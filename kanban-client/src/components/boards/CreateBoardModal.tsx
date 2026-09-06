'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface CreateBoardModalProps {
  projectId: string;
  trigger: React.ReactNode;
}

export function CreateBoardModal({ projectId, trigger }: CreateBoardModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const createBoard = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/projects/${projectId}/boards`, { name, description: description || null });
      return res.data.board;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', projectId] });
      setOpen(false);
      setName('');
      setDescription('');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createBoard.mutate();
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {trigger}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-zinc-800 bg-zinc-950 p-6 shadow-2xl rounded-md sm:rounded-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex flex-col gap-1.5">
            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight text-zinc-50">
              Create New Board
            </Dialog.Title>
            <Dialog.Description className="text-sm text-zinc-400">
              Add a new kanban board to your project.
            </Dialog.Description>
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium text-zinc-50">
                Board Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Frontend Engineering"
                className="bg-[#09090b] border border-zinc-800 rounded-md px-3 py-2 text-zinc-50 text-sm focus:outline-none focus:border-zinc-50 transition-colors"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="text-sm font-medium text-zinc-50">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this board for?"
                rows={3}
                className="bg-[#09090b] border border-zinc-800 rounded-md px-3 py-2 text-zinc-50 text-sm focus:outline-none focus:border-zinc-50 transition-colors resize-none"
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={!name.trim() || createBoard.isPending}
                className="px-4 py-2 text-sm font-medium bg-zinc-50 text-zinc-950 hover:bg-zinc-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createBoard.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Board
              </button>
            </div>
          </form>

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-zinc-800 data-[state=open]:text-zinc-400"
            >
              <X className="h-4 w-4 text-zinc-400" />
              <span className="sr-only">Close</span>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
