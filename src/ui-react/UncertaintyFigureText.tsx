import * as classes from "./ScoredPossibleKeepDiscardExpandedRow.module.css";
import { type UncertaintyFigure, UncertaintyKind } from "./uncertaintyFigure";

/*
 * U+00B1. Spelled out for screen readers beside it, because the glyph is
 * announced inconsistently or not at all.
 */
const PLUS_MINUS_SIGN = "±";

interface FigureCopy {
  readonly spokenSuffix: string;
  readonly title: string;
}

/*
 * The crib figure is a bound over combined buckets; the play figure is one
 * record's own standard error and omits a policy term of unpublished size.
 * The two must not read as the same quantity, which is the whole reason this
 * copy is per kind rather than shared.
 */
const CRIB_BOUND_COPY: FigureCopy = {
  spokenSuffix: ", a bound on the combined simulation error",
  title:
    "Bound on the combined simulation error of the buckets this average used",
};

const PLAY_STANDARD_ERROR_COPY: FigureCopy = {
  spokenSuffix: " simulation standard error, which excludes policy uncertainty",
  title:
    "Simulation standard error of this figure; excludes policy uncertainty",
};

const copyFor = (kind: UncertaintyKind): FigureCopy =>
  kind === UncertaintyKind.CribBound
    ? CRIB_BOUND_COPY
    : PLAY_STANDARD_ERROR_COPY;

/*
 * The tooltip rides on the `aria-hidden` half so it is visual only: a `title`
 * on the spoken half would announce the qualification twice, once as the
 * hidden text and once as that element's own name.
 */
export const renderUncertaintyFigure = (
  figure: UncertaintyFigure | null | undefined,
  decimalPlaces: number,
): React.JSX.Element | null => {
  if (typeof figure !== "object" || figure === null) {
    return null;
  }
  const formatted = figure.standardError.toFixed(decimalPlaces);
  const copy = copyFor(figure.kind);

  return (
    <span className={classes.uncertainty}>
      <span
        aria-hidden="true"
        title={copy.title}
      >
        {`${PLUS_MINUS_SIGN}${formatted}`}
      </span>
      <span className={classes.visuallyHidden}>
        {`plus or minus ${formatted}${copy.spokenSuffix}`}
      </span>
    </span>
  );
};
