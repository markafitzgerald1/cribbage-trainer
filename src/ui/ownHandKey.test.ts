import { describe, expect, it } from "@jest/globals";
import { formatOwnHand, ownHandKey, readOwnHandId } from "./ownHandKey";
import { mockThrowingStorage } from "../ui-react/Trainer.test.common";

const HAND_KEY = "AH,2H|Dealer";

describe("readOwnHandId", () => {
  it.each([
    { expected: "first-deal", queried: HAND_KEY, stored: HAND_KEY },
    { expected: null, queried: "AH,2H|Pone", stored: HAND_KEY },
  ])(
    "reads $expected when the marker names $stored and the hand is $queried",
    ({ expected, queried, stored }) => {
      localStorage.setItem(ownHandKey, formatOwnHand("first-deal", stored));

      expect(readOwnHandId(queried)).toBe(expected);
    },
  );

  it("reads nothing when no marker is stored", () => {
    localStorage.clear();

    expect(readOwnHandId(HAND_KEY)).toBeNull();
  });

  it("reads nothing when storage throws", () => {
    const spy = mockThrowingStorage(ownHandKey);
    const id = readOwnHandId(HAND_KEY);
    spy.mockRestore();

    expect(id).toBeNull();
  });
});
