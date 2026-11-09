"use client";
/* Local object URLs from the browser cannot use Next's remote image optimiser. */
/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { clampPoint, type Point } from "@/lib/utils/geometry";

export function CornerEditor({ imageUrl, imageSize, corners, onChange, onReset }: { imageUrl: string; imageSize: { width: number; height: number }; corners: Point[]; onChange: (corners: Point[]) => void; onReset: () => void }) {
  const box = useRef<HTMLDivElement>(null); const [active, setActive] = useState<number | null>(null);
  const move = (event: React.PointerEvent) => {
    if (active === null || !box.current) return; const rect = box.current.getBoundingClientRect();
    const point = clampPoint({ x: (event.clientX - rect.left) / rect.width * imageSize.width, y: (event.clientY - rect.top) / rect.height * imageSize.height }, imageSize.width, imageSize.height);
    onChange(corners.map((corner, index) => index === active ? point : corner));
  };
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between gap-4"><div><h2 className="font-semibold">Adjust document corners</h2><p className="text-sm text-slate-500">Drag each handle to the inside edge of the certificate.</p></div><button onClick={onReset} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">Reset</button></div>
    <div ref={box} onPointerMove={move} onPointerUp={() => setActive(null)} onPointerCancel={() => setActive(null)} className="relative touch-none overflow-hidden rounded-xl bg-slate-950" style={{ aspectRatio: `${imageSize.width}/${imageSize.height}` }}><img src={imageUrl} alt="Captured certificate, ready for corner adjustment" className="h-full w-full select-none object-contain" draggable={false} />
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${imageSize.width} ${imageSize.height}`} preserveAspectRatio="none"><polygon points={corners.map(p => `${p.x},${p.y}`).join(" ")} fill="rgba(59,130,246,.12)" stroke="#38bdf8" strokeWidth={Math.max(imageSize.width, imageSize.height) / 350} /></svg>
      {corners.map((point, index) => <button key={index} aria-label={`Move corner ${index + 1}`} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); setActive(index); }} className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-blue-500 shadow-lg" style={{ left: `${point.x / imageSize.width * 100}%`, top: `${point.y / imageSize.height * 100}%` }} />)}
    </div></section>;
}
