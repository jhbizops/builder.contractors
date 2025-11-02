# Builder.Contractors Platform

## Overview
The platform now uses a first-party session-based authentication and storage layer instead of Firebase. All data is served from the Node/Express API with in-memory persistence and can be swapped for a durable store later. The client interacts with the API via `@tanstack/react-query` using typed helpers.

## Environment setup
1. Install dependencies
   ```bash
   pnpm install
   ```
2. Create a `.env` file based on `.env.example` and set:
   - `PORT` – optional (defaults to `5000`).
   - `SESSION_SECRET` – required. Use a long random string.

## Running the app
- Development server (client + API):
  ```bash
  pnpm dev
  ```
- Lint:
  ```bash
  pnpm lint
  ```
- Type-check:
  ```bash
  pnpm typecheck
  ```
- Tests (Vitest):
  ```bash
  pnpm test
  ```
- Production build:
  ```bash
  pnpm build
  pnpm start
  ```

## Authentication flow
- Registration, login, logout, and session inspection happen through the Express API:
  - `POST /api/auth/register` → creates user, auto-approves admin role, starts session.
  - `POST /api/auth/login` → establishes session.
  - `POST /api/auth/logout` → destroys session.
  - `GET /api/auth/session` → returns current user or `401` if unauthenticated.
- Passwords are hashed with PBKDF2, and sessions are stored via `express-session` + `memorystore`.
- Client state is managed in `AuthContext` with React Query cache invalidation.

## Data API summary
All endpoints require authentication unless noted:
- `GET /api/users` (admin only) → list users.
- `PATCH /api/users/:id` (admin only) → update approval/role metadata.
- `GET|POST|PATCH|DELETE /api/leads` → CRUD for leads including attachments (stored as data URLs).
- `GET|POST /api/lead-comments` → threaded lead comments with optional `leadId` query.
- `GET|POST /api/activity-logs` → history entries filtered by `leadId`.
- `GET|POST|PATCH /api/services` → service catalogue management.

## Frontend changes
- Firebase and local storage auth fallback removed.
- `useFirestore` now wraps REST endpoints with date-aware deserialisation.
- Lead files are stored inline as `{ id, name, dataUrl, uploadedAt }` objects; uploads use browser APIs.
- Admin approval panel pulls from the new user API.

## Testing
- Added Vitest coverage for password hashing utilities and storage layer.
- Removed obsolete Firebase/local-auth tests.
