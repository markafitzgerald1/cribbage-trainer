import { describe, expect, it } from "@jest/globals";
import { create } from "./randomNumberGenerator";

describe("create", () => {
  it("returns Math.random if no seed is specified", () => {
    expect(create(null)).toBe(Math.random);
  });

  it("returns a function that generates the same sequence of random numbers when given the same seed", () => {
    const seed = "my seed";
    const generateRandomNumber1 = create(seed);
    const generateRandomNumber2 = create(seed);
    const randomNumberCount = 100;
    Array.from({ length: randomNumberCount }).forEach(() => {
      expect(generateRandomNumber1()).toStrictEqual(generateRandomNumber2());
    });
  });
});
