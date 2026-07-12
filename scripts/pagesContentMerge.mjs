import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

// Validated so a PR number sourced from external input (gh pr list JSON)
// can never be used to escape the intended pr/<number> directory.
function assertValidPrNumber(prNumber) {
  if (!/^\d+$/u.test(String(prNumber))) {
    throw new Error(`Invalid PR number: ${prNumber}`);
  }
}

function prDirectory(checkoutDir, prNumber) {
  assertValidPrNumber(prNumber);

  return path.join(checkoutDir, "pr", String(prNumber));
}

// The pr/ directory holds the other currently-open preview deploys; .git
// must survive because the checkout is a live git worktree that gets
// committed and pushed after the mutation.
const PRESERVED_CHECKOUT_ENTRIES = new Set(["pr", ".git"]);

// Replaces everything in checkoutDir with distDir's contents except the
// preserved entries above.
export function applyProd(distDir, checkoutDir) {
  mkdirSync(checkoutDir, { recursive: true });

  for (const entry of readdirSync(checkoutDir)) {
    if (!PRESERVED_CHECKOUT_ENTRIES.has(entry)) {
      rmSync(path.join(checkoutDir, entry), { force: true, recursive: true });
    }
  }

  cpSync(distDir, checkoutDir, { recursive: true });
}

// Replaces only pr/<prNumber>/, leaving the production root and every
// other PR's preview untouched.
export function applyPr(prNumber, distDir, checkoutDir) {
  const target = prDirectory(checkoutDir, prNumber);

  rmSync(target, { force: true, recursive: true });
  mkdirSync(target, { recursive: true });
  cpSync(distDir, target, { recursive: true });
}

// A no-op (not a throw) when the PR has no preview, e.g. it never had a
// push land after opening, or cleanup runs twice.
export function removePr(prNumber, checkoutDir) {
  rmSync(prDirectory(checkoutDir, prNumber), { force: true, recursive: true });
}

// Merged PRs get no close-event cleanup (that would race the merge's own
// production deploy in the pages-deploy concurrency group), so the
// production publish prunes preview directories whose PR is no longer open.
export function prunePreviews(checkoutDir, openPrNumbers) {
  const keep = new Set(
    openPrNumbers.map((prNumber) => {
      assertValidPrNumber(prNumber);

      return String(prNumber);
    }),
  );
  const prRoot = path.join(checkoutDir, "pr");

  if (!existsSync(prRoot)) {
    return;
  }

  for (const entry of readdirSync(prRoot)) {
    if (!keep.has(entry)) {
      rmSync(path.join(prRoot, entry), { force: true, recursive: true });
    }
  }
}

// Deploying replaces the entire live Pages site with checkoutDir, so a
// tree without a production root index.html would take production down
// (this happened on the pages-content branch's very first preview
// publish, before production had ever been seeded through this pipeline).
export function assertDeployable(checkoutDir) {
  if (!existsSync(path.join(checkoutDir, "index.html"))) {
    throw new Error(
      `Refusing to deploy: ${checkoutDir} has no root index.html, so ` +
        "deploying would replace the live production site with an " +
        "incomplete tree. Seed production content first (deploy main).",
    );
  }
}

function main(argv) {
  const [command, ...rest] = argv;

  if (command === "prod") {
    const [distDir, checkoutDir] = rest;

    applyProd(distDir, checkoutDir);
  } else if (command === "pr") {
    const [prNumber, distDir, checkoutDir] = rest;

    applyPr(prNumber, distDir, checkoutDir);
  } else if (command === "remove") {
    const [prNumber, checkoutDir] = rest;

    removePr(prNumber, checkoutDir);
  } else if (command === "assert-deployable") {
    const [checkoutDir] = rest;

    assertDeployable(checkoutDir);
  } else if (command === "prune") {
    const [checkoutDir, ...openPrNumbers] = rest;

    prunePreviews(checkoutDir, openPrNumbers);
  } else {
    throw new Error(
      `Unknown command: ${command}. Expected "prod", "pr", "remove", ` +
        `"prune", or "assert-deployable".`,
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2));
}
