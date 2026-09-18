// The OIDC redirect target. There is no session to read until the redirect
// has been processed, so this route is wired OUTSIDE the AuthzProvider
// (src/App.tsx). Not a wireframe screen — this and /forbidden are the
// platform-prescribed carve-out from "no invented screens".

import { useEffect, useState, type JSX } from "react";
import { Box, CircularProgress, Layout, ParticleBackground, Stack, Typography } from "@wso2/oxygen-ui";
import { handleCallback } from "../authz/session";

export function CallbackPage(): JSX.Element {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        await handleCallback();
        // Post-sign-in landing: no env key for it, the app is served at its
        // own host root.
        window.location.assign(window.location.origin);
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : "Sign-in failed.");
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  return (
    <Layout.Content>
      <ParticleBackground opacity={0.5} />
      <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Stack spacing={2} alignItems="center">
          <Typography variant="h6">Todo App</Typography>
          {error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <>
              <CircularProgress size={28} />
              <Typography color="text.secondary">Signing you in…</Typography>
            </>
          )}
        </Stack>
      </Box>
    </Layout.Content>
  );
}
