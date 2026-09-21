import basicSsl from "@vitejs/plugin-basic-ssl";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/*
 * Opt-in, via `npm run start:https`, rather than the default for `npm start`:
 * `localhost` is already a secure context, so the only thing HTTPS buys there
 * is a certificate warning. A phone on the LAN is the case that needs it, and
 * needs both halves — `--host` to listen off loopback, and TLS to make the
 * origin a secure context, without which `crypto.randomUUID` is absent and the
 * telemetry layer throws on first render. See README, Reach the dev server
 * from a phone.
 */
const devHttps = process.env.DEV_HTTPS === "1";

// More info at: https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
export default {
  // Overridden for PR preview deploys, which publish under
  // /cribbage-trainer/pr/<number>/ (see .github/workflows).
  base: process.env.PAGES_BASE_PATH ?? "/cribbage-trainer",
  build: {
    emptyOutDir: true,
    outDir: "../dist",
  },
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
  plugins: devHttps ? [basicSsl()] : [],
  root: "./src",
  test: {
    // Keep vitest artifacts (cache, coverage) out of ./src to avoid polluting source tree
    cacheDir: path.join(dirname, "node_modules/.vitest"),
    coverage: {
      exclude: [
        "src/game/expectedCribPointsTable.json",
        "src/game/expectedCribPointsUncertainty.json",
        "src/game/expectedPlayPointsTable.json",
      ],
      reportsDirectory: path.join(dirname, "coverage"),
      /*
       * Set a little under what Docker reports, not at it. Two Docker runs
       * on #814 differing only by a documentation edit reported branches at
       * 81.81 and then 81.75, so pinning the exact total turned the next
       * run red on noise; statements, functions and lines were identical
       * across both. The margin absorbs that variance while staying well
       * above what a real regression would cost.
       *
       * Set for #627 from a Docker run reporting 91.19 / 81.49 / 92.13 /
       * 91.04. Branches fell from the previous 81.75-ish because the sidecar
       * reader validates a published wire format: Jest covers every rejection
       * it can return, and browser-mode stories reach only the handful a page
       * can actually provoke.
       */
      thresholds: {
        branches: 81.2,
        functions: 91.8,
        lines: 90.7,
        statements: 90.9,
      },
    },
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          browser: {
            enabled: true,
            headless: true,
            instances: [
              {
                browser: "chromium",
              },
            ],
            provider: playwright({}),
          },
          name: "storybook",
          // Use project root so setupFiles outside ./src are resolved correctly (e.g. .storybook)
          root: dirname,
          setupFiles: [path.join(dirname, ".storybook/vitest.setup.ts")],
          testTimeout: 15_000,
        },
      },
    ],
    root: dirname,
  },
};
