import { BoardData } from '@/hooks/useBoardData';

interface BoardHeaderProps {
  board: BoardData;
}

export function BoardHeader({ board }: BoardHeaderProps) {
  const members = board.members || [];
  const displayMembers = members.slice(0, 5);
  const excess = members.length - 5;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-6 border-b border-zinc-800 bg-[#09090b]">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-zinc-50">{board.name}</h1>
        {board.description && (
          <p className="text-sm text-zinc-400">{board.description}</p>
        )}
      </div>

      <div className="flex items-center -space-x-2">
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
  );
}
