import {
  type PolicyRow,
  drawPolicyRank,
  parsePolicyShard,
} from "./pegPolicyShard";
import { describe, expect, it } from "@jest/globals";
import type { Rank } from "./Card";

// The simulate-cribbage-games exporter's tests pin these same bytes.
const PINNED = [
  ...[0x43, 0x50, 0x53, 0x31],
  ...[2, 0, 0, 0],
  ...[0, 0, 0, 0, 0, 0, 0, 0],
  ...[0x31, 0, 0, 0, 0, 0, 0, 0],
  ...[2, 5, 0, 0, 0, 3, 9, 0],
  ...[2, 3],
  ...[1, 0],
  ...[0xe8, 0x03, 0, 0, 0xfa, 0, 0, 0, 0xee, 0x02],
];

const payload = (bytes: number[]): Uint8Array => Uint8Array.from(bytes);

const withByte = (index: number, value: number): Uint8Array => {
  const bytes = [...PINNED];
  bytes.splice(index, 1, value);
  return payload(bytes);
};

const RANKS_AT = 24;
const WIDTHS_AT = 32;
const SUPPORT_AT = 34;
const FIRST_DELTA_AT = 8;
const SECOND_DELTA_AT = 16;
const HIGH_DELTA_AT = 23;

const asRanks = (values: readonly number[]): readonly Rank[] =>
  values as readonly Rank[];

const pinnedRow = (): PolicyRow =>
  parsePolicyShard(payload(PINNED))?.lookup(0x31) as PolicyRow;

describe("pegging policy shard", () => {
  it("reads the pinned rows by history", () => {
    expect.hasAssertions();

    const shard = parsePolicyShard(payload(PINNED));

    expect(shard?.rowCount).toBe(2);
    expect(shard?.lookup(0)).toStrictEqual({
      counts: [1000, 0],
      ranks: [2, 5],
      supported: true,
    });
    expect(shard?.lookup(0x31)).toStrictEqual({
      counts: [250, 0, 750],
      ranks: [0, 3, 9],
      supported: false,
    });
    expect(shard?.lookup(0x30)).toBeNull();
    expect(shard?.lookup(0x32)).toBeNull();
  });

  it("reads a slice of a larger buffer at its own offset", () => {
    expect.hasAssertions();

    const buffer = new Uint8Array(PINNED.length + 3);
    buffer.set(PINNED, 3);

    expect(
      parsePolicyShard(buffer.subarray(3))?.lookup(0x31)?.ranks,
    ).toStrictEqual([0, 3, 9]);
  });

  it("adds each delta to the previous history", () => {
    expect.hasAssertions();

    const shard = parsePolicyShard(withByte(FIRST_DELTA_AT, 1));

    expect(shard?.lookup(1)?.ranks).toStrictEqual([2, 5]);
    expect(shard?.lookup(0x32)?.ranks).toStrictEqual([0, 3, 9]);
    expect(shard?.lookup(0x31)).toBeNull();
  });

  it("reads the high word of a history delta", () => {
    expect.hasAssertions();

    const shard = parsePolicyShard(withByte(HIGH_DELTA_AT - 2, 1));

    expect(shard?.lookup(0x31 + 2 ** 40)?.ranks).toStrictEqual([0, 3, 9]);
    expect(parsePolicyShard(withByte(HIGH_DELTA_AT, 1))).toBeNull();
  });

  it.each([
    { bytes: payload(PINNED.slice(0, 7)), name: "a truncated header" },
    { bytes: withByte(0, 0x44), name: "another magic" },
    { bytes: withByte(4, 3), name: "a row count the columns cannot hold" },
    { bytes: payload([...PINNED, 0]), name: "a trailing byte" },
    { bytes: payload(PINNED.slice(0, -1)), name: "truncated counts" },
    { bytes: withByte(SECOND_DELTA_AT, 0), name: "a repeated history" },
    { bytes: withByte(WIDTHS_AT, 1), name: "a width below two" },
    { bytes: withByte(WIDTHS_AT, 5), name: "a width above four" },
    { bytes: withByte(SUPPORT_AT, 2), name: "a support byte above one" },
    { bytes: withByte(RANKS_AT, 5), name: "ranks out of order" },
    { bytes: withByte(RANKS_AT + 6, 13), name: "a rank past king" },
    { bytes: withByte(RANKS_AT + 3, 4), name: "padding after the ranks" },
    {
      bytes: withByte(SUPPORT_AT + 2, 0xe9),
      name: "counts not summing to 1000",
    },
  ])("refuses $name", ({ bytes }) => {
    expect.hasAssertions();
    expect(parsePolicyShard(bytes)).toBeNull();
  });

  it("refuses a history past thirteen events", () => {
    expect.hasAssertions();

    const bytes = [...PINNED];
    bytes.splice(SECOND_DELTA_AT + 6, 2, 0x10, 0);

    expect(parsePolicyShard(payload(bytes))).toBeNull();

    bytes.splice(SECOND_DELTA_AT + 6, 2, 0x0f, 0);

    expect(parsePolicyShard(payload(bytes))).not.toBeNull();
  });

  it.each([
    { draw: 0, expected: 0 },
    { draw: 249, expected: 0 },
    { draw: 250, expected: 9 },
    { draw: 999, expected: 9 },
  ])(
    "draws rank $expected for $draw, never a zero count",
    ({ draw, expected }) => {
      expect.hasAssertions();

      expect(drawPolicyRank(pinnedRow(), asRanks([0, 3, 9]), draw)).toBe(
        expected,
      );
    },
  );

  it.each([
    { draw: 0, legal: asRanks([0, 3]), name: "a menu narrower than stored" },
    { draw: 0, legal: asRanks([0, 3, 8]), name: "a different menu" },
    { draw: 1000, legal: asRanks([0, 3, 9]), name: "a draw of 1000" },
    { draw: -1, legal: asRanks([0, 3, 9]), name: "a negative draw" },
    { draw: 0.5, legal: asRanks([0, 3, 9]), name: "a fractional draw" },
  ])("refuses $name", ({ draw, legal }) => {
    expect.hasAssertions();

    expect(() => drawPolicyRank(pinnedRow(), legal, draw)).toThrow(
      "does not fit",
    );
  });
});
