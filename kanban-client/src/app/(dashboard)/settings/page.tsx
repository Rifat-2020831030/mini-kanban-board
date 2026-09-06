'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings, 
  Users, 
  Shield, 
  Trash2, 
  Loader2, 
  Plus, 
  ArrowLeft, 
  CheckCircle2, 
  Kanban,
  AlertTriangle,
  Save,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Board, BoardMember, Project, ProjectMember, User } from '@/types/api';

function SettingsContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlBoardId = searchParams.get('boardId');
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(urlBoardId);
  
  // Form states for Board General Info
  const [boardName, setBoardName] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // States for Add Board Member
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState<string>('');
  const [newMemberRole, setNewMemberRole] = useState<'OWNER' | 'EDITOR' | 'MEMBER'>('EDITOR');
  const [newMemberJobTitle, setNewMemberJobTitle] = useState('');
  const [addMemberError, setAddMemberError] = useState<string | null>(null);

  // States for Member Edits (mapped by memberId: { role, job_title })
  const [memberEdits, setMemberEdits] = useState<Record<string, { role: 'OWNER' | 'EDITOR' | 'MEMBER'; job_title: string }>>({});
  const [memberActionError, setMemberActionError] = useState<string | null>(null);

  // Danger zone state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 1. Fetch current logged-in user
  const { data: me } = useQuery<User>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data.user || res.data;
    }
  });

  // 2. Fetch active user project
  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ['project', 'me'],
    queryFn: async () => {
      const res = await api.get('/projects/me');
      return res.data;
    }
  });

  // 3. Fetch user's project members to check admin status
  const { data: projectMembers } = useQuery<ProjectMember[]>({
    queryKey: ['project', project?.id, 'members'],
    queryFn: async () => {
      const res = await api.get(`/projects/${project?.id}/members`);
      return res.data;
    },
    enabled: !!project?.id,
  });

  // 4. Fetch all boards in the project for selector dropdown
  const { data: boards, isLoading: boardsLoading } = useQuery<Board[]>({
    queryKey: ['boards', project?.id],
    queryFn: async () => {
      const res = await api.get(`/boards?projectId=${project?.id}`);
      return res.data;
    },
    enabled: !!project?.id,
  });

  // Auto-select board if not provided in URL
  useEffect(() => {
    if (!selectedBoardId && boards && boards.length > 0) {
      setSelectedBoardId(boards[0].id);
    } else if (urlBoardId && urlBoardId !== selectedBoardId) {
      setSelectedBoardId(urlBoardId);
    }
  }, [urlBoardId, boards, selectedBoardId]);

  // 5. Fetch selected Board details
  const { data: board, isLoading: boardLoading } = useQuery<Board>({
    queryKey: ['board', selectedBoardId],
    queryFn: async () => {
      const res = await api.get(`/boards/${selectedBoardId}`);
      return res.data;
    },
    enabled: !!selectedBoardId,
  });

  // 6. Fetch selected Board members
  const { data: boardMembers, isLoading: membersLoading } = useQuery<BoardMember[]>({
    queryKey: ['board-members', selectedBoardId],
    queryFn: async () => {
      const res = await api.get(`/boards/${selectedBoardId}/members`);
      return res.data;
    },
    enabled: !!selectedBoardId,
  });

  // Populate General Info form when board data loads
  useEffect(() => {
    if (board) {
      setBoardName(board.name);
      setBoardDescription(board.description || '');
    }
  }, [board]);

  // Populate Member Edits state when board members load
  useEffect(() => {
    if (boardMembers) {
      const edits: Record<string, { role: 'OWNER' | 'EDITOR' | 'MEMBER'; job_title: string }> = {};
      boardMembers.forEach(m => {
        edits[m.id] = {
          role: m.role,
          job_title: m.job_title || '',
        };
      });
      setMemberEdits(edits);
    }
  }, [boardMembers]);

  // Check roles & permissions
  const isProjectAdmin = projectMembers?.some(m => m.user_id === me?.id && m.role === 'ADMIN') || false;
  const myBoardMemberRecord = boardMembers?.find(m => m.user_id === me?.id);
  const myBoardRole = myBoardMemberRecord?.role || board?.my_board_role;
  const isBoardOwner = myBoardRole === 'OWNER';
  const isAuthorized = isProjectAdmin || isBoardOwner;

  // Filter project members who are NOT YET on this board
  const availableProjectMembers = (projectMembers || []).filter(pm => 
    !(boardMembers || []).some(bm => bm.user_id === pm.user_id)
  );

  // Mutations
  const updateBoardMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await api.patch(`/boards/${selectedBoardId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', selectedBoardId] });
      queryClient.invalidateQueries({ queryKey: ['boards', project?.id] });
      setGeneralError(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: (err: any) => {
      setGeneralError(err.response?.data?.error?.message || 'Failed to update board settings.');
    }
  });

  const addBoardMemberMutation = useMutation({
    mutationFn: async (data: { userId: string; role: 'OWNER' | 'EDITOR' | 'MEMBER'; jobTitle?: string }) => {
      const res = await api.post(`/boards/${selectedBoardId}/members`, data);
      return res.data;
    },
    onSuccess: () => {
      setSelectedUserIdToAdd('');
      setNewMemberJobTitle('');
      setAddMemberError(null);
      queryClient.invalidateQueries({ queryKey: ['board-members', selectedBoardId] });
      queryClient.invalidateQueries({ queryKey: ['board', selectedBoardId] });
    },
    onError: (err: any) => {
      setAddMemberError(err.response?.data?.error?.message || 'Failed to add member to board.');
    }
  });

  const updateBoardMemberMutation = useMutation({
    mutationFn: async ({ memberId, role, jobTitle }: { memberId: string; role: 'OWNER' | 'EDITOR' | 'MEMBER'; jobTitle?: string }) => {
      const res = await api.patch(`/boards/${selectedBoardId}/members/${memberId}`, { role, jobTitle });
      return res.data;
    },
    onSuccess: () => {
      setMemberActionError(null);
      queryClient.invalidateQueries({ queryKey: ['board-members', selectedBoardId] });
      queryClient.invalidateQueries({ queryKey: ['board', selectedBoardId] });
    },
    onError: (err: any) => {
      setMemberActionError(err.response?.data?.error?.message || 'Failed to update board member.');
    }
  });

  const removeBoardMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/boards/${selectedBoardId}/members/${memberId}`);
    },
    onSuccess: () => {
      setMemberActionError(null);
      queryClient.invalidateQueries({ queryKey: ['board-members', selectedBoardId] });
      queryClient.invalidateQueries({ queryKey: ['board', selectedBoardId] });
    },
    onError: (err: any) => {
      setMemberActionError(err.response?.data?.error?.message || 'Failed to remove board member.');
    }
  });

  const deleteBoardMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/boards/${selectedBoardId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', project?.id] });
      router.push('/boards');
    },
    onError: (err: any) => {
      setMemberActionError(err.response?.data?.error?.message || 'Failed to delete board.');
      setShowDeleteConfirm(false);
    }
  });

  const handleUpdateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardName.trim() || !selectedBoardId) return;
    updateBoardMutation.mutate({ name: boardName, description: boardDescription });
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserIdToAdd || !selectedBoardId) return;
    addBoardMemberMutation.mutate({
      userId: selectedUserIdToAdd,
      role: newMemberRole,
      jobTitle: newMemberJobTitle.trim() || undefined
    });
  };

  const handleSaveMemberEdit = (memberId: string) => {
    const edit = memberEdits[memberId];
    if (!edit || !selectedBoardId) return;
    updateBoardMemberMutation.mutate({
      memberId,
      role: edit.role,
      jobTitle: edit.job_title
    });
  };

  if (projectLoading || boardsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 max-w-4xl mx-auto w-full">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <h2 className="text-xl font-medium text-zinc-50 mb-2">No Project Found</h2>
          <p className="text-zinc-400">You must belong to a project to access settings.</p>
        </div>
      </div>
    );
  }

  if (boards && boards.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto w-full">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <Kanban className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
          <h2 className="text-xl font-medium text-zinc-50 mb-2">No Boards Found</h2>
          <p className="text-zinc-400 mb-6">Create a board first before managing board settings.</p>
          <Link href="/boards" className="inline-flex items-center gap-2 bg-zinc-50 text-zinc-950 px-4 py-2 rounded-md font-medium text-sm hover:bg-zinc-200 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Go to Boards
          </Link>
        </div>
      </div>
    );
  }

  const backHref = selectedBoardId ? `/boards/${selectedBoardId}` : '/boards';

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <Link 
        href={backHref} 
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-50 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Board
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50 flex items-center gap-2">
            <Settings className="w-6 h-6 text-zinc-400" />
            Board Settings
          </h1>
          <p className="text-zinc-400 mt-1">Manage board configuration, role permissions, and members.</p>
        </div>

        {/* Board Selector Dropdown */}
        {boards && boards.length > 1 && (
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
            <Kanban className="w-4 h-4 text-indigo-400 shrink-0" />
            <select
              value={selectedBoardId || ''}
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedBoardId(newId);
                router.replace(`/settings?boardId=${newId}`);
              }}
              className="bg-transparent text-sm text-zinc-50 focus:outline-none cursor-pointer pr-2"
            >
              {boards.map((b) => (
                <option key={b.id} value={b.id} className="bg-zinc-900 text-zinc-50">
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Permission Warning Banner if not authorized */}
      {!isAuthorized && (
        <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Read-only mode: </span>
            Only Board Owners or Project Admins can modify board settings or manage board members. You are currently viewing as a board 
            <span className="font-semibold capitalize"> {myBoardRole?.toLowerCase() || 'member'}</span>.
          </div>
        </div>
      )}

      {boardLoading ? (
        <div className="p-12 flex justify-center bg-zinc-900 border border-zinc-800 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      ) : board && (
        <div className="space-y-8">
          {/* General Information */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-zinc-50">General Information</h2>
                <p className="text-sm text-zinc-400 mt-1">Update board title and description.</p>
              </div>
              {showSuccess && (
                <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 className="w-4 h-4" />
                  Saved
                </span>
              )}
            </div>

            <div className="p-6">
              <form onSubmit={handleUpdateBoard} className="flex flex-col gap-4">
                <div className="w-full">
                  <label htmlFor="boardName" className="block text-sm font-medium text-zinc-400 mb-1.5">
                    Board Name
                  </label>
                  <input
                    id="boardName"
                    type="text"
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                    disabled={!isAuthorized || updateBoardMutation.isPending}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-700 disabled:opacity-50"
                  />
                </div>

                <div className="w-full">
                  <label htmlFor="boardDescription" className="block text-sm font-medium text-zinc-400 mb-1.5">
                    Description
                  </label>
                  <textarea
                    id="boardDescription"
                    value={boardDescription}
                    onChange={(e) => setBoardDescription(e.target.value)}
                    disabled={!isAuthorized || updateBoardMutation.isPending}
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-700 disabled:opacity-50 resize-none"
                    placeholder="Enter a description for this board..."
                  />
                </div>

                {generalError && (
                  <p className="text-red-400 text-sm">{generalError}</p>
                )}

                {isAuthorized && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={updateBoardMutation.isPending || !boardName.trim() || (boardName === board.name && boardDescription === (board.description || ''))}
                      className="bg-zinc-50 text-zinc-950 px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2 h-9"
                    >
                      {updateBoardMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Board Info
                    </button>
                  </div>
                )}
              </form>
            </div>
          </section>

          {/* Board Members Section */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-lg font-medium text-zinc-50 flex items-center gap-2">
                <Users className="w-5 h-5 text-zinc-400" />
                Board Members & Roles
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                Manage board members, assign roles (Owner, Editor, Member), and set custom job titles.
              </p>
            </div>

            {/* Add Project Member to Board Form */}
            {isAuthorized && (
              <div className="p-6 border-b border-zinc-800 bg-zinc-950/40">
                <h3 className="text-sm font-medium text-zinc-200 mb-3 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-indigo-400" />
                  Add Member to Board
                </h3>
                {availableProjectMembers.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">
                    All project members are already added to this board.
                  </p>
                ) : (
                  <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1 w-full">
                      <label htmlFor="selectMember" className="block text-xs font-medium text-zinc-400 mb-1">
                        Select Project Member
                      </label>
                      <select
                        id="selectMember"
                        value={selectedUserIdToAdd}
                        onChange={(e) => setSelectedUserIdToAdd(e.target.value)}
                        disabled={addBoardMemberMutation.isPending}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                        required
                      >
                        <option value="">-- Choose member --</option>
                        {availableProjectMembers.map(pm => (
                          <option key={pm.id} value={pm.user_id}>
                            {pm.user.username} ({pm.user.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-36">
                      <label htmlFor="newRole" className="block text-xs font-medium text-zinc-400 mb-1">
                        Role
                      </label>
                      <select
                        id="newRole"
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value as any)}
                        disabled={addBoardMemberMutation.isPending}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="EDITOR">Editor</option>
                        <option value="OWNER">Owner</option>
                      </select>
                    </div>

                    <div className="w-full sm:w-44">
                      <label htmlFor="jobTitle" className="block text-xs font-medium text-zinc-400 mb-1">
                        Job Title (Optional)
                      </label>
                      <input
                        id="jobTitle"
                        type="text"
                        placeholder="e.g. Developer"
                        value={newMemberJobTitle}
                        onChange={(e) => setNewMemberJobTitle(e.target.value)}
                        disabled={addBoardMemberMutation.isPending}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={addBoardMemberMutation.isPending || !selectedUserIdToAdd}
                      className="bg-zinc-50 text-zinc-950 px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-1.5 h-9 shrink-0"
                    >
                      {addBoardMemberMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Add to Board
                    </button>
                  </form>
                )}

                {addMemberError && (
                  <p className="text-red-400 text-xs mt-2">{addMemberError}</p>
                )}
              </div>
            )}

            {/* Current Board Members List */}
            <div className="divide-y divide-zinc-800">
              {memberActionError && (
                <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm">
                  {memberActionError}
                </div>
              )}

              {membersLoading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                </div>
              ) : boardMembers?.map((member) => {
                const edit = memberEdits[member.id] || { role: member.role, job_title: member.job_title || '' };
                const isChanged = edit.role !== member.role || edit.job_title !== (member.job_title || '');
                const isSelf = member.user_id === me?.id;

                return (
                  <div key={member.id} className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-zinc-800/20 transition-colors">
                    {/* User Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-50 font-semibold shrink-0">
                        {member.user.username.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-zinc-50 truncate">
                            {member.user.username}
                          </p>
                          {isSelf && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-normal">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 truncate">{member.user.email}</p>
                      </div>
                    </div>

                    {/* Role & Job Title Controls */}
                    <div className="flex flex-wrap items-center gap-3">
                      {isAuthorized ? (
                        <>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Job Title (e.g. QA)"
                              value={edit.job_title}
                              onChange={(e) => {
                                setMemberEdits(prev => ({
                                  ...prev,
                                  [member.id]: { ...prev[member.id], job_title: e.target.value }
                                }));
                              }}
                              className="w-36 bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                            />

                            <select
                              value={edit.role}
                              onChange={(e) => {
                                setMemberEdits(prev => ({
                                  ...prev,
                                  [member.id]: { ...prev[member.id], role: e.target.value as any }
                                }));
                              }}
                              className="bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-700 cursor-pointer"
                            >
                              <option value="MEMBER">Member</option>
                              <option value="EDITOR">Editor</option>
                              <option value="OWNER">Owner</option>
                            </select>

                            {isChanged && (
                              <button
                                onClick={() => handleSaveMemberEdit(member.id)}
                                disabled={updateBoardMemberMutation.isPending}
                                className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors text-xs flex items-center gap-1"
                                title="Save Role & Title Changes"
                              >
                                {updateBoardMemberMutation.isPending ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => removeBoardMemberMutation.mutate(member.id)}
                            disabled={removeBoardMemberMutation.isPending}
                            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors disabled:opacity-50"
                            title="Remove Member from Board"
                          >
                            {removeBoardMemberMutation.isPending && removeBoardMemberMutation.variables === member.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          {member.job_title && (
                            <span className="text-xs text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
                              {member.job_title}
                            </span>
                          )}
                          <div className="flex items-center gap-1 px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded text-xs font-semibold text-zinc-300">
                            {member.role === 'OWNER' && <Shield className="w-3 h-3 text-red-400 mr-1 inline" />}
                            {member.role}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {boardMembers?.length === 0 && (
                <div className="p-8 text-center text-zinc-400 text-sm">
                  No members found on this board.
                </div>
              )}
            </div>
          </section>

          {/* Danger Zone: Delete Board */}
          {isAuthorized && (
            <section className="bg-zinc-900 border border-red-900/40 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-red-900/30 bg-red-950/10">
                <h2 className="text-lg font-medium text-red-400 flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-400" />
                  Danger Zone
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Deleting a board soft-deletes it along with all columns and tasks inside it.
                </p>
              </div>
              
              <div className="p-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-200">Delete this board</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Once deleted, access to this board will be revoked for all members.</p>
                </div>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Delete Board
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => deleteBoardMutation.mutate()}
                      disabled={deleteBoardMutation.isPending}
                      className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      {deleteBoardMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Confirm Delete
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}
