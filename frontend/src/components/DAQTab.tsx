import { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { CheckCircle2, XCircle, HardDriveDownload } from "lucide-react";
import { NumberInput } from "./NumberInput";
import { ConfigContext } from "../App";

import { BarChart3, Loader2 } from "lucide-react";


interface PXISlotProps {
  deviceName: string;
  channels: { id: string; name: string; defaultSave?: boolean }[];
  sampleRate?: string;
  nSamples?: string;
  dt?: string;
  onPayloadChange?: (payload: any) => void; // ADD THIS LINE
}

function PXISlot({
  deviceName,
  channels = [],
  sampleRate = "1000",
  nSamples = "100000",
  dt = "100.0",
  onPayloadChange,
}: PXISlotProps) {
  const configContext = useContext(ConfigContext);
  const config = configContext?.config;

  const isConnected = true; // Mock
  const [channelSaveStates, setChannelSaveStates] = useState<Record<string, boolean>>(
    channels.reduce((acc, channel) => ({ ...acc, [channel.id]: channel.defaultSave !== false }), {})
  );
  const [channelNames, setChannelNames] = useState<Record<string, string>>(
    channels.reduce((acc, channel) => ({ ...acc, [channel.id]: channel.name }), {})
  );
  const [channelRanges, setChannelRanges] = useState<Record<string, string>>(
    channels.reduce((acc, channel) => ({ ...acc, [channel.id]: "± 10 V" }), {})
  );

  const [saveAll, setSaveAll] = useState(false);
  const [samplingRate, setSamplingRate] = useState(Number(sampleRate));
  const [totalSamples, setTotalSamples] = useState(Number(nSamples));
  const [deltaT, setDeltaT] = useState(Number(dt));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!config) return null;

  const handleSaveAllChange = (checked: boolean) => {
    setSaveAll(checked);
    const newStates: Record<string, boolean> = {};
    channels.forEach((channel) => {
      newStates[channel.id] = checked;
    });
    setChannelSaveStates(newStates);
  };

  const handleChannelSaveChange = (channelId: string, checked: boolean) => {
    setChannelSaveStates((prev) => ({ ...prev, [channelId]: checked }));
  };

  const handleChannelNameChange = (channelId: string, newName: string) => {
    setChannelNames((prev) => ({ ...prev, [channelId]: newName }));
  };

  const handleChannelRangeChange = (channelId: string, newRange: string) => {
    setChannelRanges((prev) => ({ ...prev, [channelId]: newRange }));
  };

  useEffect(() => {
    // When sampling rate or total samples changes, update delta t
    // Delta t (ms) = (Total Samples / Sample Rate kS/s)
    if (samplingRate > 0) {
      const newDeltaT = totalSamples / samplingRate;
      setDeltaT(Number(newDeltaT.toFixed(2)));
    }
  }, [samplingRate, totalSamples]);

  const handleDeltaTChange = (value: number) => {
    setDeltaT(value);
    // When delta t changes, update total samples
    // Total Samples = Delta t (ms) * Sample Rate (kS/s)
    if (value > 0) {
      const newTotalSamples = value * samplingRate;
      setTotalSamples(Math.round(newTotalSamples));
    }
  };

  useEffect(() => {
    const currentPayload = {
      deviceName,
      sampleRate: samplingRate,
      totalSamples,
      acquisitionTime: deltaT,
      channels: channels.map((channel) => ({
        id: channel.id,
        name: channelNames[channel.id],
        range: channelRanges[channel.id],
        save: channelSaveStates[channel.id] ?? false,
      })),
    };

    if (onPayloadChange) {
      onPayloadChange(currentPayload);
    }
  }, [samplingRate, totalSamples, deltaT, channelNames, channelRanges, channelSaveStates, deviceName, channels, onPayloadChange]);


  const acquireData = async () => {
    setLoading(true);
    setError(null);

    const payload = {
      deviceName,
      sampleRate: samplingRate,
      totalSamples,
      acquisitionTime: deltaT,
      channels: channels.map((channel) => ({
        id: channel.id,
        name: channelNames[channel.id],
        range: channelRanges[channel.id],
        save: channelSaveStates[channel.id] ?? false,
      })),
    };

    try {
      const response = await fetch(`/api/daq/${deviceName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to acquire data from ${deviceName}`);
      }

      const data = await response.json();
      console.log(`PXI${deviceName} acquired data:`, data);
    } catch (error) {
      console.error(error);
      setError(`Failed to acquire data on ${deviceName}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{deviceName}</CardTitle>
        <div className="flex items-center gap-2">
          <Button onClick={acquireData} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Acquiring...
              </>
            ) : (
              <>
                <HardDriveDownload className="h-4 w-4" />
                Acquire
              </>
            )}
          </Button>
          {isConnected ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {/* Channel Row Headers */}
          <div className="grid grid-cols-4 gap-2 pb-2 border-b">
            <Label>Channel</Label>
            <Label>Name</Label>
            <Label>Range</Label>
            <div className="flex items-center gap-2">
              <Label>Save</Label>
              <Checkbox
                checked={saveAll}
                onCheckedChange={(checked) => handleSaveAllChange(checked as boolean)}
              />
            </div>
          </div>

          {/* Channel Rows */}
          {channels.map((channel) => (
            <div key={channel.id} className="grid grid-cols-4 gap-2 items-center">
              <span className="text-sm">{channel.id}</span>
              <Input
                value={channelNames[channel.id]}
                onChange={(e) => {
                    const filteredValue = e.target.value.toLowerCase().replace(/[^0-9a-z-_]/g, '');
                    handleChannelNameChange(channel.id, filteredValue)}}
                className="h-8"
              />
              <Select
                value={channelRanges[channel.id]}
                onValueChange={(value) => handleChannelRangeChange(channel.id, value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="± 10 V">± 10 V</SelectItem>
                  <SelectItem value="± 5 V">± 5 V</SelectItem>
                  <SelectItem value="± 2.5 V">± 2.5 V</SelectItem>
                  <SelectItem value="± 1.25 V">± 1.25 V</SelectItem>
                  <SelectItem value="0-10 V V">0-10 V</SelectItem>
                  <SelectItem value="0-5 V V">0-5 V</SelectItem>
                  <SelectItem value="0-2 V V">0-2 V</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex justify-center">
                <Checkbox
                  checked={channelSaveStates[channel.id]}
                  onCheckedChange={(checked) => handleChannelSaveChange(channel.id, checked as boolean)}
                />
              </div>
            </div>
          ))}

          {/* Acquisition Params */}
          <div className="pt-4 space-y-3 border-t mt-4">
            <h4 className="text-sm">Acquisition Parameters</h4>
            <div className="space-y-1">
              <Label>Sample Rate (kS/s)</Label>
              <NumberInput
                value={samplingRate}
                onChange={setSamplingRate}
                min={config.pxi.sampleRate.min}
                max={config.pxi.sampleRate.max}
                step={config.pxi.sampleRate.step}
              />
            </div>
            <div className="space-y-1">
              <Label>Total Samples</Label>
              <NumberInput
                value={totalSamples}
                onChange={setTotalSamples}
                min={config.pxi.totalSamples.min}
                max={config.pxi.totalSamples.max}
                step={config.pxi.totalSamples.step}
              />
            </div>
            <div className="space-y-1">
              <Label>Acquisition Time (ms)</Label>
              <NumberInput
                value={deltaT}
                onChange={handleDeltaTChange}
                min={config.pxi.acquisitionTime.min}
                max={config.pxi.acquisitionTime.max}
                step={config.pxi.acquisitionTime.step}
                decimals={config.pxi.acquisitionTime.decimals}
              />
            </div>
          </div>

          {error && <p className="text-destructive mt-2">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function PicoscopeChannel({ channel }: { channel: 'A' | 'B' }) {
  const configContext = useContext(ConfigContext);
  const config = configContext?.config;

  const isConnected = true; // Mock connection status
  const [samplingFreq, setSamplingFreq] = useState(100);
  const [totalSamples, setTotalSamples] = useState(5000);
  const [acquisitionTime, setAcquisitionTime] = useState(0.05);
  const [saveData, setSaveData] = useState(true);

  useEffect(() => {
    // Update acquisition time when sampling freq or total samples changes
    // Acquisition Time (ms) = Total Samples / (Sampling Freq (kS/s))
    if (samplingFreq > 0) {
      const timeMs = totalSamples / samplingFreq;
      setAcquisitionTime(Number(timeMs.toFixed(4)));
    }
  }, [samplingFreq, totalSamples]);

  const handleAcquisitionTimeChange = (value: number) => {
    setAcquisitionTime(value);
    // Update total samples based on new acquisition time
    if (value > 0) {
      const newTotalSamples = Math.round(value * samplingFreq);
      setTotalSamples(newTotalSamples);
    }
  };

  if (!config) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Channel {channel}</CardTitle>
        {isConnected ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Sampling Freq (kS/s)</Label>
            <NumberInput
              value={samplingFreq}
              onChange={setSamplingFreq}
              min={config.picoscope.sampleRate.min}
              max={config.picoscope.sampleRate.max}
              step={config.picoscope.sampleRate.step}
              placeholder="kS/s"
              className="placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-1">
            <Label>Total Samples</Label>
            <NumberInput
              value={totalSamples}
              onChange={setTotalSamples}
              min={config.picoscope.totalSamples.min}
              max={config.picoscope.totalSamples.max}
              step={config.picoscope.totalSamples.step}
            />
          </div>
          <div className="space-y-1">
            <Label>Acquisition Time (ms)</Label>
            <NumberInput
              value={acquisitionTime}
              onChange={handleAcquisitionTimeChange}
              min={config.picoscope.acquisitionTime.min}
              max={config.picoscope.acquisitionTime.max}
              step={config.picoscope.acquisitionTime.step}
              decimals={config.picoscope.acquisitionTime.decimals}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`save-${channel}`}
              checked={saveData}
              onCheckedChange={(checked) => setSaveData(checked as boolean)}
            />
            <Label htmlFor={`save-${channel}`} className="cursor-pointer">
              Save Data
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DAQTab() {
  const configContext = useContext(ConfigContext);
  const config = configContext?.config;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!config) {
    return <div>Loading configuration...</div>;
  }

  const pxi5Channels = config.pxi.pxi1.channelNames.map((name, index) => ({
    id: name,
    name: `${name}`
  }));

  const pxi6Channels = config.pxi.pxi2.channelNames.map((name, index) => ({
    id: name,
    name: `${name}`
  }));

  const pxi7Channels = config.pxi.pxi3.channelNames.map((name, index) => ({
    id: name,
    name: `${name}`
  }));


  const [pxiPayloads, setPxiPayloads] = useState<Record<string, any>>({});

  const handleSlotPayloadChange = (deviceName: string) => (payload: any) => {
    setPxiPayloads((prev) => ({ ...prev, [deviceName]: payload }));
  };

  const acquirePXI = async () => {
    setLoading(true);
    setError(null);

    const payload = Object.values(pxiPayloads);

    try {
      const response = await fetch(`/api/daq/PXI`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to acquire data from PXI slots`);
      }

      const data = await response.json();
      console.log(`PXI slots acquired data:`, data);
    } catch (error) {
      console.error(error);
      setError(`Failed to acquire data on PXI slots`);
    } finally {
      setLoading(false);
    }
  };

  return (

    <div>
      {/* Headers Row */}
      <div className="mb-4">
        <Button onClick={acquirePXI} disabled={loading} className="gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Acquiring...
            </>
          ) : (
            <>
              <HardDriveDownload className="h-4 w-4" />
              Acquire PXI
            </>
          )}
        </Button>
      </div>

      {/* PXI Channels */}
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <PXISlot
            deviceName="PXI1Slot5"
            channels={pxi5Channels}
            onPayloadChange={handleSlotPayloadChange("PXI1Slot5")}
          />
          <PXISlot
            deviceName="PXI1Slot6"
            channels={pxi6Channels}
            onPayloadChange={handleSlotPayloadChange("PXI1Slot6")}
          />
          <PXISlot
            deviceName="PXI1Slot7"
            channels={pxi7Channels}
            onPayloadChange={handleSlotPayloadChange("PXI1Slot7")}
          />
        </div>
      </div>

      {/* Picoscope Channels */}
      <div>
        <h3 className="mb-4">Picoscope</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Picoscope 1 */}
          <div className="space-y-4">
            <h4 className="text-sm text-muted-foreground">Picoscope 1</h4>
            <div className="grid grid-cols-2 gap-4">
              <PicoscopeChannel channel="A" />
              <PicoscopeChannel channel="B" />
            </div>
          </div>

          {/* Picoscope 2 */}
          <div className="space-y-4">
            <h4 className="text-sm text-muted-foreground">Picoscope 2</h4>
            <div className="grid grid-cols-2 gap-4">
              <PicoscopeChannel channel="A" />
              <PicoscopeChannel channel="B" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}