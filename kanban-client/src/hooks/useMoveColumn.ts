import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BoardData } from './useBoardData';

interface MoveColumnParams {
  projectId: string;
  boardId: string;
  columnId: string;
  afterColumnId: string | null;
}

export function useMoveColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, boardId, columnId, afterColumnId }: MoveColumnParams) => {
      const res = await api.patch(`/projects/${projectId}/boards/${boardId}/columns/${columnId}/move`, {
        afterColumnId,
      });
      return res.data.column;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['board', variables.boardId] });
      const previousBoard = queryClient.getQueryData<BoardData>(['board', variables.boardId]);

      if (previousBoard) {
        const newBoard = JSON.parse(JSON.stringify(previousBoard)) as BoardData;
        const colIdx = newBoard.columns.findIndex(c => c.id === variables.columnId);
        if (colIdx > -1) {
          const [movedCol] = newBoard.columns.splice(colIdx, 1);
          if (!variables.afterColumnId) {
            newBoard.columns.unshift(movedCol);
          } else {
            const afterIdx = newBoard.columns.findIndex(c => c.id === variables.afterColumnId);
            if (afterIdx > -1) {
              newBoard.columns.splice(afterIdx + 1, 0, movedCol);
            } else {
              newBoard.columns.push(movedCol);
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
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}
