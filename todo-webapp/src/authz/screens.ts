// Adapted from thunder-authentication's assets/screens.example.ts.
//
// THIS IS THE ONLY FILE THAT KNOWS ABOUT SCREENS, and all it says about the
// one screen this app has is which API operation it LOADS. wireframes.dsl
// draws exactly one screen, TodoList, in the one flow "Manage todos" (role
// "User") — so there is no public screen here.

import { canCall } from "./core";
import { OPERATIONS, isOperationKey, type OperationKey } from "./operations.gen";

export interface ScreenRoute {
  /** A stable id the App maps to a page component. */
  readonly key: string;
  /** The wireframe's screen name, for the rail and the Forbidden copy. */
  readonly label: string;
  readonly path: string;
  /**
   * The operation this screen exists to perform: the call it renders on load.
   * `null` is for a screen that needs NO operation at all — rare, and not the
   * case here.
   */
  readonly loads: OperationKey | null;
  /**
   * In a flow with no `role` line: reachable before sign-in. Every flow this
   * app has carries `role "User"`, so no screen here is public.
   */
  readonly public?: boolean;
}

/**
 * YOUR screens, in RAIL ORDER. One row per wireframe screen — this app has
 * exactly one: TodoList, which loads the caller's own todos.
 */
export const SCREEN_ROUTES: readonly ScreenRoute[] = [
  { key: "todolist", label: "Your todos", path: "/todos", loads: "GET /me/todos" },
];

// FAIL LOUDLY, at module load — the first render, every time, in dev, in the
// mock walk and in the deployed pod. See thunder-authentication SKILL.md §5.
for (const screen of SCREEN_ROUTES) {
  if (screen.loads !== null && !isOperationKey(screen.loads)) {
    throw new Error(
      `src/authz/screens.ts: screen "${screen.label}" loads "${screen.loads}", which ` +
        `no contract declares. Re-run \`npm run gen\`, or name the operation the ` +
        `way openapi.yaml spells it.`,
    );
  }
}

/**
 * The screens a caller can actually open, in rail order. The first one is the
 * landing screen; an EMPTY list is the NoAccess case.
 */
export function reachableScreens(
  scopes: ReadonlySet<string>,
  signedIn: boolean,
): readonly ScreenRoute[] {
  return SCREEN_ROUTES.filter((screen) => {
    if (screen.public) return true;
    if (screen.loads === null) return signedIn;
    return canCall(OPERATIONS[screen.loads], scopes, signedIn);
  });
}

/** Does this caller reach anything their scopes actually earned them? */
export function hasScopedReach(scopes: ReadonlySet<string>, signedIn: boolean): boolean {
  return reachableScreens(scopes, signedIn).some((screen) => !screen.public && screen.loads !== null);
}
