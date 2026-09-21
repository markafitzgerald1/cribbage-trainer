import {
  CribRole,
  type ExpectedCribPointBreakdown,
} from "../game/expectedCribPoints";

const DEALER_MULTIPLIER = 1;
const PONE_MULTIPLIER = -1;
const missingCategoryValue = new Map<string, number>().get("missing");

export interface Category {
  readonly isMutedHeader?: boolean;
  readonly label: string;
  readonly notApplicable?: boolean;
  /*
   * A simulation-error bound on `value`, when the published sidecar covers
   * every bucket that value was built from. Absent or null means the bound is
   * unavailable, which is not the same as a bound of zero - a measured zero
   * is a real value and renders as one.
   */
  readonly uncertainty?: number | null;
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
    { label: "Total", uncertainty, value: expectedCribPoints * multiplier },
  ];
};
