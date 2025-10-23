import { useContext, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { ConfigContext } from "../App";
import { NumberInput } from "./NumberInput";
import { Config } from "../hooks/useConfig";

interface SettingsTabProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

export function SettingsTab({ darkMode, setDarkMode }: SettingsTabProps) {
  const configContext = useContext(ConfigContext);
  const config = configContext?.config;
  const saveConfig = configContext?.saveConfig;
  const loadDefaultSettings = configContext?.loadDefaultSettings;
  const loadUserSettings = configContext?.loadUserSettings;
  const [localConfig, setLocalConfig] = useState<Config | undefined>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSaveConfig = () => {
    if (localConfig && saveConfig) {
      saveConfig(localConfig);
      alert('Configuration saved to user_settings.json!');
    }
  };

  const handleLoadDefaults = async () => {
    if (loadDefaultSettings) {
      const defaultConfig = await loadDefaultSettings();
      setLocalConfig(defaultConfig);
      alert('Default settings loaded from default_settings.json!');
    }
  };

  const handleLoadUserSettings = async () => {
    if (loadUserSettings) {
      const userConfig = await loadUserSettings();
      setLocalConfig(userConfig);
      alert('User settings loaded from user_settings.json!');
    }
  };

  const updateConfigValue = (path: string[], value: number | string | string[]) => {
    if (!localConfig) return;
    
    const newConfig = JSON.parse(JSON.stringify(localConfig)) as Config;
    let current: any = newConfig;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    setLocalConfig(newConfig);
  };

  const updateChannelName = (pxiSlot: 'pxi1' | 'pxi2' | 'pxi3', index: number, value: string) => {
    if (!localConfig) return;
    const newNames = [...localConfig.pxi[pxiSlot].channelNames];
    newNames[index] = value;
    updateConfigValue(['pxi', pxiSlot, 'channelNames'], newNames);
  };

  if (!localConfig) {
    return <div>Loading configuration...</div>;
  }

  return (
    <div className="space-y-4">
      {/* General Settings and Visualization Settings on same row */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Save Directory</Label>
              <Input type="text" defaultValue="C:/Data/" />
            </div>
            <div className="space-y-2">
              <Label>Experiment Name</Label>
              <Input type="text" placeholder="Enter experiment name" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Enable dark mode interface</p>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visualization Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Number of Graphs to Display</Label>
              <NumberInput
                value={localConfig.visualization.graphsToDisplay.default}
                onChange={(val) => updateConfigValue(['visualization', 'graphsToDisplay', 'default'], val)}
                min={localConfig.visualization.graphsToDisplay.min}
                max={localConfig.visualization.graphsToDisplay.max}
                step={localConfig.visualization.graphsToDisplay.step}
              />
            </div>
            <div className="space-y-2">
              <Label>Number of Traces per Graph</Label>
              <NumberInput
                value={localConfig.visualization.tracesPerGraph.default}
                onChange={(val) => updateConfigValue(['visualization', 'tracesPerGraph', 'default'], val)}
                min={localConfig.visualization.tracesPerGraph.min}
                max={localConfig.visualization.tracesPerGraph.max}
                step={localConfig.visualization.tracesPerGraph.step}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Real-time Plotting</Label>
                <p className="text-sm text-muted-foreground">Update plots during data acquisition</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Default Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Default Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Trigger Defaults */}
          <div className="space-y-4">
            <h3 className="border-b pb-2">Trigger Defaults</h3>
            
            {/* Column Headers */}
            <div className="grid grid-cols-[120px_1fr_1fr] gap-6 pl-4">
              <div></div>
              <div className="text-muted-foreground">Duration (ms)</div>
              <div className="text-muted-foreground">Delay (ms)</div>
            </div>

            {/* Enable Trigger */}
            <div className="grid grid-cols-[120px_1fr_1fr] gap-6 pl-4">
              <Label className="self-center">Enable</Label>
              <NumberInput
                value={localConfig.triggers.enable.duration.default}
                onChange={(val) => updateConfigValue(['triggers', 'enable', 'duration', 'default'], val)}
                min={0}
                max={1000}
                step={1}
              />
              <NumberInput
                value={localConfig.triggers.enable.delay.default}
                onChange={(val) => updateConfigValue(['triggers', 'enable', 'delay', 'default'], val)}
                min={0}
                max={1000}
                step={1}
              />
            </div>

            {/* DC Field Trigger */}
            <div className="grid grid-cols-[120px_1fr_1fr] gap-6 pl-4">
              <Label className="self-center">DC Field</Label>
              <NumberInput
                value={localConfig.triggers.dcField.duration.default}
                onChange={(val) => updateConfigValue(['triggers', 'dcField', 'duration', 'default'], val)}
                min={0}
                max={1000}
                step={1}
              />
              <NumberInput
                value={localConfig.triggers.dcField.delay.default}
                onChange={(val) => updateConfigValue(['triggers', 'dcField', 'delay', 'default'], val)}
                min={0}
                max={1000}
                step={1}
              />
            </div>

            {/* RMF Field Trigger */}
            <div className="grid grid-cols-[120px_1fr_1fr] gap-6 pl-4">
              <Label className="self-center">RMF Field</Label>
              <NumberInput
                value={localConfig.triggers.rmfField.duration.default}
                onChange={(val) => updateConfigValue(['triggers', 'rmfField', 'duration', 'default'], val)}
                min={0}
                max={1000}
                step={1}
              />
              <NumberInput
                value={localConfig.triggers.rmfField.delay.default}
                onChange={(val) => updateConfigValue(['triggers', 'rmfField', 'delay', 'default'], val)}
                min={0}
                max={1000}
                step={1}
              />
            </div>

            {/* Extra Trigger */}
            <div className="grid grid-cols-[120px_1fr_1fr] gap-6 pl-4">
              <Label className="self-center">Extra</Label>
              <NumberInput
                value={localConfig.triggers.extra.duration.default}
                onChange={(val) => updateConfigValue(['triggers', 'extra', 'duration', 'default'], val)}
                min={0}
                max={1000}
                step={1}
              />
              <NumberInput
                value={localConfig.triggers.extra.delay.default}
                onChange={(val) => updateConfigValue(['triggers', 'extra', 'delay', 'default'], val)}
                min={0}
                max={1000}
                step={1}
              />
            </div>
          </div>

          {/* Raspberry Pi Defaults */}
          <div className="space-y-4">
            <h3 className="border-b pb-2">Raspberry Pi Defaults</h3>
            <div className="grid grid-cols-2 gap-6 pl-4">
              <div className="space-y-1">
                <Label className="text-xs">RMF Frequency (kHz)</Label>
                <NumberInput
                  value={localConfig.raspberryPi.rmfFreq.default}
                  onChange={(val) => updateConfigValue(['raspberryPi', 'rmfFreq', 'default'], val)}
                  min={0}
                  max={5000}
                  step={0.01}
                  decimals={2}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duty Cycle (%)</Label>
                <NumberInput
                  value={localConfig.raspberryPi.dutyCycle.default}
                  onChange={(val) => updateConfigValue(['raspberryPi', 'dutyCycle', 'default'], val)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </div>

          {/* PXI Defaults */}
          <div className="space-y-4">
            <h3 className="border-b pb-2">PXI Defaults</h3>
            <div className="grid grid-cols-3 gap-4 pl-4">
              <div className="space-y-1">
                <Label className="text-xs">Sample Rate (kS/s)</Label>
                <NumberInput
                  value={localConfig.pxi.sampleRate.default}
                  onChange={(val) => updateConfigValue(['pxi', 'sampleRate', 'default'], val)}
                  min={1}
                  max={10000}
                  step={100}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Total Samples</Label>
                <NumberInput
                  value={localConfig.pxi.totalSamples.default}
                  onChange={(val) => updateConfigValue(['pxi', 'totalSamples', 'default'], val)}
                  min={0}
                  max={10000000}
                  step={100000}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Acquisition Time (ms)</Label>
                <NumberInput
                  value={localConfig.pxi.acquisitionTime.default}
                  onChange={(val) => updateConfigValue(['pxi', 'acquisitionTime', 'default'], val)}
                  min={0}
                  max={100000}
                  step={10}
                  decimals={2}
                />
              </div>
            </div>
          </div>

          {/* Picoscope Defaults */}
          <div className="space-y-4">
            <h3 className="border-b pb-2">Picoscope Defaults</h3>
            <div className="grid grid-cols-3 gap-4 pl-4">
              <div className="space-y-1">
                <Label className="text-xs">Sample Rate (kS/s)</Label>
                <NumberInput
                  value={localConfig.picoscope.sampleRate.default}
                  onChange={(val) => updateConfigValue(['picoscope', 'sampleRate', 'default'], val)}
                  min={1}
                  max={1000}
                  step={1}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Total Samples</Label>
                <NumberInput
                  value={localConfig.picoscope.totalSamples.default}
                  onChange={(val) => updateConfigValue(['picoscope', 'totalSamples', 'default'], val)}
                  min={0}
                  max={10000000}
                  step={100000}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Acquisition Time (ms)</Label>
                <NumberInput
                  value={localConfig.picoscope.acquisitionTime.default}
                  onChange={(val) => updateConfigValue(['picoscope', 'acquisitionTime', 'default'], val)}
                  min={0}
                  max={100000}
                  step={10}
                  decimals={4}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Limits Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Limits Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Trigger Limits */}
          <div className="space-y-4">
            <h3 className="border-b pb-2">Trigger Limits</h3>
            
            {/* Column Headers */}
            <div className="grid grid-cols-[120px_1fr_1fr] gap-6 pl-4">
              <div></div>
              <div>
                <h4 className="mb-2">Duration (ms)</h4>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>Min</div>
                  <div>Max</div>
                  <div>Step</div>
                </div>
              </div>
              <div>
                <h4 className="mb-2">Delay (ms)</h4>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>Min</div>
                  <div>Max</div>
                  <div>Step</div>
                </div>
              </div>
            </div>

            {/* Enable Trigger */}
            <div className="grid grid-cols-[120px_1fr_1fr] gap-6 pl-4">
              <Label className="self-center">Enable</Label>
              <div className="grid grid-cols-3 gap-2">
                <NumberInput
                  value={localConfig.triggers.enable.duration.min}
                  onChange={(val) => updateConfigValue(['triggers', 'enable', 'duration', 'min'], val)}
                  min={0}
                  max={1000}
                  step={1}
                />
                <NumberInput
                  value={localConfig.triggers.enable.duration.max}
                  onChange={(val) => updateConfigValue(['triggers', 'enable', 'duration', 'max'], val)}
                  min={0}
                  max={1000}
                  step={1}
                />
                <NumberInput
                  value={localConfig.triggers.enable.duration.step}
                  onChange={(val) => updateConfigValue(['triggers', 'enable', 'duration', 'step'], val)}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <NumberInput
                  value={localConfig.triggers.enable.delay.min}
                  onChange={(val) => updateConfigValue(['triggers', 'enable', 'delay', 'min'], val)}
                  min={0}
                  max={1000}
                  step={1}
                />
                <NumberInput
                  value={localConfig.triggers.enable.delay.max}
                  onChange={(val) => updateConfigValue(['triggers', 'enable', 'delay', 'max'], val)}
                  min={0}
                  max={1000}
                  step={1}
                />
                <NumberInput
                  value={localConfig.triggers.enable.delay.step}
                  onChange={(val) => updateConfigValue(['triggers', 'enable', 'delay', 'step'], val)}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>
            </div>

            {/* DC Field Trigger */}
            <div className="grid grid-cols-[120px_1fr_1fr] gap-6 pl-4">
              <Label className="self-center">DC Field</Label>
              <div className="grid grid-cols-3 gap-2">
                <NumberInput
                  value={localConfig.triggers.dcField.duration.min}
                  onChange={(val) => updateConfigValue(['triggers', 'dcField', 'duration', 'min'], val)}
                  min={0}
                  max={1000}
                  step={1}
                />
                <NumberInput
                  value={localConfig.triggers.dcField.duration.max}
                  onChange={(val) => updateConfigValue(['triggers', 'dcField', 'duration', 'max'], val)}
                  min={0}
                  max={1000}
                  step={1}
                />
                <NumberInput
                  value={localConfig.triggers.dcField.duration.step}
                  onChange={(val) => updateConfigValue(['triggers', 'dcField', 'duration', 'step'], val)}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <NumberInput
                  value={localConfig.triggers.dcField.delay.min}
                  onChange={(val) => updateConfigValue(['triggers', 'dcField', 'delay', 'min'], val)}
                  min={0}
                  max={1000}
                  step={1}
                />
                <NumberInput
                  value={localConfig.triggers.dcField.delay.max}
                  onChange={(val) => updateConfigValue(['triggers', 'dcField', 'delay', 'max'], val)}
                  min={0}
                  max={1000}
                  step={1}
                />
                <NumberInput
                  value={localConfig.triggers.dcField.delay.step}
                  onChange={(val) => updateConfigValue(['triggers', 'dcField', 'delay', 'step'], val)}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>
            </div>

            {/* RMF Field Trigger */}
            <div className="grid grid-cols-[120px_1fr_1fr] gap-6 pl-4">
              <Label className="self-center">RMF Field</Label>
              <div className="grid grid-cols-3 gap-2">
                <NumberInput
                  value={localConfig.triggers.rmfField.duration.min}
                  onChange={(val) => updateConfigValue(['triggers', 'rmfField', 'duration', 'min'], val)}
                  min={0}
                  max={1000}
                  step={1}
                />
                <NumberInput
                  value={localConfig.triggers.rmfField.duration.max}
                  onChange={(val) => updateConfigValue(['triggers', 'rmfField', 'duration', 'max'], val)}
                  min={0}
                  max={1000}
                  step={1}
                />
                <NumberInput
                  value={localConfig.triggers.rmfField.duration.step}
                  onChange={(val) => updateConfigValue(['triggers', 'rmfField', 'duration', 'step'], val)}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <NumberInput
                  value={localConfig.triggers.rmfField.delay.min}
                  onChange={(val) => updateConfigValue(['triggers', 'rmfField', 'delay', 'min'], val)}
                  min={0}
                  max={1000}
                  step={1}
                />
                <NumberInput
                  value={localConfig.triggers.rmfField.delay.max}
                  onChange={(val) => updateConfigValue(['triggers', 'rmfField', 'delay', 'max'], val)}
                  min={0}
                  max={1000}
                  step={1}
                />
                <NumberInput
                  value={localConfig.triggers.rmfField.delay.step}
                  onChange={(val) => updateConfigValue(['triggers', 'rmfField', 'delay', 'step'], val)}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>
            </div>

            {/* Extra Trigger */}
            <div className="grid grid-cols-[120px_1fr_1fr] gap-6 pl-4">
              <Label className="self-center">Extra</Label>
              <div className="grid grid-cols-3 gap-2">
                <NumberInput
                  value={localConfig.triggers.extra.duration.min}
                  onChange={(val) => updateConfigValue(['triggers', 'extra', 'duration', 'min'], val)}
                  min={0}
                  max={1000}
                  step={1}
                />
                <NumberInput
                  value={localConfig.triggers.extra.duration.max}
                  onChange={(val) => updateConfigValue(['triggers', 'extra', 'duration', 'max'], val)}
                  min={0}
                  max={1000}
                  step={1}
                />
                <NumberInput
                  value={localConfig.triggers.extra.duration.step}
                  onChange={(val) => updateConfigValue(['triggers', 'extra', 'duration', 'step'], val)}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <NumberInput
                  value={localConfig.triggers.extra.delay.min}
                  onChange={(val) => updateConfigValue(['triggers', 'extra', 'delay', 'min'], val)}
                  min={0}
                  max={1000}
                  step={1}
                />
                <NumberInput
                  value={localConfig.triggers.extra.delay.max}
                  onChange={(val) => updateConfigValue(['triggers', 'extra', 'delay', 'max'], val)}
                  min={0}
                  max={1000}
                  step={1}
                />
                <NumberInput
                  value={localConfig.triggers.extra.delay.step}
                  onChange={(val) => updateConfigValue(['triggers', 'extra', 'delay', 'step'], val)}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </div>

          {/* Raspberry Pi Limits */}
          <div className="space-y-4">
            <h3 className="border-b pb-2">Raspberry Pi Limits</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="mb-2">RMF Frequency (kHz)</h4>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2 pl-4">
                  <div>Min</div>
                  <div>Max</div>
                  <div>Step</div>
                </div>
                <div className="grid grid-cols-3 gap-2 pl-4">
                  <NumberInput
                    value={localConfig.raspberryPi.rmfFreq.min}
                    onChange={(val) => updateConfigValue(['raspberryPi', 'rmfFreq', 'min'], val)}
                    min={0}
                    max={5000}
                    step={0.01}
                    decimals={2}
                  />
                  <NumberInput
                    value={localConfig.raspberryPi.rmfFreq.max}
                    onChange={(val) => updateConfigValue(['raspberryPi', 'rmfFreq', 'max'], val)}
                    min={0}
                    max={5000}
                    step={0.01}
                    decimals={2}
                  />
                  <NumberInput
                    value={localConfig.raspberryPi.rmfFreq.step}
                    onChange={(val) => updateConfigValue(['raspberryPi', 'rmfFreq', 'step'], val)}
                    min={0.01}
                    max={100}
                    step={0.01}
                    decimals={2}
                  />
                </div>
              </div>
              <div>
                <h4 className="mb-2">Duty Cycle (%)</h4>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2 pl-4">
                  <div>Min</div>
                  <div>Max</div>
                  <div>Step</div>
                </div>
                <div className="grid grid-cols-3 gap-2 pl-4">
                  <NumberInput
                    value={localConfig.raspberryPi.dutyCycle.min}
                    onChange={(val) => updateConfigValue(['raspberryPi', 'dutyCycle', 'min'], val)}
                    min={0}
                    max={100}
                    step={1}
                  />
                  <NumberInput
                    value={localConfig.raspberryPi.dutyCycle.max}
                    onChange={(val) => updateConfigValue(['raspberryPi', 'dutyCycle', 'max'], val)}
                    min={0}
                    max={100}
                    step={1}
                  />
                  <NumberInput
                    value={localConfig.raspberryPi.dutyCycle.step}
                    onChange={(val) => updateConfigValue(['raspberryPi', 'dutyCycle', 'step'], val)}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PXI Limits */}
          <div className="space-y-4">
            <h3 className="border-b pb-2">PXI Limits</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h4 className="mb-2">Sample Rate</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2 pl-4">
                  <div>Max</div>
                  <div>Step</div>
                </div>
                <div className="grid grid-cols-2 gap-2 pl-4">
                  <NumberInput
                    value={localConfig.pxi.sampleRate.max}
                    onChange={(val) => updateConfigValue(['pxi', 'sampleRate', 'max'], val)}
                    min={1}
                    max={10000}
                    step={100}
                  />
                  <NumberInput
                    value={localConfig.pxi.sampleRate.step}
                    onChange={(val) => updateConfigValue(['pxi', 'sampleRate', 'step'], val)}
                    min={1}
                    max={1000}
                    step={1}
                  />
                </div>
              </div>
              <div>
                <h4 className="mb-2">Total Samples</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2 pl-4">
                  <div>Max</div>
                  <div>Step</div>
                </div>
                <div className="grid grid-cols-2 gap-2 pl-4">
                  <NumberInput
                    value={localConfig.pxi.totalSamples.max}
                    onChange={(val) => updateConfigValue(['pxi', 'totalSamples', 'max'], val)}
                    min={1000}
                    max={10000000}
                    step={100000}
                  />
                  <NumberInput
                    value={localConfig.pxi.totalSamples.step}
                    onChange={(val) => updateConfigValue(['pxi', 'totalSamples', 'step'], val)}
                    min={1000}
                    max={100000}
                    step={1000}
                  />
                </div>
              </div>
              <div>
                <h4 className="mb-2">Acq. Time</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2 pl-4">
                  <div>Max</div>
                  <div>Step</div>
                </div>
                <div className="grid grid-cols-2 gap-2 pl-4">
                  <NumberInput
                    value={localConfig.pxi.acquisitionTime.max}
                    onChange={(val) => updateConfigValue(['pxi', 'acquisitionTime', 'max'], val)}
                    min={1}
                    max={100000}
                    step={10}
                  />
                  <NumberInput
                    value={localConfig.pxi.acquisitionTime.step}
                    onChange={(val) => updateConfigValue(['pxi', 'acquisitionTime', 'step'], val)}
                    min={1}
                    max={1000}
                    step={1}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Picoscope Limits */}
          <div className="space-y-4">
            <h3 className="border-b pb-2">Picoscope Limits</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h4 className="mb-2">Sample Rate</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2 pl-4">
                  <div>Max</div>
                  <div>Step</div>
                </div>
                <div className="grid grid-cols-2 gap-2 pl-4">
                  <NumberInput
                    value={localConfig.picoscope.sampleRate.max}
                    onChange={(val) => updateConfigValue(['picoscope', 'sampleRate', 'max'], val)}
                    min={1}
                    max={1000}
                    step={1}
                  />
                  <NumberInput
                    value={localConfig.picoscope.sampleRate.step}
                    onChange={(val) => updateConfigValue(['picoscope', 'sampleRate', 'step'], val)}
                    min={1}
                    max={100}
                    step={1}
                  />
                </div>
              </div>
              <div>
                <h4 className="mb-2">Total Samples</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2 pl-4">
                  <div>Max</div>
                  <div>Step</div>
                </div>
                <div className="grid grid-cols-2 gap-2 pl-4">
                  <NumberInput
                    value={localConfig.picoscope.totalSamples.max}
                    onChange={(val) => updateConfigValue(['picoscope', 'totalSamples', 'max'], val)}
                    min={1000}
                    max={10000000}
                    step={100000}
                  />
                  <NumberInput
                    value={localConfig.picoscope.totalSamples.step}
                    onChange={(val) => updateConfigValue(['picoscope', 'totalSamples', 'step'], val)}
                    min={1000}
                    max={100000}
                    step={1000}
                  />
                </div>
              </div>
              <div>
                <h4 className="mb-2">Acq. Time</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2 pl-4">
                  <div>Max</div>
                  <div>Step</div>
                </div>
                <div className="grid grid-cols-2 gap-2 pl-4">
                  <NumberInput
                    value={localConfig.picoscope.acquisitionTime.max}
                    onChange={(val) => updateConfigValue(['picoscope', 'acquisitionTime', 'max'], val)}
                    min={1}
                    max={100000}
                    step={10}
                  />
                  <NumberInput
                    value={localConfig.picoscope.acquisitionTime.step}
                    onChange={(val) => updateConfigValue(['picoscope', 'acquisitionTime', 'step'], val)}
                    min={1}
                    max={1000}
                    step={1}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PXI Voltage Ranges & Channel Names */}
      <Card>
        <CardHeader>
          <CardTitle>PXI Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PXI Default Voltage Ranges */}
          <div className="space-y-4">
            <h3 className="border-b pb-2">Default Voltage Ranges</h3>
            <div className="grid grid-cols-3 gap-4 pl-4">
              <div className="space-y-1">
                <Label className="text-xs">PXI Slot 1</Label>
                <Select
                  value={localConfig.pxi.pxi1.defaultRange}
                  onValueChange={(val) => updateConfigValue(['pxi', 'pxi1', 'defaultRange'], val)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10v">± 10 V</SelectItem>
                    <SelectItem value="5v">± 5 V</SelectItem>
                    <SelectItem value="2.5v">± 2.5 V</SelectItem>
                    <SelectItem value="1.25v">± 1.25 V</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">PXI Slot 2</Label>
                <Select
                  value={localConfig.pxi.pxi2.defaultRange}
                  onValueChange={(val) => updateConfigValue(['pxi', 'pxi2', 'defaultRange'], val)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10v">± 10 V</SelectItem>
                    <SelectItem value="5v">± 5 V</SelectItem>
                    <SelectItem value="2.5v">± 2.5 V</SelectItem>
                    <SelectItem value="1.25v">± 1.25 V</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">PXI Slot 3</Label>
                <Select
                  value={localConfig.pxi.pxi3.defaultRange}
                  onValueChange={(val) => updateConfigValue(['pxi', 'pxi3', 'defaultRange'], val)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10v">± 10 V</SelectItem>
                    <SelectItem value="5v">± 5 V</SelectItem>
                    <SelectItem value="2.5v">± 2.5 V</SelectItem>
                    <SelectItem value="1.25v">± 1.25 V</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Channel Names */}
          <div className="space-y-4">
            <h3 className="border-b pb-2">Channel Names</h3>
            
            {/* PXI Slot 1 */}
            <div>
              <h4 className="mb-2 pl-4 text-muted-foreground">PXI Slot 1</h4>
              <div className="grid grid-cols-8 gap-2 pl-4">
                {localConfig.pxi.pxi1.channelNames.map((name, index) => (
                  <div key={index} className="space-y-1">
                    <Label className="text-xs">Ch {index}</Label>
                    <Input
                      value={name}
                      onChange={(e) => updateChannelName('pxi1', index, e.target.value)}
                      className="h-8"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* PXI Slot 2 */}
            <div>
              <h4 className="mb-2 pl-4 text-muted-foreground">PXI Slot 2</h4>
              <div className="grid grid-cols-8 gap-2 pl-4">
                {localConfig.pxi.pxi2.channelNames.map((name, index) => (
                  <div key={index} className="space-y-1">
                    <Label className="text-xs">Ch {index}</Label>
                    <Input
                      value={name}
                      onChange={(e) => updateChannelName('pxi2', index, e.target.value)}
                      className="h-8"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* PXI Slot 3 */}
            <div>
              <h4 className="mb-2 pl-4 text-muted-foreground">PXI Slot 3</h4>
              <div className="grid grid-cols-8 gap-2 pl-4">
                {localConfig.pxi.pxi3.channelNames.map((name, index) => (
                  <div key={index} className="space-y-1">
                    <Label className="text-xs">Ch {index}</Label>
                    <Input
                      value={name}
                      onChange={(e) => updateChannelName('pxi3', index, e.target.value)}
                      className="h-8"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSaveConfig} className="flex-1">
              Save Configuration
            </Button>
            <Button onClick={handleLoadDefaults} variant="outline" className="flex-1">
              Load Defaults
            </Button>
            <Button onClick={handleLoadUserSettings} variant="outline" className="flex-1">
              Load User Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
