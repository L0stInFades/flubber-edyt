# flubber-edyt

`flubber-edyt` is a trimmed, modernized morphing package built for EDYT's animation pipeline.

It is intentionally focused on **shape-morph clip-path rendering** and removes legacy APIs that are not needed by the product runtime.

## Why this package exists

EDYT only needs high-quality, high-frequency interpolation between shape paths (for timeline and export rendering). The original `flubber` package is broader and older; this fork is optimized for:

- path-to-path morph interpolation
- stable endpoint behavior for timeline scrubbing
- low-GC hot-path execution
- modern TypeScript + ESM/CJS packaging

## Installation

```bash
npm install flubber-edyt
```

## API

### `interpolate(fromShape, toShape, options?)`

Core interpolation API.

- `fromShape` / `toShape`: SVG path string or `Array<[x, y]>`
- returns `(t: number) => string | Array<[x, y]>`

Options:

- `maxSegmentLength` default: `0.005` (EDYT tuned)
- `string` default: `true`
- `optimizeEndpoints` default: `true`
- `endpointEpsilon` default: `1e-4`
- `clamp` default: `true`
- `precision` default: `6` (`null` to disable rounding)

### `createShapeMorphInterpolator(fromPath, toPath, options?)`

Animation-friendly path-only helper. Returns `(t: number) => string`.

### `createEdytMorphInterpolator(...)`

Alias of `createShapeMorphInterpolator` for EDYT runtime naming.

## EDYT Integration Example

```ts
import { createEdytMorphInterpolator } from "flubber-edyt";

const interpolatePath = createEdytMorphInterpolator(startPath, endPath, {
  maxSegmentLength: 0.005,
  precision: 6,
});

const pathD = interpolatePath(progress);
```

## Notes

- This package targets Node `>=18`.
- The implementation keeps `interpolate(...)` compatibility to simplify migration from `flubber`.
