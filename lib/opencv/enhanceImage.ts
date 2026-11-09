export type EnhancementMode = "original" | "certificate" | "document";
export type EnhancementOptions = { mode: EnhancementMode; brightness: number; contrast: number; saturation: number };

export function enhanceImage(source: HTMLCanvasElement, options: EnhancementOptions): HTMLCanvasElement {
  const canvas = document.createElement("canvas"); canvas.width = source.width; canvas.height = source.height;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.filter = `brightness(${100 + options.brightness}%) contrast(${100 + options.contrast}%) saturate(${100 + options.saturation}%)`;
  context.drawImage(source, 0, 0); context.filter = "none";
  if (options.mode === "original") return canvas;
  const data = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2];
    if (options.mode === "document") {
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const value = luminance > 165 ? 255 : luminance < 105 ? 18 : Math.min(255, luminance * 1.13);
      data.data[i] = data.data[i + 1] = data.data[i + 2] = value;
    } else {
      // Gentle luminance lift preserves certificate inks, seals and signatures.
      data.data[i] = Math.min(255, r * 1.035 + 3); data.data[i + 1] = Math.min(255, g * 1.035 + 3); data.data[i + 2] = Math.min(255, b * 1.035 + 3);
    }
  }
  context.putImageData(data, 0, 0); return canvas;
}
