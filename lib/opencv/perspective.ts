import { orderCorners, outputSize, type Point } from "@/lib/utils/geometry";

export function perspectiveCorrect(cv: any, source: HTMLCanvasElement, inputCorners: Point[]): HTMLCanvasElement {
  const corners = orderCorners(inputCorners); const { width, height } = outputSize(corners);
  const src = cv.imread(source), dst = new cv.Mat();
  const sourcePoints = cv.matFromArray(4, 1, cv.CV_32FC2, corners.flatMap(p => [p.x, p.y]));
  const targetPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, width - 1, 0, width - 1, height - 1, 0, height - 1]);
  const transform = cv.getPerspectiveTransform(sourcePoints, targetPoints);
  try {
    cv.warpPerspective(src, dst, transform, new cv.Size(width, height), cv.INTER_CUBIC, cv.BORDER_REPLICATE);
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height; cv.imshow(canvas, dst); return canvas;
  } finally { src.delete(); dst.delete(); sourcePoints.delete(); targetPoints.delete(); transform.delete(); }
}
