/** @jest-environment node */
/* jscpd:ignore-start */
import { DEALER, PONE } from "./pegging";
import { describe, expect, it, jest } from "@jest/globals";
import { createPolicyShardLoader } from "./pegPolicyShardLoader";
import { gzipSync } from "node:zlib";
/* jscpd:ignore-end */

const PONE_KEEP = "A_2_3_4";
const DEALER_KEEP = "5_6_7_8";
const NEXT_KEEP = "9_T_J_Q";

// One opening row, zero-based ranks 0 and 1, with 1000 and 0 counts.
const OPENING_ROW = Buffer.from(
  "43505331010000000000000000000000000100000201e8030000",
  "hex",
);
const compressedBody = (data: Uint8Array = OPENING_ROW) =>
  Uint8Array.from(gzipSync(data));
const shardResponse = () => new Response(compressedBody());

const mockShardFetch = () =>
  jest.spyOn(globalThis, "fetch").mockResolvedValue(shardResponse());

describe("policy shard loader", () => {
  it("fetches only requested seat and keep pairs and shares their cached results", async () => {
    expect.hasAssertions();

    using requests = mockShardFetch();
    const lookup = createPolicyShardLoader()(PONE_KEEP, DEALER_KEEP);

    expect([
      lookup(PONE, DEALER_KEEP),
      requests.mock.calls.length,
    ]).toStrictEqual([null, 0]);

    const first = lookup(PONE, PONE_KEEP);

    expect(lookup(PONE, PONE_KEEP)).toBe(first);

    const shard = await first;
    const second = lookup(DEALER, DEALER_KEEP);
    await second;

    expect(shard?.lookup(0)?.counts).toStrictEqual([1000, 0]);
    expect(lookup(DEALER, DEALER_KEEP)).toBe(second);
    expect(requests.mock.calls.map(([url]) => url)).toStrictEqual([
      "/pegging-policy-shards/pone/A_2_3_4.bin.gz",
      "/pegging-policy-shards/dealer/5_6_7_8.bin.gz",
    ]);
  });

  it("returns null without fetching a forced keep or an invalid asset key", () => {
    expect.hasAssertions();

    const forForcedHand = createPolicyShardLoader();
    using requests = mockShardFetch();
    const lookup = forForcedHand("A_A_A_A", "../outside");

    expect(lookup(PONE, "A_A_A_A")).toBeNull();
    expect(lookup(DEALER, "../outside")).toBeNull();
    expect(requests).not.toHaveBeenCalled();
  });

  const failedResponses = [
    [
      "HTTP status",
      () => Promise.resolve(new Response(compressedBody(), { status: 404 })),
    ],
    ["missing body", () => Promise.resolve(new Response(null))],
    ["invalid gzip", () => Promise.resolve(new Response("invalid gzip"))],
    [
      "invalid payload",
      () => Promise.resolve(new Response(compressedBody(Uint8Array.of(0)))),
    ],
    [
      "network error",
      () => Promise.reject(new TypeError("network unavailable")),
    ],
  ] as const;

  it.each(failedResponses)(
    "retries after %s with cache reload",
    async (_name, fail) => {
      expect.hasAssertions();

      using requests = mockShardFetch().mockImplementationOnce(fail);
      const lookup = createPolicyShardLoader("/preview/")(
        PONE_KEEP,
        DEALER_KEEP,
      );

      await expect(
        Promise.resolve(lookup(PONE, PONE_KEEP)),
      ).resolves.toBeNull();
      await expect(
        Promise.resolve(lookup(PONE, PONE_KEEP)),
      ).resolves.toMatchObject({ rowCount: 1 });
      expect(
        requests.mock.calls.map(([, options]) => options?.cache),
      ).toStrictEqual(["default", "reload"]);
    },
  );

  it("invalidates the previous hand and ignores its late response", async () => {
    expect.hasAssertions();

    const delivery: { resolve: ((response: Response) => void) | null } = {
      resolve: null,
    };
    const delayed = new Promise<Response>((resolve) => {
      delivery.resolve = resolve;
    });
    using requests = mockShardFetch()
      .mockResolvedValueOnce(shardResponse())
      .mockReturnValueOnce(delayed);
    const forHand = createPolicyShardLoader("/preview/");
    const earlier = forHand(PONE_KEEP, DEALER_KEEP);
    const first = await earlier(PONE, PONE_KEEP);
    const unfinished = Promise.resolve(earlier(DEALER, DEALER_KEEP));
    const current = forHand(PONE_KEEP, NEXT_KEEP);
    const previousRequest = requests.mock.calls.at(1);

    expect(previousRequest?.[1]?.signal?.aborted).toBe(true);
    expect(earlier(PONE, PONE_KEEP)).toBeNull();

    delivery.resolve?.(shardResponse());
    const replacement = await current(PONE, PONE_KEEP);

    await expect(unfinished).resolves.toBeNull();
    expect(replacement).not.toBe(first);
    expect([
      requests.mock.calls.length,
      requests.mock.lastCall?.[0],
    ]).toStrictEqual([3, "/preview/pone/A_2_3_4.bin.gz"]);
  });
});
