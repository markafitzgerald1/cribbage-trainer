const GOOGLE_ANALYTICS_COOKIE_PREFIX = "_ga";

const expireCookie = (name: string, domainAttribute: string) => {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domainAttribute}`;
};

export const clearGoogleAnalyticsCookies = () => {
  const analyticsCookieNames = document.cookie
    .split(";")
    .map((cookie) => {
      // Both the index and the slice must come from the trimmed string, otherwise the separator's space shifts the name by one character.
      const trimmedCookie = cookie.trim();
      return trimmedCookie.substring(0, trimmedCookie.indexOf("="));
    })
    .filter((name) => name.startsWith(GOOGLE_ANALYTICS_COOKIE_PREFIX));
  const domainAttribute = `; Domain=${window.location.hostname}`;

  analyticsCookieNames.forEach((name) => {
    // Google may scope the cookie to the host or to the parent domain.
    // A delete only matches a cookie with the same domain scope.
    expireCookie(name, "");
    expireCookie(name, domainAttribute);
  });
};
