import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, Plus, Shield, Users, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BoardMember } from '@/types/api';
import { api } from '@/lib/api';

interface BoardMembersModalProps {
  members: BoardMember[];
  boardId?: string;
  projectId: string;
  isAdmin: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'OWNER':
    case 'ADMIN':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'EDITOR':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'MEMBER':
    case 'VIEWER':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    default:
      return 'bg-zinc-800 text-zinc-300 border-zinc-700';
  }
};

export function BoardMembersModal({ members, boardId, projectId, isAdmin, open, onOpenChange }: BoardMembersModalProps) {
  const queryClient = useQueryClient();
  const activeBoardId = boardId || (members && members.length > 0 ? members[0].board_id : undefined);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'OWNER' | 'EDITOR' | 'MEMBER'>('MEMBER');
  const [inviteJobTitle, setInviteJobTitle] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch board-specific members
  const { data: boardMembers } = useQuery<BoardMember[]>({
    queryKey: ['board-members', activeBoardId],
    queryFn: async () => {
      const res = await api.get(`/boards/${activeBoardId}/members`);
      return res.data;
    },
    enabled: !!activeBoardId && open,
  });

  const displayMembers = boardMembers || members || [];

  // Add member directly to board
  const inviteBoardMemberMutation = useMutation({
    mutationFn: async (data: { email: string; role: string; jobTitle?: string }) => {
      const res = await api.post(`/boards/${activeBoardId}/members`, data);
      return res.data;
    },
    onSuccess: () => {
      setInviteEmail('');
      setInviteJobTitle('');
      setInviteRole('MEMBER');
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['board-members', activeBoardId] });
      queryClient.invalidateQueries({ queryKey: ['board', activeBoardId] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error?.message || 'Failed to add member to board.');
    }
  });

  // Change member role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const res = await api.patch(`/boards/${activeBoardId}/members/${memberId}`, { role });
      return res.data;
    },
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['board-members', activeBoardId] });
      queryClient.invalidateQueries({ queryKey: ['board', activeBoardId] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error?.message || 'Failed to update member role.');
    }
  });

  // Remove member from board
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/boards/${activeBoardId}/members/${memberId}`);
    },
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['board-members', activeBoardId] });
      queryClient.invalidateQueries({ queryKey: ['board', activeBoardId] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error?.message || 'Failed to remove member from board.');
    }
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeBoardId) return;
    inviteBoardMemberMutation.mutate({
      email: inviteEmail.trim(),
      role: inviteRole,
      jobTitle: inviteJobTitle.trim() || undefined
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content 
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <Dialog.Title className="text-lg font-medium text-zinc-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-zinc-400" />
              Board Members
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>
          
          <div className="p-4 max-h-[65vh] overflow-y-auto flex flex-col gap-3">
            {actionError && (
              <p className="text-red-400 text-xs p-2.5 rounded bg-red-500/10 border border-red-500/20">
                {actionError}
              </p>
            )}

            {isAdmin && activeBoardId && (
              <form onSubmit={handleInvite} className="mb-4 flex flex-col gap-3 p-3 border border-zinc-800 rounded-md bg-zinc-950/50">
                <p className="text-sm font-medium text-zinc-300">Add member to board</p>
                <div className="flex flex-col gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="User email address..."
                    required
                    disabled={inviteBoardMemberMutation.isPending}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                  />
                  <div className="flex gap-2 overflow-hidden">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      disabled={inviteBoardMemberMutation.isPending}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-700 cursor-pointer"
                    >
                      <option value="MEMBER">Member (Read-only / Self-assign)</option>
                      <option value="EDITOR">Editor (Task & Label Management)</option>
                      <option value="OWNER">Owner (Board PM / Full Control)</option>
                    </select>
                    <input
                      type="text"
                      value={inviteJobTitle}
                      onChange={(e) => setInviteJobTitle(e.target.value)}
                      placeholder="Job title (optional)"
                      disabled={inviteBoardMemberMutation.isPending}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={inviteBoardMemberMutation.isPending || !inviteEmail.trim()}
                  className="bg-zinc-50 text-zinc-950 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {inviteBoardMemberMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add to Board
                </button>
              </form>
            )}

            {displayMembers.map((member: any) => (
              <div key={member.id} className="flex items-center justify-between gap-3 p-2.5 rounded-md hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 border ${getRoleColor(member.role)}`}>
                    {member.user?.username ? member.user.username.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-sm text-zinc-100 truncate">
                      {member.user?.username}
                    </span>
                    <span className="text-xs text-zinc-500 truncate">
                      {member.user?.email}
                    </span>
                    {member.job_title && (
                      <span className="text-xs text-zinc-400 truncate mt-0.5">
                        {member.job_title}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isAdmin ? (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => updateRoleMutation.mutate({ memberId: member.id, role: e.target.value })}
                        disabled={updateRoleMutation.isPending}
                        className="bg-zinc-950 border border-zinc-800 rounded-md px-2 py-1 text-xs text-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-700 cursor-pointer"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="EDITOR">Editor</option>
                        <option value="OWNER">Owner</option>
                      </select>

                      <button
                        onClick={() => removeMemberMutation.mutate(member.id)}
                        disabled={removeMemberMutation.isPending}
                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors disabled:opacity-50"
                        title="Remove member from board"
                      >
                        {removeMemberMutation.isPending && removeMemberMutation.variables === member.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </>
                  ) : (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-medium border ${getRoleColor(member.role)}`}>
                      {(member.role as string) === 'OWNER' && <Shield className="w-3 h-3 inline-block mr-1" />}
                      {member.role}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {displayMembers.length === 0 && (
              <div className="text-sm text-zinc-400 text-center py-4">
                No members on this board.
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
