import * as classes from "./PrivacyPolicy.module.css";
import { forwardRef } from "react";

export const PrivacyPolicy = forwardRef<HTMLDivElement>((_, ref) => (
  <div
    className={classes.privacyPolicy}
    ref={ref}
  >
    <h1>Privacy Policy for Cribbage Trainer</h1>
    <p>Effective date: July 23, 2026</p>

    <h2>Who is responsible</h2>
    <p>
      Cribbage Trainer is operated by Mark Fitzgerald, an independent developer
      based in Ontario, Canada. Mark Fitzgerald is the data controller and the
      person responsible for privacy.
    </p>
    <p>
      Privacy questions and requests can be sent privately to{" "}
      <a href="mailto:mark.a.fitzgerald+cribbage.trainer@gmail.com">
        mark.a.fitzgerald+cribbage.trainer@gmail.com
      </a>
      . Please do not include sensitive personal information in a public GitHub
      issue.
    </p>

    <h2>Analytics is optional</h2>
    <p>
      Cribbage Trainer does not load Google Analytics, set or read Google
      Analytics cookies, or send information to Google Analytics unless you
      select Accept. Declining analytics or leaving the choice unanswered does
      not affect your ability to use the trainer.
    </p>
    <p>
      If you accept, Google Analytics uses analytics cookies and receives the
      card-free measurements described below. Advertising storage, advertising
      user data, and advertising personalization remain disabled.
    </p>

    <h2>Information collected after acceptance</h2>
    <p>After you accept analytics, Google Analytics may receive:</p>
    <ul>
      <li>
        The site origin and path, without URL query parameters or fragments, and
        the referring site’s origin. This prevents hands, discards, roles,
        seeds, and analysis settings stored in the URL from being sent.
      </li>
      <li>
        The page title, timestamp, browser, operating system, device type,
        language, and screen resolution.
      </li>
      <li>
        Approximate location derived from the connection’s IP address. Google
        necessarily receives the IP address during transmission but states that
        Google Analytics does not log or store it.
      </li>
      <li>
        Card-free trainer interactions, including when a hand begins, cards are
        selected or unselected, analysis is shown or hidden, and the Deal button
        is used.
      </li>
      <li>
        A random identifier for one dealt hand, counts, sequence indices, and
        low-cardinality sources such as interactive, deep link, or history.
      </li>
    </ul>
    <p>
      Cribbage Trainer does not send card identities, hand contents, discard
      contents, URL game state, names, email addresses, account identifiers, or
      a cross-device user identifier to Google Analytics.
    </p>

    <h2>Purpose and legal basis</h2>
    <p>
      Analytics is used to understand aggregate site usage, improve the trainer,
      diagnose usability and reliability problems, and evaluate whether new
      features are useful. The legal basis for this processing is your consent.
      Analytics is not used for advertising, personalized advertising, or
      selling personal information.
    </p>

    <h2>Google Analytics and international processing</h2>
    <p>
      Google LLC processes analytics information on behalf of Cribbage Trainer
      to provide Google Analytics. Information may be processed in Canada, the
      United States, and other countries where Google or its service providers
      operate. Those countries may have privacy laws different from the laws
      where you live.
    </p>
    <p>
      Cribbage Trainer uses Google’s data-processing terms and applicable
      contractual transfer safeguards. Google’s optional products-and-services
      data sharing is disabled. For more information, see{" "}
      <a href="https://policies.google.com/technologies/partner-sites">
        how Google uses information from sites that use its services
      </a>
      .
    </p>

    <h2>Cookies, local storage, and retention</h2>
    <p>
      If you accept analytics, Google Analytics cookies may recognize the same
      browser on later visits. Analytics cookies are configured to expire after
      approximately 13 months without extending their lifetime on later
      activity.
    </p>
    <p>
      Google Analytics user-level and event-level data is retained for 14
      months. Aggregated reports that no longer identify an individual device
      may be retained longer. Cribbage Trainer does not currently export
      analytics data to a separate warehouse.
    </p>
    <p>
      Cribbage Trainer uses local storage to remember your analytics choice.
      This preference remains until you change it, clear site storage, or a
      future material privacy-policy update requires a new choice.
    </p>

    <h2>Changing or withdrawing your choice</h2>
    <p>
      Use the always-available Analytics Settings link in the trainer to enable
      or disable analytics. Disabling analytics removes the Google Analytics
      cookies visible to Cribbage Trainer and reloads the page without loading
      Google Analytics. It does not retroactively delete information already
      received by Google Analytics.
    </p>
    <p>
      You may also block analytics with browser privacy settings or extensions.
      You can use the{" "}
      <a href="https://tools.google.com/dlpage/gaoptout">
        Google Analytics Opt-Out Browser Add-on
      </a>
      , although it is not required to use Cribbage Trainer’s own setting.
    </p>

    <h2>Privacy questions and applicable rights</h2>
    <p>
      Depending on applicable law, you may have rights to ask about, access,
      correct, delete, restrict, or object to processing of your personal
      information, and to withdraw consent. You can send a request to the
      privacy email address above. Cribbage Trainer will respond as applicable
      law requires. There is no Cribbage Trainer account or persistent app user
      ID, so it may not be possible to verify that a Google Analytics record
      relates to you or locate it in response to a request.
    </p>
    <p>
      Depending on applicable law, if a concern is not resolved, you may also
      have the right to complain to the{" "}
      <a href="https://www.priv.gc.ca/en/report-a-concern/">
        Office of the Privacy Commissioner of Canada
      </a>
      , your local data-protection authority, or, in the United Kingdom, the{" "}
      <a href="https://ico.org.uk/make-a-complaint/data-protection-complaints/">
        Information Commissioner’s Office
      </a>
      .
    </p>

    <h2>Changes to this policy</h2>
    <p>
      Material changes will be described here and, when appropriate, will
      require a new analytics choice before further analytics collection.
    </p>
    <p>
      The July 23, 2026 update made analytics entirely opt-in, added persistent
      Analytics Settings, documented the controller and private contact,
      clarified legal basis, international processing, retention, and privacy
      rights, and preserved the card-free telemetry boundary. Choices saved
      under the earlier policy are not reused.
    </p>
  </div>
));

PrivacyPolicy.displayName = "PrivacyPolicy";
