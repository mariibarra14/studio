
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AddVenueForm } from "./add-venue-form";

type AddVenueModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function AddVenueModal({ isOpen, onClose, onSuccess }: AddVenueModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Agregar Nuevo Escenario</DialogTitle>
          <DialogDescription>
            Completa la información a continuación para registrar un nuevo escenario. Todos los campos son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <AddVenueForm onSuccess={onSuccess} onCancel={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
