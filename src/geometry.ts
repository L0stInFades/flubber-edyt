import type { Point, Ring } from "./types";

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function distance(a: Point, b: Point): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

export function pointAlong(a: Point, b: Point, pct: number): Point {
  return [a[0] + (b[0] - a[0]) * pct, a[1] + (b[1] - a[1]) * pct];
}

export function samePoint(a: Point, b: Point): boolean {
  return distance(a, b) < 1e-9;
}

export function polygonArea(ring: Ring): number {
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length]!;
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area / 2;
}

export function polygonPerimeter(ring: Ring): number {
  let perimeter = 0;
  for (let i = 0; i < ring.length; i++) {
    perimeter += distance(ring[i]!, ring[(i + 1) % ring.length]!);
  }
  return perimeter;
}

export function interpolatePoint(a: Point, b: Point, t: number): Point {
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
}

export function clamp01(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t;
}
