import { useEffect, useRef } from 'react';

interface Trigger {
  name: string;
  duration: number;
  delay: number;
  color: string;
}

interface TimingDiagramProps {
  enableDuration: number;
  enableDelay: number;
  dcDuration: number;
  dcDelay: number;
  rmfDuration: number;
  rmfDelay: number;
  extraDuration: number;
  extraDelay: number;
}

export function TimingDiagram({
  enableDuration,
  enableDelay,
  dcDuration,
  dcDelay,
  rmfDuration,
  rmfDelay,
  extraDuration,
  extraDelay,
}: TimingDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Define triggers
    const triggers: Trigger[] = [
      { name: 'Enable', duration: enableDuration, delay: enableDelay, color: '#3b82f6' },
      { name: 'DC Field', duration: dcDuration, delay: dcDelay, color: '#10b981' },
      { name: 'RMF Field', duration: rmfDuration, delay: rmfDelay, color: '#f59e0b' },
      { name: 'Extra Trig', duration: extraDuration, delay: extraDelay, color: '#ef4444' }
    ];

    const maxTime = Math.max(
      enableDuration + enableDelay,
      dcDuration + dcDelay,
      rmfDuration + rmfDelay,
      extraDuration + extraDelay,
      130
    );
    const timeScale = (canvas.width - 100) / maxTime;
    const rowHeight = 50;
    const pulseHeight = 30;

    // Draw background
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let t = 0; t <= maxTime; t += 10) {
      const x = 80 + t * timeScale;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height - 20);
      ctx.stroke();
    }

    // Draw time axis
    ctx.fillStyle = '#374151';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    for (let t = 0; t <= maxTime; t += 20) {
      const x = 80 + t * timeScale;
      ctx.fillText(`${t}ms`, x, canvas.height - 5);
    }

    // Draw each trigger
    triggers.forEach((trigger, index) => {
      const y = index * rowHeight + 20;

      // Draw label
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'right';
      ctx.fillText(trigger.name, 70, y + 20);

      // Draw baseline
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, y + 25);
      ctx.lineTo(canvas.width - 20, y + 25);
      ctx.stroke();

      // Draw pulse if duration > 0
      if (trigger.duration > 0) {
        const startX = 80 + trigger.delay * timeScale;
        const endX = 80 + (trigger.delay + trigger.duration) * timeScale;

        ctx.fillStyle = trigger.color;
        ctx.strokeStyle = trigger.color;
        ctx.lineWidth = 2;

        // Draw rising edge
        ctx.beginPath();
        ctx.moveTo(startX, y + 25);
        ctx.lineTo(startX, y + 25 - pulseHeight);
        ctx.lineTo(endX, y + 25 - pulseHeight);
        ctx.lineTo(endX, y + 25);
        ctx.stroke();

        // Fill pulse
        ctx.globalAlpha = 0.3;
        ctx.fillRect(startX, y + 25 - pulseHeight, endX - startX, pulseHeight);
        ctx.globalAlpha = 1.0;

        // Draw duration annotation
        ctx.fillStyle = '#374151';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${trigger.duration}ms`, (startX + endX) / 2, y + 25 - pulseHeight - 5);
      }
    });
  }, [enableDuration, enableDelay, dcDuration, dcDelay, rmfDuration, rmfDelay, extraDuration, extraDelay]);

  return (
    <div className="border rounded-md bg-white p-4">
      <canvas
        ref={canvasRef}
        width={800}
        height={220}
        className="w-full"
      />
    </div>
  );
}
