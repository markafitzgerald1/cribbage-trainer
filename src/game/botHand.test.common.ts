import { DEALER } from "./pegging";
import { parseHand } from "./Card";
import { parsePolicyShard } from "./pegPolicyShard";

export const botHandDeal = {
  botDiscard: parseHand("4H,8H"),
  botKeep: parseHand("5C,5D,9C,QC"),
  playerCards: parseHand("KC,KH,6H,JH,2H,3H"),
  playerSeat: DEALER,
} as const;

const header = [67, 80, 83, 49];
export const emptyBotShard = parsePolicyShard(
  Uint8Array.of(...header, 0, 0, 0, 0),
);

// Opening, Q-K, and Q-K-5-6-reset, with all mass on Q, 5, and 9.
const historyDeltas = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0xdc, 0, 0, 0, 0, 0, 0, 0],
  [0, 0x65, 0x0f, 0, 0, 0, 0, 0],
];
const menus = [
  [4, 8, 11, 0],
  [4, 8, 0, 0],
  [4, 8, 0, 0],
];
const counts = [
  [0, 0, 0, 0, 0xe8, 3],
  [0xe8, 3, 0, 0],
  [0, 0, 0xe8, 3],
];
export const botShard = parsePolicyShard(
  Uint8Array.of(
    ...header,
    ...[3, 0, 0, 0],
    ...historyDeltas.flat(),
    ...menus.flat(),
    ...[3, 2, 2],
    ...[1, 1, 1],
    ...counts.flat(),
  ),
);
