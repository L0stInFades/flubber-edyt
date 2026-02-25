import { INVALID_INPUT } from "./errors";
import { bisect } from "./add";
import {
  isFiniteNumber,
  polygonArea,
  polygonPerimeter,
  samePoint,
} from "./geometry";
import { pathStringToRing } from "./svg";
import type { Ring, ShapeInput, SegmentLengthMode } from "./types";

const DEFAULT_MAX_SEGMENT_LENGTH_MODE: SegmentLengthMode = "relative";
const MAX_RING_POINTS = 4096;
const MIN_SEGMENT_LENGTH = 1e-9;

export function normalizeRing(
  shape: ShapeInput,
  maxSegmentLength: number,
  maxSegmentLengthMode: SegmentLengthMode = DEFAULT_MAX_SEGMENT_LENGTH_MODE,
): Ring {
  let ring: Ring;
  let skipBisect = false;

  if (typeof shape === "string") {
    const converted = pathStringToRing(
      shape,
      maxSegmentLength,
      maxSegmentLengthMode,
    );
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

  const effectiveMaxSegmentLength = resolveEffectiveMaxSegmentLength(
    ring,
    maxSegmentLength,
    maxSegmentLengthMode,
  );

  if (
    !skipBisect &&
    isFiniteNumber(effectiveMaxSegmentLength) &&
    effectiveMaxSegmentLength > 0
  ) {
    bisect(ring, effectiveMaxSegmentLength);
  }

  return ring;
}

function resolveEffectiveMaxSegmentLength(
  ring: Ring,
  maxSegmentLength: number,
  mode: SegmentLengthMode,
): number {
  if (!isFiniteNumber(maxSegmentLength) || maxSegmentLength <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  let effective = maxSegmentLength;

  if (mode === "relative" && maxSegmentLength < 1) {
    const extent = getRingExtent(ring);
    if (extent > 1) {
      effective = maxSegmentLength * extent;
    }
  }

  return applyPointCap(ring, effective);
}

function applyPointCap(ring: Ring, segmentLength: number): number {
  const perimeter = polygonPerimeter(ring);

  if (!isFiniteNumber(perimeter) || perimeter <= 0) {
    return segmentLength;
  }

  const estimatedSegments = Math.max(
    3,
    Math.ceil(perimeter / Math.max(segmentLength, MIN_SEGMENT_LENGTH)),
  );

  if (estimatedSegments <= MAX_RING_POINTS) {
    return segmentLength;
  }

  return perimeter / MAX_RING_POINTS;
}

function getRingExtent(ring: Ring): number {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const point of ring) {
    const x = point[0];
    const y = point[1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const width = maxX - minX;
  const height = maxY - minY;

  return Math.max(width, height, 1);
}

function validRing(ring: Ring): boolean {
  // A morphable polygon ring needs at least 3 points.
  if (ring.length < 3) return false;

  return ring.every((point) => {
    return (
      Array.isArray(point) &&
      point.length >= 2 &&
      isFiniteNumber(point[0]) &&
      isFiniteNumber(point[1])
    );
  });
}
