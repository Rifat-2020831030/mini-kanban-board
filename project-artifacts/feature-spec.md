# Mini Kanban Board — Software Requirements Specification (SRS)

## 1. Overall Description

The Mini Kanban Board is a collaborative, real-time project management web application. It allows users to organize their work visually using boards, columns, and tasks. The system is designed to support teams working together within a unified workspace (Project) and provides granular access control to ensure data security and appropriate access levels for different team members. 

Key capabilities include:
- **Project-centric Organization**: Workspaces are organized into Projects, containing multiple boards.
- **Project Admins & Board Owners**: Project Creators manage project settings and create boards, appointing Board Owners who act as Project Managers (PMs) for individual boards.
- **Granular Board Access Control**: Role-based permissions at the board level (`OWNER`, `EDITOR`, `MEMBER`), with custom job titles for members.
- **Real-time Collaboration**: Changes made by one user are instantly reflected on the screens of all other users currently viewing the same board.
- **Drag-and-Drop Interface**: Intuitive management of tasks and columns via drag-and-drop.

## 2. User Roles & Hierarchy Flow

The system operates with a structured workflow:

1. **Project Admin / Creator**: 
   - The creator of a project or an appointed project administrator.
   - Manages project-level settings (`/project-settings`), including project name/description and adding other Project Admins.
   - Creates boards within the project and appoints Board Owners.
   - Has implicit full ownership rights over all boards within the project.

2. **Board OWNER (Project Manager / PM Role)**:
   - Appointed by a Project Admin or board creator to lead a specific board.
   - Manages the complete board workflow: board settings, columns, labels, and member management.
   - Invites and adds members directly to their board with specific roles (`OWNER`, `EDITOR`, `MEMBER`) and job titles (e.g. "Dev", "QA", "Designer").

3. **Board EDITOR**:
   - Can create, edit, move, assign, and delete tasks and sub-tasks, and manage board labels.
   - Cannot modify columns, board settings, or add/remove board members.

4. **Board MEMBER / VIEWER**:
   - Read-only access to all tasks on the board.
   - Can assign tasks to **themselves**. Once assigned to a specific task, they gain full task-editing capabilities for that task.

## 3. Functional Requirements

### 3.1 Authentication & User Accounts
- **FR-AUTH-1 (Registration)**: Users must be able to create an account using a unique username, unique email address, and a password.
- **FR-AUTH-2 (Login)**: Registered users must be able to securely log in using their email and password.
- **FR-AUTH-3 (Logout)**: Logged-in users must be able to securely end their session.
- **FR-AUTH-4 (Session Management)**: Users can remain logged in across multiple devices concurrently.

### 3.2 Project Management
- **FR-PROJ-1 (Project Creation)**: Any registered user who is not already in a project can create a new project. The creator becomes the first Project Admin.
- **FR-PROJ-2 (Single Project Rule)**: A user can only belong to one project at any given time.
- **FR-PROJ-3 (Project Settings)**: Project Admins can update the project's name and description via Project Settings (`/project-settings`).
- **FR-PROJ-4 (Project Admin Management)**: Project Admins can add other registered users as Project Admins/Owners and manage project leadership.

### 3.3 Board & Member Management
- **FR-BRD-1 (Board Creation)**: Project Admins can create new boards within their project and assign initial Board Owners.
- **FR-BRD-2 (Board Listing)**: Users can view a list of all boards they belong to or manage.
- **FR-BRD-3 (Board Settings)**: Project Admins and Board Owners can update a board's name, description, and settings (`/settings?boardId=...`).
- **FR-BRD-4 (Board Deletion)**: Project Admins and Board Owners can delete a board, which soft-deletes it and all its contents.
- **FR-BRD-5 (Board Member Invitation)**: Board Owners and Project Admins can invite/add registered users directly to a board from the Board View member modal or Board Settings, assigning a role (`OWNER`, `EDITOR`, `MEMBER`) and an optional visual job title.
- **FR-BRD-6 (Board Role & Job Title Management)**: Board Owners and Project Admins can update board member roles and job titles or remove members from the board.

### 3.4 Column Management
- **FR-COL-1 (Create Column)**: Project Admins and Board Owners can create new workflow columns (e.g., "To Do", "In Progress").
- **FR-COL-2 (Rename Column)**: Project Admins and Board Owners can rename existing columns.
- **FR-COL-3 (Reorder Column)**: Project Admins and Board Owners can drag and drop columns to reorder them on the board.
- **FR-COL-4 (Delete Column)**: Project Admins and Board Owners can delete a column.

### 3.5 Task Management
- **FR-TSK-1 (Create Task)**: Authorized board members can create new tasks within a column.
- **FR-TSK-2 (View Task)**: Board members can click a task to view its full details.
- **FR-TSK-3 (Update Task)**: Admins, Board Owners, and Editors can edit ANY task's title, description, priority, and due date. Self-assigned Members can edit details of their task.
- **FR-TSK-4 (Move Task)**: Admins, Board Owners, Editors, and task assignees can move tasks across columns.
- **FR-TSK-5 (Delete Task)**: Admins, Board Owners, and Editors can delete tasks.
- **FR-TSK-6 (Assign Task)**: Admins, Board Owners, and Editors can assign any board member to any task. Members can assign themselves to tasks.
- **FR-TSK-7 (Sub-tasks / Checklist)**: Authorized users can add sub-tasks, toggle completion, edit text, reorder, and delete sub-tasks.

### 3.6 Label Management
- **FR-LBL-1 (Create Label)**: Admins, Board Owners, and Editors can create reusable, color-coded labels specific to a board.
- **FR-LBL-2 (Edit/Delete Label)**: Authorized users can edit or delete board labels.
- **FR-LBL-3 (Tag Task)**: Authorized users can tag tasks with labels.

### 3.7 Real-time Collaboration
- **FR-RTC-1 (Live Updates)**: All board-level actions (creating/moving/editing tasks, sub-tasks, columns, labels, or board members) are instantly synchronized to all active viewers of the board in real-time.
