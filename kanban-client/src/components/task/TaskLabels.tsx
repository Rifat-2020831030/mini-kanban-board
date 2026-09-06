'use client';

import { useState } from 'react';
import { Task, Label } from '@/types/api';
import { useTaskLabels } from '@/hooks/useTaskLabels';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, X } from 'lucide-react';

export function TaskLabels({ task, boardId, projectId, isMember }: { task: Task, boardId: string, projectId: string, isMember: boolean }) {
  const queryClient = useQueryClient();
  const { addLabel, removeLabel } = useTaskLabels();
  const [showDropdown, setShowDropdown] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6');

  const { data: board } = useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const res = await api.get(`/boards/${boardId}`);
      return res.data;
    },
    enabled: !!boardId && showDropdown,
  });

  const createLabelMutation = useMutation({
    mutationFn: async (data: { name: string, color: string }) => {
      const res = await api.post(`/boards/${boardId}/labels`, data);
      return res.data;
    },
    onSuccess: (newLabel) => {
      setNewLabelName('');
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      if (newLabel?.id) {
        addLabel.mutate({ projectId, boardId, taskId: task.id, labelId: newLabel.id });
      }
    }
  });

  const boardLabels: Label[] = board?.labels || [];
  const assignedLabelIds = new Set((task.labels || []).map((l: any) => (l.label || l).id));
  const availableLabels = boardLabels.filter((l) => !assignedLabelIds.has(l.id));

  const handleAdd = (labelId: string) => {
    addLabel.mutate({ projectId, boardId, taskId: task.id, labelId });
    setShowDropdown(false);
  };

  const handleRemove = (labelId: string) => {
    removeLabel.mutate({ projectId, boardId, taskId: task.id, labelId });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLabelName.trim()) {
      createLabelMutation.mutate({ name: newLabelName.trim(), color: newLabelColor });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Labels</label>
      <div className="flex flex-wrap gap-2 items-center">
        {task.labels?.map((l: any) => {
          const label = l.label || l;
          return (
            <div 
              key={label.id} 
              className="flex items-center gap-1.5 rounded-full pl-2.5 pr-1.5 py-0.5 border"
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
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-700 border-dashed text-zinc-400 text-xs hover:text-zinc-50 hover:bg-zinc-800 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Label
            </button>

            {showDropdown && (
              <div className="absolute left-0 top-9 z-20 w-56 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl py-2 px-3 flex flex-col gap-2">
                <div className="text-[11px] font-semibold text-zinc-500 border-b border-zinc-800 pb-1">
                  Select Label
                </div>
                {availableLabels.length > 0 && (
                  <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
                    {availableLabels.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => handleAdd(l.id)}
                        className="text-left px-2 py-1 text-xs rounded hover:bg-zinc-800 flex items-center justify-between"
                        style={{ color: l.color }}
                      >
                        <span className="font-medium">{l.name}</span>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                      </button>
                    ))}
                  </div>
                )}

                <form onSubmit={handleCreate} className="border-t border-zinc-800 pt-2 flex flex-col gap-2">
                  <span className="text-[11px] font-medium text-zinc-400">Create New Label</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      placeholder="Label name..."
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-50 outline-none"
                    />
                    <input
                      type="color"
                      value={newLabelColor}
                      onChange={(e) => setNewLabelColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newLabelName.trim() || createLabelMutation.isPending}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-1 text-xs font-medium rounded disabled:opacity-50"
                  >
                    Create & Add
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
