import type { Meta, StoryObj } from "@storybook/react";
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

export const ConsentUnspecifiedDialog: Story = {};

export const ConsentUnknownDialog: Story = {
  args: {
    consent: null,
  },
};

export const ConsentGivenDialog: Story = {
  args: {
    consent: true,
  },
};

export const ConsentNotGivenDialog: Story = {
  args: {
    consent: false,
  },
};
