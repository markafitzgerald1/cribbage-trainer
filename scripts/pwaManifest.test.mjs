import { ok, strictEqual } from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { test } from "node:test";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(repoRoot, "src", "public");
const manifestPath = path.join(publicDir, "site.webmanifest");
const indexPath = path.join(repoRoot, "src", "index.html");

const assertNonEmptyFile = (filePath, description) => {
  const stats = statSync(filePath, { throwIfNoEntry: false });
  ok(stats?.isFile(), `${description} must exist as a file`);
  ok(stats.size > 0, `${description} must not be empty`);
};

test("site.webmanifest exists and defines valid PWA metadata", () => {
  assertNonEmptyFile(manifestPath, "src/public/site.webmanifest");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

  strictEqual(manifest.name, "Cribbage Trainer");
  ok(
    typeof manifest.short_name === "string" && manifest.short_name.length > 0,
    "short_name must be a non-empty string",
  );
  strictEqual(manifest.start_url, "./");
  strictEqual(manifest.display, "standalone");
  strictEqual(manifest.theme_color, "#1f6536");
  strictEqual(manifest.background_color, "#1f6536");
  ok(
    Array.isArray(manifest.icons) && manifest.icons.length > 0,
    "icons must be a non-empty array",
  );
});

test("site.webmanifest includes at least one icon of 192px or larger for Android installation", () => {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const hasInstallableIcon = manifest.icons.some((icon) => {
    const dimensions = icon.sizes.split("x").map(Number);
    return dimensions[0] >= 192 && dimensions[1] >= 192;
  });
  ok(
    hasInstallableIcon,
    "manifest must include at least one icon of 192px or larger",
  );
});

test("every icon referenced in site.webmanifest exists in src/public/", () => {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  for (const icon of manifest.icons) {
    assertNonEmptyFile(
      path.join(publicDir, icon.src),
      `manifest icon ${icon.src}`,
    );
  }
});

test("src/index.html includes matching theme-color and points to public webmanifest and icons", () => {
  const indexHtml = readFileSync(indexPath, "utf8");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

  ok(
    indexHtml.includes(
      `<meta\n      name="theme-color"\n      content="${manifest.theme_color}"\n    />`,
    ),
    'index.html must include <meta name="theme-color"> matching the manifest',
  );

  const referencedPublicFiles = [
    "apple-touch-icon.png",
    "favicon.ico",
    "favicon-32x32.png",
    "favicon-16x16.png",
    "site.webmanifest",
  ];

  for (const file of referencedPublicFiles) {
    ok(
      indexHtml.includes(`href="/${file}"`),
      `index.html must reference /${file}`,
    );
    assertNonEmptyFile(
      path.join(publicDir, file),
      `public asset ${file} referenced in index.html`,
    );
  }
});
