declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// Google's tag only processes `arguments` objects pushed to the data layer; plain arrays are silently ignored.
// The rest parameter exists for typing only, while `arguments` is what gets pushed.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function gtag(..._args: unknown[]) {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer?.push(arguments);
}
