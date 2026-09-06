'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, Layout, Bug, CheckSquare, Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface CreateColumnModalProps {
  projectId: string;
  boardId: string;
  trigger: React.ReactNode;
}

const TEMPLATES = [
  {
    id: 'kanban',
    name: 'Basic Kanban',
    icon: Layout,
    description: 'A simple 3-step workflow to get started.',
    columns: ['To Do', 'In Progress', 'Done']
  },
  {
    id: 'software',
    name: 'Software Development',
    icon: CheckSquare,
    description: 'Standard agile software development workflow.',
    columns: ['Backlog', 'Selected for Development', 'In Progress', 'Code Review', 'Testing', 'Done']
  },
  {
    id: 'bug',
    name: 'Bug Tracking',
    icon: Bug,
    description: 'Track and resolve software issues.',
    columns: ['Triage', 'Investigating', 'Fix in Progress', 'QA', 'Closed']
  }
];

export function CreateColumnModal({ projectId, boardId, trigger }: CreateColumnModalProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'template' | 'custom'>('template');
  const [customName, setCustomName] = useState('');
  const queryClient = useQueryClient();

  const createColumn = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post(`/boards/${boardId}/columns`, { name, projectId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setOpen(false);
      setCustomName('');
    }
  });

  const bulkCreateColumns = useMutation({
    mutationFn: async (names: string[]) => {
      const res = await api.post(`/boards/${boardId}/columns/bulk`, { names, projectId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setOpen(false);
    }
  });

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    createColumn.mutate(customName);
  };

  const handleTemplateSelect = (columns: string[]) => {
    bulkCreateColumns.mutate(columns);
  };

  const isLoading = createColumn.isPending || bulkCreateColumns.isPending;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {trigger}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-zinc-800 bg-zinc-950 p-6 shadow-2xl rounded-md sm:rounded-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex flex-col gap-1.5 mb-2">
            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight text-zinc-50">
              Add Columns
            </Dialog.Title>
            <Dialog.Description className="text-sm text-zinc-400">
              Choose a template to automatically populate columns, or add a single custom column.
            </Dialog.Description>
          </div>
          
          <div className="flex gap-2 border-b border-zinc-800 pb-4 mb-4">
            <button
              onClick={() => setMode('template')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'template' ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400 hover:text-zinc-50'}`}
            >
              Templates
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'custom' ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400 hover:text-zinc-50'}`}
            >
              Custom Column
            </button>
          </div>

          {mode === 'template' ? (
            <div className="flex flex-col gap-3">
              {TEMPLATES.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.columns)}
                    disabled={isLoading}
                    className="flex items-start gap-4 p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="p-2 bg-zinc-800 rounded-md group-hover:bg-zinc-700 transition-colors shrink-0">
                      <Icon className="w-5 h-5 text-zinc-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-zinc-50 mb-1">{template.name}</h4>
                      <p className="text-xs text-zinc-400 mb-2">{template.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {template.columns.map((col, i) => (
                          <span key={i} className="px-2 py-0.5 bg-zinc-800 text-[10px] text-zinc-300 rounded whitespace-nowrap">
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-medium text-zinc-50">
                  Column Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Backlog"
                  className="bg-[#09090b] border border-zinc-800 rounded-md px-3 py-2 text-zinc-50 text-sm focus:outline-none focus:border-zinc-50 transition-colors"
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
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
                  disabled={!customName.trim() || isLoading}
                  className="px-4 py-2 text-sm font-medium bg-zinc-50 text-zinc-950 hover:bg-zinc-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Column
                </button>
              </div>
            </form>
          )}

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
