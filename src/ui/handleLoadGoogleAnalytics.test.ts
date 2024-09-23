import { describe, expect, it, jest } from "@jest/globals";
import { handleLoadGoogleAnalytics } from "./handleLoadGoogleAnalytics";

jest.mock<typeof import("./loadGoogleAnalytics")>(
  "./loadGoogleAnalytics",
  () => ({
    loadGoogleAnalytics: jest.fn(),
  }),
);

import { loadGoogleAnalytics } from "./loadGoogleAnalytics";

interface ProcessEnvWithOptionalMeasurementId extends NodeJS.ProcessEnv {
  VITE_GOOGLE_ANALYTICS_MEASUREMENT_ID?: string;
}

const processEnv = process.env as ProcessEnvWithOptionalMeasurementId;

describe.each([null, false, true])(
  "handleLoadGoogleAnalytics with consented = %s",
  (consented) => {
    it("calls loadGoogleAnalytics with consent status and measurement ID", () => {
      jest.clearAllMocks();
      const measurementId = "test-measurement-id";
      processEnv.VITE_GOOGLE_ANALYTICS_MEASUREMENT_ID = measurementId;

      handleLoadGoogleAnalytics(consented);

      expect(loadGoogleAnalytics).toHaveBeenCalledWith(
        consented,
        measurementId,
      );

      jest.clearAllMocks();
    });

    it("calls loadGoogleAnalytics with consent status and null measurement ID if measurement ID is not set", () => {
      jest.clearAllMocks();
      delete processEnv.VITE_GOOGLE_ANALYTICS_MEASUREMENT_ID;

      handleLoadGoogleAnalytics(consented);

      expect(loadGoogleAnalytics).toHaveBeenCalledWith(consented, null);
    });
  },
);
