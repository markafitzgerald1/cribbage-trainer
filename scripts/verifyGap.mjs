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
 * scripts are expanded — `RUN npm run lint` hides actionlint, audit and
 * outdated behind one entry.
 */
const invokedBy = (name) =>
  [
    ...(packageScripts[name] ?? "").matchAll(
      /npm(?::| run )(?<called>[\w:-]+)/gu,
    ),
  ].map((match) => match.groups.called);

/*
 * A script is only safe to replace by the scripts it calls when calling
 * them is all it does. `node check.mjs && npm run lint:eslint` would
 * otherwise vanish into `lint:eslint`, reporting no gap while `check.mjs`
 * never runs in the hook. Strip the npm invocations and the fan-out
 * runner's own syntax; anything left is work only the parent performs.
 */
const isPureFanOut = (name) =>
  !/\S/u.test(
    (packageScripts[name] ?? "")
      .replace(/npm(?::| run )[\w:-]+/gu, " ")
      .replace(/\bconcurrently\b/gu, " ")
      .replace(/--[\w-]+/gu, " ")
      .replace(/'[^']*'/gu, " ")
      .replace(/"[^"]*"/gu, " ")
      .replace(/[&|;,]/gu, " "),
  );

const leavesOf = (name) => {
  const invoked = invokedBy(name);
  if (invoked.length === 0) {
    return [name];
  }
  const nested = invoked.flatMap(leavesOf);
  return isPureFanOut(name) ? nested : [name, ...nested];
};

/*
 * Read the gate's entry points from the Dockerfile so a new RUN line cannot
 * be missed. Non-script invocations are kept rather than filtered out:
 * `RUN npm clean-install` is a real failure class the hook cannot reach,
 * because a manifest that has drifted from the lockfile still installs
 * locally while `npm ci` refuses it.
 */
/*
 * Continuations are joined first, and each instruction is then scanned for
 * every npm invocation rather than one: a single `RUN` can chain several
 * with `&&`, and an expression anchored to the instruction would report
 * only the first, quietly under-reporting the gap it exists to compute.
 */
const dockerInstructions = readRepoFile("Dockerfile")
  .replace(/\\\r?\n/gu, " ")
  .split(/\r?\n/u)
  .filter((line) => /^(?:RUN|CMD)\b/u.test(line));

const gateEntryPoints = dockerInstructions.flatMap((instruction) =>
  [...instruction.matchAll(/\bnpm(?: run)? (?<entry>[\w:-]+)/gu)].map(
    (match) => match.groups.entry,
  ),
);

const gate = new Set(gateEntryPoints.flatMap(leavesOf));
const fast = new Set(leavesOf("verify:fast"));

// Printed as the command to run, since a non-script entry has no `run`.
const asCommand = (name) =>
  name in packageScripts ? `npm run ${name}` : `npm ${name}`;

const gap = [...gate]
  .filter((name) => !fast.has(name))
  .sort()
  .map(asCommand);

process.stdout.write(`${gap.join("\n")}\n`);
