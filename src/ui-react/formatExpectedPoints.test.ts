import {
  MINUS_SIGN,
  formatCount,
  formatSignedCount,
  formatSignedExpectedPoints,
  toAlignedFixed,
} from "./formatExpectedPoints";
import { describe, expect, it } from "@jest/globals";

describe("toAlignedFixed", () => {
  it("shows two decimal places", () => {
    expect(toAlignedFixed(8.125)).toBe("8.13");
  });

  it("uses the digit-width minus sign", () => {
    expect(toAlignedFixed(-1.5)).toBe(`${MINUS_SIGN}1.50`);
  });

  it("drops the sign from a negative that rounds to zero", () => {
    expect(toAlignedFixed(-0.001)).toBe("0.00");
  });
});

describe("formatSignedExpectedPoints", () => {
  it("marks a gain with a leading plus", () => {
    expect(formatSignedExpectedPoints(4.2)).toBe("+4.20");
  });

  it("marks a loss with the digit-width minus sign", () => {
    expect(formatSignedExpectedPoints(-4.2)).toBe(`${MINUS_SIGN}4.20`);
  });

  it("leaves an exact zero unsigned", () => {
    expect(formatSignedExpectedPoints(0)).toBe("0.00");
  });

  /*
   * The sign is taken from the rounded value, so a quantity too small to show
   * does not claim a gain the displayed number contradicts.
   */
  it("leaves a positive value that rounds to zero unsigned", () => {
    expect(formatSignedExpectedPoints(0.001)).toBe("0.00");
  });
});

describe("formatCount", () => {
  it("shows a whole count as it stands", () => {
    expect(formatCount(12)).toBe("12");
  });

  it("uses the digit-width minus sign for a negative count", () => {
    expect(formatCount(-6)).toBe(`${MINUS_SIGN}6`);
  });
});

describe("formatSignedCount", () => {
  it("marks a positive count with a leading plus", () => {
    expect(formatSignedCount(6)).toBe("+6");
  });

  it("leaves zero unsigned", () => {
    expect(formatSignedCount(0)).toBe("0");
  });

  it("uses the digit-width minus sign for a negative count", () => {
    expect(formatSignedCount(-6)).toBe(`${MINUS_SIGN}6`);
  });
});
