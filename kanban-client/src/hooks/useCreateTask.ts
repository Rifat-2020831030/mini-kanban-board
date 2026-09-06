import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface CreateTaskParams {
  projectId: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  assigneeIds?: string[];
  labelIds?: string[];
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, boardId, columnId, title, description, dueDate, priority, assigneeIds, labelIds }: CreateTaskParams) => {
      const res = await api.post(`/boards/${boardId}/tasks`, {
        columnId,
        title,
        description,
        dueDate,
        priority: priority || 'NONE',
        assigneeIds,
        labelIds,
      });
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}
