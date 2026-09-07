'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  FolderOpen, 
  Kanban, 
  Layout, 
  Plus, 
  Layers,
  Settings
} from 'lucide-react';
import { api } from '@/lib/api';
import { Board, Project } from '@/types/api';
import { CreateBoardModal } from '@/components/boards/CreateBoardModal';

interface ProjectItemProps {
  project: Project;
  activeBoardId: string | null;
  userId: string | null;
}

function ProjectTreeItem({ project, activeBoardId, userId }: ProjectItemProps) {
  const pathname = usePathname();

  // Fetch boards for this project
  const { data: boards, isLoading: boardsLoading } = useQuery<Board[]>({
    queryKey: ['boards', project.id],
    queryFn: async () => {
      const res = await api.get(`/boards?projectId=${project.id}`);
      return res.data;
    },
    enabled: !!project.id,
  });

  // Check if current active board is inside this project to auto-expand
  const hasActiveBoard = boards?.some(b => b.id === activeBoardId);
  const [expanded, setExpanded] = useState<boolean>(true);

  useEffect(() => {
    if (hasActiveBoard) {
      setExpanded(true);
    }
  }, [hasActiveBoard]);

  // Fetch project members to check role
  const { data: members } = useQuery({
    queryKey: ['project', project.id, 'members'],
    queryFn: async () => {
      const res = await api.get(`/projects/${project.id}/members`);
      return res.data;
    },
    enabled: !!project.id,
  });

  const isProjectAdmin = members?.some((m: any) => m.user_id === userId && m.role === 'ADMIN');

  return (
    <div className="flex flex-col mb-1 group/tree">
      {/* Project Header */}
      <div 
        className={`flex items-center justify-between px-2 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer select-none ${
          expanded ? 'text-zinc-100 bg-zinc-800/40' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button 
            type="button"
            className="p-0.5 rounded hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 shrink-0 text-zinc-400" />
            ) : (
              <ChevronRight className="w-4 h-4 shrink-0 text-zinc-400" />
            )}
          </button>
          
          {expanded ? (
            <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-zinc-500 shrink-0" />
          )}

          <span className="truncate font-semibold text-xs tracking-wide uppercase text-zinc-300">
            {project.name}
          </span>
        </div>

        {isProjectAdmin && (
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Link
              href="/project-settings"
              className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60 rounded transition-colors"
              title="Project Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </Link>
            <CreateBoardModal
              projectId={project.id}
              trigger={
                <button 
                  className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60 rounded transition-colors"
                  title="Create Board"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              }
            />
          </div>
        )}
      </div>

      {/* Expanded Boards List with Reddit-Style Line Architecture */}
      {expanded && (
        <div className="relative ml-3 pl-3 pt-1 flex flex-col gap-0.5">
          {/* Continuous vertical line running through children (Reddit thread style) */}
          {boards && boards.length > 0 && (
            <div 
              className="absolute left-[7px] top-0 bottom-3 w-[2px] bg-zinc-800 group-hover/tree:bg-zinc-700 transition-colors rounded-full" 
            />
          )}

          {boardsLoading ? (
            <div className="py-2 pl-4 text-xs text-zinc-500 animate-pulse">
              Loading boards...
            </div>
          ) : boards && boards.length > 0 ? (
            boards.map((board, index) => {
              const isActive = activeBoardId === board.id;
              const isLast = index === boards.length - 1;

              return (
                <div key={board.id} className="relative flex items-center group/board">
                  {/* Reddit-style Branch Line connector (L-shaped branch line) */}
                  <div 
                    className={`absolute -left-[9px] top-0 w-[14px] ${
                      isLast ? 'h-[18px]' : 'h-full'
                    } border-l-2 border-b-2 ${
                      isActive 
                        ? 'border-indigo-500' 
                        : 'border-zinc-800 group-hover/board:border-zinc-600'
                    } rounded-bl-sm pointer-events-none transition-colors`}
                  />

                  {/* Board Link Node */}
                  <Link
                    href={`/boards/${board.id}`}
                    className={`flex items-center gap-2.5 w-full ml-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/30'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                    }`}
                  >
                    <Kanban 
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover/board:text-zinc-300'
                      }`} 
                    />
                    <span className="truncate flex-1">{board.name}</span>

                    {board.my_board_role && (
                      <span 
                        className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold shrink-0 ${
                          board.my_board_role === 'OWNER' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : board.my_board_role === 'EDITOR'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {board.my_board_role}
                      </span>
                    )}
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="relative flex items-center">
              <div className="absolute -left-[9px] top-0 w-[14px] h-[18px] border-l-2 border-b-2 border-zinc-800 rounded-bl-sm pointer-events-none" />
              <span className="ml-2 px-2.5 py-1 text-[11px] text-zinc-500 italic">
                No boards found
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SidebarTree({ userId }: { userId: string | null }) {
  const pathname = usePathname();

  // Extract boardId from current pathname if visiting /boards/[boardId]
  const boardMatch = pathname?.match(/\/boards\/([a-f0-9-]+)/i);
  const activeBoardId = boardMatch ? boardMatch[1] : null;

  // Fetch all user projects
  const { data: projectsData, isLoading, isError } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        const res = await api.get('/projects');
        return Array.isArray(res.data) ? res.data : [res.data];
      } catch (err) {
        // Fallback to /projects/me if /projects returns single item or fails
        const fallbackRes = await api.get('/projects/me');
        return fallbackRes.data ? [fallbackRes.data] : [];
      }
    },
  });

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Root Boards Nav Link */}
      <Link
        href="/boards"
        className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-semibold transition-colors ${
          pathname === '/boards'
            ? 'bg-zinc-800 text-zinc-50'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
        }`}
      >
        <Layout className="w-4 h-4 text-zinc-400" />
        <span>All Boards Overview</span>
      </Link>

      <div className="h-px bg-zinc-800/80 my-2" />

      <div className="px-2 pb-1 flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
        <span>Projects & Boards</span>
        <Layers className="w-3.5 h-3.5 text-zinc-600" />
      </div>

      {/* Projects List with Reddit-Style Line Expansion */}
      {isLoading ? (
        <div className="space-y-2 p-2">
          <div className="h-6 bg-zinc-800/60 rounded animate-pulse w-3/4" />
          <div className="h-5 bg-zinc-800/40 rounded animate-pulse ml-4 w-2/3" />
          <div className="h-5 bg-zinc-800/40 rounded animate-pulse ml-4 w-1/2" />
        </div>
      ) : isError || !projectsData || projectsData.length === 0 ? (
        <div className="p-3 text-center text-xs text-zinc-500 bg-zinc-900/50 rounded-md border border-zinc-800/60">
          No projects available.
        </div>
      ) : (
        <div className="flex flex-col">
          {projectsData.map((project) => (
            <ProjectTreeItem
              key={project.id}
              project={project}
              activeBoardId={activeBoardId}
              userId={userId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
