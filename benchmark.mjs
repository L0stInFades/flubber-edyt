import { performance } from "node:perf_hooks";
import { createEdytMorphInterpolator } from "./dist/index.js";

const fromPath =
  "M0.5,0 C0.776142,0 1,0.223858 1,0.5 C1,0.776142 0.776142,1 0.5,1 C0.223858,1 0,0.776142 0,0.5 C0,0.223858 0.223858,0 0.5,0 Z";
const toPath = "M0.5,0 L1,1 L0,1 Z";

const morph = createEdytMorphInterpolator(fromPath, toPath, {
  maxSegmentLength: 0.005,
  precision: 6,
});

const warmup = 3000;
for (let i = 0; i < warmup; i++) {
  morph((i % 1000) / 1000);
}

const iterations = 50000;
const t0 = performance.now();
let totalLength = 0;
for (let i = 0; i < iterations; i++) {
  const d = morph((i % 1000) / 1000);
  totalLength += d.length;
}
const t1 = performance.now();

const totalMs = t1 - t0;
const perCallUs = (totalMs * 1000) / iterations;

console.log("flubber-edyt benchmark");
console.log(`iterations: ${iterations}`);
console.log(`total time: ${totalMs.toFixed(2)} ms`);
console.log(`per call:   ${perCallUs.toFixed(2)} us`);
console.log(`avg length: ${(totalLength / iterations).toFixed(2)}`);
