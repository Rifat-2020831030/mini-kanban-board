import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useSubtasks() {
  const queryClient = useQueryClient();

  const addSubtask = useMutation({
    mutationFn: async ({ projectId, boardId, taskId, title }: { projectId: string, boardId: string, taskId: string, title: string }) => {
      await api.post(`/boards/${boardId}/tasks/${taskId}/subtasks`, { title });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });

  const updateSubtask = useMutation({
    mutationFn: async ({ projectId, boardId, taskId, subtaskId, title, is_completed, afterSubtaskId }: { projectId: string, boardId: string, taskId: string, subtaskId: string, title?: string, is_completed?: boolean, afterSubtaskId?: string | null }) => {
      await api.patch(`/boards/${boardId}/tasks/${taskId}/subtasks/${subtaskId}`, { title, isCompleted: is_completed, afterSubtaskId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });

  const deleteSubtask = useMutation({
    mutationFn: async ({ projectId, boardId, taskId, subtaskId }: { projectId: string, boardId: string, taskId: string, subtaskId: string }) => {
      await api.delete(`/boards/${boardId}/tasks/${taskId}/subtasks/${subtaskId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });

  return { addSubtask, updateSubtask, deleteSubtask };
}
