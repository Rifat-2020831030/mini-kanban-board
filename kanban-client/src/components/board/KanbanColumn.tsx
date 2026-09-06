'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { ColumnHeader } from './ColumnHeader';
import { AddTaskForm } from './AddTaskForm';
import { Column, Task } from '@/types/api';

interface KanbanColumnProps {
  projectId: string;
  boardId: string;
  column: Column & { tasks: Task[] };
  isAdmin: boolean;
}

export function KanbanColumn({ projectId, boardId, column, isAdmin }: KanbanColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const tasksIds = column.tasks.map(t => t.id);

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="shrink-0 w-72 flex flex-col bg-zinc-900/50 border-2 border-zinc-700 border-dashed rounded-lg opacity-50 h-full min-h-[200px]" 
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative shrink-0 w-72 flex flex-col max-h-full after:absolute after:top-0 after:bottom-0 after:-right-3 after:w-px after:border-r after:border-dashed after:border-zinc-800 last:after:hidden"
    >
      <div 
        {...attributes}
        {...listeners}
        className="cursor-grab hover:bg-zinc-900/30 rounded-t-md p-1 -m-1 mb-1 transition-colors"
      >
        <ColumnHeader 
          projectId={projectId}
          boardId={boardId}
          columnId={column.id}
          name={column.name}
          taskCount={column.tasks.length}
          isAdmin={isAdmin}
        />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-[2px] pr-1 pb-2 scrollbar-thin">
        <SortableContext items={tasksIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {column.tasks.map(task => (
              <TaskCard key={task.id} task={task} columnId={column.id} />
            ))}
          </div>
        </SortableContext>
        
        <AddTaskForm 
          projectId={projectId}
          boardId={boardId}
          columnId={column.id}
        />
      </div>
    </div>
  );
}
