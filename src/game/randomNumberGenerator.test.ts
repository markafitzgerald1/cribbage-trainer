import { createGenerator, isSeededSession } from "./randomNumberGenerator";
import { describe, expect, it } from "@jest/globals";

describe("create", () => {
  it("returns Math.random if no seed is specified", () => {
    expect(createGenerator()).toBe(Math.random);
  });

  it("returns Math.random if a null seed is specified", () => {
    expect(createGenerator(null)).toBe(Math.random);
  });

  // eslint-disable-next-line jest/prefer-ending-with-an-expect
  it("returns a function that generates the same sequence of random numbers when given the same seed", () => {
    const seed = "my seed";
    const generateRandomNumber1 = createGenerator(seed);
    const generateRandomNumber2 = createGenerator(seed);
    const randomNumberCount = 100;
    Array.from({ length: randomNumberCount }).forEach(() => {
      expect(generateRandomNumber1()).toStrictEqual(generateRandomNumber2());
    });
  });
});

describe("isSeededSession", () => {
  const SEED_CASES: readonly (readonly [string | null, boolean])[] = [
    [null, false],
    ["", false],
    ["my seed", true],
  ];

  it.each(SEED_CASES)("classifies seed %p as seeded %p", (seed, expected) => {
    expect(isSeededSession(seed)).toBe(expected);
  });
});
