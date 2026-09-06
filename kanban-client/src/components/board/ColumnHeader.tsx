'use client';

import { useState, useRef } from 'react';
import { MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ColumnHeaderProps {
  projectId: string;
  boardId: string;
  columnId: string;
  name: string;
  taskCount: number;
  isAdmin: boolean;
}

export function ColumnHeader({ projectId, boardId, columnId, name, taskCount, isAdmin }: ColumnHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const renameMutation = useMutation({
    mutationFn: async (newName: string) => {
      await api.patch(`/boards/${boardId}/columns/${columnId}/rename`, { name: newName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setIsEditing(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/boards/${boardId}/columns/${columnId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    }
  });

  const handleRenameSubmit = () => {
    if (editName.trim() && editName !== name) {
      renameMutation.mutate(editName.trim());
    } else {
      setIsEditing(false);
      setEditName(name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(name);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this column and all its tasks?')) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="flex items-center justify-between mb-3 group">
      {isEditing ? (
        <input
          ref={inputRef}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={handleKeyDown}
          autoFocus
          className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-sm font-medium text-zinc-50 uppercase tracking-wide outline-none w-full mr-2"
        />
      ) : (
        <div className="flex items-center gap-2 overflow-hidden">
          <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wide truncate">
            {name}
          </h3>
          <span className="bg-zinc-800 text-zinc-400 text-xs px-1.5 py-0.5 rounded-full font-medium">
            {taskCount}
          </span>
        </div>
      )}

      {!isEditing && isAdmin && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="text-zinc-500 hover:text-zinc-50 hover:bg-zinc-800 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" className="min-w-[160px] bg-zinc-900 border border-zinc-800 rounded-md p-1 shadow-xl z-50 animate-in fade-in zoom-in-95">
              <DropdownMenu.Item 
                onSelect={() => {
                  setTimeout(() => setIsEditing(true), 0);
                }}
                className="flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800 rounded cursor-pointer outline-none"
              >
                <Edit2 className="w-4 h-4" />
                Rename
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-zinc-800 my-1" />
              <DropdownMenu.Item 
                onSelect={handleDelete}
                className="flex items-center gap-2 px-2 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded cursor-pointer outline-none"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
    </div>
  );
}
