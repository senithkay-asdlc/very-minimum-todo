# very-minimum-todo — PRD

## Problem Statement

People rely on scattered notes, chat messages, or memory to track small
personal tasks, which makes it easy to forget what still needs doing and
easy to lose track of what has already been done. They need a single place,
tied to their own identity, where they can jot a task down and mark it done
once it's finished.

## Solution

A minimal, personal todo app: a user signs in, adds todos, and marks them
done (or undoes that if marked by mistake). Each user's todos are private to
them, and everything is saved in a database so the list persists across
sessions and devices.

## Actors

- **User** — a signed-in individual who adds their own todos, views their own
list, and marks todos done or not-done. There is no shared or admin view;
every user only ever sees their own data.

## User Stories

1. As a User, I want to sign in, so that my todos are kept private to me and
 available whenever I return.
2. As a User, I want to add a todo, so that I can capture something I need to
 do.
3. As a User, I want to view my list of todos, so that I can see what's still
 pending and what's already done.
4. As a User, I want to mark a todo as done, so that I can track my progress.
5. As a User, I want to unmark a todo I previously marked done, so that I can
 correct a mistake.

## Product Decisions

- **Sign-in**: users sign in via SSO through Thunder, the platform IDP (org
default).
- **Data privacy**: each user's todos are private to them — no user can see
or modify another user's list.
- **Marking done is reversible**: a user can toggle a todo between done and
not-done at any time.
- **Persistence**: todos are stored in a database so they persist across
sessions and devices.
- **No third-party services**: the app needs no external service beyond
sign-in — no email, payments, notifications, or similar integrations.

## Out of Scope

- Editing a todo's text after it is added.
- Deleting todos.
- Due dates, reminders, or notifications.
- Sharing or collaborating on todos between users.
- Categories, tags, search, or filtering.
- A native mobile app.

## Open Questions

None at this time.