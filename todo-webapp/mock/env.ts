// mockEnv carries exactly the keys the platform actually emits for this
// component: this app's own USER_AUTH_* OIDC keys (src/env.ts declares no
// others — no sibling API URL, no configurations.env default).

export const mockEnv = {
  USER_AUTH_CLIENT_ID: "mock-client",
  USER_AUTH_ISSUER: "https://mock-idp.test",
  // No USER_AUTH_JWKS_URL: the platform emits it, src/env.ts does not declare
  // it (the browser never validates a token), so mock mode does not carry it.
  // The OIDC scopes are `group` and `ou`, SINGULAR, followed by the project's
  // own catalog handles from specs/design/security.json.
  USER_AUTH_SCOPES: "openid profile email group ou todos:read todos:create todos:update",
  USER_AUTH_RESOURCE: "https://mock-idp.test/resources/mock-project",
};
