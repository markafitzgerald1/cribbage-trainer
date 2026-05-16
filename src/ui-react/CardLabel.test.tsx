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
      const result = renderLabelComponent(dealtCardRank);
      const rankElement = result.getByText(CARD_LABELS[dealtCardRank]);

      expect(rankElement.className.split(" ").includes(classes.ten)).toBe(
        dealtCardRank === CARDS.TEN.rank,
      );
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

      const suitElement = result.getByText(suit);

      expect(suitElement.parentElement?.querySelector("svg")).toBeTruthy();
    },
  );

  it("renders multiple ranks and multiple suits", () => {
    const result = render(
      <CardLabel
        ranks={[Rank.KING, Rank.TEN]}
        suits={[Suit.CLUBS, Suit.DIAMONDS]}
      />,
    );

    expect(result.getByText("K")).toBeTruthy();
    expect(result.getByText("10")).toBeTruthy();
    expect(result.getByText(Suit.CLUBS)).toBeTruthy();
    expect(result.getByText(Suit.DIAMONDS)).toBeTruthy();
  });

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

  it("renders empty when no ranks or suits provided", () => {
    const result = render(<CardLabel />);
    const cardLabel = result.container.querySelector(`.${classes.cardLabel}`);

    expect(cardLabel?.textContent).toBe("");
  });
});
