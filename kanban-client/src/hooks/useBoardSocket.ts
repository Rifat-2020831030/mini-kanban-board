'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/providers/SocketProvider';
import { BoardData } from './useBoardData';
import { Task, Column, Label, BoardMember, Subtask } from '@/types/api';

export function useBoardSocket(boardId: string, projectId: string) {
  const queryClient = useQueryClient();
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !boardId) return;

    // TASK events
    socket.on('task:created', (task: Task) => {
      queryClient.setQueryData(['board', boardId], (old: BoardData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          columns: old.columns.map(col => {
            if (col.id === task.column_id) {
              return { ...col, tasks: [...col.tasks, task].sort((a, b) => Number(a.position) - Number(b.position)) };
            }
            return col;
          })
        };
      });
    });

    socket.on('task:moved', ({ taskId, columnId, position }: { taskId: string, columnId: string, position: string }) => {
      queryClient.setQueryData(['board', boardId], (old: BoardData | undefined) => {
        if (!old) return old;
        let movedTask: Task | undefined;
        // First find and remove the task from any column
        const nextColumns = old.columns.map(col => {
          const taskIndex = col.tasks.findIndex(t => t.id === taskId);
          if (taskIndex > -1) {
            movedTask = { ...col.tasks[taskIndex], column_id: columnId, position };
            const newTasks = [...col.tasks];
            newTasks.splice(taskIndex, 1);
            return { ...col, tasks: newTasks };
          }
          return col;
        });

        // If we found it, add it to the correct column and re-sort
        if (movedTask) {
          return {
            ...old,
            columns: nextColumns.map(col => {
              if (col.id === columnId) {
                return {
                  ...col,
                  tasks: [...col.tasks, movedTask!].sort((a, b) => Number(a.position) - Number(b.position))
                };
              }
              return col;
            })
          };
        }
        return old;
      });
    });

    socket.on('task:updated', (task: Task) => {
      queryClient.setQueryData(['board', boardId], (old: BoardData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          columns: old.columns.map(col => ({
            ...col,
            tasks: col.tasks.map(t => t.id === task.id ? { ...t, ...task } : t)
          }))
        };
      });
      // Update individual task cache
      queryClient.setQueryData(['task', task.id], (old: Task | undefined) => old ? { ...old, ...task } : old);
    });

    socket.on('task:deleted', ({ taskId }: { taskId: string }) => {
      queryClient.setQueryData(['board', boardId], (old: BoardData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          columns: old.columns.map(col => ({
            ...col,
            tasks: col.tasks.filter(t => t.id !== taskId)
          }))
        };
      });
    });

    // COLUMN events
    socket.on('column:created', (column: Column) => {
      queryClient.setQueryData(['board', boardId], (old: BoardData | undefined) => {
        if (!old) return old;
        const newCol = { ...column, tasks: [] };
        return {
          ...old,
          columns: [...old.columns, newCol].sort((a, b) => Number(a.position) - Number(b.position))
        };
      });
    });

    socket.on('column:renamed', ({ columnId, name }: { columnId: string, name: string }) => {
      queryClient.setQueryData(['board', boardId], (old: BoardData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          columns: old.columns.map(col => col.id === columnId ? { ...col, name } : col)
        };
      });
    });

    socket.on('column:moved', ({ columnId, position }: { columnId: string, position: string }) => {
      queryClient.setQueryData(['board', boardId], (old: BoardData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          columns: old.columns.map(col => col.id === columnId ? { ...col, position } : col)
            .sort((a, b) => Number(a.position) - Number(b.position))
        };
      });
    });

    socket.on('column:deleted', ({ columnId }: { columnId: string }) => {
      queryClient.setQueryData(['board', boardId], (old: BoardData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          columns: old.columns.filter(col => col.id !== columnId)
        };
      });
    });

    // LABEL events
    socket.on('label:created', (label: Label) => {
      queryClient.setQueryData(['board', boardId], (old: BoardData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          labels: [...(old.labels || []), label]
        };
      });
    });

    socket.on('label:updated', (label: Label) => {
      queryClient.setQueryData(['board', boardId], (old: BoardData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          labels: (old.labels || []).map(l => l.id === label.id ? label : l)
        };
      });
    });

    socket.on('label:deleted', ({ labelId }: { labelId: string }) => {
      queryClient.setQueryData(['board', boardId], (old: BoardData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          labels: (old.labels || []).filter(l => l.id !== labelId)
        };
      });
    });

    socket.on('label:tagged', ({ taskId, label }: { taskId: string, label: any }) => {
      queryClient.setQueryData(['board', boardId], (old: BoardData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          columns: old.columns.map(col => ({
            ...col,
            tasks: col.tasks.map(t => {
              if (t.id === taskId) {
                return { ...t, labels: [...(t.labels || []), label] };
              }
              return t;
            })
          }))
        };
      });
    });

    socket.on('label:untagged', ({ taskId, labelId }: { taskId: string, labelId: string }) => {
      queryClient.setQueryData(['board', boardId], (old: BoardData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          columns: old.columns.map(col => ({
            ...col,
            tasks: col.tasks.map(t => {
              if (t.id === taskId) {
                return { ...t, labels: (t.labels || []).filter((l: any) => l.label_id !== labelId && l.id !== labelId) };
              }
              return t;
            })
          }))
        };
      });
    });

    // SUBTASK events
    socket.on('subtask:created', ({ taskId, subtask }: { taskId: string, subtask: Subtask }) => {
      queryClient.setQueryData(['task', taskId], (old: Task | undefined) => {
        if (!old) return old;
        return { ...old, subtasks: [...(old.subtasks || []), subtask] };
      });
    });

    socket.on('subtask:updated', ({ taskId, subtask }: { taskId: string, subtask: Subtask }) => {
      queryClient.setQueryData(['task', taskId], (old: Task | undefined) => {
        if (!old) return old;
        return { ...old, subtasks: (old.subtasks || []).map(s => s.id === subtask.id ? subtask : s) };
      });
    });

    socket.on('subtask:deleted', ({ taskId, subtaskId }: { taskId: string, subtaskId: string }) => {
      queryClient.setQueryData(['task', taskId], (old: Task | undefined) => {
        if (!old) return old;
        return { ...old, subtasks: (old.subtasks || []).filter(s => s.id !== subtaskId) };
      });
    });

    // MEMBER events
    socket.on('member:added', (member: BoardMember) => {
      queryClient.setQueryData(['board', boardId], (old: BoardData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          members: [...(old.members || []), member]
        };
      });
    });

    socket.on('member:updated', (member: BoardMember) => {
      queryClient.setQueryData(['board', boardId], (old: BoardData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          members: (old.members || []).map(m => m.user_id === member.user_id ? member : m)
        };
      });
    });

    socket.on('member:removed', ({ userId }: { userId: string }) => {
      queryClient.setQueryData(['board', boardId], (old: BoardData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          members: (old.members || []).filter(m => m.user_id !== userId)
        };
      });
    });

    return () => {
      socket.off('task:created');
      socket.off('task:moved');
      socket.off('task:updated');
      socket.off('task:deleted');
      socket.off('column:created');
      socket.off('column:renamed');
      socket.off('column:moved');
      socket.off('column:deleted');
      socket.off('label:created');
      socket.off('label:updated');
      socket.off('label:deleted');
      socket.off('label:tagged');
      socket.off('label:untagged');
      socket.off('subtask:created');
      socket.off('subtask:updated');
      socket.off('subtask:deleted');
      socket.off('member:added');
      socket.off('member:updated');
      socket.off('member:removed');
    };
  }, [socket, boardId, queryClient]);
}
