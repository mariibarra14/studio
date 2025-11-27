
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AddEventForm } from "./add-event-form";

type AddEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function AddEventModal({ isOpen, onClose, onSuccess }: AddEventModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Crear Nuevo Evento</DialogTitle>
          <DialogDescription>
            Completa la información a continuación para registrar un nuevo evento.
          </DialogDescription>
        </DialogHeader>
        <AddEventForm onSuccess={onSuccess} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}
