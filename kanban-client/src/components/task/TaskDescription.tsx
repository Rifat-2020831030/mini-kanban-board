'use client';

import { useState, useRef, useEffect } from 'react';
import { Task } from '@/types/api';
import { AlignLeft } from 'lucide-react';

export function TaskDescription({ task, updateTask, projectId, boardId }: { task: Task, updateTask: any, projectId: string, boardId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(task.description || '');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDescription(task.description || '');
  }, [task.description]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSubmit = () => {
    setIsEditing(false);
    const trimmed = description.trim();
    if (trimmed !== (task.description || '')) {
      updateTask.mutate({
        projectId,
        boardId,
        taskId: task.id,
        description: trimmed || null,
      });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-zinc-50 font-medium">
        <AlignLeft className="w-5 h-5 text-zinc-400" />
        <h3>Description</h3>
      </div>
      
      {isEditing ? (
        <div className="flex flex-col gap-2">
          <textarea
            ref={inputRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a more detailed description..."
            className="w-full min-h-[120px] bg-zinc-900 border border-zinc-700 rounded-md p-3 text-sm text-zinc-50 outline-none focus:border-zinc-500 transition-colors resize-y"
          />
          <div className="flex gap-2">
            <button 
              onClick={handleSubmit}
              className="px-3 py-1.5 bg-zinc-50 text-zinc-950 text-sm font-medium rounded-md hover:bg-zinc-200"
            >
              Save
            </button>
            <button 
              onClick={() => {
                setIsEditing(false);
                setDescription(task.description || '');
              }}
              className="px-3 py-1.5 text-zinc-400 text-sm font-medium hover:text-zinc-50 rounded-md hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => setIsEditing(true)}
          className={`text-sm rounded-md p-3 cursor-pointer transition-colors ${
            task.description 
              ? 'text-zinc-300 hover:bg-zinc-800/50' 
              : 'text-zinc-500 bg-zinc-800/30 hover:bg-zinc-800/60'
          }`}
        >
          {task.description ? (
            <div className="whitespace-pre-wrap">{task.description}</div>
          ) : (
            'Add a more detailed description...'
          )}
        </div>
      )}
    </div>
  );
}
