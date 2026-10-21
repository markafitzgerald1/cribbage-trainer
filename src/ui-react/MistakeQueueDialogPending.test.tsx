import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import {
  MistakeQueueDialog,
  type MistakeQueueDialogProps,
} from "./MistakeQueueDialog";
import {
  createAgedOutTally,
  createSampleMistakeTally,
} from "./MistakeQueueDialog.test.common";
import { describe, expect, it, jest } from "@jest/globals";
import type { StoredTally } from "../ui/discardTally";
import { createTestMistakeRecord } from "../ui/mistakeQueue.test.common";
import { render } from "@testing-library/react";
import { setAnalysisTables } from "./Trainer.test.common";

const agedOut = createAgedOutTally();
const withRecord = (
  overrides: Parameters<typeof createTestMistakeRecord>[0],
): StoredTally => ({
  ...agedOut,
  records: [
    ...agedOut.records,
    createTestMistakeRecord({
      handKey: "2C,3C,4C,5C,6C,7C|Dealer",
      recordedAdmission: "pending",
      ...overrides,
    }),
  ],
});

const renderQueue = (
  tally: StoredTally,
  filters: Pick<
    MistakeQueueDialogProps,
    "initialRoleFilter" | "initialStatusFilter"
  > = {},
) => {
  setAnalysisTables();

  return render(
    <MistakeQueueDialog
      initialRoleFilter={filters.initialRoleFilter}
      initialStatusFilter={filters.initialStatusFilter}
      onClose={jest.fn()}
      show
      tally={tally}
    />,
  );
};

const expectOnlyMessage = (
  rendered: ReturnType<typeof renderQueue>,
  shown: RegExp,
) => {
  expect(rendered.getByText(shown)).toBeInTheDocument();
  expect(
    rendered.queryByText(/Judging your last discard/iu),
  ).not.toBeInTheDocument();
};

describe("mistake queue while a decision is pending", () => {
  it("says the last discard is being judged rather than that mistakes aged out", () => {
    const { getByText, queryByText } = renderQueue(withRecord({}));

    expect(getByText(/Judging your last discard/iu)).toBeInTheDocument();
    expect(queryByText(/aged out/iu)).not.toBeInTheDocument();
  });

  it("judges a first-ever discard, the only record in the history", () => {
    const { getByText } = renderQueue({
      ...agedOut,
      records: withRecord({}).records.slice(-1),
    });

    expect(getByText(/Judging your last discard/iu)).toBeInTheDocument();
  });

  it.each([
    {
      name: "an optimal pending record",
      overrides: { expectedPointsLoss: 0, isOptimal: true },
    },
    {
      name: "a record settled within noise",
      overrides: {
        recordedAdmission: { basis: "sampling-noise-v1", eligible: false },
      },
    },
    { name: "a pending practice record", overrides: { isPractice: true } },
  ])("still says mistakes aged out with $name", ({ overrides }) => {
    expectOnlyMessage(renderQueue(withRecord(overrides)), /aged out/iu);
  });

  it("keeps the filter message for a non-empty queue the filters emptied", () => {
    const sample = createSampleMistakeTally();
    const rendered = renderQueue(
      {
        ...sample,
        records: [
          ...sample.records,
          createTestMistakeRecord({ recordedAdmission: "pending" }),
        ],
      },
      { initialRoleFilter: "pone", initialStatusFilter: "mastered" },
    );

    expectOnlyMessage(rendered, /match the selected filters/iu);
  });
});
