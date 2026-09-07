import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

/*
 * Prints what the Docker gate runs that `npm run verify:fast` does not, so
 * the answer is computed rather than remembered. Three successive review
 * rounds on #763 corrected a prose list of this gap and it was wrong every
 * time, because both sides move independently: a check added to the hook or
 * a step added to the Dockerfile invalidates any written answer silently.
 */

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const readRepoFile = (name) => readFileSync(join(repoRoot, name), "utf8");

const packageScripts = JSON.parse(readRepoFile("package.json")).scripts;

/*
 * Both `npm:name` (concurrently's shorthand) and `npm run name` appear in
 * this repository's scripts, and the gap stays invisible unless nested
 * scripts are expanded — the Dockerfile's single lint step would otherwise
 * conceal `lint:actionlint`, `lint:audit` and `lint:outdated`.
 */
const invokedBy = (name) =>
  [
    ...(packageScripts[name] ?? "").matchAll(
      /npm(?::| run )(?<called>[\w:-]+)/gu,
    ),
  ].map((match) => match.groups.called);

/*
 * A parent is reported alongside everything it calls, never replaced by it.
 * Deciding whether a parent "only" fans out means parsing shell, and three
 * attempts at that during #763 each hid work behind a shape the previous
 * one had not considered: a chained `&&` command, then a quoted worker such
 * as `concurrently "node check.mjs" "npm:lint:eslint"`, then a flag whose
 * value was mistaken for one. Over-reporting a parent costs a line; missing
 * one reports a closed gap that is not closed, so this does not parse.
 */
const withDescendants = (name) => {
  const invoked = invokedBy(name);
  return invoked.length === 0
    ? [name]
    : [name, ...invoked.flatMap(withDescendants)];
};

/*
 * npm subcommands that validate something and could appear in the
 * `Dockerfile`. `clean-install` and `ci` are the same command; the gate
 * uses the long form.
 */
const NPM_SUBCOMMANDS = new Set(["ci", "clean-install", "install", "test"]);

/*
 * Each `RUN`/`CMD` instruction is tokenized and scanned for the first
 * token after an `npm` that is a real thing to run — a `package.json`
 * script or an npm subcommand. Everything between (`run`, `--flags`,
 * option values like `--script-shell /bin/bash`, JSON punctuation) is
 * skipped because it is none of those. Eight review rounds each found a
 * legal npm shape a looser parser mis-read; this cannot name a
 * non-script, because it only recognizes names it can look up. `npm run x`
 * is only valid when `x` is a defined script, so nothing real is lost.
 */
const isEntry = (token) =>
  token in packageScripts || NPM_SUBCOMMANDS.has(token);

const entriesInInstruction = (instruction) => {
  const tokens = instruction
    .replace(/["[\],]/gu, " ")
    .split(/\s+/u)
    .filter(Boolean);
  const entries = [];
  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index] !== "npm") {
      continue;
    }
    for (let cursor = index + 1; cursor < tokens.length; cursor += 1) {
      if (tokens[cursor] === "npm") {
        break;
      }
      if (isEntry(tokens[cursor])) {
        entries.push(tokens[cursor]);
        break;
      }
    }
  }
  return entries;
};

const gateEntryPoints = readRepoFile("Dockerfile")
  .replace(/\\\r?\n/gu, " ")
  .split(/\r?\n/u)
  .filter((line) => /^(?:RUN|CMD)\b/u.test(line))
  .flatMap(entriesInInstruction);

const gate = new Set(gateEntryPoints.flatMap(withDescendants));
const fast = new Set(withDescendants("verify:fast"));

// Printed as the command to run, since a non-script entry has no `run`.
const asCommand = (name) =>
  name in packageScripts ? `npm run ${name}` : `npm ${name}`;

const gap = [...gate]
  .filter((name) => !fast.has(name))
  .sort()
  .map(asCommand);

process.stdout.write(`${gap.join("\n")}\n`);
