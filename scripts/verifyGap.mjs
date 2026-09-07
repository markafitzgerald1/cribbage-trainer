import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

/*
 * Prints what the Docker gate runs that `npm run verify:fast` does not, so
 * the answer is computed rather than remembered. Successive review rounds on
 * #763 corrected a prose list of this gap and it was wrong every time,
 * because both sides move independently: a check added to the hook or a step
 * added to the Dockerfile invalidates any written answer silently.
 */

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const readRepoFile = (name) => readFileSync(join(repoRoot, name), "utf8");

const packageScripts = JSON.parse(readRepoFile("package.json")).scripts;

/*
 * Both `npm:name` (concurrently's shorthand) and `npm run name` appear in
 * this repository's scripts, and the gap stays invisible unless nested
 * scripts are expanded - the Dockerfile's single lint step would otherwise
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
 * Deciding whether a parent "only" fans out means parsing shell, and every
 * attempt at that during #763 hid work behind a shape the previous one had
 * not considered. Over-reporting a parent costs a line; missing one reports
 * a closed gap that is not closed, so this does not parse.
 */
const withDescendants = (name) => {
  const invoked = invokedBy(name);
  return invoked.length === 0
    ? [name]
    : [name, ...invoked.flatMap(withDescendants)];
};

/*
 * npm's own validation subcommands, any of which a Dockerfile step could
 * invoke directly (`RUN npm audit`). `clean-install` and `ci` are the same
 * command; the gate uses the long form. Everything else after an `npm`
 * token is `run`, a flag, an option value, or a script argument.
 */
const NPM_SUBCOMMANDS = new Set([
  "audit",
  "ci",
  "clean-install",
  "doctor",
  "install",
  "outdated",
  "test",
]);

/*
 * Each `RUN`/`CMD` instruction is tokenized, and from the first `npm` token
 * onward every token that is a real thing to run - a `package.json` script
 * or an npm subcommand - is collected. `run`, `--flags`, option values
 * (`--script-shell /bin/bash`), script arguments, and JSON punctuation are
 * none of those, so they are skipped by not matching. Ten review rounds each
 * found a legal npm shape a narrower parser mis-read, several inside npm's
 * option grammar; matching by name rather than by position sidesteps the
 * grammar. Collecting every match rather than the first also means an option
 * value that equals a script name (`--workspace test test-e2e`) yields both:
 * over-reported at worst, and the gap filter drops it when it is already in
 * `verify:fast` - the same "over-report a line, never hide a gap" rule the
 * rest of this file follows.
 */
const isEntry = (token) =>
  token in packageScripts || NPM_SUBCOMMANDS.has(token);

const entriesInInstruction = (instruction) => {
  const tokens = instruction
    .replace(/["[\],]/gu, " ")
    .split(/\s+/u)
    .filter(Boolean);
  const firstNpm = tokens.indexOf("npm");
  return firstNpm < 0 ? [] : tokens.slice(firstNpm + 1).filter(isEntry);
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
