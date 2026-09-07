'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Folder, 
  Shield, 
  Trash2, 
  Loader2, 
  Plus, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Project, ProjectMember, User } from '@/types/api';

function ProjectSettingsContent() {
  const queryClient = useQueryClient();

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);

  // 1. Fetch current logged-in user
  const { data: me } = useQuery<User>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data.user || res.data;
    }
  });

  // 2. Fetch active project
  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ['project', 'me'],
    queryFn: async () => {
      const res = await api.get('/projects/me');
      return res.data;
    }
  });

  // 3. Fetch project members/admins
  const { data: members, isLoading: membersLoading } = useQuery<ProjectMember[]>({
    queryKey: ['project-members', project?.id],
    queryFn: async () => {
      const res = await api.get(`/projects/${project?.id}/members`);
      return res.data;
    },
    enabled: !!project?.id,
  });

  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setProjectDescription(project.description || '');
    }
  }, [project]);

  const isAdmin = members?.some(m => m.user_id === me?.id && m.role === 'ADMIN') || false;

  // Mutations
  const updateProjectMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await api.patch(`/projects/${project?.id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setGeneralError(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: (err: any) => {
      setGeneralError(err.response?.data?.error?.message || 'Failed to update project settings.');
    }
  });

  const addProjectOwnerMutation = useMutation({
    mutationFn: async (identifier: string) => {
      const res = await api.post(`/projects/${project?.id}/members`, {
        identifier,
        role: 'ADMIN',
      });
      return res.data;
    },
    onSuccess: () => {
      setInviteIdentifier('');
      setInviteError(null);
      queryClient.invalidateQueries({ queryKey: ['project-members', project?.id] });
    },
    onError: (err: any) => {
      setInviteError(err.response?.data?.error?.message || 'Failed to add project owner.');
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/projects/${project?.id}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', project?.id] });
    },
    onError: (err: any) => {
      setInviteError(err.response?.data?.error?.message || 'Failed to remove project owner.');
    }
  });

  const handleUpdateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !project) return;
    updateProjectMutation.mutate({ name: projectName, description: projectDescription });
  };

  const handleAddOwner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteIdentifier.trim() || !project) return;
    addProjectOwnerMutation.mutate(inviteIdentifier.trim());
  };

  if (projectLoading) {
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
          <p className="text-zinc-400">You need to belong to a project to view project settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <Link 
        href="/boards" 
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-50 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Boards
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-50 flex items-center gap-2">
          <Folder className="w-6 h-6 text-indigo-400" />
          Project Settings
        </h1>
        <p className="text-zinc-400 mt-1">Manage project information and appoint Project Owners.</p>
      </div>

      {!isAdmin && (
        <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Read-only mode: </span>
            Only Project Admins/Owners can modify project settings.
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* General Project Info */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-zinc-50">General Information</h2>
              <p className="text-sm text-zinc-400 mt-1">Update project workspace name and description.</p>
            </div>
            {showSuccess && (
              <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium animate-in fade-in zoom-in duration-300">
                <CheckCircle2 className="w-4 h-4" />
                Saved
              </span>
            )}
          </div>

          <div className="p-6">
            <form onSubmit={handleUpdateProject} className="flex flex-col gap-4">
              <div className="w-full">
                <label htmlFor="projectName" className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={!isAdmin || updateProjectMutation.isPending}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-700 disabled:opacity-50"
                />
              </div>

              <div className="w-full">
                <label htmlFor="projectDescription" className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Description
                </label>
                <textarea
                  id="projectDescription"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  disabled={!isAdmin || updateProjectMutation.isPending}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-700 disabled:opacity-50 resize-none"
                  placeholder="Briefly describe this project workspace..."
                />
              </div>

              {generalError && (
                <p className="text-red-400 text-sm">{generalError}</p>
              )}

              {isAdmin && (
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={updateProjectMutation.isPending || !projectName.trim() || (projectName === project.name && projectDescription === (project.description || ''))}
                    className="bg-zinc-50 text-zinc-950 px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2 h-9"
                  >
                    {updateProjectMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        </section>

        {/* Project Owners Section */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-lg font-medium text-zinc-50 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Project Owners & Admins
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Project Owners have full administrative permissions over this project and all its boards.
            </p>
          </div>

          {/* Add Project Owner Form */}
          {isAdmin && (
            <div className="p-6 border-b border-zinc-800 bg-zinc-950/40">
              <h3 className="text-sm font-medium text-zinc-200 mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                Add Project Owner
              </h3>
              <form onSubmit={handleAddOwner} className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <label htmlFor="inviteIdentifier" className="block text-xs font-medium text-zinc-400 mb-1">
                    User Email or Username
                  </label>
                  <input
                    id="inviteIdentifier"
                    type="text"
                    placeholder="e.g. owner@example.com or username"
                    value={inviteIdentifier}
                    onChange={(e) => setInviteIdentifier(e.target.value)}
                    disabled={addProjectOwnerMutation.isPending}
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={addProjectOwnerMutation.isPending || !inviteIdentifier.trim()}
                  className="bg-zinc-50 text-zinc-950 px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-1.5 h-9 shrink-0"
                >
                  {addProjectOwnerMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Owner
                </button>
              </form>

              {inviteError && (
                <p className="text-red-400 text-xs mt-2">{inviteError}</p>
              )}
            </div>
          )}

          {/* Project Owners List */}
          <div className="divide-y divide-zinc-800">
            {membersLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
              </div>
            ) : members?.map((member) => {
              const isSelf = member.user_id === me?.id;

              return (
                <div key={member.id} className="p-4 sm:p-6 flex items-center justify-between gap-4 hover:bg-zinc-800/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-semibold shrink-0">
                      {member.user.username.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
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

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold uppercase">
                      <Shield className="w-3 h-3" />
                      Project Owner
                    </span>

                    {isAdmin && !isSelf && (
                      <button
                        onClick={() => removeMemberMutation.mutate(member.id)}
                        disabled={removeMemberMutation.isPending}
                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors disabled:opacity-50"
                        title="Remove Project Owner"
                      >
                        {removeMemberMutation.isPending && removeMemberMutation.variables === member.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {members?.length === 0 && (
              <div className="p-8 text-center text-zinc-400 text-sm">
                No project owners found.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function ProjectSettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>}>
      <ProjectSettingsContent />
    </Suspense>
  );
}
