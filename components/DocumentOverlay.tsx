import type { Point } from "@/lib/utils/geometry";

export function DocumentOverlay({ corners, width, height }: { corners: Point[]; width: number; height: number }) {
  if (corners.length !== 4) return <div className="absolute inset-[8%] rounded-xl border-2 border-dashed border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,.25)]" aria-hidden />;
  const points = corners.map(point => `${point.x / width * 100},${point.y / height * 100}`).join(" ");
  return <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden><polygon points={points} fill="rgba(59,130,246,.12)" stroke="#60a5fa" strokeWidth="0.6" vectorEffect="non-scaling-stroke" /></svg>;
}
