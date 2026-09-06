'use client';

import { Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TaskLifecycleEvent } from '@/types/api';

export function TaskLifecycle({ taskId, boardId, projectId }: { taskId: string, boardId: string, projectId: string }) {
  const { data: events, isLoading } = useQuery({
    queryKey: ['task', taskId, 'lifecycle'],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/boards/${boardId}/tasks/${taskId}/lifecycle`);
      return res.data.events as TaskLifecycleEvent[];
    }
  });

  if (isLoading) return <div className="animate-pulse h-10 bg-zinc-800 rounded-md w-full mt-4"></div>;
  if (!events || events.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 mt-4 pt-6 border-t border-zinc-800/50">
      <div className="flex items-center gap-2 text-zinc-50 font-medium">
        <Activity className="w-4 h-4 text-zinc-400" />
        <h3 className="text-sm">Activity</h3>
      </div>
      
      <div className="flex flex-col gap-3 pl-1">
        {events.map((evt) => (
          <div key={evt.id} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-medium text-zinc-400 shrink-0 mt-0.5">
              {evt.user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-300">
                <span className="font-medium text-zinc-100">{evt.user.username}</span>
                {' '}{evt.action_type.toLowerCase()}{' '}this task
              </span>
              <span className="text-[10px] text-zinc-500">
                {new Date(evt.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
