import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, fn, waitFor, within } from "storybook/test";
import { AnalyticsConsentDialog } from "./AnalyticsConsentDialog";

const meta = {
  component: AnalyticsConsentDialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "AnalyticsConsentDialog",
} satisfies Meta<typeof AnalyticsConsentDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedArgs = {
  consent: true,
  onAllowDecisionQuality: () => null,
  onChange: () => null,
  onPolicyUpdateChoice: () => null,
};

const createStoryWithConsent = (consent: boolean | null) => ({
  args: {
    ...sharedArgs,
    consent,
  },
});

const openPrivacyPolicy = async (canvasElement: HTMLElement) => {
  const privacyLink = within(canvasElement).getByRole("button", {
    name: "Privacy Policy",
  });

  await fireEvent.click(privacyLink);

  await expect(canvasElement).toHaveTextContent(
    "Privacy Policy for Cribbage Trainer",
  );
};

const createPrivacyStory = (
  afterOpen?: (canvasElement: HTMLElement) => Promise<void> | void,
): Story => ({
  args: sharedArgs,
  play: async ({ canvasElement }) => {
    await openPrivacyPolicy(canvasElement);
    if (afterOpen) {
      await afterOpen(canvasElement);
    }
  },
});

export const ConsentUnknownOrUnspecifiedDialog: Story =
  createStoryWithConsent(null);
export const ConsentGivenDialog: Story = createStoryWithConsent(true);
export const ConsentNotGivenDialog: Story = createStoryWithConsent(false);

const openAnalyticsSettings = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await fireEvent.click(
    canvas.getByRole("button", { name: "Analytics Settings" }),
  );
  return canvas;
};

const createSettingsArgs = (consent: boolean) => ({
  consent,
  onAllowDecisionQuality: fn(),
  onChange: fn(),
  onPolicyUpdateChoice: fn(),
});

const createSettingsStory = ({
  actionName,
  consent,
  decisionQualityConsented = true,
  verify,
}: {
  readonly actionName: string;
  readonly consent: boolean;
  readonly decisionQualityConsented?: boolean;
  readonly verify: (args: {
    readonly onAllowDecisionQuality: unknown;
    readonly onChange: unknown;
  }) => Promise<void>;
}): Story => ({
  args: { ...createSettingsArgs(consent), decisionQualityConsented },
  play: async ({ args, canvasElement }) => {
    const canvas = await openAnalyticsSettings(canvasElement);
    await fireEvent.click(canvas.getByText(actionName));

    await verify(args);
  },
});

export const ConsentCanBeGranted: Story = createSettingsStory({
  actionName: "Allow analytics",
  consent: false,
  verify: async ({ onChange }) => {
    await expect(onChange).toHaveBeenCalledWith(true);
  },
});
export const ConsentCanBeWithdrawn: Story = createSettingsStory({
  actionName: "Disable analytics",
  consent: true,
  verify: async ({ onChange }) => {
    await expect(onChange).toHaveBeenCalledWith(false);
  },
});

export const AnalyticsSettingsCanBeDismissed: Story = {
  args: createSettingsArgs(true),
  play: async ({ args, canvasElement }) => {
    await openAnalyticsSettings(canvasElement);
    const canvas = within(canvasElement);

    await expect(canvasElement).toHaveTextContent(
      "Analytics is currently enabled",
    );

    await fireEvent.click(canvas.getByRole("button", { name: "Close" }));

    await waitFor(async () => {
      await expect(
        canvas.getByRole("button", { name: "Analytics Settings" }),
      ).toBeVisible();
    });

    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

export const PrivacyPolicyOpens: Story = createPrivacyStory();

export const PrivacyPolicyClosesOnOutsideClick: Story = createPrivacyStory(
  async (canvasElement) => {
    const overlay = canvasElement.querySelector('[class*="overlay"]');

    await expect(overlay).not.toBeNull();

    await fireEvent.mouseDown(overlay as Element);

    await expect(canvasElement).not.toHaveTextContent(
      "Privacy Policy for Cribbage Trainer",
    );
  },
);

export const PrivacyPolicyClosesWithEscape: Story = createPrivacyStory(
  async (canvasElement) => {
    await fireEvent.keyDown(canvasElement, { key: "Escape" });

    await expect(canvasElement).not.toHaveTextContent(
      "Privacy Policy for Cribbage Trainer",
    );
  },
);

const createPolicyUpdateStory = (
  buttonName: string,
  verify: (args: {
    readonly onChange: unknown;
    readonly onPolicyUpdateChoice: unknown;
  }) => Promise<void>,
): Story => ({
  args: {
    consent: true,
    isPolicyUpdate: true,
    onAllowDecisionQuality: fn(),
    onChange: fn(),
    onPolicyUpdateChoice: fn(),
  },
  play: async ({ args, canvasElement }) => {
    await expect(canvasElement).toHaveTextContent("Analytics Consent Update");

    await fireEvent.click(
      within(canvasElement).getByRole("button", { name: buttonName }),
    );

    await verify(args);
  },
});

export const PolicyUpdateAccepted: Story = createPolicyUpdateStory(
  "Accept",
  async ({ onPolicyUpdateChoice }) => {
    await expect(onPolicyUpdateChoice).toHaveBeenCalledWith(true);
  },
);

// Declining the addition must leave analytics consent itself alone.
export const PolicyUpdateDeclined: Story = createPolicyUpdateStory(
  "Decline",
  async ({ onChange, onPolicyUpdateChoice }) => {
    await expect(onPolicyUpdateChoice).toHaveBeenCalledWith(false);
    await expect(onChange).not.toHaveBeenCalled();
  },
);

// The measurement declined with the policy update can still be turned on later, and granting it must not re-answer analytics itself.
export const DecisionQualityAllowedInSettings: Story = createSettingsStory({
  actionName: "Allow decision-quality measurements",
  consent: true,
  decisionQualityConsented: false,
  verify: async ({ onAllowDecisionQuality, onChange }) => {
    await expect(onAllowDecisionQuality).toHaveBeenCalledTimes(1);
    await expect(onChange).not.toHaveBeenCalled();
  },
});
