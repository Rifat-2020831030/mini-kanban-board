import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Task, Subtask } from '@/types/api';

export function useSubtasks() {
  const queryClient = useQueryClient();

  const addSubtask = useMutation({
    mutationFn: async ({ projectId, boardId, taskId, title }: { projectId: string, boardId: string, taskId: string, title: string }) => {
      const res = await api.post(`/boards/${boardId}/tasks/${taskId}/subtasks`, { title });
      return res.data;
    },
    onMutate: async (newSubtaskData) => {
      await queryClient.cancelQueries({ queryKey: ['task', newSubtaskData.taskId] });

      const previousTask = queryClient.getQueryData<Task>(['task', newSubtaskData.taskId]);

      if (previousTask) {
        const tempSubtask: Subtask = {
          id: `temp-${Date.now()}`,
          task_id: newSubtaskData.taskId,
          title: newSubtaskData.title,
          is_completed: false,
          position: '0',
        };
        queryClient.setQueryData<Task>(['task', newSubtaskData.taskId], {
          ...previousTask,
          subtasks: [...(previousTask.subtasks || []), tempSubtask],
        });
      }

      return { previousTask };
    },
    onError: (err, newSubtaskData, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(['task', newSubtaskData.taskId], context.previousTask);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });

  const updateSubtask = useMutation({
    mutationFn: async ({ projectId, boardId, taskId, subtaskId, title, is_completed, afterSubtaskId }: { projectId: string, boardId: string, taskId: string, subtaskId: string, title?: string, is_completed?: boolean, afterSubtaskId?: string | null }) => {
      const res = await api.patch(`/boards/${boardId}/tasks/${taskId}/subtasks/${subtaskId}`, { title, isCompleted: is_completed, afterSubtaskId });
      return res.data;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['task', variables.taskId] });

      const previousTask = queryClient.getQueryData<Task>(['task', variables.taskId]);

      if (previousTask && previousTask.subtasks) {
        const updatedSubtasks = previousTask.subtasks.map((st) => {
          if (st.id === variables.subtaskId) {
            return {
              ...st,
              ...(variables.title !== undefined ? { title: variables.title } : {}),
              ...(variables.is_completed !== undefined ? { is_completed: variables.is_completed } : {}),
            };
          }
          return st;
        });

        queryClient.setQueryData<Task>(['task', variables.taskId], {
          ...previousTask,
          subtasks: updatedSubtasks,
        });
      }

      return { previousTask };
    },
    onError: (err, variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(['task', variables.taskId], context.previousTask);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });

  const deleteSubtask = useMutation({
    mutationFn: async ({ projectId, boardId, taskId, subtaskId }: { projectId: string, boardId: string, taskId: string, subtaskId: string }) => {
      await api.delete(`/boards/${boardId}/tasks/${taskId}/subtasks/${subtaskId}`);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['task', variables.taskId] });

      const previousTask = queryClient.getQueryData<Task>(['task', variables.taskId]);

      if (previousTask && previousTask.subtasks) {
        queryClient.setQueryData<Task>(['task', variables.taskId], {
          ...previousTask,
          subtasks: previousTask.subtasks.filter((st) => st.id !== variables.subtaskId),
        });
      }

      return { previousTask };
    },
    onError: (err, variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(['task', variables.taskId], context.previousTask);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });

  return { addSubtask, updateSubtask, deleteSubtask };
}
