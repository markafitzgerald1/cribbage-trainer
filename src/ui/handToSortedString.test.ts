import { CARD_LABELS, createCard } from "../game/Card";
import { describe, expect, it } from "@jest/globals";
/* jscpd:ignore-start */
import { HandCard } from "../game/HandCard";
import { SortOrder } from "./SortOrder";
import { handToSortedString } from "./handToSortedString";
import { sortOrderNames } from "../ui/SortOrderName";
/* jscpd:ignore-end */

describe("handToString", () => {
  describe("kept hand", () => {
    const createHand = (handSpecifier: string): readonly HandCard[] =>
      [...handSpecifier].map((rankLabel, dealOrder) => ({
        ...createCard(CARD_LABELS.indexOf(rankLabel)),
        dealOrder,
      }));

    const FOUR_THREE_TWO_ACE = "432A";
    const ACE_TWO_THREE_FOUR = "A234";

    describe.each(sortOrderNames)("sort order %s", (sortOrderName) => {
      it.each([
        ["hand of non-ten number cards", "5982", ["9852", "2589"]],
        [
          "unsorted hand containing an ace",
          "A423",
          [FOUR_THREE_TWO_ACE, ACE_TWO_THREE_FOUR],
        ],
        ["hand containing a jack", "J582", ["J852", "258J"]],
        ["hand of only ten cards", "KJTQ", ["KQJT", "TJQK"]],
        ["hand with picture, number and ace cards", "KAJ2", ["KJ2A", "A2JK"]],
        [
          "sorted ascending hand",
          ACE_TWO_THREE_FOUR,
          [FOUR_THREE_TWO_ACE, ACE_TWO_THREE_FOUR],
        ],
        [
          "sorted descending hand",
          FOUR_THREE_TWO_ACE,
          [FOUR_THREE_TWO_ACE, ACE_TWO_THREE_FOUR],
        ],
        ["descending discard with picture card", "K4", ["K4", "4K"]],
        ["ascending discard with only number cards", "79", ["97", "79"]],
        ["pair discard", "55", ["55", "55"]],
        ["ascending discard of ten cards", "TK", ["KT", "TK"]],
        ["descending discard of number cards", "82", ["82", "28"]],
      ])(`%s`, (_, handSpecifier, expectedHands) =>
        expect(
          handToSortedString(
            createHand(handSpecifier),
            SortOrder[sortOrderName]
          )
        ).toBe([handSpecifier, ...expectedHands][SortOrder[sortOrderName]])
      );
    });
  });
});
