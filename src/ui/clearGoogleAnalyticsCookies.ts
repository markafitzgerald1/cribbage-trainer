const GOOGLE_ANALYTICS_COOKIE_PREFIX = "_ga";

const expireCookie = (name: string, domain: string) => {
  document.cookie = `${name}=; Max-Age=0; Path=/${domain}; SameSite=Lax`;
};

export const clearGoogleAnalyticsCookies = () => {
  const analyticsCookieNames = document.cookie
    .split(";")
    .map((cookie) => cookie.trim().substring(0, cookie.indexOf("=")))
    .filter((name) => name.startsWith(GOOGLE_ANALYTICS_COOKIE_PREFIX));
  const domain = `; Domain=${window.location.hostname}`;

  analyticsCookieNames.forEach((name) => {
    expireCookie(name, "");
    expireCookie(name, domain);
  });
};
