'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useBoardData } from '@/hooks/useBoardData';
import { BoardView } from '@/components/board/BoardView';
import { Loader2 } from 'lucide-react';
import { Project } from '@/types/api';

import { useSearchParams } from 'next/navigation';
import { TaskModal } from '@/components/task/TaskModal';

export default function BoardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const boardId = params.boardId as string;
  const taskId = searchParams.get('taskId');

  // 1. Get current user
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data.user;
    }
  });

  // 2. Get current project
  const { data: project } = useQuery({
    queryKey: ['project', 'me'],
    queryFn: async () => {
      const res = await api.get('/projects/me');
      return res.data as Project;
    }
  });

  // 3. Fetch board data
  const { data: boardData, isLoading, isError } = useBoardData(
    project?.id as string,
    boardId,
    user?.id as string
  );

  if (isLoading || !boardData || !project) {
    return (
      <div className="flex flex-col h-full bg-[#09090b]">
        <div className="h-20 border-b border-zinc-800 animate-pulse bg-zinc-900/20" />
        <div className="flex p-6 gap-6 h-full overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-72 shrink-0 h-full flex flex-col gap-2">
              <div className="h-10 bg-zinc-900 rounded-md animate-pulse" />
              <div className="h-24 bg-zinc-900 rounded-md animate-pulse" />
              <div className="h-32 bg-zinc-900 rounded-md animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full bg-[#09090b]">
        <div className="flex flex-col items-center p-8 bg-zinc-900 border border-zinc-800 rounded-lg">
          <p className="text-red-400 mb-4">Failed to load board data.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-zinc-50 text-zinc-950 font-medium rounded-md hover:bg-zinc-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <BoardView 
        projectId={project!.id} 
        board={boardData.board} 
        isAdmin={boardData.isAdmin} 
      />
      {taskId && (
        <TaskModal 
          projectId={project!.id}
          boardId={boardId}
          taskId={taskId}
          myRole={boardData.myRole}
        />
      )}
    </>
  );
}
