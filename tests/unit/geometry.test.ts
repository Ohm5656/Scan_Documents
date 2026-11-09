import { describe, expect, it } from "vitest";
import { defaultCorners, orderCorners, outputSize } from "@/lib/utils/geometry";

describe("document geometry", () => {
  it("creates a complete image boundary", () => {
    expect(defaultCorners(1200, 800)).toEqual([{ x: 0, y: 0 }, { x: 1200, y: 0 }, { x: 1200, y: 800 }, { x: 0, y: 800 }]);
  });
  it("orders an arbitrary quad from top-left clockwise", () => {
    const result = orderCorners([{ x: 90, y: 80 }, { x: 10, y: 10 }, { x: 15, y: 100 }, { x: 110, y: 5 }]);
    expect(result[0]).toEqual({ x: 10, y: 10 });
    expect(result).toHaveLength(4);
  });
  it("uses the longest opposite edges for output size", () => {
    expect(outputSize([{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 210, y: 100 }, { x: 0, y: 100 }])).toEqual({ width: 210, height: 100 });
  });
});
