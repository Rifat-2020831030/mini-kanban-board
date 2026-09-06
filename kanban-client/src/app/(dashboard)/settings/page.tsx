'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Users, Shield, Trash2, Loader2, Plus, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Project, ProjectMember, User } from '@/types/api';

function SettingsContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const boardId = searchParams.get('boardId');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  
  const { data: me } = useQuery<User>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data;
    }
  });

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ['project', 'me'],
    queryFn: async () => {
      const res = await api.get('/projects/me');
      return res.data;
    }
  });

  const { data: members, isLoading: membersLoading } = useQuery<ProjectMember[]>({
    queryKey: ['project', project?.id, 'members'],
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

  const updateProjectMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await api.patch(`/projects/${project?.id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', 'me'] });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async (data: { email: string, role: string }) => {
      const res = await api.post(`/projects/${project?.id}/members`, data);
      return res.data;
    },
    onSuccess: () => {
      setInviteEmail('');
      setInviteRole('MEMBER');
      queryClient.invalidateQueries({ queryKey: ['project', project?.id, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (data: { memberId: string, role: string }) => {
      const res = await api.put(`/projects/${project?.id}/members/${data.memberId}`, { role: data.role });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', project?.id, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/projects/${project?.id}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', project?.id, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
    }
  });

  const handleUpdateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || (projectName === project?.name && projectDescription === (project?.description || ''))) return;
    updateProjectMutation.mutate({ name: projectName, description: projectDescription });
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMemberMutation.mutate({ email: inviteEmail, role: inviteRole });
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
          <p className="text-zinc-400">You need to be part of a project to access settings.</p>
        </div>
      </div>
    );
  }

  const backHref = boardId ? `/boards/${boardId}` : '/boards';
  const backText = boardId ? 'Back to Board' : 'Back to Boards';

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <Link 
        href={backHref} 
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-50 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {backText}
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-50 flex items-center gap-2">
          <Settings className="w-6 h-6 text-zinc-400" />
          Project Settings
        </h1>
        <p className="text-zinc-400 mt-1">Manage your project preferences and team members.</p>
      </div>

      <div className="space-y-8">
        {/* General Settings */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-zinc-50">General Information</h2>
              <p className="text-sm text-zinc-400 mt-1">Update your project's basic details.</p>
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
                  placeholder="Enter a brief description for this project..."
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!isAdmin || updateProjectMutation.isPending || (projectName === project.name && projectDescription === (project.description || ''))}
                  className="bg-zinc-50 text-zinc-950 px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2 h-9"
                >
                  {updateProjectMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Members Settings */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex justify-between items-start flex-col sm:flex-row gap-4">
            <div>
              <h2 className="text-lg font-medium text-zinc-50 flex items-center gap-2">
                <Users className="w-5 h-5 text-zinc-400" />
                Team Members
              </h2>
              <p className="text-sm text-zinc-400 mt-1">Manage who has access to this project.</p>
            </div>
          </div>
          
          {isAdmin && (
            <div className="p-6 border-b border-zinc-800 bg-zinc-950/50">
              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label htmlFor="inviteEmail" className="block text-sm font-medium text-zinc-400 mb-1.5">
                    Invite via Email
                  </label>
                  <input
                    id="inviteEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    required
                    disabled={inviteMemberMutation.isPending}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                  />
                </div>
                <div className="w-full sm:w-40">
                  <label htmlFor="inviteRole" className="block text-sm font-medium text-zinc-400 mb-1.5">
                    Role
                  </label>
                  <select
                    id="inviteRole"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'MEMBER')}
                    disabled={inviteMemberMutation.isPending}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-700 appearance-none"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={inviteMemberMutation.isPending || !inviteEmail.trim()}
                  className="bg-zinc-50 text-zinc-950 px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2 h-9"
                >
                  {inviteMemberMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Invite
                </button>
              </form>
              {inviteMemberMutation.isError && (
                <p className="text-red-400 text-sm mt-2">
                  {(inviteMemberMutation.error as any)?.response?.data?.error?.message || 'Failed to invite member.'}
                </p>
              )}
            </div>
          )}

          <div className="divide-y divide-zinc-800">
            {membersLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
              </div>
            ) : members?.map((member) => (
              <div key={member.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-800/20 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-50 font-medium shrink-0">
                    {member.user.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-50 truncate">
                      {member.user.username}
                      {member.user_id === me?.id && <span className="ml-2 text-xs text-zinc-500 font-normal">(You)</span>}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">{member.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto ml-13 sm:ml-0">
                  {isAdmin && member.user_id !== me?.id ? (
                    <select
                      value={member.role}
                      onChange={(e) => updateRoleMutation.mutate({ memberId: member.id, role: e.target.value })}
                      disabled={updateRoleMutation.isPending}
                      className="bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-700 cursor-pointer appearance-none"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md">
                      {member.role === 'ADMIN' ? (
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                      <span className="text-xs font-medium text-zinc-300 capitalize">{member.role.toLowerCase()}</span>
                    </div>
                  )}

                  {isAdmin && member.user_id !== me?.id && (
                    <button
                      onClick={() => removeMemberMutation.mutate(member.id)}
                      disabled={removeMemberMutation.isPending}
                      className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors disabled:opacity-50"
                      title="Remove Member"
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
            ))}
            
            {members?.length === 0 && (
              <div className="p-8 text-center text-zinc-400 text-sm">
                No members found in this project.
              </div>
            )}
          </div>
        </section>
      </div>
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
