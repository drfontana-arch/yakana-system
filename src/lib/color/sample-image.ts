import type { RGB } from "@/lib/color/kmeans";

const MAX_SOURCE_SIZE = 600;

/**
 * Samples an image down to one averaged color per grid cell by explicitly
 * averaging the source pixels that fall inside each cell's region — this
 * gives much crisper, truer-to-the-photo results than letting the browser's
 * built-in canvas downscale filter blur everything in one pass.
 */
export function sampleImageToGrid(
  img: HTMLImageElement,
  gridWidth: number,
  gridHeight: number,
): RGB[] {
  const scale = Math.min(1, MAX_SOURCE_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
  const sourceWidth = Math.max(1, Math.round(img.naturalWidth * scale));
  const sourceHeight = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen");
  ctx.drawImage(img, 0, 0, sourceWidth, sourceHeight);
  const { data } = ctx.getImageData(0, 0, sourceWidth, sourceHeight);

  const cellColors: RGB[] = [];

  for (let row = 0; row < gridHeight; row++) {
    const y0 = Math.floor((row * sourceHeight) / gridHeight);
    const y1 = Math.max(y0 + 1, Math.floor(((row + 1) * sourceHeight) / gridHeight));
    for (let col = 0; col < gridWidth; col++) {
      const x0 = Math.floor((col * sourceWidth) / gridWidth);
      const x1 = Math.max(x0 + 1, Math.floor(((col + 1) * sourceWidth) / gridWidth));

      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * sourceWidth + x) * 4;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
      }
      cellColors.push([Math.round(r / count), Math.round(g / count), Math.round(b / count)]);
    }
  }

  return cellColors;
}
