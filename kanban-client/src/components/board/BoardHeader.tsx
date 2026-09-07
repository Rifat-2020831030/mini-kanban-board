import { useState } from 'react';
import { Search, Plus, Settings } from 'lucide-react';
import Link from 'next/link';
import { BoardData } from '@/hooks/useBoardData';
import { BoardMembersModal } from './BoardMembersModal';
import { BoardMember, ProjectMember } from '@/types/api';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface BoardHeaderProps {
  board: BoardData;
  isAdmin: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'ADMIN':
    case 'OWNER':
      return 'bg-red-500/20 text-red-400 border-[#09090b]';
    case 'MEMBER':
    case 'EDITOR':
      return 'bg-blue-500/20 text-blue-400 border-[#09090b]';
    case 'VIEWER':
      return 'bg-emerald-500/20 text-emerald-400 border-[#09090b]';
    default:
      return 'bg-zinc-800 text-zinc-300 border-[#09090b]';
  }
};

export function BoardHeader({ board, isAdmin, searchQuery, onSearchChange }: BoardHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: projectMembers } = useQuery({
    queryKey: ['project-members', board.project_id],
    queryFn: async () => {
      const res = await api.get(`/projects/${board.project_id}/members`);
      return res.data;
    },
    enabled: !!board.project_id,
  });

  const members: any[] = (projectMembers && projectMembers.length > 0)
    ? projectMembers
    : (board.board_members || (board as any).members || []);

  const displayMembers = members.slice(0, 5);
  const excess = members.length - 5;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-6 border-b border-zinc-800 bg-[#09090b]">
        {/* Left side: Title, Description, and Members */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold text-zinc-50">{board.name}</h1>
            {board.description && (
              <p className="text-sm text-zinc-400">{board.description}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div 
              className="flex items-center -space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setIsModalOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setIsModalOpen(true);
              }}
            >
              {displayMembers.map((member) => (
                <div
                  key={member.user_id}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-semibold overflow-hidden ${getRoleColor(member.role)}`}
                  title={`${member.user.username} (${member.role})`}
                >
                  {member.user.username.charAt(0).toUpperCase()}
                </div>
              ))}
              {excess > 0 && (
                <div className="w-7 h-7 rounded-full bg-zinc-800 border-2 border-[#09090b] flex items-center justify-center text-[10px] font-medium text-zinc-400">
                  +{excess}
                </div>
              )}
            </div>
            
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm"
                  title="Add Member to Board"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
                
                <Link
                  href={`/settings?boardId=${board.id}`}
                  className="w-8 h-8 rounded-md flex items-center justify-center bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-50 transition-colors"
                  title="Board Settings"
                >
                  <Settings className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right side: Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {onSearchChange && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                value={searchQuery || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-zinc-50 text-sm rounded-md pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-700 w-full sm:w-64"
              />
            </div>
          )}
        </div>
      </div>

      <BoardMembersModal 
        members={members} 
        boardId={board.id}
        projectId={board.project_id}
        isAdmin={isAdmin}
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
      />
    </>
  );
}
