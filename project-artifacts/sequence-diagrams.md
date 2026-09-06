# Mini Kanban Board — Sequence Diagrams

This document outlines the interaction between the Client, API, Database, and Real-time server (Socket.io) for major activities in the application.

## 1. User Registration & Login (Auth Flow)

This sequence covers a new user registering and immediately logging in to receive their JWT access and refresh tokens.

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
    Client->>User: Redirect to /projects/me
```

---

## 2. Project Creation & Member Invitation

This sequence outlines how a user creates a project (automatically becoming an Admin) and invites another registered user to collaborate.

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

    Admin->>Client: Add Alice to Board (Role: VIEWER, Title: "QA")
    Client->>API: POST /api/projects/../boards/../members { userId, role: "VIEWER", job_title: "QA" }
    API->>DB: Insert Board Member
    DB-->>API: Success
    API-->>Client: 201 Created

    Invitee->>Client: Log in
    Client->>API: GET /api/projects/me
    API->>DB: Fetch Project for User
    DB-->>API: "Marketing" Project
    API-->>Client: 200 OK
    Client->>Invitee: Show Project Dashboard
```

---

## 3. Real-time Task Movement (Drag & Drop)

This sequence demonstrates the optimistic UI update pattern and real-time Socket.io broadcasting when multiple users are viewing the same board.

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
    ClientA->>API: PATCH /api/projects/../tasks/X/move
    API->>DB: Update Task Column & Position
    API->>DB: Insert task_lifecycle_events (action: MOVED)
    DB-->>API: Success
    
    par Real-time Broadcast
        API->>SocketIO: Emit `task:moved` & `lifecycle:event`
        SocketIO-->>ClientB: Event: `task:moved`
        ClientB->>ClientB: Update UI (Task X moves to "Done")
        ClientB->>UserB: Sees task move in real-time
    and HTTP Response
        API-->>ClientA: 200 OK
        ClientA->>ClientA: Reconcile position with DB response
    end
```

---

## 4. Sub-task Management (Checklist)

This sequence demonstrates creating and completing a sub-task on a specific task card.

```mermaid
sequenceDiagram
    actor User
    participant Client
    participant API
    participant DB

    User->>Client: Click "Add Sub-task" on Task X
    Client->>API: POST /api/../tasks/X/subtasks { title: "Draft Copy" }
    API->>DB: Insert Sub-task (position: bottom)
    DB-->>API: Success
    API-->>Client: 201 Created
    Client->>User: UI displays new Sub-task

    User->>Client: Click Checkbox (Complete Sub-task)
    Client->>Client: Optimistic UI Update (Checkmark checked)
    Client->>API: PATCH /api/../subtasks/Y { is_completed: true }
    API->>DB: Update is_completed = true
    DB-->>API: Success
    API-->>Client: 200 OK
    Client->>Client: Confirm UI state
```

---

## 5. Task Creation, Pulling, & Handoff (Strict Ownership)

This sequence demonstrates how regular members (Viewers) interact with tasks under the strict ownership model.

```mermaid
sequenceDiagram
    actor Developer
    participant Client
    participant API
    participant DB
    actor QA_Tester

    note over Developer, DB: Scenario A: Creating a new task
    Developer->>Client: Create task "Fix Login Bug"
    Client->>API: POST /api/../tasks { title: "Fix Login Bug" }
    API->>DB: Insert Task
    API->>DB: Insert task_lifecycle_events (action: CREATED)
    API->>DB: Insert Task Assignee (UserId = Developer)
    DB-->>API: Success
    API-->>Client: 201 Created (Developer is auto-assigned)

    note over Developer, DB: Scenario B: Pulling unassigned work
    Developer->>Client: Click "Assign to me" on unassigned Task Y
    Client->>API: POST /api/../tasks/Y/assignees { userId: Developer }
    API->>DB: Insert Task Assignee
    DB-->>API: Success
    API-->>Client: 201 Created

    note over Developer, QA_Tester: Scenario C: Handoff from Dev to QA
    Developer->>Client: Assign "QA Tester" to Task Y
    Client->>API: POST /api/../tasks/Y/assignees { userId: QA_Tester }
    API->>DB: Insert Task Assignee
    DB-->>API: Success
    API-->>Client: 201 Created
    
    Developer->>Client: Remove self from Task Y
    Client->>API: DELETE /api/../tasks/Y/assignees/Developer
    API->>DB: Delete Task Assignee
    DB-->>API: Success
    API-->>Client: 204 No Content
    Client->>Developer: Task Y is now read-only for Developer
```
