import type { Ring } from "./types";
import { distance } from "./geometry";

export function rotateToBestAlignment(ring: Ring, target: Ring): void {
  const len = ring.length;
  let min = Number.POSITIVE_INFINITY;
  let bestOffset = 0;

  for (let offset = 0; offset < len; offset++) {
    let sumOfSquares = 0;

    for (let i = 0; i < len; i++) {
      const d = distance(ring[(offset + i) % len]!, target[i]!);
      sumOfSquares += d * d;
    }

    if (sumOfSquares < min) {
      min = sumOfSquares;
      bestOffset = offset;
    }
  }

  if (bestOffset > 0) {
    const prefix = ring.splice(0, bestOffset);
    ring.push(...prefix);
  }
}
