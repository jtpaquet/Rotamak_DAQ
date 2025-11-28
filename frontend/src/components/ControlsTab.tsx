import { useState, useContext } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { TimingDiagram } from "./TimingDiagram";
import { Zap, Send } from "lucide-react";
import { NumberInput } from "./NumberInput";
import { ConfigContext } from "../App";
import { DAQControlData } from "../types/daq-control-data";

export function ControlsTab() {
  const configContext = useContext(ConfigContext);
  const config = configContext?.config;

  const [enableDuration, setEnableDuration] = useState(200);
  const [enableDelay, setEnableDelay] = useState(0);
  const [dcDuration, setDcDuration] = useState(80);
  const [dcDelay, setDcDelay] = useState(60);
  const [rmfDuration, setRmfDuration] = useState(40);
  const [rmfDelay, setRmfDelay] = useState(80);
  const [extraDuration, setExtraDuration] = useState(0);
  const [extraDelay, setExtraDelay] = useState(0);
  const [saveData, setSaveData] = useState(true);
  const [isDischarging, setIsDischarging] = useState(false);
  const [rmfFreq, setRmfFreq] = useState(125);
  const [dutyCycle1, setDutyCycle1] = useState(35);
  const [dutyCycle2, setDutyCycle2] = useState(35);

  // File Handle states
  const formatDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().split(' ')[0]; // HH:MM:SS
    return `${date} - ${time}`;
  };

  const [date, setDate] = useState(formatDateTime());
  const [shotNumber, setShotNumber] = useState<number | undefined>(undefined);
  const [fileName, setFileName] = useState("");
  const [fileAppend, setFileAppend] = useState("");
  const [saveDirectory, setSaveDirectory] = useState("");

  // Shot Info states
  const [gas, setGas] = useState("");
  const [pressure, setPressure] = useState<number | undefined>(undefined);
  const [rfPower, setRfPower] = useState<number | undefined>(undefined);
  const [batteryVoltage, setBatteryVoltage] = useState<number | undefined>(undefined);

  if (!config) {
    return <div>Loading configuration...</div>;
  }

  const enableTotal = enableDuration + enableDelay;
  function clampToEnable(totalEnable: number, duration: number, delay: number) {
    if (duration + delay > totalEnable) {
      // Reduce duration first to fit within total
      const newDuration = Math.max(0, totalEnable - delay);
      return newDuration;
    }
    return duration;
  }


  const handleDischarge = async () => {
    const daqControlData: DAQControlData = {
      triggers: {
        enable: { duration: enableDuration, delay: enableDelay },
        dcField: { duration: dcDuration, delay: dcDelay },
        rmfField: { duration: rmfDuration, delay: rmfDelay },
        extra: { duration: extraDuration, delay: extraDelay },
      },
      raspberryPi: {
        rmfFreq,
        dutyCycle1,
        dutyCycle2,
      },
      fileHandle: {
        date,
        shotNumber,
        fileName,
        fileAppend,
        saveDirectory,
        saveData,
      },
      shotInfo: {
        gas,
        pressure,
        rfPower,
        batteryVoltage,
      },
    };
    setIsDischarging(true);
    setTimeout(() => setIsDischarging(false), 1000);

    try {
      // Send data to backend API endpoint
      await fetch('/api/daq-discharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(daqControlData),
      });
      console.log('DAQ Control data sent:', daqControlData);
    } catch (error) {
      console.error('Failed to send DAQ control data:', error);
    }
  };

  const handleSendData = async () => {
    const daqControlData: DAQControlData = {
      triggers: {
        enable: { duration: enableDuration, delay: enableDelay },
        dcField: { duration: dcDuration, delay: dcDelay },
        rmfField: { duration: rmfDuration, delay: rmfDelay },
        extra: { duration: extraDuration, delay: extraDelay },
      },
      raspberryPi: {
        rmfFreq,
        dutyCycle1,
        dutyCycle2,
      },
      fileHandle: {
        date,
        shotNumber,
        fileName,
        fileAppend,
        saveDirectory,
        saveData,
      },
      shotInfo: {
        gas,
        pressure,
        rfPower,
        batteryVoltage,
      },
    };

    try {
      // Send data to backend API endpoint
      await fetch('/api/daq-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(daqControlData),
      });
      console.log('DAQ Control data sent:', daqControlData);
    } catch (error) {
      console.error('Failed to send DAQ control data:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Discharge Button - Centered */}
      <div className="flex justify-center">
        <button
          onClick={handleDischarge}
          disabled={isDischarging}
          className="group relative px-20 py-6 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white shadow-2xl hover:shadow-amber-500/50 transition-all duration-300 border border-amber-400/30 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400/0 via-amber-400/20 to-amber-400/0 blur-xl group-hover:blur-2xl transition-all duration-300"></div>

          {/* Pulse animation when discharging */}
          {isDischarging && (
            <>
              <div className="absolute inset-0 rounded-2xl bg-white/30 animate-ping"></div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse"></div>
            </>
          )}

          {/* Content */}
          <div className="relative flex items-center gap-3">
            <Zap className={`h-6 w-6 ${isDischarging ? 'animate-bounce' : ''}`} />
            <span className="text-2xl tracking-wide">
              {isDischarging ? 'DISCHARGING...' : 'DISCHARGE'}
            </span>
            <Zap className={`h-6 w-6 ${isDischarging ? 'animate-bounce' : ''}`} />
          </div>
        </button>
      </div>

      {/* Send Settings Button */}
      <div className="flex justify-start">
        <Button
          onClick={handleSendData}
          className="px-8 py-6 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Send className="h-5 w-5 mr-2" />
          Send Settings
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Triggers Container - Top Left */}
        <Card>
          <CardHeader>
            <CardTitle>Triggers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Header Row */}
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>&nbsp;</Label>
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
              </div>
              <div className="space-y-2">
                <Label>Delay</Label>
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
              </div>
            </div>

            {/* Enable */}
            <div className="grid grid-cols-4 gap-4 items-center">
              <div>
                <Label>Enable</Label>
              </div>
              <div>
                <NumberInput
                  value={enableDuration}
                  onChange={setEnableDuration}
                  min={config.triggers.enable.duration.min}
                  max={config.triggers.enable.duration.max}
                  step={config.triggers.enable.duration.step}
                  placeholder="ms"
                  className="placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <NumberInput
                  value={enableDelay}
                  onChange={setEnableDelay}
                  min={config.triggers.enable.delay.min}
                  max={config.triggers.enable.delay.max}
                  step={config.triggers.enable.delay.step}
                  placeholder="ms"
                  className="placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <Select defaultValue="ch0">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ch0">Channel 0</SelectItem>
                    <SelectItem value="ch1">Channel 1</SelectItem>
                    <SelectItem value="ch2">Channel 2</SelectItem>
                    <SelectItem value="ch3">Channel 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* DC Field */}
            <div className="grid grid-cols-4 gap-4 items-center">
              <div>
                <Label>DC Field</Label>
              </div>
              <div>
                <NumberInput
                  value={dcDuration}
                  onChange={(value) => {
                    const newDuration = clampToEnable(enableTotal, value, dcDelay);
                    setDcDuration(newDuration);
                  }}
                  min={config.triggers.dcField.duration.min}
                  max={config.triggers.dcField.duration.max}
                  step={config.triggers.dcField.duration.step}
                  placeholder="ms"
                  className="placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <NumberInput
                  value={dcDelay}
                  onChange={(value) => {
                    const newDuration = clampToEnable(enableTotal, dcDuration, value);
                    setDcDelay(value);
                    setDcDuration(newDuration);
                  }}
                  min={config.triggers.dcField.delay.min}
                  max={config.triggers.dcField.delay.max}
                  step={config.triggers.dcField.delay.step}
                  placeholder="ms"
                  className="placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <Select defaultValue="ch1">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ch0">Channel 0</SelectItem>
                    <SelectItem value="ch1">Channel 1</SelectItem>
                    <SelectItem value="ch2">Channel 2</SelectItem>
                    <SelectItem value="ch3">Channel 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* RMF Field */}
            <div className="grid grid-cols-4 gap-4 items-center">
              <div>
                <Label>RMF Field</Label>
              </div>
              <div>
                <NumberInput
                  value={rmfDuration}
                  onChange={(value) => {
                    const newDuration = clampToEnable(enableTotal, value, rmfDelay);
                    setRmfDuration(newDuration);
                  }}
                  min={config.triggers.rmfField.duration.min}
                  max={config.triggers.rmfField.duration.max}
                  step={config.triggers.rmfField.duration.step}
                  placeholder="ms"
                  className="placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <NumberInput
                  value={rmfDelay}
                  onChange={(value) => {
                    const newDuration = clampToEnable(enableTotal, rmfDuration, value);
                    setRmfDelay(value);
                    setRmfDuration(newDuration);
                  }}
                  min={config.triggers.rmfField.delay.min}
                  max={config.triggers.rmfField.delay.max}
                  step={config.triggers.rmfField.delay.step}
                  placeholder="ms"
                  className="placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <Select defaultValue="ch2">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ch0">Channel 0</SelectItem>
                    <SelectItem value="ch1">Channel 1</SelectItem>
                    <SelectItem value="ch2">Channel 2</SelectItem>
                    <SelectItem value="ch3">Channel 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Extra Trig */}
            <div className="grid grid-cols-4 gap-4 items-center">
              <div>
                <Label>Extra Trig</Label>
              </div>
              <div>
                <NumberInput
                  value={extraDuration}
                  onChange={(value) => {
                    const newDuration = clampToEnable(enableTotal, value, extraDelay);
                    setExtraDuration(newDuration);
                  }}
                  min={config.triggers.extra.duration.min}
                  max={config.triggers.extra.duration.max}
                  step={config.triggers.extra.duration.step}
                  placeholder="ms"
                  className="placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <NumberInput
                  value={extraDelay}
                  onChange={setExtraDelay}
                  min={config.triggers.extra.delay.min}
                  max={config.triggers.extra.delay.max}
                  step={config.triggers.extra.delay.step}
                  placeholder="ms"
                  className="placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <Select defaultValue="ch3">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ch0">Channel 0</SelectItem>
                    <SelectItem value="ch1">Channel 1</SelectItem>
                    <SelectItem value="ch2">Channel 2</SelectItem>
                    <SelectItem value="ch3">Channel 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Timing Diagram */}
            <div className="mt-6">
              <Label className="mb-2 block">Timing Diagram</Label>
              <TimingDiagram
                enableDuration={enableDuration}
                enableDelay={enableDelay}
                dcDuration={dcDuration}
                dcDelay={dcDelay}
                rmfDuration={rmfDuration}
                rmfDelay={rmfDelay}
                extraDuration={extraDuration}
                extraDelay={extraDelay}
              />
            </div>
          </CardContent>
        </Card>

        {/* File Handle - Top Right */}
        <Card>
          <CardHeader>
            <CardTitle>File Handle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Shot #</Label>
              <Input
                type="number"
                value={shotNumber ?? ""}
                onChange={(e) => setShotNumber(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Shot number"
              />
            </div>
            <div className="space-y-2">
              <Label>File Name</Label>
              <Input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter file name"
              />
            </div>
            <div className="space-y-2">
              <Label>File Append</Label>
              <Input
                type="text"
                value={fileAppend}
                onChange={(e) => setFileAppend(e.target.value)}
                placeholder="Append text"
              />
            </div>
            <div className="space-y-2">
              <Label>Save Directory</Label>
              <Input
                type="text"
                value={saveDirectory}
                onChange={(e) => setSaveDirectory(e.target.value)}
                placeholder="C:/Data/"
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="save-data"
                checked={saveData}
                onCheckedChange={(checked) => setSaveData(checked as boolean)}
              />
              <Label htmlFor="save-data" className="cursor-pointer">
                Save Data
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Raspberry Pi Controls - Bottom Left */}
        <Card>
          <CardHeader>
            <CardTitle>RMF Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Port Selection</Label>
                <Select defaultValue="Func_gen">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Func_gen">Function generator</SelectItem>
                    <SelectItem value="DAQ_ctr_output">DAQ counter output (PXI1Slot5/Ctr0)</SelectItem>
                    <SelectItem value="DAQ_digital_output">DAQ digital output (N/A)</SelectItem>
                    {/* <SelectItem value="port4">Port 4</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>RMF Freq (kHz)</Label>
                <NumberInput
                  value={rmfFreq}
                  onChange={setRmfFreq}
                  min={config.raspberryPi.rmfFreq.min}
                  max={config.raspberryPi.rmfFreq.max}
                  step={config.raspberryPi.rmfFreq.step}
                  decimals={config.raspberryPi.rmfFreq.decimals}
                  placeholder="kHz"
                  className="placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label>RMF Duty Cycle 1 (%)</Label>
                <NumberInput
                  value={dutyCycle1}
                  onChange={setDutyCycle1}
                  min={config.raspberryPi.dutyCycle.min}
                  max={config.raspberryPi.dutyCycle.max}
                  step={config.raspberryPi.dutyCycle.step}
                  decimals={config.raspberryPi.dutyCycle.decimals}
                  placeholder="%"
                  className="placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label>RMF Duty Cycle 2 (%)</Label>
                <NumberInput
                  value={dutyCycle2}
                  onChange={setDutyCycle2}
                  min={config.raspberryPi.dutyCycle.min}
                  max={config.raspberryPi.dutyCycle.max}
                  step={config.raspberryPi.dutyCycle.step}
                  decimals={config.raspberryPi.dutyCycle.decimals}
                  placeholder="%"
                  className="placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shot Info - Bottom Right */}
        <Card>
          <CardHeader>
            <CardTitle>Shot Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Gas</Label>
              <Select value={gas} onValueChange={setGas}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="argon">Argon</SelectItem>
                  <SelectItem value="helium">Helium</SelectItem>
                  <SelectItem value="hydrogen">Hydrogen</SelectItem>
                  <SelectItem value="air">Air</SelectItem>
                  <SelectItem value="nitrogen">Nitrogen</SelectItem>
                  <SelectItem value="oxygen">Oxygen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pressure (mTorr)</Label>
              <Input
                type="number"
                step="0.1"
                value={pressure ?? ""}
                onChange={(e) => setPressure(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="mTorr"
                className="placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label>RF Power (W)</Label>
              <Input
                type="number"
                step="0.1"
                value={rfPower ?? ""}
                onChange={(e) => setRfPower(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="W"
                className="placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label>Battery Voltage (V)</Label>
              <Input
                type="number"
                step="0.1"
                value={batteryVoltage ?? ""}
                onChange={(e) => setBatteryVoltage(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="V"
                className="placeholder:text-muted-foreground"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}