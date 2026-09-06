'use client';

import { useState } from 'react';
import { Task } from '@/types/api';
import { useTaskAssignees } from '@/hooks/useTaskAssignees';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, X } from 'lucide-react';

export function TaskAssignees({ task, boardId, projectId, isMember }: { task: Task, boardId: string, projectId: string, isMember: boolean }) {
  const { addAssignee, removeAssignee } = useTaskAssignees();
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: board } = useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const res = await api.get(`/boards/${boardId}`);
      return res.data;
    },
    enabled: !!boardId && showDropdown,
  });

  const boardMembers = board?.board_members || [];
  const assignedUserIds = new Set((task.assignees || []).map((a: any) => a.user_id || a.user?.id));
  const availableMembers = boardMembers.filter((bm: any) => !assignedUserIds.has(bm.user_id));

  const handleAdd = (userId: string) => {
    addAssignee.mutate({ projectId, boardId, taskId: task.id, userId });
    setShowDropdown(false);
  };

  const handleRemove = (userId: string) => {
    removeAssignee.mutate({ projectId, boardId, taskId: task.id, userId });
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Assignees</label>
      <div className="flex flex-wrap gap-2 items-center">
        {task.assignees?.map((a: any) => {
          const u = a.user || a;
          return (
            <div key={u.id} className="flex items-center gap-2 bg-zinc-800 rounded-full pl-1.5 pr-3 py-1">
              <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-50 uppercase">
                {u.username.substring(0, 1)}
              </div>
              <span className="text-xs text-zinc-300">{u.username}</span>
              {!isMember && (
                <button onClick={() => handleRemove(u.id)} className="ml-1 text-zinc-500 hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
        
        {!isMember && (
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 border-dashed text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 transition-colors"
              title="Add Assignee"
            >
              <Plus className="w-4 h-4" />
            </button>

            {showDropdown && (
              <div className="absolute left-0 top-9 z-20 w-48 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl py-1">
                <div className="px-3 py-1 text-[11px] font-semibold text-zinc-500 border-b border-zinc-800">
                  Select Board Member
                </div>
                {availableMembers.length > 0 ? (
                  availableMembers.map((bm: any) => (
                    <button
                      key={bm.user_id}
                      onClick={() => handleAdd(bm.user_id)}
                      className="w-full text-left px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <div className="w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center text-[8px] font-bold text-zinc-50 uppercase">
                        {bm.user.username.substring(0, 1)}
                      </div>
                      <span>{bm.user.username}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-zinc-500 text-center">
                    All members assigned
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
