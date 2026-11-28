import * as classes from "./PlayBotHand.module.css";
import { type BotHandDeal, dealBotHand } from "../game/botHandDeal";
import {
  type BotHandResult,
  type BotShardLookup,
  type PlayingBotHand,
  advanceBotHand,
  playBotHandCard,
  startBotHand,
} from "../game/botHand";
import { type Card, Suit, serializeCard } from "../game/Card";
import {
  DEALER,
  GO,
  PONE,
  RESET,
  type Seat,
  historyKey,
  legalRanks,
} from "../game/pegging";
import { useCallback, useState } from "react";
import { CARDS_PER_DISCARD } from "../game/facts";

interface PlayBotHandProps {
  readonly playerSeat: Seat;
  readonly lookupShard: BotShardLookup;
  readonly deal?: typeof dealBotHand;
}

type Screen =
  | { readonly kind: "ready" | "dealing" }
  | { readonly kind: "discard"; readonly deal: BotHandDeal }
  | {
      readonly kind: "pegging";
      readonly hand: PlayingBotHand;
      readonly busy: boolean;
    }
  | { readonly kind: "complete"; readonly hand: BotHandResult }
  | { readonly kind: "error"; readonly message: string };

const suitNames: Record<Suit, string> = {
  [Suit.CLUBS]: "clubs",
  [Suit.DIAMONDS]: "diamonds",
  [Suit.HEARTS]: "hearts",
  [Suit.SPADES]: "spades",
};
const cardName = (card: Card) => `${card.rankLabel} of ${suitNames[card.suit]}`;
const cardFace = (card: Card) => `${card.rankLabel}${card.suit}`;
function seatValue<T>(values: readonly [T, T], seat: Seat): T {
  return seat === PONE ? values[0] : values[1];
}

const seatName = (seat: Seat, player: Seat) =>
  seat === player ? "You" : "Bot";

function renderHistory({
  pegging,
  plays,
  playerSeat,
}: PlayingBotHand | BotHandResult) {
  const played = plays.values();
  return (
    <ol
      aria-label="Pegging history"
      className={classes.row}
    >
      {pegging.history.map((event, index) => {
        // A rank event and its physical card are appended together by the engine.
        if (event === GO || event === RESET) {
          return (
            <li key={historyKey(pegging.history.slice(0, index + 1))}>
              {event === GO ? "Go" : "Reset"}
            </li>
          );
        }
        const { card, seat } = played.next().value as (typeof plays)[number];
        return (
          <li key={serializeCard(card)}>
            {seatName(seat, playerSeat)} played {cardFace(card)}
          </li>
        );
      })}
    </ol>
  );
}

function renderCounting(hand: BotHandResult) {
  return (
    <section aria-label="Hand complete">
      <h3>Hand complete</h3>
      <ul>
        {([PONE, DEALER] as const).map((seat) => (
          <li key={seat}>
            {seatName(seat, hand.playerSeat)} (
            {seat === PONE ? "pone" : "dealer"}):{" "}
            {seatValue(hand.keeps, seat).map(cardFace).join(" ")} for{" "}
            {seatValue(hand.handScores, seat).total}. Pegging{" "}
            {seatValue(hand.pegging.points, seat)}. Total{" "}
            {seatValue(hand.totals, seat)}.
          </li>
        ))}
        <li>
          Dealer crib: {hand.crib.map(cardFace).join(" ")} for{" "}
          {hand.cribScore.total}.
        </li>
        <li>Dealer heels: {hand.heels}.</li>
      </ul>
    </section>
  );
}

interface CardAction {
  readonly action: "Discard" | "Play";
  readonly disabled: boolean;
  readonly pressed?: boolean;
  readonly handleChoose: () => void;
}

function renderCardButton(
  card: Card,
  { action, disabled, handleChoose, pressed }: CardAction,
) {
  return (
    <button
      aria-label={`${action} ${cardName(card)}`}
      aria-pressed={pressed}
      className={classes.card}
      disabled={disabled}
      key={serializeCard(card)}
      onClick={handleChoose}
      type="button"
    >
      {cardFace(card)}
    </button>
  );
}

function renderPegging(
  hand: PlayingBotHand,
  busy: boolean,
  onPlay: (card: Card) => void,
) {
  const { pegging, playerSeat, keeps, plays } = hand;
  const legal = legalRanks(pegging);
  const remaining = seatValue(keeps, playerSeat).filter((card) =>
    plays.every((play) => play.card !== card),
  );
  return (
    <>
      <p role="status">
        {busy ? "Resolving pegging." : "Your play."} Count {pegging.count}.{" "}
        Pegging: you {seatValue(pegging.points, playerSeat)}, bot{" "}
        {pegging.points[playerSeat === PONE ? DEALER : PONE]}.
      </p>
      <div
        aria-label="Your remaining cards"
        className={classes.row}
        role="group"
      >
        {remaining.map((card) =>
          renderCardButton(card, {
            action: "Play",
            disabled: busy || !legal.includes(card.rank),
            handleChoose: () => onPlay(card),
          }),
        )}
      </div>
    </>
  );
}

function renderDiscards(
  cards: readonly Card[],
  discards: readonly Card[],
  actions: {
    readonly onToggle: (card: Card) => void;
    readonly handleCut: () => void;
  },
) {
  const canCut = discards.length === CARDS_PER_DISCARD;
  return (
    <>
      <p>Choose two cards for the crib.</p>
      <div
        aria-label="Your deal"
        className={classes.row}
        role="group"
      >
        {cards.map((card) => {
          const selected = discards.includes(card);
          return renderCardButton(card, {
            action: "Discard",
            disabled: canCut && !selected,
            handleChoose: () => actions.onToggle(card),
            pressed: selected,
          });
        })}
      </div>
      <button
        disabled={!canCut}
        onClick={actions.handleCut}
        type="button"
      >
        Discard and cut
      </button>
    </>
  );
}

export function PlayBotHand({
  deal = dealBotHand,
  lookupShard,
  playerSeat,
}: PlayBotHandProps) {
  const [screen, setScreen] = useState<Screen>({ kind: "ready" });
  const [discards, setDiscards] = useState<readonly Card[]>([]);

  const handleDeal = useCallback(() => {
    const loadDeal = async () => {
      setScreen({ deal: await deal(playerSeat), kind: "discard" });
    };

    setScreen({ kind: "dealing" });
    loadDeal().catch(() => {
      setScreen({ kind: "error", message: "Could not deal the hand." });
    });
  }, [deal, playerSeat]);

  const advance = async (
    hand: PlayingBotHand | BotHandResult,
  ): Promise<void> => {
    if (hand.kind === "complete") {
      setScreen({ hand, kind: "complete" });
      return;
    }
    if (
      hand.pegging.next === hand.playerSeat &&
      legalRanks(hand.pegging).length > 0
    ) {
      setScreen({ busy: false, hand, kind: "pegging" });
      return;
    }
    setScreen({ busy: true, hand, kind: "pegging" });
    const next = await advanceBotHand(hand, lookupShard);
    if (next.kind === "missing-policy") {
      setScreen({
        kind: "error",
        message: "Pegging stopped because the bot policy row is missing.",
      });
      return;
    }
    await advance(next);
  };

  const continuePegging = (hand: PlayingBotHand | BotHandResult) => {
    advance(hand).catch(() => {
      setScreen({
        kind: "error",
        message: "Could not use the bot pegging policy.",
      });
    });
  };

  const onToggle = (card: Card) => {
    setDiscards((selected) =>
      selected.includes(card)
        ? selected.filter((discard) => discard !== card)
        : [...selected, card],
    );
  };

  return (
    <section
      aria-label="Play a hand"
      className={classes.screen}
    >
      <h2>Play a hand</h2>
      <p>You are {playerSeat === DEALER ? "the dealer" : "the pone"}.</p>
      {screen.kind === "ready" && (
        <button
          onClick={handleDeal}
          type="button"
        >
          Deal
        </button>
      )}
      {screen.kind === "dealing" && <p role="status">Dealing…</p>}
      {screen.kind === "error" && <p role="alert">{screen.message}</p>}
      {screen.kind === "discard" &&
        renderDiscards(screen.deal.playerCards, discards, {
          handleCut: () => continuePegging(startBotHand(screen.deal, discards)),
          onToggle,
        })}
      {(screen.kind === "pegging" || screen.kind === "complete") && (
        <>
          <p>
            Starter: {cardFace(screen.hand.starter)}. Heels: {screen.hand.heels}
            .
          </p>
          {renderHistory(screen.hand)}
        </>
      )}
      {screen.kind === "pegging" &&
        renderPegging(screen.hand, screen.busy, (card) =>
          continuePegging(playBotHandCard(screen.hand, card)),
        )}
      {screen.kind === "complete" && renderCounting(screen.hand)}
    </section>
  );
}

PlayBotHand.defaultProps = { deal: dealBotHand };
