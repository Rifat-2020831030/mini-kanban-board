# Mini Kanban Board — Sprint Implementation Plan

This document breaks down the implementation of the entire project into distinct modular sprints. This sprint plan is designed for parallel execution by autonomous agents.

## Dependency Matrix & Completion Tracker

Status key: ⏳ Pending, 🚧 In Progress, ✅ Completed

| Sprint | Phase Description | Dependencies | Status |
| :--- | :--- | :--- | :--- |
| **Sprint 1** | Foundation & Backend Setup | *None* | ⏳ |
| **Sprint 2** | Core Project & Board APIs | Sprint 1 | ⏳ |
| **Sprint 3** | Task APIs & Real-time Server | Sprint 2 | ⏳ |
| **Sprint 4** | Frontend Foundation & Tokens | *None (Run parallel to Backend)* | ⏳ |
| **Sprint 5** | Frontend Kanban Mechanics | Sprint 4, Sprint 2 | ⏳ |
| **Sprint 6** | Task Details & Polish | Sprint 5, Sprint 3 | ⏳ |

---

## Detailed Sprint Breakdown

### Sprint 1: Foundation & Backend Setup
* **1.1**: Initialize Express server, Prisma ORM, and local PostgreSQL Docker container.
* **1.2**: Define Database Schema (`schema.prisma`) according to `feature_spec.md` and run initial migrations.
* **1.3**: Setup Authentication controllers (Register, Login, JWT generation).
* **1.4**: Implement core middleware (Auth Guard, Error Handler, Zod request validation).

### Sprint 2: Core Project & Board APIs
* **2.1**: Implement Project CRUD & Project Member management APIs.
* **2.2**: Implement Board CRUD & Board Member management (Roles) APIs.
* **2.3**: Implement Column CRUD endpoints.
* **Goal**: A fully functioning backend for creating isolated project workspaces.

### Sprint 3: Task APIs & Real-time Server
* **3.1**: Implement Task CRUD and the complex Fractional Indexing movement logic.
* **3.2**: Implement Task Assignment logic (strict handoffs, auto-assignment).
* **3.3**: Implement Sub-task checklisting and Labels CRUD.
* **3.4**: Implement the Task Lifecycle History endpoint.
* **3.5**: Initialize Socket.io server and broadcast real-time events (`task:moved`, `lifecycle:event`) from the endpoints.

### Sprint 4: Frontend Foundation (Parallel Execution)
* **4.1**: Scaffold Next.js app, configure Tailwind v4, and integrate `shadcn/ui`.
* **4.2**: Implement the "High-Contrast Dark Mode" design tokens globally.
* **4.3**: Set up Zustand (client state) and TanStack Query (server state).
* **4.4**: Build the Authentication screens (Login/Register) and client-side router guards.

### Sprint 5: Frontend Kanban Mechanics
* **5.1**: Build Project & Board selection dashboard views.
* **5.2**: Build the core Kanban Board view with generic Columns.
* **5.3**: Integrate `dnd-kit` for Drag-and-Drop mechanics and Optimistic UI updates.
* **5.4**: Connect Socket.io client to listen for and react to real-time sync events.

### Sprint 6: Task Details & Polish
* **6.1**: Build the `TaskDetailDrawer` component.
* **6.2**: Implement inline editing for assignees, labels, and sub-tasks inside the drawer.
* **6.3**: Render the read-only Lifecycle History feed.
* **6.4**: Conduct end-to-end bug bash and polish micro-interactions (hover states, transitions).
