import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { useState, useEffect } from "react";

export function LogsTab() {
  const [logs, setLogs] = useState<string[]>([
    "[10:23:45] System initialized",
    "[10:23:46] PXI Slot 5 connected",
    "[10:23:46] PXI Slot 6 connected",
    "[10:23:47] PXI Slot 7 connected",
    "[10:23:48] Picoscope 1 Channel A connected",
    "[10:23:48] Picoscope 1 Channel B connected",
    "[10:23:49] Picoscope 2 Channel A connected",
    "[10:23:49] Picoscope 2 Channel B connected",
    "[10:23:50] All devices ready",
    "[10:24:15] Trigger configuration updated",
    "[10:24:30] Data acquisition started - Shot #1",
    "[10:24:35] Data saved to C:/Data/shot_001.dat",
    "[10:25:00] System ready for next acquisition",
  ]);

  const clearLogs = () => {
    setLogs([`[${new Date().toLocaleTimeString()}] Logs cleared`]);
  };

  const exportLogs = () => {
    const logText = logs.join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qrex_logs_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Simulate new log entries
  useEffect(() => {
    const interval = setInterval(() => {
      const messages = [
        "System heartbeat OK",
        "Temperature sensors nominal",
        "Voltage monitoring active",
        "Trigger system armed",
      ];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ${randomMessage}`
      ].slice(-100)); // Keep last 100 logs
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>System Logs</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportLogs}>
              Export Logs
            </Button>
            <Button variant="outline" onClick={clearLogs}>
              Clear Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] w-full rounded-md border bg-muted/50 p-4">
            <div className="font-mono text-sm space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="text-foreground/90">
                  {log}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm">Log Level</label>
              <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option>Debug</option>
                <option selected>Info</option>
                <option>Warning</option>
                <option>Error</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm">Max Log Entries</label>
              <input 
                type="number" 
                defaultValue="100"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
