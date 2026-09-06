import { useState } from 'react';
import { Search } from 'lucide-react';
import { BoardData } from '@/hooks/useBoardData';
import { BoardMembersModal } from './BoardMembersModal';

interface BoardHeaderProps {
  board: BoardData;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function BoardHeader({ board, searchQuery, onSearchChange }: BoardHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const members = board.members || [];
  const displayMembers = members.slice(0, 5);
  const excess = members.length - 5;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-6 border-b border-zinc-800 bg-[#09090b]">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-zinc-50">{board.name}</h1>
          {board.description && (
            <p className="text-sm text-zinc-400">{board.description}</p>
          )}
        </div>

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

          <div 
            className="flex items-center -space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsModalOpen(true);
              }
            }}
          >
            {displayMembers.map((member) => (
              <div
                key={member.user_id}
                className="w-7 h-7 rounded-full bg-zinc-800 border-2 border-[#09090b] flex items-center justify-center text-xs font-medium text-zinc-50 overflow-hidden"
                title={`${member.user.username} (${member.role})`}
              >
                {member.user.username.substring(0, 2).toUpperCase()}
              </div>
            ))}
            {excess > 0 && (
              <div className="w-7 h-7 rounded-full bg-zinc-800 border-2 border-[#09090b] flex items-center justify-center text-[10px] font-medium text-zinc-400">
                +{excess}
              </div>
            )}
          </div>
        </div>
      </div>

      <BoardMembersModal 
        members={members} 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
      />
    </>
  );
}
