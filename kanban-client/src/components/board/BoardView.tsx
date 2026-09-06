'use client';

import { useState, useMemo } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  SortableContext, 
  horizontalListSortingStrategy, 
  sortableKeyboardCoordinates 
} from '@dnd-kit/sortable';
import { BoardData } from '@/hooks/useBoardData';
import { useMoveTask } from '@/hooks/useMoveTask';
import { useMoveColumn } from '@/hooks/useMoveColumn';
import { KanbanColumn } from './KanbanColumn';
import { BoardHeader } from './BoardHeader';
import { TaskCard } from './TaskCard';
import { CreateColumnModal } from './CreateColumnModal';
import { useSocket } from '@/providers/SocketProvider';
import { useBoardSocket } from '@/hooks/useBoardSocket';
import { useEffect } from 'react';

interface BoardViewProps {
  projectId: string;
  board: BoardData;
  isAdmin: boolean;
}

export function BoardView({ projectId, board, isAdmin }: BoardViewProps) {
  const [activeTask, setActiveTask] = useState<any>(null);
  const [activeColumn, setActiveColumn] = useState<any>(null);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');

  const filteredBoard = useMemo(() => {
    if (!taskSearchQuery) return board;
    const lowerQuery = taskSearchQuery.toLowerCase();
    return {
      ...board,
      columns: board.columns.map(col => ({
        ...col,
        tasks: col.tasks.filter(task => 
          task.title.toLowerCase().includes(lowerQuery) || 
          (task.description && task.description.toLowerCase().includes(lowerQuery))
        )
      }))
    };
  }, [board, taskSearchQuery]);

  const moveTask = useMoveTask();
  const moveColumn = useMoveColumn();

  useBoardSocket(board.id, projectId);

  const socket = useSocket();

  useEffect(() => {
    if (socket && board.id) {
      socket.emit('join:board', board.id);
      return () => {
        socket.emit('leave:board', board.id);
      };
    }
  }, [socket, board.id]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { type } = active.data.current || {};

    if (type === 'column') {
      setActiveColumn(active.data.current?.column);
    } else if (type === 'task') {
      setActiveTask(active.data.current?.task);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    // For task dragging over other tasks/columns to show optimistic positioning if needed
    // The query cache update in onDragEnd handles actual logic.
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveColumn(null);
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveColumn = active.data.current?.type === 'column';
    const isOverColumn = over.data.current?.type === 'column';

    // Handle Column Move
    if (isActiveColumn && isOverColumn) {
      // Find new index to determine afterColumnId
      const columns = board.columns;
      const oldIndex = columns.findIndex(c => c.id === activeId);
      const newIndex = columns.findIndex(c => c.id === overId);
      
      let afterColumnId: string | null = null;
      if (newIndex > 0) {
        // If moving down, the one we drop over becomes the preceding one, 
        // UNLESS we are moving down past it, dnd-kit gives 'over' as the item we swap with.
        // Actually, dnd-kit sortable shifts array. 
        // A simple robust way: simulate array shift, then find the element before it.
        const newCols = [...columns];
        const [moved] = newCols.splice(oldIndex, 1);
        newCols.splice(newIndex, 0, moved);
        
        if (newIndex > 0) {
          afterColumnId = newCols[newIndex - 1].id;
        }
      }

      moveColumn.mutate({
        projectId,
        boardId: board.id,
        columnId: activeId as string,
        afterColumnId
      });
      return;
    }

    // Handle Task Move
    const isActiveTask = active.data.current?.type === 'task';
    
    if (isActiveTask) {
      const activeTaskData = active.data.current?.task;
      const overType = over.data.current?.type;
      
      let targetColumnId = '';
      let targetTasks: any[] = [];
      let afterTaskId: string | null = null;

      if (overType === 'column') {
        targetColumnId = over.id as string;
        const targetCol = board.columns.find(c => c.id === targetColumnId);
        targetTasks = targetCol ? targetCol.tasks : [];
        
        // Dropped onto an empty column or column header
        if (targetTasks.length > 0) {
          afterTaskId = targetTasks[targetTasks.length - 1].id;
        }
      } else if (overType === 'task') {
        targetColumnId = over.data.current?.columnId;
        const targetCol = board.columns.find(c => c.id === targetColumnId);
        if (!targetCol) return;
        
        targetTasks = [...targetCol.tasks];
        
        const overIndex = targetTasks.findIndex(t => t.id === over.id);
        const activeIndex = targetTasks.findIndex(t => t.id === active.id);
        
        // If same column, simulate shift to find afterTaskId
        if (activeTaskData.column_id === targetColumnId) {
          const [moved] = targetTasks.splice(activeIndex, 1);
          targetTasks.splice(overIndex, 0, moved);
          if (overIndex > 0) {
            afterTaskId = targetTasks[overIndex - 1].id;
          }
        } else {
          // Cross-column move
          if (overIndex > 0) {
            // Since we are inserting at overIndex, the previous is overIndex - 1
            // But wait, the task at overIndex will be pushed down.
            // So afterTaskId is the task currently at overIndex - 1.
            // Wait, dnd-kit drop can be before or after the over item depending on rect intersection.
            // A simple approximation: if dropping over an item, assume we insert after it if we drag from above, etc.
            // For simplicity, let's just place it after the item we dropped over.
            afterTaskId = over.id as string; 
          } else {
            afterTaskId = null; // Top of list
          }
        }
      }

      if (targetColumnId) {
        moveTask.mutate({
          projectId,
          boardId: board.id,
          taskId: activeId as string,
          columnId: targetColumnId,
          afterTaskId
        });
      }
    }
  };

  const columnIds = filteredBoard.columns.map(c => c.id);

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <BoardHeader board={board} searchQuery={taskSearchQuery} onSearchChange={setTaskSearchQuery} />
      
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-[#09090b]">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex items-stretch gap-6 h-fit max-h-full">
            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
              {filteredBoard.columns.map(column => (
                <KanbanColumn 
                  key={column.id}
                  projectId={projectId}
                  boardId={board.id}
                  column={column}
                  isAdmin={isAdmin}
                />
              ))}
            </SortableContext>
            
            {/* Add Column Button (Optional extra) */}
            {isAdmin && (
              <CreateColumnModal
                projectId={projectId}
                boardId={board.id}
                trigger={
                  <button className="shrink-0 w-72 h-12 flex items-center justify-center gap-2 rounded-lg border border-zinc-800 border-dashed text-zinc-500 hover:text-zinc-50 hover:bg-zinc-900 transition-colors">
                    <span className="text-sm font-medium">+ Add Column</span>
                  </button>
                }
              />
            )}
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeColumn && (
              <div className="shrink-0 w-72 flex flex-col bg-zinc-900 border border-zinc-700 rounded-lg opacity-80 h-32 p-4 shadow-2xl">
                <h3 className="text-zinc-50 font-medium">{activeColumn.name}</h3>
              </div>
            )}
            {activeTask && (
              <TaskCard task={activeTask} columnId={activeTask.column_id} />
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
