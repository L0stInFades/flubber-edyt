import { INVALID_INPUT } from "./errors";
import { bisect } from "./add";
import { isFiniteNumber, polygonArea, samePoint } from "./geometry";
import { pathStringToRing } from "./svg";
import type { Ring, ShapeInput } from "./types";

export function normalizeRing(shape: ShapeInput, maxSegmentLength: number): Ring {
  let ring: Ring;
  let skipBisect = false;

  if (typeof shape === "string") {
    const converted = pathStringToRing(shape, maxSegmentLength);
    ring = converted.ring;
    skipBisect = converted.skipBisect;
  } else if (Array.isArray(shape)) {
    ring = shape.slice();
  } else {
    throw new TypeError(INVALID_INPUT);
  }

  if (!validRing(ring)) {
    throw new TypeError(INVALID_INPUT);
  }

  if (ring.length > 1 && samePoint(ring[0]!, ring[ring.length - 1]!)) {
    ring.pop();
  }

  // Enforce clockwise orientation for stable point correspondence.
  if (polygonArea(ring) > 0) {
    ring.reverse();
  }

  if (!skipBisect && isFiniteNumber(maxSegmentLength) && maxSegmentLength > 0) {
    bisect(ring, maxSegmentLength);
  }

  return ring;
}

function validRing(ring: Ring): boolean {
  return ring.every((point) => {
    return (
      Array.isArray(point) &&
      point.length >= 2 &&
      isFiniteNumber(point[0]) &&
      isFiniteNumber(point[1])
    );
  });
}
