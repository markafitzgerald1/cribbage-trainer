import { fileURLToPath } from "node:url";
import path from "node:path";
import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
export default {
  base: "/cribbage-trainer",
  build: {
    emptyOutDir: true,
    outDir: "../dist",
  },
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
  root: "./src",
  test: {
    // Keep vitest artifacts (cache, coverage) out of ./src to avoid polluting source tree
    cacheDir: path.join(dirname, "node_modules/.vitest"),
    coverage: {
      exclude: [
        "src/game/expectedCribPointsTable.json",
        "src/game/expectedPlayPointsTable.json",
      ],
      reportsDirectory: path.join(dirname, "coverage"),
      thresholds: {
        // Role-agnostic Net sort label dropped a covered ternary branch.
        branches: 87.56,
        functions: 97.09,
        lines: 94.56,
        statements: 94.71,
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
        },
      },
    ],
    root: dirname,
  },
};
