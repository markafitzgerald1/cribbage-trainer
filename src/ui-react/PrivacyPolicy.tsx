import * as classes from "./PrivacyPolicy.module.css";
import React from "react";

export function PrivacyPolicy() {
  return (
    <div className={classes.privacyPolicy}>
      <h1>Privacy Policy</h1>
      <p>
        This Privacy Policy explains how we collect, use, and disclose
        information about you when you use the Cribbage Trainer service (the
        &quot;Service&quot;).
      </p>

      <h2>Information We Collect</h2>
      <p>
        We collect several types of information from and about users of our
        Service:
      </p>
      <ul>
        <li>
          Device Information: We automatically collect information about your
          device, such as your browser type, operating system, IP address,
          unique device identifiers, and network information.
        </li>
        <li>
          Usage Information: We collect information about how you use our
          Service, such as the pages you visit, the features you use, and the
          time you spend on the Service.
        </li>
        <li>
          Cookies and Similar Technologies: We use cookies and similar
          technologies to collect information about your preferences and
          activity on our Service. You can control your cookie settings through
          your browser settings.
        </li>
      </ul>

      <h2>Google Analytics</h2>
      <p>
        We use Google Analytics to track user activity on our Service. Google
        Analytics collects information such as your browser type, operating
        system, referring website, and pages you visit. You can learn more about
        how Google uses information from sites or apps that use its services
        here:{" "}
        <a href="https://policies.google.com/technologies/partner-sites?hl=en-US">
          https://policies.google.com/technologies/partner-sites?hl=en-US
        </a>
      </p>

      <h2>Your Choices</h2>
      <p>
        You have choices about how we collect and use your information. You can:
      </p>
      <ul>
        <li>Control your cookie settings through your browser.</li>
        <li>
          Opt out of Google Analytics tracking by visiting{" "}
          {/* eslint-disable-next-line react/jsx-max-depth */}
          <a href="https://tools.google.com/dlpage/gaoptout">
            https://tools.google.com/dlpage/gaoptout
          </a>
        </li>
      </ul>

      <h2>Data Retention</h2>
      <p>
        We will retain your information for as long as necessary to provide the
        Service to you and comply with our legal obligations.
      </p>

      <h2>Changes to this Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you
        of any changes by posting the new Privacy Policy on this page.
      </p>

      <h2>Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us
        at{" "}
        <a href="https://github.com/markafitzgerald1/cribbage-trainer/issues/new">
          https://github.com/markafitzgerald1/cribbage-trainer/issues/new
        </a>
        .
      </p>
    </div>
  );
}
