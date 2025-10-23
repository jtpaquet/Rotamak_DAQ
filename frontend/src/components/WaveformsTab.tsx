import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function WaveformsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Waveforms</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted rounded-md flex items-center justify-center h-96">
          <span className="text-muted-foreground">Waveform Display Area</span>
        </div>
      </CardContent>
    </Card>
  );
}
