import * as classes from "./AnalyticsConsentDialog.module.css";
import { useCallback, useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import { PrivacyPolicy } from "./PrivacyPolicy";

type AnalyticsConsentDialogProps = {
  // eslint-disable-next-line react/require-default-props
  readonly consent?: boolean | null;
  readonly onChange: (value: boolean) => void;
};

export function AnalyticsConsentDialog({
  consent = null,
  onChange,
}: AnalyticsConsentDialogProps) {
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const privacyPolicyRef = useRef<HTMLDivElement>(null);

  const displayModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const hideModal = useCallback(() => {
    setShowModal(false);
  }, []);

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

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hideModal();
      }
    },
    [hideModal],
  );

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const modalElement = modalRef.current;
      const privacyPolicyElement = privacyPolicyRef.current;
      if (
        modalElement &&
        !modalElement.contains(event.target as Node) &&
        privacyPolicyElement &&
        !privacyPolicyElement.contains(event.target as Node)
      ) {
        hideModal();
      }
    },
    [hideModal],
  );

  useEffect(() => {
    if (showModal) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showModal, handleClickOutside, handleKeyDown]);

  const handleKeyDownEnter = useCallback(
    (event: React.KeyboardEvent<HTMLSpanElement>) => {
      if (event.key === "Enter") {
        displayModal();
      }
    },
    [displayModal],
  );

  const PrivacyPolicyLink = (
    <span
      onClick={displayModal}
      onKeyDown={handleKeyDownEnter}
      role="button"
      style={{
        color: "blue",
        cursor: "pointer",
        textDecoration: "underline",
      }}
      tabIndex={0}
    >
      Privacy Policy
    </span>
  );

  const renderConsentMessage = () => {
    switch (consent) {
      case true:
        return (
          <>
            Thank you! Your consent helps us improve our site using tools like
            Google Analytics. For more details, please see our{" "}
            {PrivacyPolicyLink}.
          </>
        );
      case false:
        return (
          <>
            Analytics have been disabled. You can find more information in our{" "}
            {PrivacyPolicyLink}.
          </>
        );
      case null:
        return (
          <>
            <h2>Analytics Consent</h2>
            <p>
              We use cookies and tools like Google Analytics to analyze how
              visitors use our site. This helps us make improvements and tailor
              the experience. See our {PrivacyPolicyLink} for more details.
            </p>
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
          </>
        );
      default:
        return null;
    }
  };

  const content = renderConsentMessage();

  if (content === null) {
    return null;
  }

  return (
    <div className={classes.analyticsConsentDialog}>
      {renderConsentMessage()}
      <Modal
        onClose={hideModal}
        ref={modalRef}
        show={showModal}
      >
        <PrivacyPolicy ref={privacyPolicyRef} />
      </Modal>
    </div>
  );
}
