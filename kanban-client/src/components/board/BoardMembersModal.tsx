import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, Plus, Shield, Users } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BoardMember } from '@/types/api';
import { api } from '@/lib/api';

interface BoardMembersModalProps {
  members: BoardMember[];
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
    case 'MEMBER':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'VIEWER':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    default:
      return 'bg-zinc-800 text-zinc-300 border-zinc-700';
  }
};

export function BoardMembersModal({ members, projectId, isAdmin, open, onOpenChange }: BoardMembersModalProps) {
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');

  const inviteMemberMutation = useMutation({
    mutationFn: async (data: { email: string, role: string }) => {
      const res = await api.post(`/projects/${projectId}/members`, data);
      return res.data;
    },
    onSuccess: () => {
      setInviteEmail('');
      setInviteRole('MEMBER');
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId, 'members'] });
    }
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMemberMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content 
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
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
          
          <div className="p-4 max-h-[60vh] overflow-y-auto flex flex-col gap-3">
            {isAdmin && (
              <form onSubmit={handleInvite} className="mb-4 flex flex-col gap-3 p-3 border border-zinc-800 rounded-md bg-zinc-950/50">
                <p className="text-sm font-medium text-zinc-300">Invite new member</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Email address..."
                    required
                    disabled={inviteMemberMutation.isPending}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    disabled={inviteMemberMutation.isPending}
                    className="w-28 bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-700 appearance-none"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={inviteMemberMutation.isPending || !inviteEmail.trim()}
                  className="bg-zinc-50 text-zinc-950 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {inviteMemberMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Invite
                </button>
                {inviteMemberMutation.isError && (
                  <p className="text-red-400 text-xs text-center">
                    {(inviteMemberMutation.error as any)?.response?.data?.error?.message || 'Failed to invite member.'}
                  </p>
                )}
              </form>
            )}

            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800/50">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 border ${getRoleColor(member.role)}`}>
                  {member.user.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-zinc-100 truncate">
                      {member.user.username}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-medium border ${getRoleColor(member.role)}`}>
                      {(member.role as string) === 'OWNER' && <Shield className="w-3 h-3 inline-block mr-1" />}
                      {member.role}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500 truncate">
                    {member.user.email}
                  </span>
                  {member.job_title && (
                    <span className="text-xs text-zinc-400 truncate mt-0.5">
                      {member.job_title}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {members.length === 0 && (
              <div className="text-sm text-zinc-400 text-center py-4">
                No members found.
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
