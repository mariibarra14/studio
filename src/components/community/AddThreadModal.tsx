"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AddThreadForm } from "./AddThreadForm";

type AddThreadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  forumId: string;
};

export function AddThreadModal({ isOpen, onClose, onSuccess, forumId }: AddThreadModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Crear Nuevo Hilo</DialogTitle>
          <DialogDescription>
            Inicia una nueva discusión para que otros usuarios participen.
          </DialogDescription>
        </DialogHeader>
        <AddThreadForm
          forumId={forumId}
          onSuccess={onSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
