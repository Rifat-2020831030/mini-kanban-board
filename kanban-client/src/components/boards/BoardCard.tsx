import Link from 'next/link';
import { Users } from 'lucide-react';
import { Board } from '@/types/api';

interface BoardCardProps {
  board: Board;
}

export function BoardCard({ board }: BoardCardProps) {
  // Determine badge color based on role
  let badgeColor = 'bg-zinc-800 text-zinc-400 border-zinc-700'; // Default / MEMBER
  if (board.my_board_role === 'OWNER') {
    badgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  } else if (board.my_board_role === 'EDITOR') {
    badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  }

  const memberCount = board.member_count ?? board.board_members?.length ?? board.members?.length ?? 0;

  return (
    <Link 
      href={`/boards/${board.id}`}
      className="group block bg-zinc-900 border border-zinc-800 rounded-md p-4 cursor-pointer hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-zinc-50 font-medium truncate pr-2">{board.name}</h3>
        {board.my_board_role && (
          <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-sm border shrink-0 ${badgeColor}`}>
            {board.my_board_role}
          </span>
        )}
      </div>
      
      <p className="text-zinc-400 text-sm line-clamp-2 mb-4 h-10">
        {board.description || 'No description provided.'}
      </p>

      <div className="flex items-center text-zinc-500 text-xs mt-auto">
        <Users className="w-3.5 h-3.5 mr-1" />
        <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
      </div>
    </Link>
  );
}
