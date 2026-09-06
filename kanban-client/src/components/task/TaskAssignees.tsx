'use client';

import { Task } from '@/types/api';
import { useTaskAssignees } from '@/hooks/useTaskAssignees';
import { Plus, X } from 'lucide-react';

export function TaskAssignees({ task, boardId, projectId, isMember }: { task: Task, boardId: string, projectId: string, isMember: boolean }) {
  const { removeAssignee } = useTaskAssignees();

  const handleRemove = (userId: string) => {
    removeAssignee.mutate({ projectId, boardId, taskId: task.id, userId });
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Assignees</label>
      <div className="flex flex-wrap gap-2">
        {task.assignees?.map((a: any) => {
          const u = a.user || a;
          return (
            <div key={u.id} className="flex items-center gap-2 bg-zinc-800 rounded-full pl-1.5 pr-3 py-1">
              <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] text-zinc-50">
                {u.username.substring(0, 2).toUpperCase()}
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
          <button className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 border-dashed text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
