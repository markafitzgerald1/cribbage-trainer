import seedrandom from "seedrandom";

export const createGenerator = (seed?: string | null): (() => number) =>
  seed ? seedrandom(seed) : Math.random;
