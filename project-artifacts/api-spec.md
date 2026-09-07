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
| **Project Admin** | Project | Project Creator/Admin. Manages project settings (`/project-settings`) & appoints Board Owners. Implicit OWNER on all boards. |
| **Board OWNER** | Board | **Project Manager (PM) Role**. Full control over specific board workflow: manages columns, board settings, board members, roles, job titles, and tasks. |
| **Board EDITOR** | Board | **Task-level permission**. Can create, edit, move, delete, and assign ANY task on the board, and manage labels. Cannot manage columns, board settings, or board members. |
| **Board MEMBER** | Board | Read-only access to all tasks. Can assign a task to **themselves**. Once assigned to a task, they gain permission to edit details, labels, subtasks, and move that specific task. |

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
Updates project name and description.
- **Request**: `{ "name": "string", "description": "string | null" }`
- **Response 200**: `{ "project": { ... } }`

---

## 3. Project Member & Admin Management

### GET `/api/projects/:projectId/members` (Project Member or Admin)
Lists all members/admins in a project.
- **Response 200**: `{ "members": [ { ... } ] }`

### POST `/api/projects/:projectId/members` (Project Admin only)
Invites/adds an existing user as a Project Admin/Owner.
- **Request**: `{ "identifier": "string (email or username)", "role": "ADMIN" }`
- **Response 201**: `{ "member": { ... } }`
- **Errors**: `404 USER_NOT_FOUND`, `409 ALREADY_MEMBER`

### DELETE `/api/projects/:projectId/members/:userId` (Project Admin only)
Removes a project admin from the project.
- **Response 204**
- **Errors**: `400 CANNOT_REMOVE_SELF`

---

## 4. Board Management

### POST `/api/projects/:projectId/boards` (Project Admin only)
Creates a new board within a project and optionally assigns an initial Board Owner.
- **Request**: `{ "name": "string", "description": "string | null", "ownerId": "uuid | null" }`
- **Response 201**: `{ "board": { ... } }`

### GET `/api/projects/:projectId/boards` (Project Member or Board Member)
Returns all boards for the project.
- **Response 200**: `{ "boards": [ { "id", "name", "my_board_role", ... } ] }`

### GET `/api/boards/:boardId` (Board Member or Project Admin)
Gets the full board payload including columns, tasks, labels, and board members.
- **Response 200**: `{ "board": { "id", "name", "columns": [...], "labels": [...], "members": [...] } }`

### PATCH `/api/boards/:boardId` (Project Admin or Board OWNER)
Updates board name and description.
- **Request**: `{ "name": "string", "description": "string | null" }`
- **Response 200**: `{ "board": { ... } }`

### DELETE `/api/boards/:boardId` (Project Admin or Board OWNER)
Soft-deletes a board and all its nested columns and tasks.
- **Response 204**

---

## 5. Board Member Management (PM Board Control)

### GET `/api/boards/:boardId/members` (Board Member or Admin)
Lists members of a specific board.
- **Response 200**: `{ "members": [ { "id", "user_id", "role", "job_title", "user": {...} } ] }`

### POST `/api/boards/:boardId/members` (Project Admin or Board OWNER)
Adds a registered user directly to a board (PM role adding team members).
- **Request**: `{ "userId": "uuid" OR "email": "string", "role": "OWNER | EDITOR | MEMBER", "job_title": "string | null" }`
- **Response 201**: `{ "member": { ... } }`
- **Errors**: `404 USER_NOT_FOUND`, `409 ALREADY_MEMBER`

### PATCH `/api/boards/:boardId/members/:memberId` (Project Admin or Board OWNER)
Updates a board member's role or job title.
- **Request**: `{ "role": "OWNER | EDITOR | MEMBER", "job_title": "string | null" }`
- **Response 200**: `{ "member": { ... } }`

### DELETE `/api/boards/:boardId/members/:memberId` (Project Admin or Board OWNER)
Removes a member from the board.
- **Response 204**

---

## 6. Column Management

### POST `/api/boards/:boardId/columns` (Admin or OWNER)
Creates a new column at the end of the board.
- **Request**: `{ "name": "string" }`
- **Response 201**: `{ "column": { ... } }`

### PATCH `/api/boards/:boardId/columns/:columnId` (Admin or OWNER)
Renames a column.
- **Request**: `{ "name": "string" }`
- **Response 200**: `{ "column": { ... } }`

### PATCH `/api/boards/:boardId/columns/:columnId/move` (Admin or OWNER)
Reorders a column via fractional indexing.
- **Request**: `{ "afterColumnId": "uuid | null" }`
- **Response 200**: `{ "column": { "id", "position" } }`

### DELETE `/api/boards/:boardId/columns/:columnId` (Admin or OWNER)
Soft-deletes a column and all tasks inside it.
- **Response 204**

---

## 7. Task Management

### POST `/api/boards/:boardId/tasks` (Any Board Member)
Creates a task in a column.
- **Request**: `{ "columnId": "uuid", "title": "string", "description": "string | null", "due_date": "string | null", "priority": "NONE|LOW|MEDIUM|HIGH" }`
- **Response 201**: `{ "task": { ... } }`

### GET `/api/boards/:boardId/tasks/:taskId` (Board Member or Admin)
Gets task details.
- **Response 200**: `{ "task": { ... } }`

### PATCH `/api/boards/:boardId/tasks/:taskId` (Admin, OWNER, EDITOR, Assignee)
Updates task fields.
- **Request**: `{ "title": "string", "description": "string", "due_date": "string", "priority": "string" }`
- **Response 200**: `{ "task": { ... } }`

### PATCH `/api/boards/:boardId/tasks/:taskId/move` (Admin, OWNER, EDITOR, Assignee)
Moves a task within or across columns on the same board.
- **Request**: `{ "columnId": "uuid", "afterTaskId": "uuid | null" }`
- **Response 200**: `{ "task": { "id", "column_id", "position" } }`

### DELETE `/api/boards/:boardId/tasks/:taskId` (Admin, OWNER, EDITOR)
Soft-deletes a task.
- **Response 204**

---

## 8. Task Assignment

### POST `/api/boards/:boardId/tasks/:taskId/assignees` (Admin, OWNER, EDITOR, or Assignee)
Assigns a board member to a task.
- **Request**: `{ "userId": "uuid" }`
- **Response 201**: `{ "assignee": { ... } }`
- **Errors**: `400 BAD_REQUEST`, `409 ALREADY_ASSIGNED`

### DELETE `/api/boards/:boardId/tasks/:taskId/assignees/:userId` (Admin, OWNER, EDITOR, Assignee)
Removes an assignee.
- **Response 204**

---

## 9. Label Management

### GET `/api/boards/:boardId/labels` (Board Member or Admin)
Lists all labels for a board.
- **Response 200**: `{ "labels": [ { "id", "name", "color" } ] }`

### POST `/api/boards/:boardId/labels` (Admin, OWNER, EDITOR)
Creates a label.
- **Request**: `{ "name": "string", "color": "string (#RRGGBB)" }`
- **Response 201**: `{ "label": { ... } }`

### PATCH `/api/boards/:boardId/labels/:labelId` (Admin, OWNER, EDITOR)
Updates a label.
- **Request**: `{ "name": "string", "color": "string" }`
- **Response 200**: `{ "label": { ... } }`

### DELETE `/api/boards/:boardId/labels/:labelId` (Admin, OWNER, EDITOR)
Deletes a label.
- **Response 204**

---

## 10. Sub-task Management

### POST `/api/boards/:boardId/tasks/:taskId/subtasks` (Admin, OWNER, EDITOR, Assignee)
Creates a new sub-task at the bottom of the checklist.
- **Request**: `{ "title": "string" }`
- **Response 201**: `{ "subtask": { ... } }`

### PATCH `/api/boards/:boardId/tasks/:taskId/subtasks/:subtaskId` (Admin, OWNER, EDITOR, Assignee)
Updates a sub-task.
- **Request**: `{ "title": "string", "is_completed": "boolean", "afterSubtaskId": "uuid | null" }`
- **Response 200**: `{ "subtask": { ... } }`

### DELETE `/api/boards/:boardId/tasks/:taskId/subtasks/:subtaskId` (Admin, OWNER, EDITOR, Assignee)
Deletes a sub-task.
- **Response 204**
