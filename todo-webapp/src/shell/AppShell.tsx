// The signed-in app shell — every gated screen renders inside it, through
// AppShell.Main's <Outlet/>. Structure follows Oxygen's sample app
// (sample/src/layouts/AppLayout.tsx): Header in AppShell.Navbar, Sidebar in
// AppShell.Sidebar, the routed page in AppShell.Main, Footer in
// AppShell.Footer. Kept even though this app has exactly one screen — the
// wireframe was drawn against this shell, so the wireframe, the running app
// and the sample line up one to one.

import type { JSX } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  AppShell,
  ColorSchemeToggle,
  Divider,
  Footer,
  Header,
  Sidebar,
  UserMenu,
} from "@wso2/oxygen-ui";
import { CheckSquare, LogOut } from "@wso2/oxygen-ui-icons-react";
import { useAuthz } from "../authz/gates";
import { signOut } from "../authz/session";
import { SCREEN_ROUTES } from "../authz/screens";

const APP_NAME = "Todo App";

export function TodoWebappShell(): JSX.Element {
  const { pathname } = useLocation();
  const { username } = useAuthz();
  const active = SCREEN_ROUTES.find((screen) => pathname.startsWith(screen.path))?.key ?? "";

  async function handleSignOut(): Promise<void> {
    await signOut();
  }

  return (
    <AppShell>
      <AppShell.Navbar>
        <Header>
          <Header.Toggle />
          <Header.Brand>
            <Header.BrandTitle>{APP_NAME}</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
          <Header.Actions>
            <ColorSchemeToggle />
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <UserMenu>
              <UserMenu.Trigger name={username || "Signed in"} />
              <UserMenu.Header name={username || "Signed in"} email="" />
              <UserMenu.Logout icon={<LogOut />} onClick={() => void handleSignOut()} />
            </UserMenu>
          </Header.Actions>
        </Header>
      </AppShell.Navbar>

      <AppShell.Sidebar>
        <Sidebar activeItem={active}>
          <Sidebar.Nav>
            <Sidebar.Category>
              {SCREEN_ROUTES.map((screen) => (
                <Sidebar.Item key={screen.key} id={screen.key} link={<Link to={screen.path} />}>
                  <Sidebar.ItemIcon>
                    <CheckSquare />
                  </Sidebar.ItemIcon>
                  <Sidebar.ItemLabel>{screen.label}</Sidebar.ItemLabel>
                </Sidebar.Item>
              ))}
            </Sidebar.Category>
          </Sidebar.Nav>
        </Sidebar>
      </AppShell.Sidebar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      <AppShell.Footer>
        <Footer>
          <Footer.Copyright>© WSO2 LLC</Footer.Copyright>
        </Footer>
      </AppShell.Footer>
    </AppShell>
  );
}

