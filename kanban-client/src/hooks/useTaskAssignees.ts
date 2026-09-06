import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface AssigneeParams {
  projectId: string;
  boardId: string;
  taskId: string;
  userId: string;
}

export function useTaskAssignees() {
  const queryClient = useQueryClient();

  const addAssignee = useMutation({
    mutationFn: async ({ projectId, boardId, taskId, userId }: AssigneeParams) => {
      await api.post(`/projects/${projectId}/boards/${boardId}/tasks/${taskId}/assignees`, { userId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });

  const removeAssignee = useMutation({
    mutationFn: async ({ projectId, boardId, taskId, userId }: AssigneeParams) => {
      await api.delete(`/projects/${projectId}/boards/${boardId}/tasks/${taskId}/assignees/${userId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });

  return { addAssignee, removeAssignee };
}
