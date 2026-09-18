// Typed read of the platform's runtime config, mounted at /env-config.js
// BEFORE this bundle runs (index.html loads it synchronously, in <head>).
// Never import.meta.env.VITE_*, never process.env — those are build-time and
// this platform never sets them.

type Env = {
  // This SPA's auth platform-resource dependency, named `user-auth` in
  // design.json — UPPER_SNAKE("user-auth") = USER_AUTH. All four are
  // required; USER_AUTH_RESOURCE is not optional — without it the token's
  // `aud` is wrong and every /api call 401s while sign-in looks healthy.
  // <DEP>_JWKS_URL is emitted too, but the browser never validates a token
  // (the API gateway does), so it is not declared here.
  USER_AUTH_CLIENT_ID: string;
  USER_AUTH_ISSUER: string;
  USER_AUTH_SCOPES: string;
  USER_AUTH_RESOURCE: string;
};

declare global {
  interface Window {
    _env_: Env;
  }
}

if (!window._env_) {
  throw new Error(
    "window._env_ not set — /env-config.js failed to load. " +
      "The platform mounts this file; if you see this locally, host " +
      "/env-config.js from your dev server.",
  );
}

export const env: Env = window._env_;
