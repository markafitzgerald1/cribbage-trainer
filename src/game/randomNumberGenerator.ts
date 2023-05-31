import seedrandom from "seedrandom";

export const create = (seed: string | null): (() => number) =>
  seed ? seedrandom(seed) : Math.random;
