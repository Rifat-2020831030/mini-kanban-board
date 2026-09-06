# Mini Kanban Board — Software Requirements Specification (SRS)

## 1. Overall Description

The Mini Kanban Board is a collaborative, real-time project management web application. It allows users to organize their work visually using boards, columns, and tasks. The system is designed to support teams working together within a unified workspace (Project) and provides granular access control to ensure data security and appropriate access levels for different team members. 

Key capabilities include:
- **Project-centric Organization**: Workspaces are organized into Projects, containing multiple boards.
- **Granular Access Control**: Role-based permissions at the project and individual board levels.
- **Real-time Collaboration**: Changes made by one user are instantly reflected on the screens of all other users currently viewing the same board.
- **Drag-and-Drop Interface**: Intuitive management of tasks and columns via drag-and-drop.

## 2. User Roles

The system operates with a hierarchical role structure:

1. **Project Admin**: The creator of a project or an appointed administrator. They have full control over the project, including managing members, archiving the project, creating boards, and implicit full ownership rights over all boards within the project.
2. **Project Member**: A general user within a project. They have no default access to boards until explicitly invited.
3. **Board OWNER**: Has full control over a specific board, including managing its settings, columns, tasks, and board members.
4. **Board EDITOR**: Can create and edit tasks and labels, but cannot manage columns, board settings, or members.
5. **Board VIEWER**: Has read-only access to a board. They can view all contents but cannot make changes, with one exception:
6. **Task Assignee (Override)**: If a Viewer is assigned to a specific task, they gain the ability to edit, move, and label that specific task.

## 3. Functional Requirements

### 3.1 Authentication & User Accounts
- **FR-AUTH-1 (Registration)**: Users must be able to create an account using a unique username, unique email address, and a password.
- **FR-AUTH-2 (Login)**: Registered users must be able to securely log in using their email and password.
- **FR-AUTH-3 (Logout)**: Logged-in users must be able to securely end their session.
- **FR-AUTH-4 (Session Management)**: Users can remain logged in across multiple devices concurrently.

### 3.2 Project Management
- **FR-PROJ-1 (Project Creation)**: Any registered user who is not already in a project can create a new project. The creator becomes the first Project Admin.
- **FR-PROJ-2 (Single Project Rule)**: A user can only belong to one project at any given time.
- **FR-PROJ-3 (Project Settings)**: Project Admins can update the project's name and description.
- **FR-PROJ-4 (Member Invitation)**: Project Admins can invite existing registered users to join the project via email or username.
- **FR-PROJ-5 (Member Management)**: Project Admins can promote members to Admin, demote Admins, and remove members from the project entirely (which immediately revokes all their board access).

### 3.3 Board Management
- **FR-BRD-1 (Board Creation)**: Project Admins can create new boards within their project.
- **FR-BRD-2 (Board Listing)**: Users can view a list of all boards they have access to.
- **FR-BRD-3 (Board Settings)**: Project Admins and Board Owners can update a board's name and description. They also control the board's filter and view (list, kanban, timeline).
- **FR-BRD-4 (Board Deletion)**: Project Admins and Board Owners can delete a board, which removes it and all its contents from view.
- **FR-BRD-5 (Board Membership)**: Project Admins and Board Owners can invite project members to the board and assign them a role (Owner, Editor, or Member) and an optional visual job title (e.g., Dev, QA, ML).
- **FR-BRD-6 (Board Role Management)**: Project Admins and Board Owners can change the roles and job titles of existing board members or remove them from the board.

### 3.4 Column Management
- **FR-COL-1 (Create Column)**: Project Admins and Board Owners can create new workflow columns (e.g., "To Do", "In Progress").
- **FR-COL-2 (Rename Column)**: Project Admins and Board Owners can rename existing columns.
- **FR-COL-3 (Reorder Column)**: Project Admins and Board Owners can drag and drop columns to change their left-to-right order on the board.
- **FR-COL-4 (Delete Column)**: Project Admins and Board Owners can delete a column. Deleting a column automatically deletes all tasks contained within it.

### 3.5 Task Management
- **FR-TSK-1 (Create Task)**: Any board member can create new tasks within a specific column. If a Member creates a task, they are automatically assigned to it.
- **FR-TSK-2 (View Task)**: Any board member can click a task to view its full details.
- **FR-TSK-3 (Update Task)**: Admins, Owners, and Editors can edit ANY task's title, description, priority, and due date. A Member can only edit tasks they have assigned themselves to (and they cannot edit the title).
- **FR-TSK-4 (Move Task)**: Admins, Owners, and Editors can move ANY task to reorder it or change columns. Members can only move tasks they are assigned to.
- **FR-TSK-5 (Delete Task)**: Only Project Admins, Board Owners, and Editors can delete tasks. Members cannot delete tasks.
- **FR-TSK-6 (Assign Task)**: Project Admins, Board Owners, and Editors can assign any member to any task. Regular Members can assign themselves to any task.
- **FR-TSK-7 (Sub-tasks / Checklist)**: Authorized users (including self-assigned Members) can add checklist sub-tasks to a task, toggle their completion status, edit their text, drag to reorder them, and delete them.
- **FR-TSK-8 (Task Lifecycle Tracking)**: The system automatically records when a task is created, moved between columns, or deleted, allowing users to view its history and calculate performance metrics like cycle time.

### 3.6 Label Management
- **FR-LBL-1 (Create Label)**: Admins, Owners, and Editors can create reusable, color-coded labels specific to a board. Label names must be unique within that board.
- **FR-LBL-2 (Edit Label)**: Authorized users can change a label's name or color.
- **FR-LBL-3 (Delete Label)**: Authorized users can delete a label, but ONLY if the label is not currently attached to any tasks.
- **FR-LBL-4 (Tag Task)**: Authorized users (including Task Assignees) can apply labels to tasks or remove them.

### 3.7 Real-time Collaboration
- **FR-RTC-1 (Live Updates)**: All board-level actions (creating/moving/editing tasks, sub-tasks, columns, labels, or members) are instantly synchronized to all other users currently viewing the board without requiring a page refresh.

## 4. Use Cases

### Use Case 1: Onboarding a New Team
**Actor**: Team Manager (User A), Team Members (Users B & C)
**Flow**:
1. User A registers for an account and creates a new project named "Product Launch". User A is now Project Admin.
2. Users B and C register for standalone accounts.
3. User A invites Users B and C to the project via their usernames.
4. User A creates a board called "Marketing Assets".
5. User A invites User B to the "Marketing Assets" board as an EDITOR.
6. User B logs in, sees the board, and creates columns ("Requested", "Designing", "Done").
7. User C logs in but sees no boards, as they haven't been invited to one yet.

### Use Case 2: Managing Task Workflow
**Actor**: Designer (User B - Editor), Copywriter (User C - Viewer)
**Flow**:
1. User B creates a task "Design Homepage Banner" in the "Requested" column.
2. User B (or Admin A) adds User C to the board as a VIEWER, and assigns User C to the banner task.
3. User C can view the whole board but cannot create new tasks.
4. Because User C is assigned to the banner task, they open it, edit the description to add copy text, and drag the task into the "Designing" column.
5. User B sees the task move to "Designing" on their screen in real-time.

