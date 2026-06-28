import { rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const GAME_DIRECTORY = path.join(SCRIPT_DIRECTORY, "..", "src", "game");
const PLAY_POINT_TYPES = [
  "fifteen",
  "thirty_one",
  "pair",
  "run",
  "go",
  "last_card",
];

export const CRIB_ASSET_URL =
  "https://github.com/markafitzgerald1/simulate-cribbage-games/releases/download/expected-crib-points/expected_crib_points.client.json";
export const PLAY_ASSET_URL =
  "https://github.com/markafitzgerald1/simulate-cribbage-games/releases/download/expected-play-points/expected_play_points.client.json";

export const CRIB_OUTPUT_PATH = path.join(
  GAME_DIRECTORY,
  "expectedCribPointsTable.json",
);
export const PLAY_OUTPUT_PATH = path.join(
  GAME_DIRECTORY,
  "expectedPlayPointsTable.json",
);

const assertObject = (value, message) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(message);
  }
};

export const validateCribTable = (table) => {
  assertObject(table, "Downloaded crib EV table is not an object");
  if (!("__metadata__" in table)) {
    throw new Error("Downloaded crib EV table is missing __metadata__");
  }
  if (Object.keys(table).length !== 170) {
    throw new Error(
      "Downloaded crib EV table does not contain 169 discard keys",
    );
  }
};

const validatePlayPlayer = (player, context) => {
  assertObject(player, `Missing play player bucket for ${context}`);
  assertObject(player.points, `Missing play point breakdown for ${context}`);
  const componentTotal = PLAY_POINT_TYPES.reduce((total, pointType) => {
    const pointBucket = player.points[pointType];
    if (typeof pointBucket?.mu !== "number") {
      throw new Error(`Missing ${pointType} play points for ${context}`);
    }
    return total + pointBucket.mu;
  }, 0);
  if (
    typeof player.mu !== "number" ||
    Math.abs(componentTotal - player.mu) > 0.001
  ) {
    throw new Error(`Play point breakdown does not sum for ${context}`);
  }
};

export const validatePlayTable = (table) => {
  assertObject(table, "Downloaded play EV table is not an object");
  const handEntries = Object.entries(table);
  if (handEntries.length !== 1820) {
    throw new Error("Downloaded play EV table does not contain 1,820 hands");
  }
  for (const [handKey, hand] of handEntries) {
    assertObject(hand, `Missing play hand bucket for ${handKey}`);
    for (const role of ["Pone", "Dealer"]) {
      const roleBucket = hand[role];
      assertObject(roleBucket, `Missing ${role} play bucket for ${handKey}`);
      validatePlayPlayer(roleBucket.players?.Pone, `${handKey}/${role}/Pone`);
      validatePlayPlayer(
        roleBucket.players?.Dealer,
        `${handKey}/${role}/Dealer`,
      );
      const target = roleBucket.players[role].mu;
      const opponentRole = role === "Pone" ? "Dealer" : "Pone";
      const opponent = roleBucket.players[opponentRole].mu;
      if (
        typeof roleBucket.mu !== "number" ||
        Math.abs(roleBucket.mu - (target - opponent)) > 0.001
      ) {
        throw new Error(`Play delta does not match seat totals for ${handKey}`);
      }
    }
  }
};

export const downloadTable = async (assetUrl, validate) => {
  const response = await fetch(assetUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to download EV table from ${assetUrl}: ${response.status} ${response.statusText}`,
    );
  }
  const body = await response.text();
  const table = JSON.parse(body);
  validate(table);
  return body.endsWith("\n") ? body : `${body}\n`;
};

export const writeTableAtomically = async (outputPath, body) => {
  const temporaryPath = `${outputPath}.tmp-${process.pid}`;
  await writeFile(temporaryPath, body);
  await rename(temporaryPath, outputPath);
  process.stdout.write(
    `Updated ${outputPath} (${Buffer.byteLength(body, "utf8").toLocaleString()} bytes).\n`,
  );
};
