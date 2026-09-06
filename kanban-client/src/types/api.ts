export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ProjectMember {
  id: string;
  user_id: string;
  project_id: string;
  role: 'ADMIN' | 'MEMBER';
  user: User;
}

export interface Board {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  my_board_role?: 'OWNER' | 'EDITOR' | 'MEMBER';
  created_at: string;
  columns?: Column[];
  labels?: Label[];
  members?: BoardMember[];
  board_members?: BoardMember[];
  member_count?: number;
}

export interface BoardMember {
  id: string;
  user_id: string;
  board_id: string;
  role: 'OWNER' | 'EDITOR' | 'MEMBER';
  job_title: string | null;
  user: User;
}

export interface Column {
  id: string;
  board_id: string;
  name: string;
  position: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  position: string;
  due_date: string | null;
  priority: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  assignees?: TaskAssignee[];
  labels?: Label[];
  subtasks?: Subtask[];
}

export interface TaskAssignee {
  task_id: string;
  user_id: string;
  user: User;
}

export interface Label {
  id: string;
  board_id: string;
  name: string;
  color: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  position: string;
}

export interface TaskLifecycleEvent {
  id: string;
  action_type: string;
  from_column_id: string | null;
  to_column_id: string | null;
  created_at: string;
  user: User;
}

// API Response Shapes
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
}
