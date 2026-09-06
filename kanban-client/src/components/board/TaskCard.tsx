'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types/api';
import { Calendar, CheckSquare } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface TaskCardProps {
  task: Task;
  columnId: string;
  myRole?: string;
  currentUserId?: string;
  isAdmin?: boolean;
}

export function TaskCard({ task, columnId, myRole, currentUserId, isAdmin }: TaskCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isAssignee = !!(task.assignees?.some((a: any) => (a.user_id || a.user?.id || a.id) === currentUserId));
  const canMove = isAdmin || myRole === 'OWNER' || myRole === 'EDITOR' || isAssignee;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
      columnId,
    },
    disabled: !canMove,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent triggering if clicking specific actions (if we add them later)
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('taskId', task.id);
    router.push(`${pathname}?${newParams.toString()}`);
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-zinc-900 border border-zinc-800 rounded-md p-3 opacity-40 h-[100px]"
      />
    );
  }

  const priorityColors = {
    HIGH: 'bg-red-500/20 text-red-400 border border-red-500/30',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    LOW: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    NONE: '',
  };

  const priorityUpper = (task.priority || 'NONE').toUpperCase() as keyof typeof priorityColors;
  const showPriority = priorityUpper !== 'NONE' && priorityColors[priorityUpper];

  const completedSubtasks = task.subtasks?.filter(st => st.is_completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={`bg-zinc-900 border border-zinc-800 rounded-md p-3 ${canMove ? 'cursor-grab hover:bg-zinc-800 hover:border-zinc-700' : 'cursor-pointer hover:bg-zinc-800/80'} group flex flex-col gap-2`}
    >


      {/* Title */}
      <h4 className="text-zinc-50 text-sm font-medium line-clamp-2 leading-snug">
        {task.title}
      </h4>

      {/* Badges / Metadata */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          {showPriority && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${priorityColors[priorityUpper]}`}>
              {priorityUpper}
            </span>
          )}
          {task.due_date && (
            <div className="flex items-center gap-1 text-zinc-400 text-xs">
              <Calendar className="w-3 h-3" />
              <span>{new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>
        
        {/* Assignees */}
        {task.assignees && task.assignees.length > 0 && (
          <div className="flex items-center -space-x-1.5">
            {task.assignees.slice(0, 3).map((a: any) => {
              const u = a.user || a;
              return (
                <div key={u.id} className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-50 uppercase" title={u.username}>
                  {u.username.substring(0, 1)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subtasks */}
      {totalSubtasks > 0 && (
        <div className="flex items-center gap-2 mt-1">
          <CheckSquare className="w-3.5 h-3.5 text-zinc-500" />
          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full" 
              style={{ width: `${subtaskProgress}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-500">
            {completedSubtasks}/{totalSubtasks}
          </span>
        </div>
      )}
    </div>
  );
}
