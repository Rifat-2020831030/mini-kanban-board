# Mini Kanban Board — API Specification

**Base URL**: `http://localhost:4000/api`

**Response Envelope**
Success: `{ "<resource>": {...} }` or `{ "<resource>s": [...] }`
Error:
```json
{
  "error": {
    "code": "SNAKE_CASE_ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### Global Note on Pagination
For the initial "mini" scope of this Kanban board, **there is no pagination** on list endpoints (boards, members, tasks, activities). All GET collection endpoints return the full dataset as an unpaginated array.

---

## Role & Access Control Summary

### Definitions
| Role | Scope | Description |
|---|---|---|
| **Project Admin** | Project | Manages project members. Implicit OWNER on all boards. |
| **Board OWNER** | Board | Has **Column-level permission**. Can manage columns, board members, and all tasks. |
| **Board EDITOR** | Board | Has **Task-level permission**. Can create, edit, move, delete, and assign ANY task on the board. Cannot manage columns or board members. |
| **Board MEMBER** | Board | Read-only access to all tasks. Can assign a task to **themselves**. Once assigned to a task, they gain permission to edit details, labels, subtasks, and move that specific task (but cannot edit the title or delete the task). |

### Permission Matrix
| Action | Project Admin / Board OWNER | Board EDITOR | Board MEMBER |
|---|---|---|---|
| **Board & Members** | | | |
| Update board name/desc | ✅ | ❌ | ❌ |
| Delete board | ✅ | ❌ | ❌ |
| Add/Remove board member | ✅ | ❌ | ❌ |
| Change member role | ✅ | ❌ | ❌ |
| **Columns (Column-level permission)** | | | |
| Create column | ✅ | ❌ | ❌ |
| Rename column | ✅ | ❌ | ❌ |
| Reorder column | ✅ | ❌ | ❌ |
| Delete column | ✅ | ❌ | ❌ |
| **Tasks (Task-level permission)** | | | |
| Create task | ✅ | ✅ | ✅ (Auto-assigned) |
| View task detail | ✅ | ✅ | ✅ |
| Edit ANY task title | ✅ | ✅ | ❌ |
| Edit ANY task details | ✅ | ✅ | ❌ |
| Move ANY task | ✅ | ✅ | ❌ |
| Delete ANY task | ✅ | ✅ | ❌ |
| **Task Assignment & Member Powers** | | | |
| Assign task to ANYONE | ✅ | ✅ | ❌ |
| Assign task to SELF | ✅ | ✅ | ✅ |
| Edit details of SELF-ASSIGNED task | ✅ | ✅ | ✅ |
| Move SELF-ASSIGNED task | ✅ | ✅ | ✅ |
| Edit title of SELF-ASSIGNED task | ✅ | ✅ | ❌ |
| Delete SELF-ASSIGNED task | ✅ | ✅ | ❌ |
| **Sub-tasks & Labels** | | | |
| Manage labels | ✅ | ✅ | ❌ (Can only add to self-assigned tasks) |
| Manage sub-tasks | ✅ | ✅ | ❌ (Can only manage on self-assigned tasks) |

---

## 1. Authentication & Session Management

### POST `/api/auth/register` (Public)
Registers a new user account.
- **Request**: `{ "username": "string", "email": "string", "password": "string" }`
- **Response 201**: `{ "user": { "id", "username", "email", "created_at" } }`
- **Errors**: `409 EMAIL_TAKEN`, `409 USERNAME_TAKEN`

### POST `/api/auth/login` (Public)
Authenticates a user and provides access and refresh tokens.
- **Request**: `{ "email": "string", "password": "string" }`
- **Response 200**: `{ "accessToken": "string", "refreshToken": "string", "user": { ... } }`
- **Errors**: `401 INVALID_CREDENTIALS`

### POST `/api/auth/refresh` (Public)
Refreshes access tokens using a valid refresh token.
- **Request**: `{ "refreshToken": "string" }`
- **Response 200**: `{ "accessToken": "string", "refreshToken": "string" }`
- **Errors**: `401 INVALID_REFRESH_TOKEN`, `401 TOKEN_EXPIRED`

### POST `/api/auth/logout` (Authenticated)
Revokes a refresh token.
- **Request**: `{ "refreshToken": "string" }`
- **Response 204**

### GET `/api/users/me`
Retrieves the currently authenticated user's profile.
- **Request**: `Authorization: Bearer <AccessToken>`
- **Response 200**: `{ "id", "username", "email", "created_at" }`

---

## 2. Project Management

### POST `/api/projects` (Authenticated)
Creates a new project. User must not already be in a project.
- **Request**: `{ "name": "string", "description": "string | null" }`
- **Response 201**: `{ "project": { ... } }`
- **Errors**: `409 ALREADY_IN_PROJECT`

### GET `/api/projects/me` (Authenticated)
Returns the project the user belongs to.
- **Response 200**: `{ "project": { ... } }`
- **Errors**: `404 NOT_IN_PROJECT`

### PATCH `/api/projects/:projectId` (Project Admin only)
Updates a project.
- **Request**: `{ "name": "string", "description": "string | null" }`
- **Response 200**: `{ "project": { ... } }`

---

## 3. Project Member Management

### GET `/api/projects/:projectId/members` (Project Member)
Lists all members in a project.
- **Response 200**: `{ "members": [ { ... } ] }`

### POST `/api/projects/:projectId/members` (Project Admin only)
Invites an existing user to the project.
- **Request**: `{ "identifier": "string (email or username)", "role": "ADMIN | MEMBER" }`
- **Response 201**: `{ "member": { ... } }`
- **Errors**: `404 USER_NOT_FOUND`, `409 USER_ALREADY_IN_PROJECT`, `409 ALREADY_MEMBER`, `400 CANNOT_INVITE_SELF`

### PATCH `/api/projects/:projectId/members/:userId` (Project Admin only)
Changes a project member's role.
- **Request**: `{ "role": "ADMIN | MEMBER" }`
- **Response 200**: `{ "member": { "id", "role" } }`
- **Errors**: `400 CANNOT_MODIFY_SELF`

### DELETE `/api/projects/:projectId/members/:userId` (Project Admin only)
Removes a member from the project entirely (revokes board access).
- **Response 204**
- **Errors**: `400 CANNOT_REMOVE_SELF`

---

## 4. Board Management

### POST `/api/projects/:projectId/boards` (Project Admin only)
Creates a new board within a project.
- **Request**: `{ "name": "string", "description": "string | null" }`
- **Response 201**: `{ "board": { ... } }`

### POST `/api/projects/:projectId/boards/:boardId/owner` (Project Admin only)
Assigns a board owner from the project members.
- **Request**: `{ "userId": "uuid" }`
- **Response 200**: `{ "board_member": { "id", "role": "OWNER" } }`
- **Errors**: `400 NOT_A_PROJECT_MEMBER`

### GET `/api/projects/:projectId/boards` (Project Member)
Returns all boards in a project.
- **Response 200**: `{ "boards": [ { "id", "name", "my_board_role", ... } ] }`

### GET `/api/projects/:projectId/boards/:boardId` (Board Member or Project Admin)
Gets the full board payload including columns, tasks, labels, and members.
- **Response 200**: `{ "board": { "id", "name", "columns": [...], "labels": [...], "members": [...] } }`

### PATCH `/api/projects/:projectId/boards/:boardId` (Project Admin or Board OWNER)
Updates board details.
- **Request**: `{ "name": "string", "description": "string | null" }`
- **Response 200**: `{ "board": { ... } }`

### DELETE `/api/projects/:projectId/boards/:boardId` (Project Admin or Board OWNER)
Soft-deletes a board and all its nested columns and tasks.
- **Response 204**

---

## 5. Board Member Management

### GET `/api/projects/:projectId/boards/:boardId/members` (Board Member or Admin)
Lists members of a specific board.
- **Response 200**: `{ "members": [ { ... } ] }`

### POST `/api/projects/:projectId/boards/:boardId/members` (Project Admin or OWNER)
Adds a project member to a board.
- **Request**: `{ "userId": "uuid", "role": "OWNER | EDITOR | VIEWER", "job_title": "string | null" }`
- **Response 201**: `{ "member": { ... } }`
- **Errors**: `400 NOT_A_PROJECT_MEMBER`, `409 ALREADY_MEMBER`

### PATCH `/api/projects/:projectId/boards/:boardId/members/:userId` (Project Admin or OWNER)
Updates a board member's role or job title.
- **Request**: `{ "role": "OWNER | EDITOR | VIEWER", "job_title": "string | null" }`
- **Response 200**: `{ "member": { ... } }`
- **Errors**: `400 CANNOT_MODIFY_SELF`

### DELETE `/api/projects/:projectId/boards/:boardId/members/:userId` (Project Admin or OWNER)
Removes a member from a board.
- **Response 204**
- **Errors**: `400 CANNOT_REMOVE_SELF`, `400 CANNOT_MODIFY_OWNER`

---

## 6. Column Management

### POST `/api/projects/:projectId/boards/:boardId/columns` (Admin or OWNER)
Creates a new column at the end of the board.
- **Request**: `{ "name": "string" }`
- **Response 201**: `{ "column": { ... } }`

### PATCH `/api/projects/:projectId/boards/:boardId/columns/:columnId` (Admin or OWNER)
Renames a column.
- **Request**: `{ "name": "string" }`
- **Response 200**: `{ "column": { ... } }`

### PATCH `/api/projects/:projectId/boards/:boardId/columns/:columnId/move` (Admin or OWNER)
Reorders a column via fractional indexing.
- **Request**: `{ "afterColumnId": "uuid | null" }`
- **Response 200**: `{ "column": { "id", "position" } }`

### DELETE `/api/projects/:projectId/boards/:boardId/columns/:columnId` (Admin or OWNER)
Soft-deletes a column and all tasks inside it.
- **Response 204**

---

## 7. Task Management

### POST `/api/projects/:projectId/boards/:boardId/tasks` (Any Board Member)
Creates a task in a column. If created by a VIEWER, they are automatically assigned to it.
- **Request**: `{ "columnId": "uuid", "title": "string", "description": "string | null", "due_date": "string | null", "priority": "NONE|LOW|MEDIUM|HIGH" }`
- **Response 201**: `{ "task": { ... } }`
- **Errors**: `404 COLUMN_NOT_FOUND`

### GET `/api/projects/:projectId/boards/:boardId/tasks/:taskId` (Board Member or Admin)
Gets task details.
- **Response 200**: `{ "task": { ... } }`

### PATCH `/api/projects/:projectId/boards/:boardId/tasks/:taskId` (Admin, OWNER, EDITOR, Assignee)
Updates task fields.
- **Request**: `{ "title": "string", "description": "string", "due_date": "string", "priority": "string" }`
- **Response 200**: `{ "task": { ... } }`
- **Errors**: `403 FORBIDDEN` (if an Assignee attempts to edit the title)

### PATCH `/api/projects/:projectId/boards/:boardId/tasks/:taskId/move` (Admin, OWNER, EDITOR, Assignee)
Moves a task within or across columns on the same board.
- **Request**: `{ "columnId": "uuid", "afterTaskId": "uuid | null" }`
- **Response 200**: `{ "task": { "id", "column_id", "position" } }`
- **Errors**: `400 CROSS_BOARD_MOVE_NOT_ALLOWED`

### DELETE `/api/projects/:projectId/boards/:boardId/tasks/:taskId` (Admin, OWNER, EDITOR)
Soft-deletes a task.
- **Response 204**

### GET `/api/projects/:projectId/boards/:boardId/tasks/:taskId/lifecycle` (Board Member or Admin)
Returns the lifecycle events (creation, movement, deletion) for a task to support performance history tracking.
- **Response 200**: `{ "events": [ { "id", "action_type", "from_column_id", "to_column_id", "created_at", "user": {...} } ] }`

---

## 8. Task Assignment

### POST `/api/projects/:projectId/boards/:boardId/tasks/:taskId/assignees` (Admin, OWNER, Assignee, or VIEWER pulling unassigned task)
Assigns a board member to a task.
- **Request**: `{ "userId": "uuid" }`
- **Response 201**: `{ "assignee": { ... } }`
- **Errors**: `400 NOT_A_BOARD_MEMBER`, `409 ALREADY_ASSIGNED`

### DELETE `/api/projects/:projectId/boards/:boardId/tasks/:taskId/assignees/:userId` (Admin, OWNER, Assignee)
Removes an assignee.
- **Response 204**

---

## 9. Label Management

### GET `/api/projects/:projectId/boards/:boardId/labels` (Board Member or Admin)
Lists all labels for a board.
- **Response 200**: `{ "labels": [ { "id", "name", "color" } ] }`

### POST `/api/projects/:projectId/boards/:boardId/labels` (Admin, OWNER, EDITOR)
Creates a label. Name must be unique on the board.
- **Request**: `{ "name": "string", "color": "string (#RRGGBB)" }`
- **Response 201**: `{ "label": { ... } }`
- **Errors**: `409 LABEL_NAME_TAKEN`

### PATCH `/api/projects/:projectId/boards/:boardId/labels/:labelId` (Admin, OWNER, EDITOR)
Updates a label.
- **Request**: `{ "name": "string", "color": "string" }`
- **Response 200**: `{ "label": { ... } }`
- **Errors**: `409 LABEL_NAME_TAKEN`

### DELETE `/api/projects/:projectId/boards/:boardId/labels/:labelId` (Admin, OWNER, EDITOR)
Deletes a label.
- **Response 204**
- **Errors**: `409 LABEL_IN_USE` (cannot delete if tagged on tasks)

### POST `/api/projects/:projectId/boards/:boardId/tasks/:taskId/labels` (Admin, OWNER, EDITOR, Assignee)
Tags a task with a label.
- **Request**: `{ "labelId": "uuid" }`
- **Response 201**
- **Errors**: `400 LABEL_WRONG_BOARD`, `409 LABEL_ALREADY_ON_TASK`

### DELETE `/api/projects/:projectId/boards/:boardId/tasks/:taskId/labels/:labelId` (Admin, OWNER, EDITOR, Assignee)
Removes a label from a task.
- **Response 204**

---

## 10. Sub-task Management

### POST `/api/projects/:projectId/boards/:boardId/tasks/:taskId/subtasks` (Admin, OWNER, EDITOR, Assignee)
Creates a new sub-task at the bottom of the checklist.
- **Request**: `{ "title": "string" }`
- **Response 201**: `{ "subtask": { ... } }`

### PATCH `/api/projects/:projectId/boards/:boardId/tasks/:taskId/subtasks/:subtaskId` (Admin, OWNER, EDITOR, Assignee)
Updates a sub-task (toggle completion, rename, or reorder).
- **Request**: `{ "title": "string", "is_completed": "boolean", "afterSubtaskId": "uuid | null" }`
- **Response 200**: `{ "subtask": { ... } }`

### DELETE `/api/projects/:projectId/boards/:boardId/tasks/:taskId/subtasks/:subtaskId` (Admin, OWNER, EDITOR, Assignee)
Deletes a sub-task.
- **Response 204**
