'use client';

import { useState } from 'react';
import { Task, Subtask } from '@/types/api';
import { useSubtasks } from '@/hooks/useSubtasks';
import { CheckSquare, Trash2, Plus } from 'lucide-react';

export function SubtaskList({ task, boardId, projectId, isMember }: { task: Task, boardId: string, projectId: string, isMember: boolean }) {
  const { addSubtask, updateSubtask, deleteSubtask } = useSubtasks();
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      addSubtask.mutate({ projectId, boardId, taskId: task.id, title: newTitle.trim() });
      setNewTitle('');
    }
  };

  const subtasks = task.subtasks || [];
  const completed = subtasks.filter((st: any) => st.is_completed).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-zinc-50 font-medium mb-1">
        <CheckSquare className="w-5 h-5 text-zinc-400" />
        <h3>Subtasks</h3>
        <span className="text-xs text-zinc-500 ml-2 bg-zinc-800 px-2 py-0.5 rounded-full">
          {completed}/{subtasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {subtasks.map((st: Subtask) => (
          <div key={st.id} className="group flex items-center gap-3 p-2 hover:bg-zinc-800/50 rounded-md">
            <input 
              type="checkbox"
              checked={st.is_completed}
              onChange={(e) => updateSubtask.mutate({ projectId, boardId, taskId: task.id, subtaskId: st.id, is_completed: e.target.checked })}
              disabled={isMember}
              className="w-4 h-4 rounded-sm border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/20"
            />
            <span className={`flex-1 text-sm ${st.is_completed ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
              {st.title}
            </span>
            {!isMember && (
              <button 
                onClick={() => deleteSubtask.mutate({ projectId, boardId, taskId: task.id, subtaskId: st.id })}
                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {!isMember && (
          <form onSubmit={handleAdd} className="flex items-center gap-2 mt-2">
            <input 
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add a subtask..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-50 outline-none focus:border-zinc-700 transition-colors"
            />
            <button 
              type="submit"
              disabled={!newTitle.trim()}
              className="bg-zinc-800 text-zinc-50 px-3 py-2 rounded-md hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
