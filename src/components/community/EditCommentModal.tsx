
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EditCommentForm } from "./EditCommentForm";
import type { EnrichedForumComment } from "@/lib/types";

type EditCommentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  comment: EnrichedForumComment;
  forumId: string;
  threadId: string;
};

export function EditCommentModal({ isOpen, onClose, onSuccess, comment, forumId, threadId }: EditCommentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar Comentario</DialogTitle>
          <DialogDescription>
            Realiza los cambios necesarios en tu comentario y haz clic en "Guardar Cambios".
          </DialogDescription>
        </DialogHeader>
        <EditCommentForm
          comment={comment}
          forumId={forumId}
          threadId={threadId}
          onSuccess={onSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
