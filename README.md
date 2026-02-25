# flubber-edyt

`flubber-edyt` is a trimmed, modernized morphing package built for EDYT's animation pipeline.

It is focused on **shape-morph clip-path rendering** and removes legacy APIs not needed in runtime.

## Why this package exists

EDYT needs high-quality, high-frequency interpolation between shape paths (timeline scrubbing + export rendering). The original `flubber` package is broader and older; this repo is tuned for:

- path-to-path morph interpolation only
- stable endpoint behavior for timeline scrubbing
- low-GC hot-path execution
- modern TypeScript + ESM/CJS package output

## EDYT-specific runtime tuning

`flubber-edyt` adds behavior tailored for our project:

- `maxSegmentLength` default is `0.005` (high quality for normalized shapes)
- `maxSegmentLengthMode: "relative"` by default
- relative mode scales `< 1` segment lengths by shape extent when paths use pixel coordinates
- interpolation point-count safety cap to prevent runaway CPU/heap on large or complex paths
- endpoint optimization for exact start/end output near `t=0` and `t=1`

## Installation

```bash
npm install flubber-edyt
```

If you use the GitHub repo directly:

```bash
npm install github:L0stInFades/flubber-edyt
```

## API

### `interpolate(fromShape, toShape, options?)`

Core interpolation API.

- `fromShape` / `toShape`: SVG path string or `Array<[x, y]>`
- returns `(t: number) => string | Array<[x, y]>`

Options:

- `maxSegmentLength` default: `0.005`
- `maxSegmentLengthMode` default: `"relative"` (`"relative" | "absolute"`)
- `string` default: `true`
- `optimizeEndpoints` default: `true`
- `endpointEpsilon` default: `1e-4`
- `clamp` default: `true`
- `precision` default: `6` (`null` disables rounding)

### `createShapeMorphInterpolator(fromPath, toPath, options?)`

Animation helper for path-to-path morphing. Returns `(t: number) => string`.

### `createEdytMorphInterpolator(...)`

Alias of `createShapeMorphInterpolator` for EDYT runtime naming.

## EDYT integration example

```ts
import { createEdytMorphInterpolator } from "flubber-edyt";

const interpolatePath = createEdytMorphInterpolator(startPath, endPath, {
  maxSegmentLength: 0.005,
  maxSegmentLengthMode: "relative",
  precision: 6,
});

const pathD = interpolatePath(progress);
```

## Development

```bash
npm install
npm test
npm run build
```

## Notes

- Node `>=18`
- Keeps `interpolate(...)` compatibility to ease migration from `flubber`
