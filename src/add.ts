import type { Point, Ring } from "./types";
import { distance, pointAlong, polygonPerimeter } from "./geometry";

export function addPoints(ring: Ring, numPoints: number): void {
  if (numPoints <= 0) return;

  const desiredLength = ring.length + numPoints;
  const perimeter = polygonPerimeter(ring);
  const step = perimeter / numPoints;

  let i = 0;
  let cursor = 0;
  let insertAt = step / 2;

  while (ring.length < desiredLength) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    const segmentLength = distance(a, b);

    if (insertAt <= cursor + segmentLength) {
      const point: Point = segmentLength
        ? pointAlong(a, b, (insertAt - cursor) / segmentLength)
        : [...a];
      ring.splice(i + 1, 0, point);
      insertAt += step;
      continue;
    }

    cursor += segmentLength;
    i++;
  }
}

export function bisect(
  ring: Ring,
  maxSegmentLength = Number.POSITIVE_INFINITY,
): void {
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!;
    let b = i === ring.length - 1 ? ring[0]! : ring[i + 1]!;

    while (distance(a, b) > maxSegmentLength) {
      b = pointAlong(a, b, 0.5);
      ring.splice(i + 1, 0, b);
    }
  }
}
