'use client';

import { Task } from '@/types/api';

export function TaskMetadata({ task, updateTask, isMember, projectId, boardId }: { task: Task, updateTask: any, isMember: boolean, projectId: string, boardId: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Priority</label>
        <select 
          value={task.priority}
          onChange={(e) => updateTask.mutate({ projectId, boardId, taskId: task.id, priority: e.target.value })}
          disabled={isMember}
          className="bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1.5 text-sm text-zinc-50 outline-none"
        >
          <option value="NONE">None</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Due Date</label>
        <input 
          type="date"
          value={task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''}
          onChange={(e) => updateTask.mutate({ projectId, boardId, taskId: task.id, due_date: e.target.value || null })}
          disabled={isMember}
          className="bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1.5 text-sm text-zinc-50 outline-none"
        />
      </div>
    </div>
  );
}
