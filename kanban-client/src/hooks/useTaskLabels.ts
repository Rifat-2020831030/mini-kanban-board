import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface LabelParams {
  projectId: string;
  boardId: string;
  taskId: string;
  labelId: string;
}

export function useTaskLabels() {
  const queryClient = useQueryClient();

  const addLabel = useMutation({
    mutationFn: async ({ projectId, boardId, taskId, labelId }: LabelParams) => {
      await api.post(`/projects/${projectId}/boards/${boardId}/tasks/${taskId}/labels`, { labelId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });

  const removeLabel = useMutation({
    mutationFn: async ({ projectId, boardId, taskId, labelId }: LabelParams) => {
      await api.delete(`/projects/${projectId}/boards/${boardId}/tasks/${taskId}/labels/${labelId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });

  return { addLabel, removeLabel };
}
