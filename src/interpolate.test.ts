import { describe, expect, it } from "vitest";
import {
  createEdytMorphInterpolator,
  createShapeMorphInterpolator,
  interpolate,
} from "./interpolate";

describe("flubber-edyt interpolate", () => {
  it("returns exact endpoints for string inputs", () => {
    const a = "M0,0L1,0L1,1L0,1Z";
    const b = "M0.5,0L1,1L0,1Z";

    const fn = createShapeMorphInterpolator(a, b);

    expect(fn(0)).toBe(a);
    expect(fn(1)).toBe(b);
  });

  it("supports EDYT alias", () => {
    const a = "M0,0L1,0L1,1L0,1Z";
    const b = "M0.5,0L1,1L0,1Z";
    const fn = createEdytMorphInterpolator(a, b);
    expect(typeof fn(0.3)).toBe("string");
  });

  it("interpolates ring output when string=false", () => {
    const a: Array<[number, number]> = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];

    const b: Array<[number, number]> = [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ];

    const fn = interpolate(a, b, { string: false });
    const mid = fn(0.5);

    expect(Array.isArray(mid)).toBe(true);
    expect((mid as Array<[number, number]>).length).toBeGreaterThan(0);
  });

  it("clamps out-of-range t values by default", () => {
    const a = "M0,0L1,0L1,1L0,1Z";
    const b = "M0.5,0L1,1L0,1Z";
    const fn = createShapeMorphInterpolator(a, b);

    expect(fn(-10)).toBe(a);
    expect(fn(10)).toBe(b);
  });

  it("applies precision in path output", () => {
    const a: Array<[number, number]> = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];

    const b: Array<[number, number]> = [
      [0, 0],
      [1, 0],
      [1, 1.123456],
      [0, 1],
    ];

    const fn = interpolate(a, b, { precision: 3 });
    const out = fn(0.5) as string;
    const match = out.match(/\d+\.\d+/);

    expect(match).toBeTruthy();
    if (match) {
      expect(match[0].split(".")[1]?.length ?? 0).toBeLessThanOrEqual(3);
    }
  });

  it("uses relative maxSegmentLength scaling for large coordinate paths", () => {
    const a = "M0,0L100,0L100,100L0,100Z";
    const b = "M50,0L100,50L50,100L0,50Z";

    const fn = createEdytMorphInterpolator(a, b, {
      maxSegmentLength: 0.005,
      maxSegmentLengthMode: "relative",
    });

    const out = fn(0.5);
    const segments = (out.match(/L/g)?.length ?? 0) + 1;

    expect(segments).toBeLessThanOrEqual(4096);
  });

  it("caps approximation point counts for complex curves", () => {
    const a =
      "M0,0 C100,0 100,100 0,100 C-100,100 -100,0 0,0 Z";
    const b =
      "M0,0 C120,20 120,120 0,140 C-120,120 -120,20 0,0 Z";

    const fn = createEdytMorphInterpolator(a, b, {
      maxSegmentLength: 0.005,
    });

    const out = fn(0.5);
    const segments = (out.match(/L/g)?.length ?? 0) + 1;

    expect(segments).toBeLessThanOrEqual(4096);
  });
});
