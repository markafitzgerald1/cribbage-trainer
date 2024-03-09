import * as classes from "./AnalyticsConsentDialog.module.css";
import { useCallback } from "react";

type AnalyticsConsentDialogProps = {
  // eslint-disable-next-line react/require-default-props
  readonly consent?: boolean | null;
  readonly onChange: (value: boolean) => void;
};

export function AnalyticsConsentDialog({
  consent = null,
  onChange,
}: AnalyticsConsentDialogProps) {
  const handleUserConsent = useCallback(
    (newConsentValue: boolean) => {
      onChange(newConsentValue);
    },
    [onChange],
  );

  const handleAccept = useCallback(() => {
    handleUserConsent(true);
  }, [handleUserConsent]);

  const handleDecline = useCallback(() => {
    handleUserConsent(false);
  }, [handleUserConsent]);

  if (consent === true) {
    return (
      <p className={classes.analyticsConsentDialog}>
        Thank you! Your consent helps us improve our site using tools like
        Google Analytics. For more details, please see our Privacy Policy
        (coming soon).
      </p>
    );
  }

  if (consent === false) {
    return (
      <p className={classes.analyticsConsentDialog}>
        Analytics have been disabled. You can find more information in our
        Privacy Policy (coming soon).
      </p>
    );
  }

  return (
    <div className={classes.analyticsConsentDialog}>
      <h2>Analytics Consent</h2>
      <p>
        We use cookies and tools like Google Analytics to analyze how visitors
        use our site. This helps us make improvements and tailor the experience.
      </p>
      <p>Our Privacy Policy will be available soon for more details.</p>
      <button
        onClick={handleAccept}
        type="button"
      >
        Accept
      </button>
      <button
        onClick={handleDecline}
        type="button"
      >
        Decline
      </button>
    </div>
  );
}
