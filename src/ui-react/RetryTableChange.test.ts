import { HAND_KEY, freshHarness } from "./usePracticeDrill.test.common";
import { describe, expect, it } from "@jest/globals";
import {
  expectedCribPointsTable,
  expectedPlayPointsTable,
} from "../analysis/analysis.test.common";
import {
  originalIdentity,
  retryIdentity,
} from "./PracticeDrillPanel.test.common";
import { parseHand, serializeHand } from "../game/Card";
import { readTallyForDisplay, recordDiscardDecision } from "../ui/discardTally";
import { CribRole } from "../game/expectedCribPoints";
import { allScoredKeepDiscardsByExpectedNetScoreDescending } from "../analysis/analysis";
import { buildMistakeQueue } from "../ui/mistakeQueue";
import { getDiscardQuality } from "../analysis/discardQuality";
import { toDealtCards } from "../game/toDealtCards";

const tablesA = {
  crib: expectedCribPointsTable,
  play: expectedPlayPointsTable,
};
const bucket = expectedPlayPointsTable["7_8_9_T"];
const dealer = bucket.Dealer;
const own = dealer.players.Dealer;
const tablesB = {
  ...tablesA,
  play: {
    ...expectedPlayPointsTable,
    "7_8_9_T": {
      ...bucket,
      Dealer: {
        ...dealer,
        mu: dealer.mu + 20,
        players: {
          ...dealer.players,
          Dealer: {
            ...own,
            mu: own.mu + 20,
            points: { ...own.points, go: { mu: own.points.go.mu + 20 } },
          },
        },
      },
    },
  },
};

const reportRetry = (
  harness: ReturnType<typeof freshHarness>,
  quality: ReturnType<typeof getDiscardQuality>,
  identity: typeof retryIdentity,
) => {
  harness.render(
    {
      cribRole: harness.drill().activeItem?.cribRole ?? CribRole.Dealer,
      quality,
    },
    identity,
  );
};

const originalHand = parseHand(HAND_KEY.split("|")[0]!);
const qualityWith = (discard: string, tables: typeof tablesA) =>
  getDiscardQuality(
    allScoredKeepDiscardsByExpectedNetScoreDescending(
      toDealtCards(originalHand, parseHand(discard)),
      CribRole.Dealer,
      tables,
    ),
  )!;

const recordOriginal = (
  discardKey: string,
  quality: ReturnType<typeof qualityWith>,
) =>
  recordDiscardDecision({
    ...quality,
    at: 100,
    cribRole: CribRole.Dealer,
    discardKey,
    handKey: HAND_KEY,
    isPractice: false,
    tableIdentity: originalIdentity,
  });

const comparedChoice = (discard: string) => ({
  now: qualityWith(discard, tablesB),
  then: qualityWith(discard, tablesA),
});

const recordCurrent = (quality: ReturnType<typeof qualityWith>) =>
  recordDiscardDecision({
    ...readTallyForDisplay().records[0]!,
    ...quality,
    at: 200,
    recordedAdmission: {
      basis: "exact-fallback-v1",
      eligible: !quality.isOptimal,
    },
    tableIdentity: retryIdentity,
  });

const seededHarness = () =>
  freshHarness({ followLoadedHand: true, seed: true });
const seededSnapshot = () => {
  const harness = seededHarness();
  return { harness, original: readTallyForDisplay().records.at(0) };
};

const actualRetry = (
  harness: ReturnType<typeof freshHarness>,
  tables: typeof tablesA,
  {
    identity,
    fail = false,
  }: { identity: typeof retryIdentity; fail?: boolean },
) => {
  const [item] = buildMistakeQueue(readTallyForDisplay());
  harness.start(item);
  const loaded = harness.loadedHands.at(-1)!;
  const options = allScoredKeepDiscardsByExpectedNetScoreDescending(
    loaded.dealtCards,
    loaded.cribRole,
    tables,
  );
  const chosen = options[fail ? options.length - 1 : 0]!;
  const cards = toDealtCards(loaded.dealtCards, chosen.discard);
  harness.replaceBoard({ cards, role: loaded.cribRole });
  harness.commit();
  const quality = getDiscardQuality(
    allScoredKeepDiscardsByExpectedNetScoreDescending(
      cards,
      loaded.cribRole,
      tables,
    ),
  );
  reportRetry(harness, quality, identity);
  return quality;
};

describe("retries across loaded table pairs", () => {
  it("keeps a mistake made under the original tables in the queue, and reachable in manual and automatic practice, even when the newer tables rate that discard best", () => {
    const harness = freshHarness({ followLoadedHand: true });
    const discard = "5H,6H";
    const { then, now } = comparedChoice(discard);

    expect({
      comparison: now.isOptimal,
      original: then.isOptimal,
    }).toStrictEqual({ comparison: true, original: false });

    recordOriginal(discard, then);
    const [item] = buildMistakeQueue(readTallyForDisplay());

    expect(item?.previousDiscardLoss).toBe(then.expectedPointsLoss);

    harness.start(item);

    expect(harness.drill().activeItem?.handKey).toBe(HAND_KEY);

    harness.clear();
    harness.auto();

    expect(harness.drill().activeItem?.handKey).toBe(HAND_KEY);

    recordCurrent(now);

    expect(
      buildMistakeQueue(readTallyForDisplay())[0]?.previousDiscardLoss,
    ).toBe(then.expectedPointsLoss);
  });

  it("keeps a decision that was best under the original tables out of the queue even when the newer tables score it a mistake", () => {
    const harness = freshHarness();
    const [best] = allScoredKeepDiscardsByExpectedNetScoreDescending(
      toDealtCards(originalHand, []),
      CribRole.Dealer,
      tablesA,
    );
    const discard = serializeHand(best!.discard);
    const { then, now } = comparedChoice(discard);

    expect([then.isOptimal, now.isOptimal]).toStrictEqual([true, false]);

    recordOriginal(discard, then);
    recordCurrent(now);
    harness.auto();

    expect([
      harness.drill().isActive,
      buildMistakeQueue(readTallyForDisplay()),
    ]).toStrictEqual([false, []]);
  });

  it("keeps the original recorded cost and each retry's table stamp through two real successful retries, one under each table pair, then a miss under the newer tables removes mastery", () => {
    const { harness, original } = seededSnapshot();

    const firstQuality = actualRetry(harness, tablesA, {
      identity: originalIdentity,
    });
    const firstStreak = readTallyForDisplay().practice[0]?.consecutiveSuccesses;
    const secondQuality = actualRetry(harness, tablesB, {
      identity: retryIdentity,
    });

    expect([
      firstQuality?.isOptimal,
      firstStreak,
      secondQuality?.isOptimal,
      buildMistakeQueue(readTallyForDisplay())[0]?.isMastered,
    ]).toStrictEqual([true, 1, true, true]);

    const stored = readTallyForDisplay();

    expect(stored.attemptLog).toMatchObject([
      {
        discardKey: "5H,10H",
        handKey: HAND_KEY,
        tableIdentity: originalIdentity,
      },
      { handKey: HAND_KEY, tableIdentity: retryIdentity },
    ]);

    const miss = actualRetry(harness, tablesB, {
      fail: true,
      identity: retryIdentity,
    });

    expect([
      miss?.isOptimal,
      buildMistakeQueue(readTallyForDisplay())[0]?.isMastered,
    ]).toStrictEqual([false, false]);
    expect(readTallyForDisplay().records[0]).toStrictEqual(original);
  });

  it("does not append an attempt on a repeated report, board sort or restored completed analysis", () => {
    const harness = seededHarness();
    const quality = actualRetry(harness, tablesA, {
      identity: originalIdentity,
    });
    const loaded = harness.loadedHands.at(-1)!;
    harness.replaceBoard({
      cards: [...loaded.dealtCards]
        .reverse()
        .map((card) => ({ ...card, kept: card.kept })),
      role: loaded.cribRole,
    });
    reportRetry(harness, quality, originalIdentity);
    harness.clear();
    reportRetry(harness, quality, retryIdentity);

    expect(readTallyForDisplay().attemptLog).toHaveLength(1);
  });
});
