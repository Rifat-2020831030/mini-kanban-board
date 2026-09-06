import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface CreateTaskParams {
  projectId: string;
  boardId: string;
  columnId: string;
  title: string;
  priority: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, boardId, columnId, title, priority }: CreateTaskParams) => {
      const res = await api.post(`/boards/${boardId}/tasks`, {
        columnId,
        title,
        priority,
      });
      return res.data.task;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}
