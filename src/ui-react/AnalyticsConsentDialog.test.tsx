import "@testing-library/jest-dom";
import { fireEvent, render } from "@testing-library/react";
import { AnalyticsConsentDialog } from "./AnalyticsConsentDialog";

describe("analytics consent dialog", () => {
  const renderDialog = (consent: boolean | null = null) => {
    const onChange = jest.fn();
    const { getByText } = render(
      <AnalyticsConsentDialog
        consent={consent}
        onChange={onChange}
      />,
    );
    return { getByText, onChange };
  };

  it("contains the expected title with null consent", () => {
    const { getByText } = renderDialog();
    expect(getByText("Analytics Consent")).toBeInTheDocument();
  });

  const ANALYTICS_CONSENT = "Analytics Consent";

  it("contains the expected title with unspecified consent", () => {
    const { getByText } = renderDialog();
    expect(getByText(ANALYTICS_CONSENT)).toBeInTheDocument();
  });

  it("contains the accept button with null consent", () =>
    expect(
      render(<AnalyticsConsentDialog onChange={jest.fn()} />).getByText(
        ANALYTICS_CONSENT,
      ),
    ).toBeInTheDocument());

  it.each<[boolean, string]>([
    [true, "Accept"],
    [false, "Decline"],
  ])(
    "calls the onChange callback with %s when the %s button is clicked",
    (expected, buttonText: string) => {
      const { onChange, getByText } = renderDialog();
      fireEvent.click(getByText(buttonText));
      expect(onChange).toHaveBeenCalledWith(expected);
    },
  );

  it.each<[boolean | null, string]>([
    [true, "Thank you! Your consent helps "],
    [false, "Analytics have been disabled."],
    [null, "We use cookies and tools like Google Analytics"],
  ])(
    "shows the correct message when consent is %s",
    (consent: boolean | null, expectedMessage: string) => {
      const { getByText } = renderDialog(consent);
      expect(getByText(expectedMessage, { exact: false })).toBeInTheDocument();
    },
  );
});
