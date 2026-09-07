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
 * Continuations are joined first, and each instruction is then scanned for
 * every npm invocation rather than one: a single `RUN` can chain several
 * with `&&`. Non-script invocations are kept, so `RUN npm clean-install`
 * appears — a manifest that has drifted from the lockfile still installs
 * locally while `npm ci` in the image refuses it, and no hook sees that.
 */
const gateEntryPoints = readRepoFile("Dockerfile")
  .replace(/\\\r?\n/gu, " ")
  .split(/\r?\n/u)
  .filter((line) => /^(?:RUN|CMD)\b/u.test(line))
  .flatMap((instruction) =>
    [...instruction.matchAll(/\bnpm(?: run)? (?<entry>[\w:-]+)/gu)].map(
      (match) => match.groups.entry,
    ),
  );

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
