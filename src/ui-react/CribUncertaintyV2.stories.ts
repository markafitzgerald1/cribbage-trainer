/* jscpd:ignore-start */
import {
  type Meta,
  SortOrder,
  type StoryObj,
  playToggle,
  toDealtCards,
} from "./stories.common";
import {
  V2_IDENTITIES,
  V2_REJECTIONS,
  rejectedV2Document,
  v2Diagnostics,
  v2Document,
} from "../game/cribUncertaintyV2.test.common";
import { expect, fn, waitFor, within } from "storybook/test";
import { CRIB_UNCERTAINTY_CONTRACT } from "../game/cribUncertainty";
import { CribRole } from "../game/expectedCribPoints";
import { ScoredKeepDiscardSortKey } from "../analysis/compareByExpectedScoreDescending";
import { ScoredPossibleKeepDiscards } from "./ScoredPossibleKeepDiscards";
import { createUncertaintyLoader } from "../game/uncertaintyLoader";
import cribSidecar from "../game/expectedCribPointsUncertainty.json";
import { parseHand } from "../game/Card";
import { parseUncertaintySidecar } from "../game/uncertaintySidecar";
import { validCribV2Identity } from "../game/cribUncertaintyV2.mjs";
/* jscpd:ignore-end */

const contract = CRIB_UNCERTAINTY_CONTRACT;
const fixture = () => v2Document(contract.vocabulary);
const parse = (value: unknown) => parseUncertaintySidecar(value, contract);
const rootDocument = () => {
  const doc = fixture();
  const records = Object.fromEntries(
    Object.keys(cribSidecar.record_groups.totals.records).map((identity) => [
      identity,
      { mu: 1, n: 4, reported_marginal_se: 0.125 },
    ]),
  );
  doc.record_groups.totals = {
    record_count: Object.keys(records).length,
    records,
  };
  return doc;
};
const source = createUncertaintyLoader(
  () => Promise.resolve({ default: rootDocument() }),
  contract,
);

const meta: Meta<typeof ScoredPossibleKeepDiscards> = {
  args: {
    cribRole: CribRole.Dealer,
    cribUncertaintySource: source,
    dealtCards: toDealtCards(parseHand("AH,2H,3S,4C,5D,6S"), [0, 1]),
    onAnalysisRendered: fn(),
    onScoreSortKeyChange: fn(),
    scoreSortKey: ScoredKeepDiscardSortKey.ExpectedNetPoints,
    sortOrder: SortOrder.Descending,
  },
  component: ScoredPossibleKeepDiscards,
  title: "ScoredPossibleKeepDiscards/V2 crib sidecar",
};
export default meta;
type Story = StoryObj<typeof meta>;

export const MarginalSampling: Story = {
  play: async (context) => {
    await playToggle(context);
    const canvas = within(context.canvasElement);
    const cribRow = canvas.getByRole("button", { name: /Crib avg/u });
    await waitFor(() => expect(cribRow.textContent).toContain("±0.13"), {
      timeout: 10000,
    });
    await Promise.all(
      V2_REJECTIONS.map(async ({ path, value }) => {
        await expect(
          parse(rejectedV2Document(contract.vocabulary, path, value)),
        ).toBeNull();
      }),
    );
    await Promise.all(
      V2_IDENTITIES.map(async ([identity, valid]) => {
        await expect(validCribV2Identity(identity)).toBe(valid);
      }),
    );
    const diagnostics = v2Diagnostics(contract.vocabulary, null);

    await expect(parse(diagnostics)).not.toBeNull();
  },
};
