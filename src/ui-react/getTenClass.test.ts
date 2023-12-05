import { describe, expect, it } from "@jest/globals";
import { CARDS } from "../game/Card";
import { getTenClass } from "./getTenClass";

describe("getTenClass", () => {
  it.each([CARDS.TEN, CARDS.FOUR])(
    "returns 'ten' CSS class if %s is a ten",
    (card) => {
      const fakeTenClassName = "tenHooray";

      expect(
        getTenClass(card.rank, fakeTenClassName) === fakeTenClassName,
      ).toBe(card.rank === CARDS.TEN.rank);
    },
  );
});
