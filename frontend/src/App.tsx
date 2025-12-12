import { useState, useEffect, createContext } from "react";
import {
  Sliders,
  Database,
  BarChart3,
  Menu,
  Settings,
  FileText,
} from "lucide-react";
import { ControlsTab } from "./components/ControlsTab";
import { DAQTab } from "./components/DAQTab";
import { DataVisualizationTab } from "./components/DataVisualizationTab";
import { SettingsTab } from "./components/SettingsTab";
import { LogsTab } from "./components/LogsTab";
import { cn } from "./lib/utils";
import { useConfig, Config } from "./hooks/useConfig";

export const ConfigContext = createContext<{
  config: Config;
  setConfig: (config: Config) => void;
  saveConfig: (config: Config) => void;
  loadDefaultSettings: () => Promise<Config>;
  loadUserSettings: () => Promise<Config>;
  pxiPayloads: Record<string, any>;
  setPxiPayloads: React.Dispatch<React.SetStateAction<Record<string, any>>>;
} | null>(null);

export default function App() {
  const [activeTab, setActiveTab] = useState("control");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const { config, setConfig, saveConfig, loadDefaultSettings, loadUserSettings } = useConfig();

  const initialPXI = {
    PXI1Slot5: {
      deviceName: "PXI1Slot5",
      sampleRate: config.pxi.sampleRate.default,
      totalSamples: config.pxi.totalSamples.default,
      acquisitionTime: config.pxi.acquisitionTime.default,
      channels: config.pxi.pxi1.channelNames.map(id => ({
        id,
        name: id,
        range: "± 10 V",
        save: true,
      })),
    },
    PXI1Slot6: {
      deviceName: "PXI1Slot6",
      sampleRate: config.pxi.sampleRate.default,
      totalSamples: config.pxi.totalSamples.default,
      acquisitionTime: config.pxi.acquisitionTime.default,
      channels: config.pxi.pxi2.channelNames.map(id => ({
        id,
        name: id,
        range: "± 10 V",
        save: true,
      })),
    },
    PXI1Slot7: {
      deviceName: "PXI1Slot7",
      sampleRate: config.pxi.sampleRate.default,
      totalSamples: config.pxi.totalSamples.default,
      acquisitionTime: config.pxi.acquisitionTime.default,
      channels: config.pxi.pxi3.channelNames.map(id => ({
        id,
        name: id,
        range: "± 10 V",
        save: true,
      })),
    },
  };
  const [pxiPayloads, setPxiPayloads] = useState(initialPXI);

  useEffect(() => {
    // Apply dark mode class to document
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const tabs = [
    { id: "control", label: "Control", icon: Sliders },
    { id: "daq", label: "DAQ", icon: Database },
    { id: "data", label: "Data", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "logs", label: "Logs", icon: FileText },
  ];

  return (
    <ConfigContext.Provider 
      value={{
        config,
        setConfig,
        saveConfig,
        loadDefaultSettings,
        loadUserSettings,
        pxiPayloads,       // ⭐ shared PXI payloads
        setPxiPayloads,    // ⭐ setter for PXI payloads
      }}
    >
      <div className="h-screen bg-background flex overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            "bg-card border-r border-border flex flex-col py-6 transition-all duration-300 ease-in-out h-full flex-shrink-0",
            sidebarExpanded ? "w-56" : "w-20",
          )}
        >
          {/* Header */}
          <div className="mb-4 px-4 flex items-center justify-between h-8">
            {sidebarExpanded && (
              <h3 className="text-muted-foreground">QREX</h3>
            )}
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className={cn(
                "text-muted-foreground hover:text-foreground transition-colors",
                !sidebarExpanded && "mx-auto",
              )}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {!sidebarExpanded && (
            <div className="mb-4">
              <h3 className="text-xs text-center text-muted-foreground">
                QREX
              </h3>
            </div>
          )}

          {/* Tabs */}
          <div
            className={cn(
              "flex-1 flex flex-col gap-2",
              sidebarExpanded ? "px-3" : "items-center",
            )}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "rounded-lg transition-all duration-200 flex items-center flex-shrink-0",
                    sidebarExpanded
                      ? "gap-3 w-full px-4 h-11"
                      : "flex-col justify-center w-14 h-14 gap-1",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "flex-shrink-0 transition-all duration-200",
                      sidebarExpanded ? "h-5 w-5" : "h-6 w-6",
                    )}
                  />
                  <span
                    className={cn(
                      "transition-all duration-200 whitespace-nowrap",
                      sidebarExpanded ? "text-sm" : "text-xs",
                    )}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          {sidebarExpanded && (
            <div className="mt-auto pt-4 px-4 border-t border-border">
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                QREX DAQ System
              </p>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                v1.0 2025
              </p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 max-w-[1800px] mx-auto">
            <div className="mb-6">
              <h1>DAQ Control Dashboard</h1>
              <p className="text-muted-foreground">
                Data Acquisition and Control System
              </p>
            </div>

            {activeTab === "control" && <ControlsTab />}
            {activeTab === "daq" && <DAQTab />}
            {activeTab === "data" && <DataVisualizationTab isActive={activeTab === "data"} />}
            {activeTab === "settings" && (
              <SettingsTab
                darkMode={darkMode}
                setDarkMode={setDarkMode}
              />
            )}
            {activeTab === "logs" && <LogsTab />}
          </div>
        </div>
      </div>
    </ConfigContext.Provider>
  );
}