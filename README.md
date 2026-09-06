# Mini Kanban Board

A collaborative, real-time project management application built as a full-stack monorepo. Teams can organize work visually using boards, columns, and tasks, with changes instantly reflected across all connected clients via WebSockets.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Project Architecture](#project-architecture)
- [Project Artifacts](#project-artifacts)
- [Local Setup](#local-setup)

---

## Project Overview

### What It Does

The Mini Kanban Board allows teams to work together within a shared workspace (called a Project). Within a project, administrators can create multiple boards. Each board has columns representing workflow stages, and tasks that can be dragged between columns. All changes are broadcast in real time to every user currently viewing the same board.

### Key Features

- JWT-based authentication with refresh token rotation
- Project and board-level role-based access control (RBAC)
- Drag-and-drop for tasks and columns using fractional indexing for conflict-free ordering
- Real-time synchronization via Socket.io on named board channels
- Task detail including subtasks (checklist), labels, assignees, priority, and due date
- Task lifecycle event tracking (creation, column transitions, deletion)

### Role Hierarchy

The system enforces a two-level permission model:

**Project Level**

| Role   | Capabilities                                                                               |
| ------ | ------------------------------------------------------------------------------------------ |
| ADMIN  | Full project control. Manages members, creates boards, implicit full access to all boards. |
| MEMBER | No default board access. Must be explicitly invited to each board.                         |

**Board Level**

| Role   | Capabilities                                                               |
| ------ | -------------------------------------------------------------------------- |
| OWNER  | Full board control. Manages columns, tasks, members, and settings.         |
| EDITOR | Can create and edit tasks and labels. Cannot manage columns or members.    |
| MEMBER | Read-only access. Can edit and move tasks they are personally assigned to. |

---

## Project Architecture

### Technology Stack

**Backend (`kanban-server`)**

| Concern    | Technology                         |
| ---------- | ---------------------------------- |
| Runtime    | Node.js v24                        |
| Framework  | Express 5                          |
| Language   | TypeScript 7 (compiled with `tsx`) |
| Database   | PostgreSQL 16 (Docker)             |
| ORM        | Prisma 7                           |
| Real-time  | Socket.io 4                        |
| Auth       | JSON Web Tokens + bcrypt           |
| Validation | Zod 4                              |

**Frontend (`kanban-client`)**

| Concern       | Technology                         |
| ------------- | ---------------------------------- |
| Framework     | Next.js 16 (App Router, Turbopack) |
| Language      | TypeScript 5                       |
| Styling       | Tailwind CSS v4                    |
| Data Fetching | TanStack Query v5 + Axios          |
| Drag-and-Drop | dnd-kit                            |
| UI Primitives | Radix UI                           |
| Icons         | Lucide React                       |
| Real-time     | Socket.io Client 4                 |

### Repository Structure

```
mini-kanban-board/
├── kanban-server/          # Express API and Socket.io server
│   ├── docker-compose.yml  # PostgreSQL container
│   ├── prisma/
│   │   └── schema.prisma   # Database schema (13 models)
│   └── src/
│       ├── index.ts        # Server entry point
│       ├── socket.ts       # Socket.io initialization and event hub
│       ├── db.ts           # Prisma client singleton
│       ├── controllers/    # Route handler functions
│       ├── middlewares/    # Auth guard, role guard, error handler, validation
│       ├── routes/         # Express routers (one file per resource)
│       ├── services/       # Business logic
│       ├── models/         # Shared type models
│       └── utils/          # JWT helpers, token utilities
│
├── kanban-client/          # Next.js frontend
│   └── src/
│       ├── app/            # App Router pages and layouts
│       ├── components/     # React components organized by domain
│       ├── lib/            # Axios client, query helpers
│       ├── types/          # Shared TypeScript type definitions
│       └── hooks/          # Custom React hooks (socket, auth)
│
└── project-artifacts/      # Specification and design documents
```

### Database Schema

The database consists of 13 tables. The entity relationships are shown below.

```mermaid
erDiagram
    users ||--o{ projects : "creates"
    users ||--o{ project_members : "is member of"
    users ||--o{ board_members : "is member of"
    users ||--o{ refresh_tokens : "has"
    projects ||--o{ project_members : "has"
    projects ||--o{ boards : "contains"
    boards ||--o{ board_members : "has"
    boards ||--o{ columns : "has"
    boards ||--o{ labels : "has"
    columns ||--o{ tasks : "contains"
    tasks ||--o{ task_assignees : "assigned to"
    users ||--o{ task_assignees : "is assigned"
    tasks ||--o{ task_labels : "tagged with"
    tasks ||--o{ subtasks : "contains"
    labels ||--o{ task_labels : "tags"
    tasks ||--o{ task_lifecycle_events : "tracks lifecycle of"
    users ||--o{ task_lifecycle_events : "performed by"
    columns ||--o{ task_lifecycle_events : "from/to"

    users {
        UUID id PK
        VARCHAR username
        VARCHAR email
        VARCHAR password_hash
    }

    refresh_tokens {
        UUID id PK
        UUID user_id FK
        VARCHAR token_hash
        TIMESTAMPTZ expires_at
    }

    projects {
        UUID id PK
        VARCHAR name
        TEXT description
        UUID created_by FK
        BOOLEAN is_archived
    }

    project_members {
        UUID id PK
        UUID project_id FK
        UUID user_id FK
        ENUM role "ADMIN | MEMBER"
    }

    boards {
        UUID id PK
        UUID project_id FK
        VARCHAR name
        TEXT description
        UUID created_by FK
        TIMESTAMPTZ deleted_at
    }

    board_members {
        UUID id PK
        UUID board_id FK
        UUID user_id FK
        ENUM role "OWNER | EDITOR | MEMBER"
        VARCHAR job_title
    }

    columns {
        UUID id PK
        UUID board_id FK
        VARCHAR name
        DECIMAL position
        TIMESTAMPTZ deleted_at
    }

    labels {
        UUID id PK
        UUID board_id FK
        VARCHAR name
        VARCHAR color
    }

    tasks {
        UUID id PK
        UUID column_id FK
        UUID board_id FK
        UUID project_id FK
        UUID created_by FK
        VARCHAR title
        TEXT description
        TIMESTAMPTZ due_date
        ENUM priority "NONE | LOW | MEDIUM | HIGH"
        DECIMAL position
        TIMESTAMPTZ deleted_at
    }

    task_assignees {
        UUID task_id PK,FK
        UUID user_id PK,FK
        UUID assigned_by FK
    }

    task_labels {
        UUID task_id PK,FK
        UUID label_id PK,FK
    }

    subtasks {
        UUID id PK
        UUID task_id FK
        VARCHAR title
        BOOLEAN is_completed
        DECIMAL position
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    task_lifecycle_events {
        UUID id PK
        UUID task_id FK
        UUID user_id FK
        VARCHAR action_type
        UUID from_column_id FK
        UUID to_column_id FK
        TIMESTAMPTZ created_at
    }
```

### API Design

The REST API is mounted at `/api` and follows resource-oriented URL patterns:

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
DELETE /api/auth/logout

GET    /api/users/me
PATCH  /api/users/me

POST   /api/projects
GET    /api/projects/me
PATCH  /api/projects/:projectId
GET    /api/projects/:projectId/members
POST   /api/projects/:projectId/members
PATCH  /api/projects/:projectId/members/:memberId
DELETE /api/projects/:projectId/members/:memberId

GET    /api/boards?projectId=
POST   /api/boards
GET    /api/boards/:boardId
PATCH  /api/boards/:boardId
DELETE /api/boards/:boardId
GET    /api/boards/:boardId/members
POST   /api/boards/:boardId/members
PATCH  /api/boards/:boardId/members/:memberId
DELETE /api/boards/:boardId/members/:memberId

GET    /api/boards/:boardId/columns
POST   /api/boards/:boardId/columns
PATCH  /api/boards/:boardId/columns/:columnId
DELETE /api/boards/:boardId/columns/:columnId

GET    /api/boards/:boardId/tasks
POST   /api/boards/:boardId/tasks
GET    /api/boards/:boardId/tasks/:taskId
PATCH  /api/boards/:boardId/tasks/:taskId
DELETE /api/boards/:boardId/tasks/:taskId
GET    /api/boards/:boardId/tasks/:taskId/assignees
POST   /api/boards/:boardId/tasks/:taskId/assignees
DELETE /api/boards/:boardId/tasks/:taskId/assignees/:userId
GET    /api/boards/:boardId/labels
POST   /api/boards/:boardId/labels
PATCH  /api/boards/:boardId/labels/:labelId
DELETE /api/boards/:boardId/labels/:labelId
POST   /api/boards/:boardId/tasks/:taskId/labels
DELETE /api/boards/:boardId/tasks/:taskId/labels/:labelId
GET    /api/boards/:boardId/tasks/:taskId/subtasks
POST   /api/boards/:boardId/tasks/:taskId/subtasks
PATCH  /api/boards/:boardId/tasks/:taskId/subtasks/:subtaskId
DELETE /api/boards/:boardId/tasks/:taskId/subtasks/:subtaskId
```

### Sequence Diagrams

The following diagrams illustrate the key interaction flows between the client, API, database, and Socket.io server.

#### 1. User Registration and Login

```mermaid
sequenceDiagram
    actor User
    participant Client
    participant API
    participant DB

    User->>Client: Enter Registration Details
    Client->>API: POST /api/auth/register
    API->>DB: Check email/username uniqueness
    DB-->>API: OK (Not found)
    API->>DB: Insert User (hash password)
    DB-->>API: Created
    API-->>Client: 201 Created

    User->>Client: Enter Login Details
    Client->>API: POST /api/auth/login
    API->>DB: Fetch user by email
    DB-->>API: User Record
    API->>API: Verify Password
    API->>DB: Generate & Store Refresh Token
    API-->>Client: 200 OK (AccessToken + RefreshToken)
    Client->>Client: Store tokens in local storage
    Client->>User: Redirect to /boards
```

#### 2. Project Creation and Member Invitation

```mermaid
sequenceDiagram
    actor Admin
    participant Client
    participant API
    participant DB
    actor Invitee

    Admin->>Client: Create Project "Marketing"
    Client->>API: POST /api/projects
    API->>DB: Insert Project
    API->>DB: Insert Project Member (role: ADMIN)
    DB-->>API: Success
    API-->>Client: 201 Created

    Admin->>Client: Invite "alice@example.com" to Project
    Client->>API: POST /api/projects/:id/members
    API->>DB: Find User by Email
    DB-->>API: User (Alice)
    API->>DB: Insert Project Member (role: MEMBER)
    DB-->>API: Success
    API-->>Client: 201 Created

    Invitee->>Client: Log in
    Client->>API: GET /api/projects/me
    API->>DB: Fetch Project for User
    DB-->>API: "Marketing" Project
    API-->>Client: 200 OK
    Client->>Invitee: Show Project Dashboard
```

#### 3. Real-time Task Movement (Drag and Drop)

```mermaid
sequenceDiagram
    actor UserA
    participant ClientA
    participant API
    participant DB
    participant SocketIO
    participant ClientB
    actor UserB

    ClientA->>SocketIO: Connect & Join `board:123`
    ClientB->>SocketIO: Connect & Join `board:123`

    UserA->>ClientA: Drag Task X to "Done" Column
    ClientA->>ClientA: Optimistic UI Update (Task in "Done")
    ClientA->>API: PATCH /api/boards/.../tasks/X
    API->>DB: Update Task Column & Position
    API->>DB: Insert task_lifecycle_events (action: MOVED)
    DB-->>API: Success

    par Real-time Broadcast
        API->>SocketIO: Emit `task:updated`
        SocketIO-->>ClientB: Event: `task:updated`
        ClientB->>ClientB: Update UI (Task X moves to "Done")
        ClientB->>UserB: Sees task move in real-time
    and HTTP Response
        API-->>ClientA: 200 OK
        ClientA->>ClientA: Reconcile position with DB response
    end
```

#### 4. Sub-task Management

```mermaid
sequenceDiagram
    actor User
    participant Client
    participant API
    participant DB

    User->>Client: Click "Add Sub-task" on Task X
    Client->>API: POST /api/.../tasks/X/subtasks { title: "Draft Copy" }
    API->>DB: Insert Sub-task (position: bottom)
    DB-->>API: Success
    API-->>Client: 201 Created
    Client->>User: UI displays new Sub-task

    User->>Client: Click Checkbox (Complete Sub-task)
    Client->>Client: Optimistic UI Update (Checkmark checked)
    Client->>API: PATCH /api/.../subtasks/Y { is_completed: true }
    API->>DB: Update is_completed = true
    DB-->>API: Success
    API-->>Client: 200 OK
    Client->>Client: Confirm UI state
```

#### 5. Task Ownership and Handoff

```mermaid
sequenceDiagram
    actor Developer
    participant Client
    participant API
    participant DB
    actor QA_Tester

    note over Developer, DB: Scenario A: Creating a new task
    Developer->>Client: Create task "Fix Login Bug"
    Client->>API: POST /api/.../tasks { title: "Fix Login Bug" }
    API->>DB: Insert Task
    API->>DB: Insert task_lifecycle_events (action: CREATED)
    API->>DB: Insert Task Assignee (UserId = Developer)
    DB-->>API: Success
    API-->>Client: 201 Created (Developer is auto-assigned)

    note over Developer, QA_Tester: Scenario B: Handoff from Dev to QA
    Developer->>Client: Assign "QA Tester" to Task Y
    Client->>API: POST /api/.../tasks/Y/assignees { userId: QA_Tester }
    API->>DB: Insert Task Assignee
    DB-->>API: Success
    API-->>Client: 201 Created

    Developer->>Client: Remove self from Task Y
    Client->>API: DELETE /api/.../tasks/Y/assignees/Developer
    API->>DB: Delete Task Assignee
    DB-->>API: Success
    API-->>Client: 204 No Content
    Client->>Developer: Task Y is now read-only for Developer
```

---

## Project Artifacts

All specification documents are located in the [`project-artifacts/`](./project-artifacts) directory.

| Document                                                           | Description                                                                        |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| [`feature-spec.md`](./project-artifacts/feature-spec.md)           | Software Requirements Specification with all functional requirements and use cases |
| [`api-spec.md`](./project-artifacts/api-spec.md)                   | Complete REST API endpoint contracts with request and response shapes              |
| [`er-diagram.md`](./project-artifacts/er-diagram.md)               | PostgreSQL entity-relationship diagram for all 13 tables                           |
| [`sequence-diagrams.md`](./project-artifacts/sequence-diagrams.md) | Interaction flow diagrams for major operations                                     |
| [`design-system.md`](./project-artifacts/design-system.md)         | UI design tokens, color palette, typography, and component conventions             |

---

## Local Setup

### Prerequisites

Ensure the following are installed before proceeding:

- Node.js >= 20
- npm >= 10
- Docker Desktop (for running PostgreSQL)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mini-kanban-board
```

### 2. Start the Database

The database runs inside Docker. Start it from the `kanban-server` directory:

```bash
cd kanban-server
docker compose up -d
```

This starts a PostgreSQL 16 container on port `5433` with the database `kanban_db`.

### 3. Configure the Backend Environment

Create a `.env` file inside `kanban-server/`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/kanban_db"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_REFRESH_SECRET="replace-with-a-different-long-random-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=4000
CLIENT_URL="http://localhost:3000"
```

### 4. Install Backend Dependencies and Apply the Schema

```bash
# Inside kanban-server/
npm install
npx prisma db push
```

`prisma db push` applies the schema directly to the database without creating migration files.

### 5. Start the Backend Server

```bash
# Inside kanban-server/
npm run dev
```

The API server starts at `http://localhost:4000`. You should see:

```
Server listening on port 4000
```

### 6. Configure the Frontend Environment

Create a `.env.local` file inside `kanban-client/`:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
NEXT_PUBLIC_SOCKET_URL="http://localhost:4000"
```

### 7. Install Frontend Dependencies and Start the Dev Server

```bash
cd ../kanban-client
npm install
npm run dev
```

The Next.js application starts at `http://localhost:3000`.

### 8. Verify the Setup

Open `http://localhost:3000` in your browser. You should be redirected to the login page. Register a new account to begin using the application.

To verify the API is healthy independently:

```bash
curl http://localhost:4000/api/health
# {"status":"ok"}
```
