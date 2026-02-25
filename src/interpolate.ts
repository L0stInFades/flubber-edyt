import { addPoints } from "./add";
import { clamp01, interpolatePoint } from "./geometry";
import { normalizeRing } from "./normalize";
import { rotateToBestAlignment } from "./rotate";
import { toPathString } from "./svg";
import { LruCache } from "./lru";
import type {
  InterpolateOptions,
  Ring,
  ShapeInput,
  ShapeMorphOptions,
  Point,
  SegmentLengthMode,
} from "./types";

const DEFAULT_MAX_SEGMENT_LENGTH = 0.005;
const DEFAULT_MAX_SEGMENT_LENGTH_MODE: SegmentLengthMode = "relative";
const DEFAULT_ENDPOINT_EPSILON = 1e-4;
const DEFAULT_PRECISION = 6;

const MORPH_CACHE = new LruCache<string, (t: number) => string | Ring>(256);

export function interpolate(
  fromShape: ShapeInput,
  toShape: ShapeInput,
  {
    maxSegmentLength = DEFAULT_MAX_SEGMENT_LENGTH,
    maxSegmentLengthMode = DEFAULT_MAX_SEGMENT_LENGTH_MODE,
    string = true,
    optimizeEndpoints = true,
    endpointEpsilon = DEFAULT_ENDPOINT_EPSILON,
    clamp = true,
    precision = DEFAULT_PRECISION,
  }: InterpolateOptions = {},
): (t: number) => string | Ring {
  const cacheKey = buildCacheKey(
    fromShape,
    toShape,
    maxSegmentLength,
    maxSegmentLengthMode,
    string,
    optimizeEndpoints,
    endpointEpsilon,
    clamp,
    precision,
  );

  if (cacheKey) {
    const cached = MORPH_CACHE.get(cacheKey);
    if (cached) return cached;
  }

  const fromRing = normalizeRing(
    fromShape,
    maxSegmentLength,
    maxSegmentLengthMode,
  );
  const toRing = normalizeRing(toShape, maxSegmentLength, maxSegmentLengthMode);

  const core = interpolateRing(fromRing, toRing, {
    string,
    clamp,
    precision,
  });

  const out =
    optimizeEndpoints &&
    string &&
    typeof fromShape === "string" &&
    typeof toShape === "string"
      ? (t: number) => {
          const tt = clamp ? clamp01(t) : t;
          // Preserve extrapolation semantics when clamp=false by only applying
          // endpoint fast-path inside the canonical [0,1] range.
          if (clamp || (tt >= 0 && tt <= 1)) {
            if (tt < endpointEpsilon) return fromShape;
            if (1 - tt < endpointEpsilon) return toShape;
          }
          return core(tt);
        }
      : core;

  if (cacheKey) MORPH_CACHE.set(cacheKey, out);
  return out;
}

export function createShapeMorphInterpolator(
  fromPath: string,
  toPath: string,
  options: ShapeMorphOptions = {},
): (t: number) => string {
  return interpolate(fromPath, toPath, {
    ...options,
    string: true,
  }) as (t: number) => string;
}

/** EDYT-preferred alias. */
export const createEdytMorphInterpolator = createShapeMorphInterpolator;

export function interpolateRing(
  fromRingInput: Ring,
  toRingInput: Ring,
  options: {
    string?: boolean;
    clamp?: boolean;
    precision?: number | null;
  } = {},
): (t: number) => string | Ring {
  const {
    string = true,
    clamp = true,
    precision = DEFAULT_PRECISION,
  } = options;

  const fromRing = fromRingInput.slice() as Ring;
  const toRing = toRingInput.slice() as Ring;

  const diff = fromRing.length - toRing.length;
  addPoints(fromRing, diff < 0 ? -diff : 0);
  addPoints(toRing, diff > 0 ? diff : 0);

  rotateToBestAlignment(fromRing, toRing);

  const len = fromRing.length;
  const fromX = new Float64Array(len);
  const fromY = new Float64Array(len);
  const dx = new Float64Array(len);
  const dy = new Float64Array(len);

  for (let i = 0; i < len; i++) {
    const a = fromRing[i]!;
    const b = toRing[i]!;
    fromX[i] = a[0];
    fromY[i] = a[1];
    dx[i] = b[0] - a[0];
    dy[i] = b[1] - a[1];
  }

  if (string) {
    return (t: number) => {
      const tt = clamp ? clamp01(t) : t;
      return interpolatePathString(fromX, fromY, dx, dy, tt, precision);
    };
  }

  return (t: number) => {
    const tt = clamp ? clamp01(t) : t;
    const ring: Ring = new Array(len);

    for (let i = 0; i < len; i++) {
      const x = fromX[i]! + tt * dx[i]!;
      const y = fromY[i]! + tt * dy[i]!;
      ring[i] = [x, y] as Point;
    }

    return ring;
  };
}

function interpolatePathString(
  fromX: Float64Array,
  fromY: Float64Array,
  dx: Float64Array,
  dy: Float64Array,
  t: number,
  precision: number | null,
): string {
  const ring: Ring = new Array(fromX.length);
  for (let i = 0; i < fromX.length; i++) {
    ring[i] = [fromX[i]! + t * dx[i]!, fromY[i]! + t * dy[i]!] as Point;
  }
  return toPathString(ring, precision);
}

function buildCacheKey(
  fromShape: ShapeInput,
  toShape: ShapeInput,
  maxSegmentLength: number,
  maxSegmentLengthMode: SegmentLengthMode,
  string: boolean,
  optimizeEndpoints: boolean,
  endpointEpsilon: number,
  clamp: boolean,
  precision: number | null,
): string | null {
  if (typeof fromShape !== "string" || typeof toShape !== "string") return null;

  return [
    fromShape,
    toShape,
    maxSegmentLength,
    maxSegmentLengthMode,
    string,
    optimizeEndpoints,
    endpointEpsilon,
    clamp,
    precision,
  ].join("|");
}

/**
 * Legacy helper kept for compatibility with old flubber consumers.
 */
export function interpolatePoints(a: Ring, b: Ring, t: number): Ring {
  const len = Math.min(a.length, b.length);
  const out: Ring = new Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = interpolatePoint(a[i]!, b[i]!, t);
  }
  return out;
}
