import { loadGoogleAnalytics } from "./loadGoogleAnalytics";

const getMeasurementId = () =>
  import.meta.env.VITE_GOOGLE_ANALYTICS_MEASUREMENT_ID ?? null;

export function handleLoadGoogleAnalytics(consented: boolean | null) {
  loadGoogleAnalytics(consented, getMeasurementId());
}
