import { cpSync, mkdirSync, readdirSync, rmSync } from "node:fs";
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

// Replaces everything in checkoutDir with distDir's contents except the
// pr/ directory, which holds the other currently-open preview deploys.
export function applyProd(distDir, checkoutDir) {
  mkdirSync(checkoutDir, { recursive: true });

  for (const entry of readdirSync(checkoutDir)) {
    if (entry !== "pr") {
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
  } else {
    throw new Error(
      `Unknown command: ${command}. Expected "prod", "pr", or "remove".`,
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2));
}
