import {
  PLAY_ASSETS,
  assertLinesDigest,
  downloadMeansAndUncertainty,
  validatePlayLines,
} from "./expectedPointsTableUpdate.mjs";
import { artifactText, parseArtifactJson } from "./artifactJson.mjs";
import {
  deepStrictEqual,
  rejects,
  strictEqual,
  throws,
} from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const readVendored = (outputPath) => readFileSync(outputPath);

const readVendoredText = (outputPath) => artifactText(readVendored(outputPath));

/*
 * The pegging-lines companion is paired with the play means the same way the
 * sidecar is, by the SHA-256 of the exact means bytes. Its full contract is
 * the browser reader's, run against the vendored bytes by
 * src/game/pegLines.test.ts; what only this file can check is the pairing
 * across both on-disk artifacts, since Vite hands the reader one parsed
 * document rather than two files.
 */
const linesText = () => readVendoredText(PLAY_ASSETS.linesOutputPath);

const linesOf = (text = linesText()) => parseArtifactJson(text);

test("the vendored play lines still satisfy the updater's checks", () =>
  validatePlayLines(linesOf(), linesText()));

test("the vendored lines are decoded as the updater decodes them", () => {
  const digest = `"means_sha256":"${linesOf().means_sha256}"`;

  throws(
    () => linesOf(linesText().replace(digest, `${digest},${digest}`)),
    /Duplicate JSON key/u,
  );
});

test("the vendored play lines were exported against the vendored means", () => {
  assertLinesDigest(linesOf(), readVendoredText(PLAY_ASSETS.meansOutputPath));
});

test("a play means file of different bytes fails the lines pairing guard", () => {
  throws(
    () =>
      assertLinesDigest(
        linesOf(),
        `${readVendoredText(PLAY_ASSETS.meansOutputPath)} `,
      ),
    /play lines file was exported against means/u,
  );
});

test("a whitespace-only change to the means is a different pairing", () => {
  const meansBody = readVendoredText(PLAY_ASSETS.meansOutputPath);

  throws(() => assertLinesDigest(linesOf(), meansBody.replace(/\{/gu, "{ ")));
});

test("the vendored play lines keys cover the vendored play table exactly", () => {
  deepStrictEqual(
    [...linesOf().keys].sort(),
    Object.keys(
      parseArtifactJson(readVendoredText(PLAY_ASSETS.meansOutputPath)),
    ).sort(),
  );
});

/*
 * The updater end to end against a stubbed release, because the guards above
 * prove the check function rejects but not that the updater calls it:
 * deleting the call leaves every one of them green.
 */
const stubRelease = (context, replacements = []) => {
  const bodies = new Map([
    [PLAY_ASSETS.meansUrl, readVendored(PLAY_ASSETS.meansOutputPath)],
    [
      PLAY_ASSETS.uncertaintyUrl,
      readVendored(PLAY_ASSETS.uncertaintyOutputPath),
    ],
    [PLAY_ASSETS.linesUrl, readVendored(PLAY_ASSETS.linesOutputPath)],
    ...replacements,
  ]);
  context.mock.method(globalThis, "fetch", (url) =>
    Promise.resolve(new globalThis.Response(bodies.get(url))),
  );
};

const refusesLines = (context, linesBody, message) => {
  stubRelease(context, [[PLAY_ASSETS.linesUrl, linesBody]]);
  return rejects(downloadMeansAndUncertainty(PLAY_ASSETS), message);
};

test("the updater refuses lines that are not valid UTF-8", (context) => {
  const published = readVendored(PLAY_ASSETS.linesOutputPath);
  const invalid = Buffer.concat([
    published.subarray(0, 1),
    Buffer.from([0xff]),
    published.subarray(1),
  ]);

  return refusesLines(context, invalid, /not valid/u);
});

test("the updater writes the lines from the exact published bytes", async (context) => {
  stubRelease(context);
  const files = await downloadMeansAndUncertainty(PLAY_ASSETS);
  const lines = files.find(
    ({ outputPath }) => outputPath === PLAY_ASSETS.linesOutputPath,
  );

  strictEqual(files.length, 3);
  strictEqual(lines.body, readVendoredText(PLAY_ASSETS.linesOutputPath));
});

test("the updater does not add a newline the published lines lack", async (context) => {
  const published = readVendoredText(PLAY_ASSETS.linesOutputPath).trimEnd();

  stubRelease(context, [[PLAY_ASSETS.linesUrl, published]]);
  const files = await downloadMeansAndUncertainty(PLAY_ASSETS);

  strictEqual(
    files.find(({ outputPath }) => outputPath === PLAY_ASSETS.linesOutputPath)
      .body,
    published,
  );
});

test("the updater refuses lines paired with other means", async (context) => {
  const otherMeans = { ...linesOf(), means_sha256: "0".repeat(64) };

  await refusesLines(
    context,
    `${JSON.stringify(otherMeans)}\n`,
    /play lines file was exported against means/u,
  );
});

for (const [name, ending] of [
  ["two newlines", "\n\n"],
  ["three newlines", "\n\n\n"],
  ["a carriage return and newline", "\r\n"],
]) {
  test(`the updater refuses lines that end in ${name}`, async (context) => {
    await refusesLines(
      context,
      `${JSON.stringify(linesOf())}${ending}`,
      /not minified/u,
    );
  });
}

test("the updater refuses lines that are not minified onto one line", async (context) => {
  await refusesLines(
    context,
    `${JSON.stringify(linesOf(), null, 1)}\n`,
    /not minified/u,
  );
});

test("the updater refuses a lines file of another schema", async (context) => {
  const other = { ...linesOf(), schema: "expected-play-lines.v2" };

  await refusesLines(context, `${JSON.stringify(other)}\n`, /declares schema/u);
});

test("the updater refuses a lines file that is not an object", async (context) => {
  await refusesLines(context, "[]\n", /not an object/u);
});

/*
 * Each edit below keeps the published pairing, so only the named defect can
 * be what the updater refuses. The browser reader is handed a parsed object
 * and cannot see a token JSON parsing rounded, so the updater catches that.
 */
const FIRST_PONE_ROW = "[[[[0,13000,-1.491,0.018]]";
const FIRST_DEALER_ROW = "[[1,1516,-0.569,0.062,0,1516]";
const INEXACT = /does not survive JSON parsing exactly/u;
const NOT_INTEGER = /Expected JSON integer lexeme/u;
const UNREADABLE = /fails the browser reader/u;

for (const [name, original, replacement, message] of [
  [
    "a standard error that parses as negative zero",
    FIRST_PONE_ROW,
    "[[[[0,13000,-1.491,-1e-400]]",
    INEXACT,
  ],
  [
    "a count that rounds to a whole number",
    FIRST_PONE_ROW,
    "[[[[0,13000.0000000000001,-1.491,0.018]]",
    INEXACT,
  ],
  [
    "a whole count written as a fraction",
    FIRST_PONE_ROW,
    "[[[[0,13000.0,-1.491,0.018]]",
    NOT_INTEGER,
  ],
  [
    "a whole count written with an exponent",
    FIRST_PONE_ROW,
    "[[[[0,1.3e4,-1.491,0.018]]",
    NOT_INTEGER,
  ],
  [
    "a reply count no modal reply can have",
    FIRST_DEALER_ROW,
    "[[1,1516,-0.569,0.062,0,1]",
    UNREADABLE,
  ],
]) {
  test(`the updater refuses lines with ${name}`, (context) => {
    const text = linesText();

    strictEqual(text.split(original).length, 2);
    return refusesLines(context, text.replace(original, replacement), message);
  });
}

test("the updater refuses a paired lines file the browser reader rejects", (context) =>
  refusesLines(
    context,
    `${JSON.stringify({
      means_sha256: linesOf().means_sha256,
      schema: linesOf().schema,
    })}\n`,
    UNREADABLE,
  ));

test("a null lines URL still pairs the lines with the means", (context) => {
  const otherMeans = { ...linesOf(), means_sha256: "0".repeat(64) };

  stubRelease(context, [
    [PLAY_ASSETS.linesUrl, `${JSON.stringify(otherMeans)}\n`],
  ]);
  return rejects(
    downloadMeansAndUncertainty(PLAY_ASSETS, { linesUrl: null }),
    /play lines file was exported against means/u,
  );
});

test("the updater hashes the means exactly as published, final newline included", (context) => {
  stubRelease(context, [
    [
      PLAY_ASSETS.meansUrl,
      readVendoredText(PLAY_ASSETS.meansOutputPath).trimEnd(),
    ],
  ]);
  return rejects(
    downloadMeansAndUncertainty(PLAY_ASSETS),
    /sidecar was exported against means/u,
  );
});
