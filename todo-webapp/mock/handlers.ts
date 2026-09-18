// The service half of mock mode — the app's own data, ownership and 404s.
// mock/authz/gateway.ts (read straight off todo-api's openapi.yaml) answers
// the "may this caller call this operation at all" question ahead of these
// handlers, so nothing here re-checks a scope.
//
// State lives in this module's scope, not a server: a reload re-seeds it, and
// only in-app navigation carries a change forward (add a todo, then reload —
// it is gone, by design).

import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/todo-api";

type Todo = components["schemas"]["Todo"];

// The caller this mock speaks for. The Todo schema itself carries no owner
// field, so ownership is tracked here, beside the seed data, rather than
// invented on the wire shape the real service returns.
export const mockCaller = {
  userId: "01a0ab00-0000-7000-8000-000000000001",
  username: "mock-owner",
};

interface StoredTodo {
  ownerId: string;
  todo: Todo;
}

let nextId = 3;

// Seed one row owned by somebody else, so /me/todos and "every row" would
// look different if a handler ever confused the two (this contract has no
// every-row operation, but the discipline stays the same).
let store: StoredTodo[] = [
  {
    ownerId: mockCaller.userId,
    todo: {
      id: "1",
      title: "Buy milk",
      done: false,
      createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    },
  },
  {
    ownerId: mockCaller.userId,
    todo: {
      id: "2",
      title: "Walk the dog",
      done: true,
      createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    },
  },
  {
    ownerId: "not-the-caller",
    todo: { id: "999", title: "Someone else's todo", done: false, createdAt: new Date().toISOString() },
  },
];

export const handlers = [
  // The caller's own todos — the path says so. No todos:read check: a caller
  // who does not hold it was refused by mock/authz/gateway.ts already.
  http.get("/api/me/todos", () => {
    const data = store.filter((row) => row.ownerId === mockCaller.userId).map((row) => row.todo);
    return HttpResponse.json({ count: data.length, next: null, previous: null, data });
  }),

  http.post("/api/me/todos", async ({ request }) => {
    const input = (await request.json()) as { title?: string };
    if (!input?.title) {
      return HttpResponse.json({ code: 400, message: "title is required" }, { status: 400 });
    }
    const created: Todo = {
      id: String(nextId++),
      title: input.title,
      done: false,
      createdAt: new Date().toISOString(),
    };
    store = [...store, { ownerId: mockCaller.userId, todo: created }];
    return HttpResponse.json(created, { status: 201 });
  }),

  // A row that exists but is not the caller's is a 404, never a 403 — it is
  // simply not in the caller's collection.
  http.patch("/api/me/todos/:todoId", async ({ params, request }) => {
    const input = (await request.json()) as { done?: boolean };
    if (typeof input?.done !== "boolean") {
      return HttpResponse.json({ code: 400, message: "done is required" }, { status: 400 });
    }
    const row = store.find((r) => r.todo.id === params.todoId && r.ownerId === mockCaller.userId);
    if (!row) {
      return HttpResponse.json({ code: 404, message: "no such todo for the caller" }, { status: 404 });
    }
    row.todo = { ...row.todo, done: input.done };
    return HttpResponse.json(row.todo);
  }),
];
