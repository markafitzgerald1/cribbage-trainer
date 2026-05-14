import * as classes from "./CardLabel.module.css";
/* jscpd:ignore-start */
import { CARDS, CARD_LABELS, Rank, Suit } from "../game/Card";
import { describe, expect, it } from "@jest/globals";
import { CardLabel } from "./CardLabel";
import { dealHand } from "../game/dealHand";
import { getByCardText } from "./test-utils";
import { render } from "@testing-library/react";
/* jscpd:ignore-end */

describe("card label component", () => {
  function renderLabelComponent(rank: Rank) {
    const cardData = CARDS[rank]!;
    return render(
      <CardLabel
        rank={rank}
        suit={cardData.suit}
      />,
    );
  }

  const dealCard = () => dealHand(Math.random)[0]!.rank;

  it("label text is its rank label", () => {
    const rank = dealCard();
    const { suit } = CARDS[rank]!;

    expect(
      getByCardText(renderLabelComponent(rank), `${CARD_LABELS[rank]}${suit}`),
    ).toBeTruthy();
  });

  it.each([CARDS.TEN.rank, CARDS.FOUR.rank])(
    "%s has the 'ten' CSS class if it is a ten",
    (dealtCardRank) => {
      const { suit } = CARDS[dealtCardRank]!;

      expect(
        getByCardText(
          renderLabelComponent(dealtCardRank),
          `${CARD_LABELS[dealtCardRank]}${suit}`,
        )
          .className.split(" ")
          .includes(classes.ten),
      ).toBe(dealtCardRank === CARDS.TEN.rank);
    },
  );

  it.each([Suit.CLUBS, Suit.DIAMONDS, Suit.HEARTS, Suit.SPADES])(
    "renders a hidden text suit and visible image for %s",
    (suit) => {
      const result = render(
        <CardLabel
          rank={CARDS.ACE.rank}
          suit={suit}
        />,
      );

      expect(
        getByCardText(
          result,
          `${CARD_LABELS[CARDS.ACE.rank]}${suit}`,
        ).querySelector("path"),
      ).toBeTruthy();
    },
  );

  it("throws for an unexpected suit", () => {
    expect(() =>
      render(
        <CardLabel
          rank={CARDS.ACE.rank}
          suit={"unexpected" as Suit}
        />,
      ),
    ).toThrow("Unknown suit: unexpected");
  });
});
