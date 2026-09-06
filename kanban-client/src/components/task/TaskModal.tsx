'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X, Trash2 } from 'lucide-react';
import { useTask } from '@/hooks/useTask';
import { useUpdateTask } from '@/hooks/useUpdateTask';
import { TaskTitleEditor } from './TaskTitleEditor';
import { TaskDescription } from './TaskDescription';
import { TaskMetadata } from './TaskMetadata';
import { TaskAssignees } from './TaskAssignees';
import { TaskLabels } from './TaskLabels';
import { SubtaskList } from './SubtaskList';
import { TaskLifecycle } from './TaskLifecycle';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface TaskModalProps {
  projectId: string;
  boardId: string;
  taskId: string;
  myRole: string; // 'OWNER' | 'EDITOR' | 'MEMBER'
}

export function TaskModal({ projectId, boardId, taskId, myRole }: TaskModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const { data: task, isLoading } = useTask(projectId, boardId, taskId);
  const updateTask = useUpdateTask();

  const close = () => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('taskId');
    router.push(`${pathname}?${newParams.toString()}`);
  };

  const deleteTask = useMutation({
    mutationFn: async () => {
      await api.delete(`/boards/${boardId}/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      close();
    }
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data.user;
    }
  });

  const isOwnerOrEditor = myRole === 'OWNER' || myRole === 'EDITOR';
  const isAssignee = !!(task?.assignees?.some((a: any) => (a.user_id || a.user?.id || a.id) === user?.id));

  const canEditTask = isOwnerOrEditor || isAssignee;
  const canDeleteTask = isOwnerOrEditor;
  const canEditTitle = isOwnerOrEditor;

  const completedSubtasks = task?.subtasks?.filter((st: any) => st.is_completed).length || 0;
  const totalSubtasks = task?.subtasks?.length || 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <Dialog.Root open={!!taskId} onOpenChange={(open) => !open && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content 
          className="fixed right-0 top-0 h-full w-full max-w-2xl bg-zinc-900 border-l border-zinc-800 z-50 overflow-y-auto shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
          aria-describedby={undefined}
        >
          {isLoading || !task ? (
            <div className="p-8 flex flex-col gap-4 animate-pulse">
              <div className="h-6 w-32 bg-zinc-800 rounded"></div>
              <div className="h-10 w-full bg-zinc-800 rounded"></div>
              <div className="h-32 w-full bg-zinc-800 rounded mt-4"></div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="sticky top-0 z-10 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-zinc-500 text-sm">
                    KAN-{task.id.split('-')[0]}
                  </span>
                  {totalSubtasks > 0 && (
                    <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
                      <span>{completedSubtasks} / {totalSubtasks} subtasks</span>
                      <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {canDeleteTask && (
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this task?')) {
                          deleteTask.mutate();
                        }
                      }}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <Dialog.Close asChild>
                    <button className="p-1.5 text-zinc-500 hover:text-zinc-50 hover:bg-zinc-800 rounded-md transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </Dialog.Close>
                </div>
              </div>

              <div className="flex-1 p-6 flex flex-col gap-8">
                <TaskTitleEditor task={task} isMember={!canEditTitle} updateTask={updateTask} projectId={projectId} boardId={boardId} />
                
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 flex flex-col gap-8">
                    <TaskDescription task={task} updateTask={updateTask} projectId={projectId} boardId={boardId} isMember={!canEditTask} />
                    <SubtaskList task={task} boardId={boardId} projectId={projectId} isMember={!canEditTask} />
                    <TaskLifecycle taskId={taskId} boardId={boardId} projectId={projectId} />
                  </div>
                  
                  <div className="w-full md:w-56 shrink-0 flex flex-col gap-6">
                    <TaskMetadata task={task} updateTask={updateTask} isMember={!canEditTask} projectId={projectId} boardId={boardId} />
                    <TaskAssignees task={task} boardId={boardId} projectId={projectId} isMember={!canEditTask} />
                    <TaskLabels task={task} boardId={boardId} projectId={projectId} isMember={!canEditTask} canManageBoardLabels={isOwnerOrEditor} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
