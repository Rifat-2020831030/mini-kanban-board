import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Task } from '@/types/api';

export function useTask(projectId: string, boardId: string, taskId: string | null) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const res = await api.get(`/boards/${boardId}/tasks/${taskId}`);
      return res.data.task as Task;
    },
    enabled: !!projectId && !!boardId && !!taskId,
  });
}
