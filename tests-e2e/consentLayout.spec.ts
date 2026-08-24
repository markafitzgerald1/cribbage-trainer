import {
  PRIVACY_POLICY_VERSION,
  analyticsConsentKey,
  answeredPolicyVersionKey,
} from "../src/ui/analyticsConsent";
import { type Page, expect, test } from "@playwright/test";
import {
  constantHandQuery,
  exactTextMatch,
  phoneLandscapeViewport,
  requireBoundingBox,
} from "./layoutMeasurements";
import { DISCARD_TALLY_KEY_PREFIX } from "../src/ui/discardTallyKeyPrefix";

const consentActionBottom = async (page: Page, name: string) => {
  const bounds = await requireBoundingBox(
    page.getByRole("button", { exact: true, name }),
  );
  return bounds.y + bounds.height;
};

// A short phone-landscape viewport makes the left grid column height-tightest.
// The header must not push its first-run consent controls out of view there.
test("first-run consent controls stay within the phone-landscape viewport", async ({
  page,
}) => {
  await page.setViewportSize(phoneLandscapeViewport);
  await page.goto("/");

  expect(await consentActionBottom(page, "Accept")).toBeLessThanOrEqual(
    phoneLandscapeViewport.height,
  );
  expect(await consentActionBottom(page, "Decline")).toBeLessThanOrEqual(
    phoneLandscapeViewport.height,
  );
});

/*
 * The policy-update banner carries more text than the first-run one and lands
 * in the same height-tight cell, so it needs its own measurement: the guard
 * above opens an unanswered browser and never renders this path.
 */
test("policy update controls stay within the phone-landscape viewport", async ({
  page,
}) => {
  await page.setViewportSize(phoneLandscapeViewport);
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, "true");
  }, analyticsConsentKey);
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Analytics Consent Update" }),
  ).toBeVisible();
  expect(await consentActionBottom(page, "Accept")).toBeLessThanOrEqual(
    phoneLandscapeViewport.height,
  );
  expect(await consentActionBottom(page, "Decline")).toBeLessThanOrEqual(
    phoneLandscapeViewport.height,
  );
});

/*
 * Mobile browsers scale rem with the device font-size setting, and the
 * side-by-side consent cell is sized in rem, so an emulator at the default
 * scale passes while a real phone has to scroll — which is what happened on
 * hardware for the update banner in landscape.
 */
test("the policy update fits the phone-landscape viewport at an enlarged root font", async ({
  page,
}) => {
  await page.setViewportSize(phoneLandscapeViewport);
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, "true");
  }, analyticsConsentKey);
  await page.goto("/");
  await page.addStyleTag({ content: "html { font-size: 28px; }" });

  expect(await consentActionBottom(page, "Decline")).toBeLessThanOrEqual(
    phoneLandscapeViewport.height,
  );
});

/*
 * The settings panel is the tallest state this cell can hold — it adds the
 * decision-quality offer above the analytics actions — and a phone reaches it
 * with one tap, so its own actions have to stay reachable too.
 */
test("analytics settings actions stay within the phone-landscape viewport", async ({
  page,
}) => {
  await page.setViewportSize(phoneLandscapeViewport);
  await page.addInitScript(
    ([consentKey, answeredKey, version]) => {
      window.localStorage.setItem(String(consentKey), "true");
      window.localStorage.setItem(String(answeredKey), String(version));
    },
    [analyticsConsentKey, answeredPolicyVersionKey, PRIVACY_POLICY_VERSION],
  );
  await page.goto("/");

  await page.getByRole("button", { name: "Analytics Settings" }).click();

  await expect(
    page.getByRole("button", { name: "Allow decision-quality measurements" }),
  ).toBeVisible();
  expect(await consentActionBottom(page, "Close")).toBeLessThanOrEqual(
    phoneLandscapeViewport.height,
  );
});

test("Privacy Policy link has a high-contrast color on the consent surface", async ({
  page,
}) => {
  await page.goto(`/${constantHandQuery}`);

  await expect(
    page.getByRole("button", { ...exactTextMatch, name: "Privacy Policy" }),
  ).toHaveCSS("color", "rgb(0, 0, 0)");
});

const minPrivacyPolicyFontSizePx = 16;

const openPrivacyPolicyModalPanel = async (page: Page) => {
  await page
    .getByRole("button", { ...exactTextMatch, name: "Privacy Policy" })
    .click();
  const panel = page.getByRole("button", { name: "Close modal" }).locator("..");
  await expect(panel).toBeVisible();
  return panel;
};

const privacyPolicyFontSizePx = async (
  page: Page,
  viewport: { height: number; width: number },
) => {
  await page.setViewportSize(viewport);
  await page.goto(`/${constantHandQuery}`);
  const panel = await openPrivacyPolicyModalPanel(page);
  const fontSize = await panel.evaluate(
    (element) => globalThis.getComputedStyle(element).fontSize,
  );
  return Number.parseFloat(fontSize);
};

test("side-by-side privacy policy text scales with the viewport, not the compacted banner", async ({
  page,
}) => {
  const narrowSideBySide = await privacyPolicyFontSizePx(page, {
    height: 390,
    width: 844,
  });
  const wideSideBySide = await privacyPolicyFontSizePx(page, {
    height: 900,
    width: 1600,
  });

  // Side-by-side mode shrinks the consent banner the modal mounts inside to
  // 0.8rem (12.8px); the policy reads as a document and must not inherit it.
  expect(narrowSideBySide).toBeGreaterThanOrEqual(minPrivacyPolicyFontSizePx);
  // A wider viewport yields larger text, tracking the vw-scaled app chrome.
  expect(wideSideBySide).toBeGreaterThan(narrowSideBySide);
});

/*
 * A returning player asked to answer a policy update has very likely also
 * built a tally, and every guard above starts from a browser with no history,
 * so none of them renders the two together.
 *
 * This cannot fail against the current stylesheet, and that was checked
 * rather than assumed: with the tally's margin inflated to 6em the actions
 * still sit inside the viewport, because side-by-side mode puts the tally in
 * column two as a middle child while the banner is a last child pinned to
 * column one. It is kept as a guard on that separation — a later change that
 * moved the tally into the banner's column would fail here — and not as
 * evidence that today's code was ever at risk.
 */
test("the policy update fits beside a tally at an enlarged root font", async ({
  page,
}) => {
  await page.setViewportSize(phoneLandscapeViewport);
  await page.addInitScript(
    /*
     * The tally key is built in the browser, because it carries the
     * deployment's own base path and only the page knows what that is.
     */
    (stored: {
      readonly consentKey: string;
      readonly tallyPrefix: string;
      readonly tally: string;
    }) => {
      window.localStorage.setItem(stored.consentKey, "true");
      window.localStorage.setItem(
        stored.tallyPrefix + new URL(document.baseURI).pathname,
        stored.tally,
      );
    },
    {
      consentKey: analyticsConsentKey,
      tally: JSON.stringify({
        lifetime: {
          decisions: 128,
          expectedPointsLossTotal: 157.44,
          optimalDecisions: 61,
        },
        records: [],
        version: 1,
      }),
      tallyPrefix: DISCARD_TALLY_KEY_PREFIX,
    },
  );
  await page.goto("/");
  await page.addStyleTag({ content: "html { font-size: 28px; }" });

  await expect(page.getByText("Points lost per discard")).toBeVisible();
  expect(await consentActionBottom(page, "Accept")).toBeLessThanOrEqual(
    phoneLandscapeViewport.height,
  );
  expect(await consentActionBottom(page, "Decline")).toBeLessThanOrEqual(
    phoneLandscapeViewport.height,
  );
});

/*
 * A first visit can produce a tally before consent is answered: the banner
 * does not block play, and the tally is local data consent never gated. The
 * banner, the analysis and the tally therefore render together, which is a
 * different set of grid children from every case above.
 */
test("first-run consent controls stay in view once a tally exists", async ({
  page,
}) => {
  await page.setViewportSize(phoneLandscapeViewport);
  await page.goto("/");
  const checkboxes = page.getByRole("checkbox");
  await checkboxes.nth(0).click();
  await checkboxes.nth(1).click();
  await page.locator('text="Loading analysis..."').waitFor({ state: "hidden" });
  await expect(page.getByText("Points lost per discard")).toBeVisible();

  expect(await consentActionBottom(page, "Accept")).toBeLessThanOrEqual(
    phoneLandscapeViewport.height,
  );
  expect(await consentActionBottom(page, "Decline")).toBeLessThanOrEqual(
    phoneLandscapeViewport.height,
  );
});
