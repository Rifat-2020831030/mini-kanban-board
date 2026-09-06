import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { BoardMember } from '@/types/api';

interface BoardMembersModalProps {
  members: BoardMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BoardMembersModal({ members, open, onOpenChange }: BoardMembersModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content 
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <Dialog.Title className="text-lg font-medium text-zinc-100">
              Board Members
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>
          
          <div className="p-4 max-h-[60vh] overflow-y-auto flex flex-col gap-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800/50">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-medium text-zinc-50 shrink-0">
                  {member.user.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-zinc-100 truncate">
                      {member.user.username}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
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
