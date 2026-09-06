import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Board, Column, Task } from '@/types/api';

export interface BoardData extends Board {
  columns: (Column & { tasks: Task[] })[];
}

export function useBoardData(projectId: string, boardId: string, currentUserId: string | null) {
  return useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/boards/${boardId}`);
      const board = res.data.board as BoardData;
      
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
    enabled: !!projectId && !!boardId && !!currentUserId,
    select: (board) => {
      const myMember = board.members?.find(m => m.user_id === currentUserId);
      const myRole = myMember?.role || 'MEMBER';
      const isAdmin = myRole === 'OWNER' || myRole === 'EDITOR'; // Project Admin check needs project context, but for board actions OWNER/EDITOR usually suffice
      return { board, columns: board.columns, myRole, isAdmin };
    }
  });
}
