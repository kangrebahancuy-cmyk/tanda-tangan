'use client';

import { useEffect, useRef } from 'react';

export default function SignaturePad({ onChange }: { onChange: (value: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const resize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const snapshot = canvas.width && canvas.height ? canvas.toDataURL('image/png') : '';

    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;

    if (snapshot) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = snapshot;
    }
  };

  useEffect(() => {
    resize();

    const ro = new ResizeObserver(resize);
    if (canvasRef.current) ro.observe(canvasRef.current);
    window.addEventListener('resize', resize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.stroke();
    last.current = p;
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;

    if (canvasRef.current) {
      onChange(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <canvas
          ref={canvasRef}
          aria-label="Tanda tangan digital"
          className="block h-[240px] w-full touch-none sm:h-[300px]"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onPointerLeave={end}
        />
        <div className="pointer-events-none absolute inset-x-5 bottom-10 border-t border-slate-300" />
        <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-slate-400">
          <span className="hidden [@media(pointer:coarse)]:inline">Gunakan jari atau stylus untuk tanda tangan</span>
          <span className="[@media(pointer:coarse)]:hidden">Gunakan mouse atau touchpad untuk tanda tangan</span>
        </div>
      </div>
      <button
        type="button"
        onClick={clear}
        className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Hapus Tanda Tangan
      </button>
    </div>
  );
}
