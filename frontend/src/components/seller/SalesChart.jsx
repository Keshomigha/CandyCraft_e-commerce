import { useRef, useEffect } from 'react';

export default function SalesChart({ data = [], height = 220 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padLeft = 60;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 40;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    const values = data.map(d => d.revenue);
    const maxVal = Math.max(...values, 1);
    const niceMax = Math.ceil(maxVal / 5000) * 5000 || 5000;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Grid lines
    const gridSteps = 5;
    ctx.strokeStyle = '#f0ede8';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = 0; i <= gridSteps; i++) {
      const y = padTop + chartH - (i / gridSteps) * chartH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      // Y-axis labels
      const val = (niceMax / gridSteps) * i;
      ctx.setLineDash([]);
      ctx.fillStyle = '#a3a3a3';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val.toString(), padLeft - 10, y + 4);
      ctx.setLineDash([4, 4]);
    }
    ctx.setLineDash([]);

    // Data points
    const points = data.map((d, i) => ({
      x: padLeft + (i / Math.max(data.length - 1, 1)) * chartW,
      y: padTop + chartH - (d.revenue / niceMax) * chartH,
    }));

    // Gradient fill
    const grad = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
    grad.addColorStop(0, 'rgba(244,162,97,0.25)');
    grad.addColorStop(1, 'rgba(244,162,97,0.02)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, padTop + chartH);
    points.forEach((p, i) => {
      if (i === 0) {
        ctx.lineTo(p.x, p.y);
      } else {
        const prev = points[i - 1];
        const cpx1 = prev.x + (p.x - prev.x) * 0.4;
        const cpx2 = p.x - (p.x - prev.x) * 0.4;
        ctx.bezierCurveTo(cpx1, prev.y, cpx2, p.y, p.x, p.y);
      }
    });
    ctx.lineTo(points[points.length - 1].x, padTop + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) {
        ctx.moveTo(p.x, p.y);
      } else {
        const prev = points[i - 1];
        const cpx1 = prev.x + (p.x - prev.x) * 0.4;
        const cpx2 = p.x - (p.x - prev.x) * 0.4;
        ctx.bezierCurveTo(cpx1, prev.y, cpx2, p.y, p.x, p.y);
      }
    });
    ctx.strokeStyle = '#F4A261';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Points
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#F4A261';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });

    // X-axis labels
    ctx.fillStyle = '#a3a3a3';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    data.forEach((d, i) => {
      const x = padLeft + (i / Math.max(data.length - 1, 1)) * chartW;
      ctx.fillText(d.month, x, h - 10);
    });
  }, [data, height]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height }}>
        No revenue data yet
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height }}
      className="block"
    />
  );
}
