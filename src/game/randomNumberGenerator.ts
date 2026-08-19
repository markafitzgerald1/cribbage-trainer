import seedrandom from "seedrandom";

// A seeded session deals a reproducible, memorizable sequence, so telemetry must be able to segment its hands out of population skill statistics.
// This predicate is the single definition of what counts as a seed, shared by the generator and by that segmentation.
export const isSeededSession = (seed?: string | null): seed is string =>
  Boolean(seed);

export const createGenerator = (seed?: string | null): (() => number) =>
  isSeededSession(seed) ? seedrandom(seed) : Math.random;
