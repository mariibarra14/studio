
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AddForumForm } from "./AddForumForm";

type AddForumModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function AddForumModal({ isOpen, onClose, onSuccess }: AddForumModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Crear Nuevo Foro</DialogTitle>
          <DialogDescription>
            Inicia una nueva conversación para uno de tus eventos.
          </DialogDescription>
        </DialogHeader>
        <AddForumForm
          onSuccess={onSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
