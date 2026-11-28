/** @jest-environment node */
/* jscpd:ignore-start */
import * as policyShard from "./pegPolicyShard";
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
const fetchShardResponse = () => Promise.resolve(shardResponse());

const mockShardFetch = () =>
  jest.spyOn(globalThis, "fetch").mockImplementation(fetchShardResponse);

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
    const dealerShard = await second;

    expect([shard?.lookup(0)?.counts, dealerShard?.rowCount]).toStrictEqual([
      [1000, 0],
      1,
    ]);
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
      .mockImplementationOnce(fetchShardResponse)
      .mockReturnValueOnce(delayed);
    const forHand = createPolicyShardLoader("/preview/");
    const earlier = forHand(PONE_KEEP, DEALER_KEEP);
    const first = await earlier(PONE, PONE_KEEP);
    const unfinished = Promise.resolve(earlier(DEALER, DEALER_KEEP));
    const current = forHand(PONE_KEEP, NEXT_KEEP);
    const previousRequest = requests.mock.calls.at(1);

    expect([
      previousRequest?.[1]?.signal?.aborted,
      earlier(PONE, PONE_KEEP),
    ]).toStrictEqual([true, null]);

    delivery.resolve?.(shardResponse());
    const replacement = await current(PONE, PONE_KEEP);

    await expect(unfinished).resolves.toBeNull();
    expect([first?.rowCount, replacement?.rowCount]).toStrictEqual([1, 1]);
    expect(replacement).not.toBe(first);
    expect([
      requests.mock.calls.length,
      requests.mock.lastCall?.[0],
    ]).toStrictEqual([3, "/preview/pone/A_2_3_4.bin.gz"]);
  });

  it("cancels a response body that stalls during a hand switch", async () => {
    expect.hasAssertions();

    let notifyRead: (() => void) | null = null;
    const reading = new Promise<void>((resolve) => {
      notifyRead = resolve;
    });
    const cancel = jest.fn<() => void>();
    const body = new ReadableStream<Uint8Array>(
      { cancel, pull: () => notifyRead?.() },
      { highWaterMark: 0 },
    );
    using requests = mockShardFetch().mockResolvedValueOnce(new Response(body));
    const forHand = createPolicyShardLoader();
    const lookup = forHand(PONE_KEEP, DEALER_KEEP);
    const pending = Promise.resolve(lookup(PONE, PONE_KEEP));

    await reading;
    forHand(NEXT_KEEP, DEALER_KEEP);

    expect(requests).toHaveBeenCalledTimes(1);
    await expect(pending).resolves.toBeNull();
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["before parsing", (switchHands: () => void) => switchHands(), 0],
    [
      "before publishing",
      (switchHands: () => void) => Promise.resolve().then(switchHands),
      1,
    ],
  ] as const)(
    "drops a fully read shard if the hand switches %s",
    async (_window, scheduleSwitch, parseCalls) => {
      expect.hasAssertions();

      const read: { finish?: (payload: ArrayBuffer) => void } = {};
      const payload = new Promise<ArrayBuffer>((resolve) => {
        read.finish = resolve;
      });
      using reading = jest
        .spyOn(Response.prototype, "arrayBuffer")
        .mockReturnValueOnce(payload);
      using requests = mockShardFetch();
      using parse = jest.spyOn(policyShard, "parsePolicyShard");
      const forHand = createPolicyShardLoader();
      const pending = forHand(PONE_KEEP, DEALER_KEEP)(PONE, PONE_KEEP);
      await Promise.resolve();

      expect(reading).toHaveBeenCalledTimes(1);

      read.finish?.(Uint8Array.from(OPENING_ROW).buffer);
      // A deferred switch lets the parser resume before the hand changes.
      await scheduleSwitch(() => {
        forHand(NEXT_KEEP, DEALER_KEEP);
      });

      await expect(Promise.resolve(pending)).resolves.toBeNull();
      expect(parse).toHaveBeenCalledTimes(parseCalls);
      expect(requests).toHaveBeenCalledTimes(1);
    },
  );
});
