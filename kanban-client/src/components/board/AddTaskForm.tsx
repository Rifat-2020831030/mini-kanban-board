'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useCreateTask } from '@/hooks/useCreateTask';

interface AddTaskFormProps {
  projectId: string;
  boardId: string;
  columnId: string;
}

export function AddTaskForm({ projectId, boardId, columnId }: AddTaskFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'>('NONE');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const createTask = useCreateTask();

  const isSubmitting = useRef(false);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleSubmit = () => {
    if (!title.trim() || isSubmitting.current) {
      if (!title.trim()) setIsEditing(false);
      return;
    }
    
    isSubmitting.current = true;
    createTask.mutate(
      { projectId, boardId, columnId, title: title.trim(), priority },
      {
        onSuccess: () => {
          setTitle('');
          setPriority('NONE');
          setIsEditing(false);
          isSubmitting.current = false;
        },
        onError: () => {
          isSubmitting.current = false;
        }
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setTitle('');
      setPriority('NONE');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="mt-2 p-2 bg-zinc-900 border border-zinc-800 rounded-md flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What needs to be done?"
          className="w-full bg-transparent text-sm text-zinc-50 placeholder:text-zinc-500 resize-none outline-none"
          rows={2}
          disabled={createTask.isPending}
        />
        <div className="flex items-center justify-between gap-2 border-t border-zinc-800/60 pt-2">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
          >
            <option value="NONE">Priority: None</option>
            <option value="LOW">Priority: Low</option>
            <option value="MEDIUM">Priority: Medium</option>
            <option value="HIGH">Priority: High</option>
          </select>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setTitle(''); setPriority('NONE'); setIsEditing(false); }}
              type="button"
              className="px-2 py-1 text-zinc-400 text-xs hover:text-zinc-50"
            >
              Cancel
            </button>
            <button
              onMouseDown={(e) => { e.preventDefault(); handleSubmit(); }}
              disabled={createTask.isPending || !title.trim()}
              className="px-3 py-1 bg-zinc-50 text-zinc-950 text-xs font-medium rounded hover:bg-zinc-200 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="mt-2 flex items-center gap-1.5 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 px-2 py-1.5 rounded-md text-sm transition-colors w-full"
    >
      <Plus className="w-4 h-4" />
      <span>Add task</span>
    </button>
  );
}
