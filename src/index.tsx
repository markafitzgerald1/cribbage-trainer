import * as ReactDOMClient from "react-dom/client";
import { StrictMode } from "react";
import { Trainer } from "./ui-react/Trainer";
import { createGenerator } from "./game/randomNumberGenerator";
import { getInitialProps } from "./ui/getInitialProps";
import { handleLoadGoogleAnalytics } from "./ui/handleLoadGoogleAnalytics";
import { trackEvent } from "./ui/trackEvent";

const {
  initialCards,
  initialCribRole,
  initialDiscards,
  initialScoreSortKey,
  initialSortOrder,
  seed,
} = getInitialProps(window.location.search);

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOMClient.createRoot(document.querySelector("#trainer")!).render(
  <StrictMode>
    <Trainer
      generateRandomNumber={createGenerator(seed)}
      initialCards={initialCards}
      initialCribRole={initialCribRole}
      initialDiscards={initialDiscards}
      initialScoreSortKey={initialScoreSortKey}
      initialSortOrder={initialSortOrder}
      loadGoogleAnalytics={handleLoadGoogleAnalytics}
      trackEvent={trackEvent}
    />
  </StrictMode>,
);
