import { kMeansColors, rgbToHex, type RGB } from "@/lib/color/kmeans";

const MAX_SOURCE_SIZE = 300;

export function extractDominantColors(img: HTMLImageElement, k: number): string[] {
  const scale = Math.min(1, MAX_SOURCE_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen");
  ctx.drawImage(img, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);

  const pixels: RGB[] = [];
  for (let i = 0; i < data.length; i += 4) {
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }

  const centroids = kMeansColors(pixels, k);
  // With fewer real colors in the photo than requested, some centroids
  // converge to the same point — dedupe rather than showing repeats.
  return Array.from(new Set(centroids.map(rgbToHex)));
}

export function pickPixelColor(canvas: HTMLCanvasElement, x: number, y: number): string {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo leer el color");
  const { data } = ctx.getImageData(x, y, 1, 1);
  return rgbToHex([data[0], data[1], data[2]]);
}
