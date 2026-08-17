---
name: dependency-maintenance
description: Use before bumping dependencies, taking a major upgrade, or whenever `npm run lint:audit` fails on an advisory — covers caret `overrides`, `.nsprc` waivers, maintenance dist-tags, and the gate-shifting effects of formatter and duplicate-detector majors.
compatibility: Requires npm and network access to the registry.
---

# Dependency maintenance

**Description:** How to keep dependencies current in this repository, and how
to clear `better-npm-audit` advisories without breaking the quality gates.

**Learnings:**

- Dependabot intentionally ignores ESLint 10.0.0 through 10.7.0 because the
  latest `eslint-plugin-jsx-a11y` release (6.10.2) declares peer support only
  through ESLint 9. Before changing that range, verify both packages' current
  registry metadata; do not bypass the peer conflict with
  `--legacy-peer-deps`.
- A Babel major can change how existing `.ts` parses: Babel 8 reads the type
  parameter of a single unconstrained generic arrow function as JSX. The
  resulting authoring rule binds every `.ts` file, so it lives in `AGENTS.md`
  rather than here — expect this class of breakage from a Babel bump even
  when no source changed.
- Major formatter and duplicate-detector upgrades can change their findings
  without changing project code. Prettier 3.9 formats some union types
  differently from 3.8, and each version rejects the other's output, so land
  the version bump and its mechanical reformatting together. jscpd 5 tokenizes
  some existing short test patterns differently and can expose clones that
  jscpd 4 missed; keep the 0% threshold and refactor the shared setup or
  assertion instead of raising `minTokens` or adding ignores. Its file pattern
  is relative to each scan path, so keep `.jscpd.json` explicit with
  `path: ["src"]` and `pattern: "**/*.ts*"` rather than relying on `.gitignore`
  filtering.
- Use `npm run deps:update:minor` for routine refreshes; handle larger major
  upgrades separately if they would dominate the change set.
- When `npm run lint:audit` (better-npm-audit) fails on freshly published
  advisories, fix them in the package.json `overrides` block and write the
  entries as **caret ranges** (`^1.1.18`, not `1.1.18`). An exact pin
  outranks `npm audit fix`, which then cannot repair the tree at all; a
  caret pin lets a plain `npm audit fix` resolve the advisories and rewrite
  only `package-lock.json`. Measured on the 2026-07-31 wave: against the
  exact pins then in place, `npm audit fix` exited 1 and left
  brace-expansion, fast-uri, and js-yaml vulnerable, and only the unpinned
  nanoid and postcss moved; with those same pins widened to carets it
  exited 0 and picked exactly the intended versions, touching no
  `devDependencies`. Never use `npm audit fix --force`, which took `eslint`
  to `^10.8.1`, _downgraded_ `stylelint` from `^17.14.0` to `^17.13.0`, and
  still fixed none of the three. Note that a caret override does not
  self-heal on `npm install` — only `npm audit fix` or
  `npm update <package>` re-resolves an existing lock entry.
- The flagged packages are almost always dev/build dependencies that are
  not shipped in the production bundle; confirm with
  `npm ls <package> --omit=dev`, which prints an empty tree when nothing
  ships. When an advisory range covers major lines that have no patched
  release at all, pin what can be pinned and record the remainder as a
  `.nsprc` exception with an `expiry`, so the waiver ages out and forces a
  re-check the way the dependabot `ignore` entries do.
- Before concluding that an older major line has no patched release, check
  its maintenance dist-tag. `npm view <package> version` reports only
  `latest`, which hides backports: brace-expansion publishes them as
  `maintenance-v1`/`maintenance-v2`, js-yaml as `v4-legacy`, nanoid as
  `legacy`. Read the per-advisory `via[].range` from `npm audit --json`
  rather than the better-npm-audit table, because each range's upper bound
  names the first patched version of that line (`<1.1.18`,
  `>=2.0.0 <2.1.4`, `>=4.0.0 <5.0.9`), which is the version to caret in
  `overrides`. The 2026-07-31 advisory wave looked like it needed an ESLint
  or stylelint major and needed no upgrade at all.
- A `.nsprc` waiver can outlive the gap it covered without anything
  noticing, which is the other reason not to pin exactly. The
  brace-expansion 1.x/2.x waiver was written when 1.1.16 and 2.1.2 were
  genuinely the newest of those lines; 1.1.17 and 2.1.3 shipped three weeks
  later and the exact pins stayed put, so the waiver survived its own
  obsolescence. When better-npm-audit prints "N of the excluded
  vulnerabilities did not match any of the found vulnerabilities", treat it
  as required cleanup and drop the entry in the same PR instead of letting
  it ride to its expiry. Leave `.nsprc` in place as `{}` when the last
  exception goes, so the Dockerfile's allowlisted `COPY`s stay valid (see
  "Lint gauntlet interplay" in `AGENTS.md`, which owns that rule because it
  also fires for changes that touch no dependency at all).
