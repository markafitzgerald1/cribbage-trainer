import * as classes from "./PrivacyPolicy.module.css";
import { forwardRef } from "react";

export const PrivacyPolicy = forwardRef<HTMLDivElement>((_, ref) => (
  <div
    className={classes.privacyPolicy}
    ref={ref}
  >
    <h1>Privacy Policy for Cribbage Trainer</h1>
    <p>Effective Date: July 23, 2026</p>
    <p>
      At Cribbage Trainer, accessible from{" "}
      <a href="https://markafitzgerald1.github.io/cribbage-trainer/">
        https://markafitzgerald1.github.io/cribbage-trainer/
      </a>
      , the privacy of our visitors is one of our main priorities. This Privacy
      Policy document outlines the types of information collected and recorded
      by Cribbage Trainer and how we use it.
    </p>

    <h2>Analytics Measurement and Consent</h2>
    <p>
      Cribbage Trainer uses Google Analytics in advanced consent mode. Before
      you make a choice, and after you decline analytics cookies, Google
      Analytics receives limited, cookieless page-view measurements without
      analytics cookies or persistent analytics identifiers. Google uses these
      measurements for aggregate behavioral modeling. Detailed interaction
      measurements are sent only after you explicitly accept analytics.
    </p>

    <h2>Information We Collect</h2>
    <p>
      The information sent to Google Analytics depends on your analytics consent
      choice:
    </p>
    <ul>
      <li>
        <strong>Without analytics cookie consent:</strong> Basic cookieless
        measurements may include the site origin and path without URL query
        parameters or fragments, page title, referring-site origin, timestamp,
        browser, operating system, device, language, screen resolution, consent
        state, and approximate location derived from the connection’s IP
        address. Google necessarily receives the IP address during transmission
        but states that Google Analytics does not log or store it. Cribbage
        Trainer does not send card identities, hand contents, URL game state, or
        detailed trainer interactions in this state.
      </li>
      <li>
        <strong>After accepting analytics:</strong> Google Analytics may use
        analytics cookies and collect card-free interaction measurements,
        including when a hand begins, cards are selected or unselected, an
        analysis is shown or hidden, and the Deal button is used.
      </li>
    </ul>

    <h2>How We Use Your Information</h2>
    <p>The information we collect is used to:</p>
    <ul>
      <li>Improve the user experience by analyzing site interactions.</li>
      <li>Provide, operate, and maintain the website.</li>
      <li>Detect and prevent fraud or abuse of the site.</li>
    </ul>

    <h2>Use of Google Analytics</h2>
    <p>
      Cribbage Trainer uses Google Analytics to analyze user interactions and
      improve the overall experience of the site. This data helps us understand
      how visitors engage with the site and allows us to optimize content and
      functionality. Before or without consent, Google Analytics operates
      without analytics cookies and uses cookieless measurements to model
      aggregate activity. After you accept analytics, it may set cookies in your
      browser to measure returning visits and site usage.
    </p>
    <p>
      For more details on how Google uses the data it collects, please refer to{" "}
      <a href="https://policies.google.com/technologies/partner-sites">
        Google’s Privacy & Terms
      </a>
      .
    </p>

    <h2>Cookies, Local Storage, and Consent Management</h2>
    <p>
      Cribbage Trainer uses local storage to remember whether you have consented
      to analytics cookies and detailed interaction measurement. This allows the
      site to apply your choice on later visits.
    </p>
    <p>
      <strong>Functionality and Measurement:</strong> Declining prevents Google
      Analytics from reading or writing analytics cookies, while basic
      cookieless measurements may continue. Accepting permits analytics cookies
      and the detailed, card-free interaction measurements described above.
    </p>
    <p>
      You can manage your cookie settings through your browser to receive
      notifications when a cookie is set, or to disable cookies entirely. Note
      that turning off cookies may reduce the measurements available in Google
      Analytics but does not prevent you from using Cribbage Trainer.
    </p>
    <p>
      <strong>Managing Preferences:</strong> You can clear local storage and
      cookies through your browser settings at any time. Doing so may require
      you to provide consent again for analytics collection upon revisiting the
      site.
    </p>

    <h2>Data Retention</h2>
    <p>
      The information collected through Google Analytics is retained according
      to Google’s default data retention settings. This period is managed by
      Google and may change over time as per their policies.
    </p>
    <p>
      You can reset the choice stored by Cribbage Trainer and remove analytics
      cookies by clearing this site’s local storage and cookies. This does not
      delete measurements that Google Analytics has already received.
    </p>

    <h2>Data Sharing</h2>
    <p>
      Cribbage Trainer does not handle sensitive personal data. The information
      we collect through Google Analytics is used solely for analyzing site
      performance and is not shared with third parties beyond Google for this
      purpose.
    </p>

    <h2>Your Choices</h2>
    <p>
      You have choices regarding the use of cookies and the collection of your
      data:
    </p>
    <ul>
      <li>
        You can decline analytics cookies and detailed interaction measurement
        in the consent prompt.
      </li>
      <li>
        You can opt out of Google Analytics tracking by using the{" "}
        <a href="https://tools.google.com/dlpage/gaoptout">
          Google Analytics Opt-Out Browser Add-on
        </a>
        .
      </li>
      <li>
        You can disable cookies through your browser settings, but this may
        affect your ability to use certain features of the website.
      </li>
    </ul>

    <h2>Security</h2>
    <p>
      We implement a variety of security measures to protect your personal
      information. However, no method of transmission over the internet or
      method of electronic storage is 100% secure, and we cannot guarantee its
      absolute security.
    </p>

    <h2>Changes to This Privacy Policy</h2>
    <p>
      We may update our Privacy Policy from time to time. We encourage you to
      review this page periodically for any changes. The date of the last update
      is shown at the top of this Privacy Policy.
    </p>
    <p>
      The July 23, 2026 update introduced advanced consent mode, cookieless
      basic measurement, and opt-in card-free trainer interaction events.
      Choices saved under the previous policy are not reused; returning visitors
      are asked to make a new analytics choice.
    </p>

    <h2>Contact Us</h2>
    <p>
      If you have any questions or concerns about this Privacy Policy, please
      feel free to contact us by opening an issue on GitHub:{" "}
      <a href="https://github.com/markafitzgerald1/cribbage-trainer/issues/new">
        https://github.com/markafitzgerald1/cribbage-trainer/issues/new
      </a>
      .
    </p>
  </div>
));

PrivacyPolicy.displayName = "PrivacyPolicy";
