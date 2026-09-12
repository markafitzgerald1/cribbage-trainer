const EXPECTED_POINTS_FRACTION_DIGITS = 2;

/*
 * The U+2212 minus sign matches the "+" advance width with tabular figures,
 * so signed columns stay aligned (the ASCII hyphen-minus is narrower).
 */
export const MINUS_SIGN = "−";

export const toAlignedFixed = (points: number): string => {
  const roundedPoints = Number(points.toFixed(EXPECTED_POINTS_FRACTION_DIGITS));

  return roundedPoints
    .toFixed(EXPECTED_POINTS_FRACTION_DIGITS)
    .replace("-", MINUS_SIGN);
};

/*
 * The sign is decided from the rounded value, not the raw one, so a quantity
 * that displays as zero displays as a plain "0.00" rather than "+0.00" — the
 * leading "+" would otherwise claim a gain the number on screen does not show.
 */
export const formatSignedExpectedPoints = (points: number): string => {
  const formatted = toAlignedFixed(points);

  return Number(formatted.replace(MINUS_SIGN, "-")) > 0
    ? `+${formatted}`
    : formatted;
};

export const formatCount = (points: number): string =>
  String(points).replace("-", MINUS_SIGN);

// Whole-number counts need no rounding, so the sign follows the value directly.
export const formatSignedCount = (points: number): string =>
  points > 0 ? `+${points}` : formatCount(points);
