export type RGB = [number, number, number];

function distanceSq(a: RGB, b: RGB) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

// k-means++ seeding: spreads initial centroids across the actual color
// range instead of picking evenly-spaced pixels, which tends to clump on
// busy photos and gives visibly worse (muddier) results.
function seedCentroids(pixels: RGB[], k: number): RGB[] {
  const centroids: RGB[] = [pixels[Math.floor(Math.random() * pixels.length)]];

  while (centroids.length < k) {
    const distances = pixels.map((p) => {
      let minD = Infinity;
      for (const c of centroids) {
        const d = distanceSq(p, c);
        if (d < minD) minD = d;
      }
      return minD;
    });
    const total = distances.reduce((a, b) => a + b, 0);
    if (total === 0) {
      centroids.push(pixels[Math.floor(Math.random() * pixels.length)]);
      continue;
    }
    let r = Math.random() * total;
    let idx = distances.length - 1;
    for (let i = 0; i < distances.length; i++) {
      r -= distances[i];
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    centroids.push(pixels[idx]);
  }

  return centroids;
}

export function kMeansColors(pixels: RGB[], k: number, iterations = 15): RGB[] {
  if (pixels.length === 0) return [];
  const clusterCount = Math.min(k, pixels.length);

  let centroids: RGB[] = seedCentroids(pixels, clusterCount);

  for (let iter = 0; iter < iterations; iter++) {
    const sums: RGB[] = Array.from({ length: clusterCount }, () => [0, 0, 0]);
    const counts = new Array(clusterCount).fill(0);

    for (const p of pixels) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < centroids.length; i++) {
        const d = distanceSq(p, centroids[i]);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      sums[bestIdx][0] += p[0];
      sums[bestIdx][1] += p[1];
      sums[bestIdx][2] += p[2];
      counts[bestIdx]++;
    }

    centroids = sums.map((sum, i) =>
      counts[i] === 0
        ? centroids[i]
        : ([sum[0] / counts[i], sum[1] / counts[i], sum[2] / counts[i]] as RGB),
    );
  }

  return centroids.map((c) => c.map(Math.round) as RGB);
}

export function nearestColorIndex(pixel: RGB, palette: RGB[]): number {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const d = distanceSq(pixel, palette[i]);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export function rgbToHex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`;
}

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}
