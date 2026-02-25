import type { Ring } from "./types";
import { distance } from "./geometry";

const MAX_EXACT_ALIGN_POINTS = 2048;
const TARGET_SAMPLES = 512;
const EXACT_REFINE_WINDOW = 16;

export function rotateToBestAlignment(ring: Ring, target: Ring): void {
  const len = ring.length;
  if (len <= 1) return;

  const bestOffset =
    len <= MAX_EXACT_ALIGN_POINTS
      ? findBestOffset(ring, target, 1, 1)
      : findBestOffsetSampled(ring, target);

  if (bestOffset > 0) {
    const prefix = ring.splice(0, bestOffset);
    ring.push(...prefix);
  }
}

function findBestOffsetSampled(ring: Ring, target: Ring): number {
  const len = ring.length;
  const stride = Math.max(1, Math.floor(len / TARGET_SAMPLES));

  let coarseBest = findBestOffset(ring, target, stride, stride);

  // Refine around coarse best with all offsets, still using sampled points.
  let min = Number.POSITIVE_INFINITY;
  let sampledBest = coarseBest;
  for (let delta = -stride; delta <= stride; delta++) {
    const offset = mod(coarseBest + delta, len);
    const score = scoreOffset(ring, target, offset, stride);
    if (score < min) {
      min = score;
      sampledBest = offset;
    }
  }

  // Final local exact refinement to keep visual quality stable.
  min = Number.POSITIVE_INFINITY;
  let exactBest = sampledBest;
  for (let delta = -EXACT_REFINE_WINDOW; delta <= EXACT_REFINE_WINDOW; delta++) {
    const offset = mod(sampledBest + delta, len);
    const score = scoreOffset(ring, target, offset, 1);
    if (score < min) {
      min = score;
      exactBest = offset;
    }
  }

  return exactBest;
}

function findBestOffset(
  ring: Ring,
  target: Ring,
  offsetStep: number,
  sampleStep: number,
): number {
  const len = ring.length;
  let min = Number.POSITIVE_INFINITY;
  let bestOffset = 0;

  for (let offset = 0; offset < len; offset += offsetStep) {
    const score = scoreOffset(ring, target, offset, sampleStep);
    if (score < min) {
      min = score;
      bestOffset = offset;
    }
  }

  return bestOffset;
}

function scoreOffset(
  ring: Ring,
  target: Ring,
  offset: number,
  sampleStep: number,
): number {
  const len = ring.length;
  let sumOfSquares = 0;

  for (let i = 0; i < len; i += sampleStep) {
    const d = distance(ring[(offset + i) % len]!, target[i]!);
    sumOfSquares += d * d;
  }

  return sumOfSquares;
}

function mod(value: number, n: number): number {
  return ((value % n) + n) % n;
}
