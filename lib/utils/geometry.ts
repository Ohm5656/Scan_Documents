export type Point = { x: number; y: number };

export const defaultCorners = (width: number, height: number): Point[] => [
  { x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height },
];

export function distance(a: Point, b: Point) { return Math.hypot(a.x - b.x, a.y - b.y); }

/** Orders any four document vertices clockwise, starting at top-left. */
export function orderCorners(points: Point[]): Point[] {
  if (points.length !== 4) throw new Error("Exactly four corners are required.");
  const center = points.reduce((sum, p) => ({ x: sum.x + p.x / 4, y: sum.y + p.y / 4 }), { x: 0, y: 0 });
  const clockwise = [...points].sort((a, b) => Math.atan2(a.y - center.y, a.x - center.x) - Math.atan2(b.y - center.y, b.x - center.x));
  const topLeft = clockwise.reduce((best, point, index) => point.x + point.y < clockwise[best].x + clockwise[best].y ? index : best, 0);
  return [...clockwise.slice(topLeft), ...clockwise.slice(0, topLeft)];
}

export function outputSize(corners: Point[]) {
  const [tl, tr, br, bl] = orderCorners(corners);
  return {
    width: Math.max(1, Math.round(Math.max(distance(tl, tr), distance(bl, br)))),
    height: Math.max(1, Math.round(Math.max(distance(tl, bl), distance(tr, br)))),
  };
}

export function clampPoint(point: Point, width: number, height: number): Point {
  return { x: Math.max(0, Math.min(width, point.x)), y: Math.max(0, Math.min(height, point.y)) };
}
