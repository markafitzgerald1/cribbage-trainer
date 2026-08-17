import {
  lstatSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  statSync,
} from "node:fs";
import { ok, strictEqual } from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { test } from "node:test";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonicalSkills = path.join(repoRoot, "skills");

/*
 * Each harness discovers skills only from its own directory, and none of them
 * is a bare skills/, so every vendor path is a symlink at the one real
 * directory. The two failure modes are silent and opposite: deleting a symlink
 * removes that harness's native discovery, while moving the real files under a
 * dot-directory drops them from the cspell and markdownlint globs, which skip
 * dot-directories entirely.
 */
const vendorSkillPaths = [
  ".agents/skills",
  ".claude/skills",
  ".codex/skills",
  ".github/skills",
];

test("skills/ holds the real files rather than a link", () => {
  const stats = lstatSync(canonicalSkills);
  ok(stats.isDirectory(), "skills/ must be a directory");
  ok(
    !stats.isSymbolicLink(),
    "skills/ must hold the real files so the lint globs keep covering them",
  );
});

test("each vendor skill path is a relative symlink to skills/", () => {
  for (const vendorPath of vendorSkillPaths) {
    const fullPath = path.join(repoRoot, vendorPath);
    const linkStats = lstatSync(fullPath, { throwIfNoEntry: false });
    ok(
      linkStats,
      `${vendorPath} is missing: that symlink is what makes its harness list these skills natively`,
    );
    ok(
      linkStats.isSymbolicLink(),
      `${vendorPath} must be a symlink so its harness discovers the skills`,
    );
    ok(
      !path.isAbsolute(readlinkSync(fullPath)),
      `${vendorPath} must point at a relative target so clones stay valid`,
    );
    strictEqual(
      realpathSync(fullPath),
      realpathSync(canonicalSkills),
      `${vendorPath} must resolve to skills/`,
    );
  }
});

test("every skill directory contains a SKILL.md", () => {
  const skillDirectories = readdirSync(canonicalSkills, {
    withFileTypes: true,
  }).filter((entry) => entry.isDirectory());
  ok(skillDirectories.length > 0, "skills/ must contain at least one skill");
  for (const skillDirectory of skillDirectories) {
    const skillFile = path.join(
      canonicalSkills,
      skillDirectory.name,
      "SKILL.md",
    );
    ok(
      statSync(skillFile, { throwIfNoEntry: false })?.isFile(),
      `${skillDirectory.name} must contain a SKILL.md`,
    );
  }
});

/*
 * Harnesses disagree on which name they display: Claude Code and Copilot in
 * VS Code show the directory name, while Copilot's CLI and desktop app,
 * Antigravity, and Codex show the frontmatter one. A skill whose two names
 * differ is therefore called different things depending on where the user
 * looks, so require them to match.
 */
test("each SKILL.md frontmatter name matches its directory", () => {
  const skillDirectories = readdirSync(canonicalSkills, {
    withFileTypes: true,
  }).filter((entry) => entry.isDirectory());
  for (const skillDirectory of skillDirectories) {
    const [, frontmatter] = readFileSync(
      path.join(canonicalSkills, skillDirectory.name, "SKILL.md"),
      "utf8",
    ).split("---");
    const declaredName = /^name:\s*(?<name>\S+)\s*$/mu.exec(frontmatter ?? "")
      ?.groups?.name;
    strictEqual(
      declaredName,
      skillDirectory.name,
      `${skillDirectory.name}/SKILL.md declares name "${declaredName}", which harnesses would show instead of the directory name`,
    );
  }
});
