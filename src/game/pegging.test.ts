import {
  DEALER,
  GO,
  PONE,
  type PeggingEvent,
  type PeggingState,
  RESET,
  historyKey,
  isPolicyDecision,
  legalRanks,
  pairScore,
  playRank,
  runLength,
  sayGo,
  startPegging,
} from "./pegging";
import { describe, expect, it } from "@jest/globals";
import type { Rank } from "./Card";

const ranks = (...values: number[]): Rank[] => values as Rank[];

const after = (
  pone: number[],
  dealer: number[],
  plays: (number | null)[],
): PeggingState =>
  plays.reduce<PeggingState>(
    (state, play) =>
      play === null ? sayGo(state) : playRank(state, play as Rank),
    startPegging(ranks(...pone), ranks(...dealer)),
  );

const afterReset = (state: PeggingState): object => ({
  count: state.count,
  last: state.history.at(-1),
  next: state.next,
  points: state.points,
});

const resetFor = (next: number, points: number[]): object => ({
  count: 0,
  last: RESET,
  next,
  points,
});

const thirtyThenTwoGoes = (): PeggingState =>
  after([9, 10, 11, 12], [9, 10, 11, 12], [9, 10, 11, null, null]);

describe("pegging", () => {
  it("scores fifteen-two for the player who makes it", () => {
    expect.hasAssertions();

    const state = after([6, 1, 2, 3], [7, 1, 2, 3], [6, 7]);

    expect(state.count).toBe(15);
    expect(state.points).toStrictEqual([0, 2]);
  });

  it("awards a go pair to the last player and resets for the other", () => {
    expect.hasAssertions();

    const state = thirtyThenTwoGoes();

    expect(afterReset(state)).toStrictEqual(resetFor(DEALER, [4, 0]));
    expect(state.history).toStrictEqual([9, 10, 11, GO, GO, RESET]);
  });

  it("packs ranks, goes and resets four bits each, oldest lowest", () => {
    expect.hasAssertions();

    const expected =
      0xa +
      0xb * 16 +
      0xc * 16 ** 2 +
      0xe * 16 ** 3 +
      0xe * 16 ** 4 +
      0xf * 16 ** 5;

    expect(historyKey(thirtyThenTwoGoes().history)).toBe(expected);
    expect(historyKey([])).toBe(0);
  });

  it("refuses a history longer than any policy menu holds", () => {
    expect.hasAssertions();

    const fourteen = Array.from({ length: 14 }, (): PeggingEvent => GO);

    expect(() => historyKey(fourteen)).toThrow("at most 13");
    expect(historyKey(fourteen.slice(1))).toBe(
      Array.from({ length: 13 }, (_, index) => 14 * 16 ** index).reduce(
        (sum, value) => sum + value,
      ),
    );
  });

  it.each([
    { expected: 3, name: "an out-of-order run", played: [4, 2], rank: 3 },
    { expected: 0, name: "a repeated rank", played: [2, 3, 3], rank: 4 },
    { expected: 4, name: "the longest run", played: [2, 4, 5], rank: 3 },
    { expected: 3, name: "a shorter tail", played: [9, 2, 4], rank: 3 },
    { expected: 0, name: "too few cards", played: [4], rank: 5 },
  ])("scores $name as a run of $expected", ({ expected, played, rank }) => {
    expect.hasAssertions();
    expect(runLength(ranks(...played), rank as Rank)).toBe(expected);
  });

  it.each([
    { expected: 2, played: [1, 5] },
    { expected: 6, played: [5, 5] },
    { expected: 12, played: [5, 5, 5] },
    { expected: 0, played: [5, 2] },
    { expected: 0, played: [] },
  ])("scores $expected for a five after $played", ({ expected, played }) => {
    expect.hasAssertions();
    expect(pairScore(ranks(...played), 5)).toBe(expected);
  });

  it("scores thirty-one as two and resets for the other player", () => {
    expect.hasAssertions();

    const state = after([9, 10, 4, 1], [9, 0, 2, 3], [9, 9, 10, 0]);

    expect(afterReset(state)).toStrictEqual(resetFor(PONE, [0, 4]));
  });

  it("scores one for the last card", () => {
    expect.hasAssertions();

    const state = after([12], [11], [12, 11]);

    expect(state.finished).toBe(true);
    expect(state.points).toStrictEqual([0, 1]);
  });

  it("scores a last card making thirty-one as two, not three", () => {
    expect.hasAssertions();

    const state = after([9, 0], [9, 9], [9, 9, 0, 9]);

    expect(state.finished).toBe(true);
    expect(state.count).toBe(31);
    expect(state.points).toStrictEqual([0, 4]);
  });

  it("refuses an illegal card and an illegal go", () => {
    expect.hasAssertions();

    const state = startPegging(ranks(9, 10, 11, 12), ranks(0, 1, 2, 3));

    expect(() => playRank(state, 0)).toThrow("not a legal play");
    expect(() => sayGo(state)).toThrow("no playable card");
  });

  it("offers each playable rank once and only under thirty-one", () => {
    expect.hasAssertions();

    const state = after([12, 12, 4, 0], [9, 10, 11, 0], [12, 9, 12]);

    expect(state.count).toBe(30);
    expect(legalRanks(state)).toStrictEqual([0]);
    expect(legalRanks(startPegging(ranks(4, 4, 0, 0), ranks()))).toStrictEqual([
      0, 4,
    ]);
  });

  it("has a policy decision only with two ranks to choose between", () => {
    expect.hasAssertions();

    const opening = startPegging(ranks(0, 1, 2, 3), ranks(4, 5, 6, 7));

    expect(isPolicyDecision(opening)).toBe(true);
    expect(isPolicyDecision(startPegging(ranks(5, 5, 5, 5), ranks(0)))).toBe(
      false,
    );
    expect(
      isPolicyDecision(after([0, 1, 2, 3], [4, 5, 6, 7], [0, 4, 1, 5, 2, 6])),
    ).toBe(false);
  });

  it("plays nothing more once the hand is finished", () => {
    expect.hasAssertions();

    const finished = after([0], [1], [0, 1]);

    expect(isPolicyDecision(finished)).toBe(false);
    expect(() => sayGo(finished)).toThrow("no playable card");
  });

  it("refuses a go pair with no card played since the reset", () => {
    expect.hasAssertions();

    const blocked: PeggingState = {
      ...startPegging(ranks(12), ranks(12)),
      count: 30,
      passed: [false, true],
    };

    expect(() => sayGo(blocked)).toThrow("card played since the reset");
  });
});
