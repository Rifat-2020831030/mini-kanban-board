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
      { projectId, boardId, columnId, title: title.trim(), priority: 'NONE' },
      {
        onSuccess: () => {
          setTitle('');
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
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="mt-2 p-2 bg-zinc-900 border border-zinc-800 rounded-md">
        <textarea
          ref={textareaRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSubmit}
          placeholder="What needs to be done?"
          className="w-full bg-transparent text-sm text-zinc-50 placeholder:text-zinc-500 resize-none outline-none"
          rows={2}
          disabled={createTask.isPending}
        />
        <div className="flex items-center justify-end gap-2 mt-2">
          <button
            onMouseDown={(e) => { e.preventDefault(); handleSubmit(); }}
            disabled={createTask.isPending}
            className="px-3 py-1 bg-zinc-50 text-zinc-950 text-xs font-medium rounded hover:bg-zinc-200"
          >
            Add
          </button>
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
