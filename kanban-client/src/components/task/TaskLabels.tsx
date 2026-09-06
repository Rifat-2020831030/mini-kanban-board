'use client';

import { Task } from '@/types/api';
import { useTaskLabels } from '@/hooks/useTaskLabels';
import { Plus, X } from 'lucide-react';

export function TaskLabels({ task, boardId, projectId, isMember }: { task: Task, boardId: string, projectId: string, isMember: boolean }) {
  const { removeLabel } = useTaskLabels();

  const handleRemove = (labelId: string) => {
    removeLabel.mutate({ projectId, boardId, taskId: task.id, labelId });
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Labels</label>
      <div className="flex flex-wrap gap-2">
        {task.labels?.map((l: any) => {
          const label = l.label || l;
          return (
            <div 
              key={label.id} 
              className="flex items-center gap-1.5 rounded-full pl-2 pr-1.5 py-0.5 border"
              style={{ backgroundColor: `${label.color}20`, borderColor: `${label.color}40`, color: label.color }}
            >
              <span className="text-xs font-medium">{label.name}</span>
              {!isMember && (
                <button onClick={() => handleRemove(label.id)} className="hover:opacity-70 p-0.5">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
        
        {!isMember && (
          <button className="flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-900 border border-zinc-700 border-dashed text-zinc-400 text-xs hover:text-zinc-50 hover:bg-zinc-800 transition-colors">
            <Plus className="w-3 h-3" />
            Add
          </button>
        )}
      </div>
    </div>
  );
}
