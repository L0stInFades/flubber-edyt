export type Point = [number, number];
export type Ring = Point[];
export type ShapeInput = string | Ring;

export interface InterpolateOptions {
  /**
   * Maximum segment length when approximating complex SVG paths.
   * Tuned for EDYT clip-path morph quality/perf balance.
   */
  maxSegmentLength?: number;
  /**
   * Return SVG path string when true, ring points when false.
   */
  string?: boolean;
  /**
   * Preserve original input path strings for near-endpoint samples.
   */
  optimizeEndpoints?: boolean;
  /**
   * Threshold for endpoint optimization.
   */
  endpointEpsilon?: number;
  /**
   * Clamp `t` into [0, 1] before interpolation.
   */
  clamp?: boolean;
  /**
   * Decimal precision when output is path string.
   * `null` means no rounding.
   */
  precision?: number | null;
}

export interface ShapeMorphOptions
  extends Omit<InterpolateOptions, "string"> {}
