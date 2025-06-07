import "../src/styles.css";
import type { Preview } from "@storybook/react-vite";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(?<colorProperty>background|color)$/iu,
        date: /Date$/iu,
      },
    },
  },
};

export default preview;
