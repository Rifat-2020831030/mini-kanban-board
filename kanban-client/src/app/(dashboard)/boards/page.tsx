'use client';

import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Board, Project, ProjectMember } from '@/types/api';
import { BoardCard } from '@/components/boards/BoardCard';
import { CreateBoardModal } from '@/components/boards/CreateBoardModal';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { useEffect, useState } from 'react';

// Skeletons
function BoardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-md p-4 h-32 animate-pulse">
          <div className="h-5 bg-zinc-800 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-zinc-800 rounded w-full mb-1"></div>
          <div className="h-4 bg-zinc-800 rounded w-4/5"></div>
        </div>
      ))}
    </div>
  );
}

export default function BoardsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch current user (needed to find my role in project if needed, but not strictly required if we just fetch projects/me)
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data.user;
    }
  });

  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, [user]);

  // Fetch Project
  const { data: projectData, isLoading: projectLoading, isError: projectError } = useQuery({
    queryKey: ['project', 'me'],
    queryFn: async () => {
      const res = await api.get('/projects/me');
      return res.data as Project;
    },
    retry: false
  });

  // Fetch Project Members (to check if I am an ADMIN)
  const { data: membersData } = useQuery({
    queryKey: ['project', projectData?.id, 'members'],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectData?.id}/members`);
      return res.data as ProjectMember[];
    },
    enabled: !!projectData?.id,
  });

  // Determine if I am project ADMIN
  const isProjectAdmin = membersData?.some(m => m.user_id === userId && m.role === 'ADMIN') || false;

  // Fetch Boards
  const { data: boardsData, isLoading: boardsLoading } = useQuery({
    queryKey: ['boards', projectData?.id],
    queryFn: async () => {
      const res = await api.get(`/boards?projectId=${projectData?.id}`);
      return res.data as Board[];
    },
    enabled: !!projectData?.id,
  });

  const isLoading = projectLoading || (!!projectData && boardsLoading);

  if (projectError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center mt-20">
        <h2 className="text-xl font-semibold text-zinc-50 mb-2">Welcome to Kanban</h2>
        <p className="text-zinc-400 mb-6 max-w-md">
          You are not a member of any project yet. You can either wait for an invitation from an administrator or create a new workspace yourself.
        </p>
        <CreateProjectModal 
          trigger={
            <button className="flex items-center gap-2 bg-zinc-50 text-zinc-950 px-5 py-2.5 rounded-md font-medium text-sm hover:bg-zinc-200 transition-colors">
              <Plus className="w-4 h-4" />
              Create new workspace
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">Boards</h1>
          {projectData && (
            <p className="text-zinc-400 mt-1">Project: {projectData.name}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search boards..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-50 text-sm rounded-md pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-700 w-full sm:w-64"
            />
          </div>
          {projectData && isProjectAdmin && (
            <CreateBoardModal 
              projectId={projectData.id}
              trigger={
                <button className="flex items-center gap-2 bg-zinc-50 text-zinc-950 px-4 py-2 rounded-md font-medium text-sm hover:bg-zinc-200 transition-colors">
                  <Plus className="w-4 h-4" />
                  New Board
                </button>
              }
            />
          )}
        </div>
      </div>

      {isLoading ? (
        <BoardsSkeleton />
      ) : boardsData && boardsData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boardsData
            .filter(board => board.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(board => (
              <BoardCard key={board.id} board={board} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-900 border border-zinc-800 border-dashed rounded-lg mt-6">
          <h3 className="text-lg font-medium text-zinc-50 mb-2">No boards yet</h3>
          <p className="text-zinc-400 text-sm mb-6 max-w-sm text-center">
            Create a board to start tracking tasks and collaborating with your team.
          </p>
          {isProjectAdmin && projectData && (
            <CreateBoardModal 
              projectId={projectData.id}
              trigger={
                <button className="flex items-center gap-2 bg-zinc-50 text-zinc-950 px-4 py-2 rounded-md font-medium text-sm hover:bg-zinc-200 transition-colors">
                  <Plus className="w-4 h-4" />
                  Create your first board
                </button>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
