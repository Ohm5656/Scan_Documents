import { orderCorners, type Point } from "@/lib/utils/geometry";

export type DetectionResult = { corners: Point[]; confidence: number } | null;

/** Finds the largest plausible quadrilateral in a downscaled source canvas. */
export function detectDocument(cv: any, source: HTMLCanvasElement): DetectionResult {
  const maxDimension = 1000;
  const scale = Math.min(1, maxDimension / Math.max(source.width, source.height));
  const resized = document.createElement("canvas");
  resized.width = Math.round(source.width * scale); resized.height = Math.round(source.height * scale);
  resized.getContext("2d")!.drawImage(source, 0, 0, resized.width, resized.height);
  const src = cv.imread(resized), gray = new cv.Mat(), blur = new cv.Mat(), edges = new cv.Mat(), closed = new cv.Mat();
  const contours = new cv.MatVector(), hierarchy = new cv.Mat(), kernel = cv.Mat.ones(5, 5, cv.CV_8U);
  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);
    cv.Canny(blur, edges, 60, 180);
    cv.morphologyEx(edges, closed, cv.MORPH_CLOSE, kernel);
    cv.findContours(closed, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
    const sourceArea = resized.width * resized.height;
    let best: { corners: Point[]; score: number } | null = null;
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i), approx = new cv.Mat();
      try {
        const perimeter = cv.arcLength(contour, true); cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);
        const area = Math.abs(cv.contourArea(approx));
        if (approx.rows !== 4 || area < sourceArea * 0.08 || !cv.isContourConvex(approx)) continue;
        const points: Point[] = Array.from({ length: 4 }, (_, index) => ({ x: approx.intPtr(index, 0)[0] / scale, y: approx.intPtr(index, 0)[1] / scale }));
        const score = area / sourceArea;
        if (!best || score > best.score) best = { corners: orderCorners(points), score };
      } finally { contour.delete(); approx.delete(); }
    }
    return best ? { corners: best.corners, confidence: Math.min(0.99, best.score) } : null;
  } finally { src.delete(); gray.delete(); blur.delete(); edges.delete(); closed.delete(); contours.delete(); hierarchy.delete(); kernel.delete(); }
}
