import * as SvgPathModule from "svgpath";
import { svgPathProperties } from "svg-path-properties";
import { INVALID_INPUT } from "./errors";
import { isFiniteNumber } from "./geometry";
import type { Point, Ring, SegmentLengthMode } from "./types";

type SvgPathSegment = [string, number?, number?];
type SvgPathParsed = {
  segments?: SvgPathSegment[];
  toString: () => string;
};
type SvgPathFactory = (path: string) => {
  abs: () => SvgPathParsed;
};

const svgPathFactory =
  (SvgPathModule as unknown as { default?: SvgPathFactory }).default ??
  (SvgPathModule as unknown as SvgPathFactory);

const POW10 = [
  1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000,
  10000000000, 100000000000, 1000000000000,
];

const DEFAULT_MAX_SEGMENT_LENGTH_MODE: SegmentLengthMode = "relative";
const MAX_APPROX_POINTS = 4096;
const BOUNDS_SAMPLES = 64;
const MIN_SEGMENT_LENGTH = 1e-9;

export function toPathString(ring: Ring, precision: number | null = 6): string {
  let out = "M";

  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]!;
    out += `${formatNumber(p[0], precision)},${formatNumber(p[1], precision)}`;
    if (i < ring.length - 1) out += "L";
  }

  out += "Z";
  return out;
}

export function pathStringToRing(
  path: string,
  maxSegmentLength: number,
  maxSegmentLengthMode: SegmentLengthMode = DEFAULT_MAX_SEGMENT_LENGTH_MODE,
): {
  ring: Ring;
  skipBisect: boolean;
} {
  const parsed = parse(path);
  return (
    exactRing(parsed) ??
    approximateRing(parsed, maxSegmentLength, maxSegmentLengthMode)
  );
}

function parse(str: string): SvgPathParsed {
  return svgPathFactory(str).abs();
}

function split(parsed: SvgPathParsed): string[] {
  return parsed
    .toString()
    .split("M")
    .map((d: string, i: number) => {
      const trimmed = d.trim();
      return i && trimmed ? `M${trimmed}` : trimmed;
    })
    .filter(Boolean);
}

function exactRing(
  parsed: SvgPathParsed,
): { ring: Ring; skipBisect: boolean } | null {
  const segments = parsed.segments ?? [];
  const ring: Ring = [];

  if (!segments.length || segments[0][0] !== "M") return null;

  for (let i = 0; i < segments.length; i++) {
    const [command, x, y] = segments[i] as [string, number?, number?];

    if ((command === "M" && i > 0) || command === "Z") break;

    if (
      (command === "M" || command === "L") &&
      isFiniteNumber(x) &&
      isFiniteNumber(y)
    ) {
      ring.push([x, y]);
      continue;
    }

    if (command === "H" && isFiniteNumber(x) && ring.length > 0) {
      ring.push([x, ring[ring.length - 1]![1]]);
      continue;
    }

    if (command === "V" && isFiniteNumber(x) && ring.length > 0) {
      ring.push([ring[ring.length - 1]![0], x]);
      continue;
    }

    return null;
  }

  return ring.length > 0 ? { ring, skipBisect: false } : null;
}

function approximateRing(
  parsed: SvgPathParsed,
  maxSegmentLength: number,
  maxSegmentLengthMode: SegmentLengthMode,
): {
  ring: Ring;
  skipBisect: boolean;
} {
  const ringPath = split(parsed)[0];
  if (!ringPath) {
    throw new TypeError(INVALID_INPUT);
  }

  const measured = measurePath(ringPath);
  const length = measured.getTotalLength();

  const effectiveSegmentLength = resolvePathSegmentLength(
    measured,
    length,
    maxSegmentLength,
    maxSegmentLengthMode,
  );

  let numPoints = 3;
  if (isFiniteNumber(effectiveSegmentLength) && effectiveSegmentLength > 0) {
    numPoints = Math.max(numPoints, Math.ceil(length / effectiveSegmentLength));
  }
  numPoints = Math.min(numPoints, MAX_APPROX_POINTS);

  const ring: Ring = [];
  for (let i = 0; i < numPoints; i++) {
    const p = measured.getPointAtLength((length * i) / numPoints);
    ring.push([p[0], p[1]]);
  }

  return { ring, skipBisect: true };
}

function resolvePathSegmentLength(
  measured: {
    getTotalLength: () => number;
    getPointAtLength: (length: number) => Point;
  },
  length: number,
  maxSegmentLength: number,
  mode: SegmentLengthMode,
): number {
  if (!isFiniteNumber(maxSegmentLength) || maxSegmentLength <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  let effective = maxSegmentLength;

  if (mode === "relative" && maxSegmentLength < 1) {
    const extent = estimatePathExtent(measured, length);
    if (extent > 1) {
      effective = maxSegmentLength * extent;
    }
  }

  if (!isFiniteNumber(length) || length <= 0) {
    return effective;
  }

  const estimatedPoints = Math.max(
    3,
    Math.ceil(length / Math.max(effective, MIN_SEGMENT_LENGTH)),
  );

  if (estimatedPoints <= MAX_APPROX_POINTS) {
    return effective;
  }

  return length / MAX_APPROX_POINTS;
}

function estimatePathExtent(
  measured: {
    getTotalLength: () => number;
    getPointAtLength: (length: number) => Point;
  },
  length: number,
): number {
  const samples = Math.max(2, BOUNDS_SAMPLES);
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < samples; i++) {
    const at = length <= 0 ? 0 : (length * i) / (samples - 1);
    const p = measured.getPointAtLength(at);
    const x = p[0];
    const y = p[1];

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const width = maxX - minX;
  const height = maxY - minY;

  return Math.max(width, height, 1);
}

function measurePath(path: string): {
  getTotalLength: () => number;
  getPointAtLength: (length: number) => Point;
} {
  if (typeof window !== "undefined" && window?.document) {
    try {
      const node = window.document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      node.setAttributeNS(null, "d", path);
      return {
        getTotalLength: () => node.getTotalLength(),
        getPointAtLength: (length) => {
          const p = node.getPointAtLength(length);
          return [p.x, p.y];
        },
      };
    } catch {
      // Fall back to pure JS implementation below.
    }
  }

  const props = new svgPathProperties(path);
  return {
    getTotalLength: () => props.getTotalLength(),
    getPointAtLength: (length) => {
      const p = props.getPointAtLength(length);
      return [p.x, p.y];
    },
  };
}

export function formatNumber(value: number, precision: number | null): string {
  if (precision === null) return String(value);

  // Runtime guard for untyped JS callers (e.g. precision: NaN).
  const safePrecision = isFiniteNumber(precision) ? precision : 6;
  const p = Math.max(0, Math.min(12, Math.round(safePrecision)));
  const factor = POW10[p] ?? 10 ** p;
  const rounded = Math.round(value * factor) / factor;
  return String(rounded);
}
