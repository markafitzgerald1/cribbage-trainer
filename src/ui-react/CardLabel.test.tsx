import * as classes from "./CardLabel.module.css";
import { CARDS, CARD_LABELS, Rank } from "../game/Card";
import { describe, expect, it } from "@jest/globals";
import { CardLabel } from "./CardLabel";
import { dealHand } from "../game/dealHand";
import { render } from "@testing-library/react";

describe("card label component", () => {
  const renderCard = (rank: Rank) => render(<CardLabel rank={rank} />);

  const dealCard = () => dealHand(Math.random)[0]!.rank;

  it("label text is its rank label", () => {
    const rank = dealCard();
    expect(renderCard(rank).getByText(CARD_LABELS[rank]!)).toBeTruthy();
  });

  it.each([CARDS.TEN.rank, CARDS.FOUR.rank])(
    "%s has the 'ten' CSS class if it is a ten",
    (dealtCardRank) => {
      const { getByText } = renderCard(dealtCardRank);

      expect(
        getByText(CARD_LABELS[dealtCardRank]!)
          .className.split(" ")
          .includes(classes.ten),
      ).toBe(dealtCardRank === CARDS.TEN.rank);
    },
  );
});
