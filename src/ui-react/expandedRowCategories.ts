import {
  CribRole,
  type ExpectedCribPointBreakdown,
} from "../game/expectedCribPoints";
import {
  type UncertaintyFigure,
  UncertaintyKind,
  toUncertaintyFigure,
} from "./uncertaintyFigure";

const DEALER_MULTIPLIER = 1;
const PONE_MULTIPLIER = -1;
const missingCategoryValue = new Map<string, number>().get("missing");

export interface Category {
  readonly isMutedHeader?: boolean;
  readonly label: string;
  readonly notApplicable?: boolean;
  /*
   * What the published sidecar says about `value`, and which kind of figure
   * that is - the two sidecars do not qualify the same quantity. Absent or
   * null means unavailable, which is not the same as a figure of zero: a
   * measured zero is a real value and renders as one.
   */
  readonly uncertainty?: UncertaintyFigure | null;
  readonly value: number | undefined;
}

export interface CribCategoriesOptions {
  readonly cribRole: CribRole;
  readonly expectedCribPoints: number;
  readonly pointBreakdown: ExpectedCribPointBreakdown | undefined;
  readonly uncertainty: number | null;
}

export const createCribCategories = ({
  cribRole,
  expectedCribPoints,
  pointBreakdown,
  uncertainty,
}: CribCategoriesOptions): readonly Category[] => {
  const multiplier =
    cribRole === CribRole.Dealer ? DEALER_MULTIPLIER : PONE_MULTIPLIER;
  return [
    {
      label: "15s",
      value:
        typeof pointBreakdown?.fifteens === "undefined"
          ? missingCategoryValue
          : pointBreakdown.fifteens * multiplier,
    },
    {
      label: "Pairs",
      value:
        typeof pointBreakdown?.pairs === "undefined"
          ? missingCategoryValue
          : pointBreakdown.pairs * multiplier,
    },
    {
      label: "Runs",
      value:
        typeof pointBreakdown?.runs === "undefined"
          ? missingCategoryValue
          : pointBreakdown.runs * multiplier,
    },
    {
      label: "Flushes",
      value:
        typeof pointBreakdown?.flushes === "undefined"
          ? missingCategoryValue
          : pointBreakdown.flushes * multiplier,
    },
    {
      label: "Nobs",
      value:
        typeof pointBreakdown?.nobs === "undefined"
          ? missingCategoryValue
          : pointBreakdown.nobs * multiplier,
    },
    /*
     * The bound rides on the total rather than on each category: the sidecar
     * publishes one standard error per bucket, covering the bucket's total,
     * and has no category records to give 15s or pairs one of their own.
     */
    {
      label: "Total",
      uncertainty: toUncertaintyFigure(UncertaintyKind.CribBound, uncertainty),
      value: expectedCribPoints * multiplier,
    },
  ];
};
