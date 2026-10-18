import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import { describe, expect, it, jest } from "@jest/globals";
import { MistakeQueueDialog } from "./MistakeQueueDialog";
import type { StoredTally } from "../ui/discardTally";
import { createAgedOutTally } from "./MistakeQueueDialog.test.common";
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

const renderQueue = (tally: StoredTally) => {
  setAnalysisTables();

  return render(
    <MistakeQueueDialog
      onClose={jest.fn()}
      show
      tally={tally}
    />,
  );
};

describe("mistake queue while a decision is pending", () => {
  it("says the last discard is being judged rather than that mistakes aged out", () => {
    const { getByText, queryByText } = renderQueue(withRecord({}));

    expect(getByText(/Judging your last discard/iu)).toBeInTheDocument();
    expect(queryByText(/aged out/iu)).not.toBeInTheDocument();
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
    const { getByText, queryByText } = renderQueue(withRecord(overrides));

    expect(getByText(/aged out/iu)).toBeInTheDocument();
    expect(queryByText(/Judging your last discard/iu)).not.toBeInTheDocument();
  });
});
