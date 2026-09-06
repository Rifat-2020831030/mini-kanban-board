import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface UpdateTaskParams {
  projectId: string;
  boardId: string;
  taskId: string;
  title?: string;
  description?: string | null;
  due_date?: string | null;
  priority?: string;
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, boardId, taskId, due_date, ...data }: UpdateTaskParams) => {
      const payload: any = { ...data };
      if (due_date !== undefined) payload.dueDate = due_date;
      const res = await api.patch(`/boards/${boardId}/tasks/${taskId}`, payload);
      return res.data.task;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}
