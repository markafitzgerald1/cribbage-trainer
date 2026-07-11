import { applyPr, applyProd, removePr } from "./pagesContentMerge.mjs";
import { deepStrictEqual, ok } from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { tmpdir } from "node:os";

function makeTempDir() {
  return mkdtempSync(path.join(tmpdir(), "pages-content-merge-test-"));
}

function writeFile(filePath, contents) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function seedCheckout(checkoutDir) {
  writeFile(path.join(checkoutDir, "index.html"), "old prod");
  writeFile(path.join(checkoutDir, "pr", "7", "index.html"), "pr 7 preview");
  writeFile(path.join(checkoutDir, "pr", "42", "index.html"), "pr 42 preview");
}

function previewExists(directoryPath) {
  try {
    readFileSync(path.join(directoryPath, "index.html"));

    return true;
  } catch {
    return false;
  }
}

test("applyProd replaces the root but preserves every pr/ directory", () => {
  const checkoutDir = makeTempDir();
  const distDir = makeTempDir();

  try {
    seedCheckout(checkoutDir);
    writeFile(path.join(distDir, "index.html"), "new prod");

    applyProd(distDir, checkoutDir);

    deepStrictEqual(readFile(path.join(checkoutDir, "index.html")), "new prod");
    deepStrictEqual(
      readFile(path.join(checkoutDir, "pr", "7", "index.html")),
      "pr 7 preview",
    );
    deepStrictEqual(
      readFile(path.join(checkoutDir, "pr", "42", "index.html")),
      "pr 42 preview",
    );
  } finally {
    rmSync(checkoutDir, { force: true, recursive: true });
    rmSync(distDir, { force: true, recursive: true });
  }
});

test("applyPr replaces only its own pr/<number>/ directory", () => {
  const checkoutDir = makeTempDir();
  const distDir = makeTempDir();

  try {
    seedCheckout(checkoutDir);
    writeFile(path.join(distDir, "index.html"), "pr 42 updated");

    applyPr(42, distDir, checkoutDir);

    deepStrictEqual(readFile(path.join(checkoutDir, "index.html")), "old prod");
    deepStrictEqual(
      readFile(path.join(checkoutDir, "pr", "7", "index.html")),
      "pr 7 preview",
    );
    deepStrictEqual(
      readFile(path.join(checkoutDir, "pr", "42", "index.html")),
      "pr 42 updated",
    );
  } finally {
    rmSync(checkoutDir, { force: true, recursive: true });
    rmSync(distDir, { force: true, recursive: true });
  }
});

test("removePr deletes only the closed PR's directory", () => {
  const checkoutDir = makeTempDir();

  try {
    seedCheckout(checkoutDir);

    removePr(42, checkoutDir);

    ok(!previewExists(path.join(checkoutDir, "pr", "42")));
    deepStrictEqual(
      readFile(path.join(checkoutDir, "pr", "7", "index.html")),
      "pr 7 preview",
    );
    deepStrictEqual(readFile(path.join(checkoutDir, "index.html")), "old prod");
  } finally {
    rmSync(checkoutDir, { force: true, recursive: true });
  }
});

test("removePr on a PR with no existing preview is a no-op, not a throw", () => {
  const checkoutDir = makeTempDir();

  try {
    seedCheckout(checkoutDir);

    removePr(999, checkoutDir);

    deepStrictEqual(
      readFile(path.join(checkoutDir, "pr", "7", "index.html")),
      "pr 7 preview",
    );
  } finally {
    rmSync(checkoutDir, { force: true, recursive: true });
  }
});
