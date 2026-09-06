# Mini Kanban Board — Implementation Plan

## Decisions & Conventions

| Decision | Choice |
|---|---|
| Board role enum | `OWNER \| EDITOR \| MEMBER` (MEMBER = read-only with Task Assignee override) |
| Database setup | Docker Compose (PostgreSQL 16) |
| Real-time | Socket.io (alongside REST) |
| ORM | Prisma |
| Backend port | `4000` |
| Frontend | Next.js 16, Tailwind v4, shadcn/ui, TanStack Query v5, DnD Kit |

---

## Dependency Gantt Chart

```mermaid
gantt
    title Mini Kanban Board — Build Phases
    dateFormat X
    axisFormat Phase %s

    section Backend
    P1 Infrastructure (Docker, Prisma, env)     :p1, 0, 1
    P2 Core Utilities and Middleware             :p2, after p1, 1
    P3 Auth + User APIs                         :p3, after p2, 1
    P4 Project + Member APIs                    :p4, after p2, 1
    P5 Board + Board Member APIs                :p5, after p4, 1
    P6 Column APIs                              :p6, after p5, 1
    P7 Task CRUD + Move + Lifecycle             :p7, after p6, 1
    P8 Assignees + Labels + Subtasks            :p8, after p7, 1
    P9 Socket.io Broadcasting                   :p9, after p8, 1

    section Frontend
    P10 Setup (deps, design system, providers)  :p10, after p1, 1
    P11 Auth Pages (login, register)            :p11, after p10, 1
    P12 Board List + Project Dashboard          :p12, after p11, 1
    P13 Kanban Board View + DnD                 :p13, after p12, 1
    P14 Task Detail Modal                       :p14, after p13, 1
    P15 Socket.io Client Integration            :p15, after p9 p14, 1
```

> **Parallelization**: P3 and P4 run simultaneously (both only depend on P2). P10 (frontend setup) begins as soon as P1 is done, running fully in parallel with P3–P9.

---

## Phase 1 — Infrastructure & Foundation

*Prerequisite for everything. No parallelization.*

### `kanban-server/docker-compose.yml` [NEW]
PostgreSQL 16 with a named volume. Exposes `5432`. Creates database `kanban_db`.

### `kanban-server/package.json` [MODIFY]
**Runtime deps**: `zod`, `bcrypt`, `jsonwebtoken`, `cors`, `dotenv`, `socket.io`, `@prisma/client`
**Dev deps**: `prisma`, `ts-node`, `typescript`, `nodemon`, `@types/bcrypt`, `@types/cors`, `@types/express`, `@types/jsonwebtoken`, `@types/node`

### `kanban-server/.env` [NEW]
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kanban_db"
JWT_ACCESS_SECRET=<random_secret>
JWT_REFRESH_SECRET=<random_secret>
PORT=4000
CLIENT_URL=http://localhost:3000
```

### `kanban-server/prisma/schema.prisma` [NEW]
All 13 models matching the ER diagram. BoardMember role enum: `OWNER | EDITOR | MEMBER`.

### `kanban-server/src/db.ts` [NEW]
Prisma Client singleton.

---

## Phase 2 — Core Utilities & Middleware

*All backend phases depend on this.*

- `src/utils/hash.ts` — bcrypt hashPassword / verifyPassword
- `src/utils/jwt.ts` — generateAccessToken (15m), generateRefreshToken (7d), verify functions
- `src/utils/fractionalIndex.ts` — computePosition(before, after) midpoint for DnD ordering
- `src/middlewares/validateRequest.ts` — Zod schema validator factory
- `src/middlewares/authGuard.ts` — Bearer token verification, attaches `req.user`
- `src/middlewares/errorHandler.ts` — global error normalizer
- `src/middlewares/roleGuard.ts` — `requireProjectRole`, `requireBoardRole`, `requireTaskAccess`

---

## Phase 3 — Auth + User APIs

*Parallel with Phase 4.*

`POST /auth/register` · `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` · `GET /users/me`

---

## Phase 4 — Project + Member APIs

*Parallel with Phase 3.*

`POST /projects` · `GET /projects/me` · `PATCH /projects/:id`
`GET/POST/PATCH/DELETE /projects/:id/members[/:userId]`

---

## Phase 5 — Board + Board Member APIs

*After Phase 4.*

`POST/GET/PATCH/DELETE /projects/:pid/boards[/:bid]`
`POST /boards/:bid/owner`
`GET/POST/PATCH/DELETE /boards/:bid/members[/:uid]`

---

## Phase 6 — Column APIs

*After Phase 5.*

`POST/PATCH/DELETE /boards/:bid/columns[/:cid]`
`PATCH /columns/:cid/move` — fractional index

---

## Phase 7 — Task CRUD + Move + Lifecycle

*After Phase 6. Largest backend module.*

`POST/GET/PATCH/DELETE /boards/:bid/tasks[/:tid]`
`PATCH /tasks/:tid/move` — fractional index + MOVED lifecycle event
`GET /tasks/:tid/lifecycle`

Auto-assign MEMBER on task create. Block title edit for MEMBER assignees.

---

## Phase 8 — Assignees, Labels & Subtasks

*After Phase 7. All three built in parallel.*

**Assignees**: `POST/DELETE /tasks/:tid/assignees[/:uid]`
**Labels**: `GET/POST/PATCH/DELETE /boards/:bid/labels[/:lid]` + `POST/DELETE /tasks/:tid/labels[/:lid]`
**Subtasks**: `POST/PATCH/DELETE /tasks/:tid/subtasks[/:sid]`

---

## Phase 9 — Socket.io Real-time Broadcasting

*After Phase 8.*

Rooms: `board:<boardId>`. Events emitted after each DB write:
`task:created/updated/moved/deleted` · `column:created/renamed/moved/deleted`
`label:created/updated/deleted` · `subtask:created/updated/deleted` · `member:added/updated/removed`

---

## Phase 10 — Frontend Setup, Design System & Providers

*Starts after Phase 1. Fully parallel with backend.*

Install: `@tanstack/react-query`, `axios`, `socket.io-client`, `@dnd-kit/*`, `lucide-react`, Radix UI primitives.
Setup: CSS design tokens, api.ts axios client (with silent refresh interceptor), QueryClient, SocketProvider.

---

## Phase 11 — Auth Pages

`/login` · `/register` — controlled forms, Zod validation, token storage, redirect on success.

---

## Phase 12 — Board List + Dashboard

`/boards` — board grid with role badges, "New Board" modal (ADMIN only).

---

## Phase 13 — Kanban Board View + DnD

`/boards/[boardId]` — `DndContext` → sortable columns → sortable task cards.
Optimistic mutations for move. Task cards show priority, labels, subtask progress, assignee avatars.

---

## Phase 14 — Task Detail Modal

Radix Dialog: title, description, priority, due date, assignees, labels, subtask checklist, lifecycle history.
All actions via optimistic `useMutation`.

---

## Phase 15 — Socket.io Client Integration

Subscribe to board room events. Merge payloads into TanStack Query cache via `queryClient.setQueryData`.

---

## Commit Plan

```
chore(infra): add docker-compose, env, and prisma schema
feat(backend): add prisma db client and server entry point
feat(backend): add auth utilities (hash + jwt)
feat(backend): add middleware (validateRequest, authGuard, roleGuard, errorHandler)
feat(backend): implement auth endpoints
feat(backend): implement GET /users/me
feat(backend): implement project CRUD and member management
feat(backend): implement board CRUD and board member management
feat(backend): implement column CRUD with fractional indexing
feat(backend): implement task CRUD, move, and lifecycle events
feat(backend): implement task assignees API
feat(backend): implement label management API
feat(backend): implement subtask management API
feat(backend): integrate socket.io real-time broadcasting
feat(frontend): setup deps, design system, providers, and api client
feat(frontend): implement auth pages
feat(frontend): implement board list and project dashboard
feat(frontend): implement kanban board view with drag-and-drop
feat(frontend): implement task detail modal
feat(frontend): integrate socket.io real-time sync
```
