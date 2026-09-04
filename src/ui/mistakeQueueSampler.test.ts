import {
  type MistakeQueueItem,
  sampleMistakeQueueByPriority,
} from "./mistakeQueue";
import { describe, expect, it } from "@jest/globals";
import {
  mockItemA,
  mockItemB,
  mockItemMastered,
} from "./mistakeQueue.test.common";

const zeroPriority = (
  item: MistakeQueueItem,
  handKey: string,
): MistakeQueueItem => ({ ...item, handKey, priority: 0 });

describe("sampleMistakeQueueByPriority", () => {
  it.each([
    { input: [], name: "an empty queue" },
    { input: [mockItemMastered], name: "an all-mastered queue" },
  ])("returns null for $name", ({ input }) => {
    expect(sampleMistakeQueueByPriority(input, 0.5)).toBeNull();
  });

  it("ignores mastered hands when drawing", () => {
    const drawn = sampleMistakeQueueByPriority(
      [mockItemMastered, mockItemA],
      0,
    );

    expect(drawn?.handKey).toBe(mockItemA.handKey);
  });

  it.each([
    { expected: mockItemA.handKey, name: "the low band", random: 0 },
    { expected: mockItemB.handKey, name: "the high band", random: 0.99 },
    {
      expected: mockItemB.handKey,
      name: "a random at or past 1",
      random: 1.5,
    },
  ])(
    "draws proportional to priority, hitting $name",
    ({ expected, random }) => {
      const drawn = sampleMistakeQueueByPriority(
        [mockItemA, mockItemB],
        random,
      );

      expect(drawn?.handKey).toBe(expected);
    },
  );

  it("splits the weighted range at the cumulative priority boundary", () => {
    const items = [mockItemA, mockItemB];
    const boundary =
      mockItemA.priority / (mockItemA.priority + mockItemB.priority);

    expect(sampleMistakeQueueByPriority(items, boundary - 0.01)?.handKey).toBe(
      mockItemA.handKey,
    );
    expect(sampleMistakeQueueByPriority(items, boundary + 0.01)?.handKey).toBe(
      mockItemB.handKey,
    );
  });

  it.each([
    { expected: "first|Dealer", random: 0 },
    { expected: "second|Dealer", random: 0.75 },
    { expected: "first|Dealer", random: -2 },
  ])(
    "falls back to a uniform draw when every priority is 0 (random $random)",
    ({ expected, random }) => {
      const items = [
        zeroPriority(mockItemA, "first|Dealer"),
        zeroPriority(mockItemB, "second|Dealer"),
      ];

      expect(sampleMistakeQueueByPriority(items, random)?.handKey).toBe(
        expected,
      );
    },
  );

  it.each([
    {
      exclude: mockItemA.handKey,
      expected: mockItemB.handKey,
      name: "skips the excluded hand while another is active",
      queue: [mockItemA, mockItemB],
    },
    {
      exclude: mockItemA.handKey,
      expected: mockItemA.handKey,
      name: "re-draws the excluded hand when it is the only one active",
      queue: [mockItemA, mockItemMastered],
    },
    {
      exclude: "not-in-queue|Dealer",
      expected: mockItemA.handKey,
      name: "ignores an exclusion that matches no active hand",
      queue: [mockItemA, mockItemB],
    },
  ])("$name", ({ exclude, expected, queue }) => {
    expect(sampleMistakeQueueByPriority(queue, 0, exclude)?.handKey).toBe(
      expected,
    );
  });
});
