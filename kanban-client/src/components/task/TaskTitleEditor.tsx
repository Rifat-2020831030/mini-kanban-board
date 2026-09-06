'use client';

import { useState, useRef, useEffect } from 'react';
import { Task } from '@/types/api';

export function TaskTitleEditor({ task, isMember, updateTask, projectId, boardId }: { task: Task, isMember: boolean, updateTask: any, projectId: string, boardId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTitle(task.title);
  }, [task.title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
    }
  }, [isEditing]);

  const handleSubmit = () => {
    setIsEditing(false);
    const trimmed = title.trim();
    if (trimmed && trimmed !== task.title) {
      updateTask.mutate({
        projectId,
        boardId,
        taskId: task.id,
        title: trimmed,
      });
    } else {
      setTitle(task.title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTitle(task.title);
    }
  };

  if (isMember) {
    return (
      <h2 className="text-xl font-semibold text-zinc-50 leading-tight">
        {task.title}
      </h2>
    );
  }

  if (isEditing) {
    return (
      <textarea
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={handleKeyDown}
        className="text-xl font-semibold text-zinc-50 bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 w-full resize-none outline-none leading-tight"
        rows={2}
      />
    );
  }

  return (
    <h2 
      onClick={() => setIsEditing(true)}
      className="text-xl font-semibold text-zinc-50 leading-tight cursor-pointer hover:bg-zinc-800/50 rounded-md px-2 py-1 -mx-2 transition-colors"
    >
      {task.title}
    </h2>
  );
}
