/*
 * The two published sidecars qualify different things, so a display that
 * renders both must say which is which. The crib average is a weighted mean
 * over starter buckets and its figure is a dependence bound over exactly the
 * buckets that mean consumed. The pegging delta is a single published record
 * and its figure is that record's own standard error - sampling error around
 * a frozen, non-converged policy, excluding policy uncertainty, which the
 * contract publishes as unavailable rather than as zero.
 *
 * Both render as the same glyph because the Total column has room for nothing
 * else, so the distinction lives in the spoken text and the tooltip. Nothing
 * here may let one figure's qualification stand in for the other's.
 */
export const UncertaintyKind = {
  CribBound: "crib-bound",
  PlayStandardError: "play-standard-error",
} as const;

export type UncertaintyKind =
  (typeof UncertaintyKind)[keyof typeof UncertaintyKind];

export interface UncertaintyFigure {
  readonly kind: UncertaintyKind;
  readonly standardError: number;
}

/*
 * Absence stays absence: a measured standard error of exactly 0 is a real
 * value and becomes a figure like any other.
 */
export const toUncertaintyFigure = (
  kind: UncertaintyKind,
  standardError: number | null,
): UncertaintyFigure | null =>
  standardError === null ? null : { kind, standardError };
