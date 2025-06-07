import type { Meta, StoryObj } from "@storybook/react-vite";
import { PrivacyPolicy } from "./PrivacyPolicy";

const meta = {
  component: PrivacyPolicy,
  tags: ["autodocs"],
  title: "PrivacyPolicy",
} satisfies Meta<typeof PrivacyPolicy>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Policy: Story = {};
