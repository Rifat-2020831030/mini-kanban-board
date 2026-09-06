import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BoardData } from './useBoardData';

interface MoveTaskParams {
  projectId: string;
  boardId: string;
  taskId: string;
  columnId: string;
  afterTaskId: string | null;
}

export function useMoveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, boardId, taskId, columnId, afterTaskId }: MoveTaskParams) => {
      const res = await api.patch(`/boards/${boardId}/tasks/${taskId}/move`, {
        toColumnId: columnId,
        afterTaskId,
      });
      return res.data.task;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['board', variables.boardId] });
      const previousBoard = queryClient.getQueryData<BoardData>(['board', variables.boardId]);

      if (previousBoard) {
        // Optimistic update logic
        const newBoard = JSON.parse(JSON.stringify(previousBoard)) as BoardData;
        let movedTask: any = null;
        let sourceColIndex = -1;
        let targetColIndex = -1;

        // Find the task and remove from source
        newBoard.columns.forEach((col, idx) => {
          if (col.id === variables.columnId) targetColIndex = idx;
          const taskIdx = col.tasks.findIndex(t => t.id === variables.taskId);
          if (taskIdx > -1) {
            movedTask = col.tasks[taskIdx];
            sourceColIndex = idx;
            col.tasks.splice(taskIdx, 1);
          }
        });

        // Add to target
        if (movedTask && targetColIndex > -1) {
          movedTask.column_id = variables.columnId;
          const targetCol = newBoard.columns[targetColIndex];
          if (!variables.afterTaskId) {
            targetCol.tasks.unshift(movedTask);
          } else {
            const afterIdx = targetCol.tasks.findIndex(t => t.id === variables.afterTaskId);
            if (afterIdx > -1) {
              targetCol.tasks.splice(afterIdx + 1, 0, movedTask);
            } else {
              targetCol.tasks.push(movedTask);
            }
          }
        }

        queryClient.setQueryData(['board', variables.boardId], newBoard);
      }

      return { previousBoard };
    },
    onError: (err, variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(['board', variables.boardId], context.previousBoard);
      }
      console.error('Failed to move task:', err);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}
