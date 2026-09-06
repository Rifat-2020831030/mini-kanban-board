import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Board, BoardMember, Column, Task } from '@/types/api';

export interface BoardData extends Board {
  columns: (Column & { tasks: Task[] })[];
  board_members?: BoardMember[];
}

export function useBoardData(projectId: string, boardId: string, currentUserId: string | null) {
  return useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const res = await api.get(`/boards/${boardId}`);
      const board = res.data as BoardData;
      
      // Sort columns by position
      board.columns?.sort((a, b) => Number(a.position) - Number(b.position));
      
      // Sort tasks within columns
      board.columns?.forEach(col => {
        if (col.tasks) {
          col.tasks.sort((a, b) => Number(a.position) - Number(b.position));
        } else {
          col.tasks = [];
        }
      });
      
      return board;
    },
    enabled: !!boardId,
    select: (board) => {
      // API returns board_members (Prisma field name), not members
      const myMember = board.board_members?.find(m => m.user_id === currentUserId);
      const myRole = myMember?.role || 'MEMBER';
      const isAdmin = myRole === 'OWNER' || myRole === 'EDITOR';
      return { board, columns: board.columns, myRole, isAdmin };
    }
  });
}
