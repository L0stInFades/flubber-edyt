export type Point = [number, number];
export type Ring = Point[];
export type ShapeInput = string | Ring;
export type SegmentLengthMode = "relative" | "absolute";

export interface InterpolateOptions {
  /**
   * Maximum segment length when approximating complex SVG paths.
   * Tuned for EDYT clip-path morph quality/perf balance.
   */
  maxSegmentLength?: number;
  /**
   * How to interpret `maxSegmentLength`:
   * - `relative` (default): if value is < 1 and shape extents are > 1, scale by shape size.
   * - `absolute`: always interpret value in path coordinate units.
   */
  maxSegmentLengthMode?: SegmentLengthMode;
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
   * When false, outside-range `t` values extrapolate.
   */
  clamp?: boolean;
  /**
   * Decimal precision when output is path string.
   * `null` means no rounding.
   */
  precision?: number | null;
}

export interface ShapeMorphOptions extends Omit<InterpolateOptions, "string"> {}
