import * as classes from "./PrivacyPolicy.module.css";

export function PrivacyPolicy() {
  return (
    <div className={classes.privacyPolicy}>
      <h1>Privacy Policy for Cribbage Trainer</h1>
      <p>Effective Date: September 2, 2024</p>
      <p>
        At Cribbage Trainer, accessible from{" "}
        <a href="https://markafitzgerald1.github.io/cribbage-trainer/">
          https://markafitzgerald1.github.io/cribbage-trainer/
        </a>
        , the privacy of our visitors is one of our main priorities. This
        Privacy Policy document outlines the types of information collected and
        recorded by Cribbage Trainer and how we use it.
      </p>

      <h2>Consent to Data Collection</h2>
      <p>
        Cribbage Trainer uses Google Analytics to collect data only after you
        have provided consent. No analytics data will be collected until you
        have explicitly agreed to the use of Google Analytics.
      </p>

      <h2>Information We Collect</h2>
      <p>
        Once consent is given, Cribbage Trainer collects certain information
        through Google Analytics, including:
      </p>
      <ul>
        <li>
          {/* eslint-disable-next-line react/jsx-max-depth */}
          <strong>Usage Data:</strong> Information about how you interact with
          the site, such as which pages you visit, how long you spend on them,
          and other behavioral metrics.
        </li>
        <li>
          {/* eslint-disable-next-line react/jsx-max-depth */}
          <strong>Device and Browser Information:</strong> Details about the
          device and browser used to access the website, including IP address,
          operating system, browser type, and screen resolution.
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
        improve the overall experience of the site. This data helps us
        understand how visitors engage with the site and allows us to optimize
        content and functionality. Google Analytics may set cookies in your
        browser to identify returning visitors and enhance your experience.
      </p>
      <p>
        For more details on how Google uses the data it collects, please refer
        to{" "}
        <a href="https://policies.google.com/technologies/partner-sites">
          Google’s Privacy & Terms
        </a>
        .
      </p>

      <h2>Cookies, Local Storage, and Consent Management</h2>
      <p>
        Cribbage Trainer uses local storage to remember whether you have
        consented to the use of Google Analytics. This ensures that analytics
        data is only collected if you have given explicit permission.
      </p>
      <p>
        <strong>Functionality and Tracking:</strong> Cookies are primarily used
        by Google Analytics to help analyze how users interact with the site.
        These cookies help us aggregate data about site traffic and site
        interactions to continually improve user experience.
      </p>
      <p>
        You can manage your cookie settings through your browser to receive
        notifications when a cookie is set, or to disable cookies entirely. Note
        that turning off cookies might affect the functionality provided by
        Google Analytics.
      </p>
      <p>
        <strong>Managing Preferences:</strong> You can clear local storage and
        cookies through your browser settings at any time. Doing so may require
        you to provide consent again for analytics collection upon revisiting
        the site.
      </p>

      <h2>Data Retention</h2>
      <p>
        The information collected through Google Analytics is retained according
        to Google’s default data retention settings. This period is managed by
        Google and may change over time as per their policies.
      </p>
      <p>
        You can manage your consent and delete your data at any time by clearing
        your browser’s local storage and disabling cookies. Please note that
        doing so may impact your experience on the website.
      </p>

      <h2>Data Sharing</h2>
      <p>
        Cribbage Trainer does not handle sensitive personal data. The
        information we collect through Google Analytics is used solely for
        analyzing site performance and is not shared with third parties beyond
        Google for this purpose.
      </p>

      <h2>Your Choices</h2>
      <p>
        You have choices regarding the use of cookies and the collection of your
        data:
      </p>
      <ul>
        <li>
          You can opt out of Google Analytics tracking by using the{" "}
          {/* eslint-disable-next-line react/jsx-max-depth */}
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
        review this page periodically for any changes. The date of the last
        update is shown at the top of this Privacy Policy.
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
  );
}
