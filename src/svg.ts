import * as SvgPathModule from "svgpath";
import { svgPathProperties } from "svg-path-properties";
import { INVALID_INPUT } from "./errors";
import { isFiniteNumber } from "./geometry";
import type { Point, Ring } from "./types";

const svgPathFactory =
  (SvgPathModule as unknown as { default?: (path: string) => any }).default ??
  (SvgPathModule as unknown as (path: string) => any);

const POW10 = [
  1,
  10,
  100,
  1000,
  10000,
  100000,
  1000000,
  10000000,
  100000000,
  1000000000,
  10000000000,
  100000000000,
  1000000000000,
];

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

export function pathStringToRing(path: string, maxSegmentLength: number): {
  ring: Ring;
  skipBisect: boolean;
} {
  const parsed = parse(path);
  return exactRing(parsed) ?? approximateRing(parsed, maxSegmentLength);
}

function parse(str: string): any {
  return svgPathFactory(str).abs();
}

function split(parsed: any): string[] {
  return parsed
    .toString()
    .split("M")
    .map((d: string, i: number) => {
      const trimmed = d.trim();
      return i && trimmed ? `M${trimmed}` : trimmed;
    })
    .filter(Boolean);
}

function exactRing(parsed: any): { ring: Ring; skipBisect: boolean } | null {
  const segments = parsed.segments ?? [];
  const ring: Ring = [];

  if (!segments.length || segments[0][0] !== "M") return null;

  for (let i = 0; i < segments.length; i++) {
    const [command, x, y] = segments[i] as [string, number?, number?];

    if ((command === "M" && i > 0) || command === "Z") break;

    if ((command === "M" || command === "L") && isFiniteNumber(x) && isFiniteNumber(y)) {
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

function approximateRing(parsed: any, maxSegmentLength: number): {
  ring: Ring;
  skipBisect: boolean;
} {
  const ringPath = split(parsed)[0];
  if (!ringPath) {
    throw new TypeError(INVALID_INPUT);
  }

  const measured = measurePath(ringPath);
  const length = measured.getTotalLength();

  let numPoints = 3;
  if (isFiniteNumber(maxSegmentLength) && maxSegmentLength > 0) {
    numPoints = Math.max(numPoints, Math.ceil(length / maxSegmentLength));
  }

  const ring: Ring = [];
  for (let i = 0; i < numPoints; i++) {
    const p = measured.getPointAtLength((length * i) / numPoints);
    ring.push([p[0], p[1]]);
  }

  return { ring, skipBisect: true };
}

function measurePath(path: string): {
  getTotalLength: () => number;
  getPointAtLength: (length: number) => Point;
} {
  if (typeof window !== "undefined" && window?.document) {
    try {
      const node = window.document.createElementNS("http://www.w3.org/2000/svg", "path");
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

function formatNumber(value: number, precision: number | null): string {
  if (precision === null) return String(value);

  const p = Math.max(0, Math.min(12, precision));
  const factor = POW10[p] ?? 10 ** p;
  const rounded = Math.round(value * factor) / factor;
  return String(rounded);
}
