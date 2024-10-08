import * as ReactDOMClient from "react-dom/client";
import { StrictMode } from "react";
import { Trainer } from "./ui-react/Trainer";
import { createGenerator } from "./game/randomNumberGenerator";
import { handleLoadGoogleAnalytics } from "./ui/handleLoadGoogleAnalytics";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOMClient.createRoot(document.querySelector("#trainer")!).render(
  <StrictMode>
    <Trainer
      generateRandomNumber={createGenerator(
        new URLSearchParams(window.location.search).get("seed"),
      )}
      loadGoogleAnalytics={handleLoadGoogleAnalytics}
    />
  </StrictMode>,
);
