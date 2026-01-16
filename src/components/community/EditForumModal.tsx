
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EditForumForm } from "./EditForumForm";
import type { Forum } from "@/lib/types";

type EditForumModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  forum: Forum;
};

export function EditForumModal({ isOpen, onClose, onSuccess, forum }: EditForumModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar Foro</DialogTitle>
          <DialogDescription>
            Modifica el título y la descripción de tu foro.
          </DialogDescription>
        </DialogHeader>
        <EditForumForm
          forum={forum}
          onSuccess={onSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
