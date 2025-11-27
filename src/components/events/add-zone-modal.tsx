
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AddZoneForm } from "./add-zone-form";

type AddZoneModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventId: string;
  escenarioId: string;
};

export function AddZoneModal({ isOpen, onClose, onSuccess, eventId, escenarioId }: AddZoneModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Añadir Nueva Zona</DialogTitle>
          <DialogDescription>
            Completa la información para crear una nueva zona para tu evento. Los asientos se generarán automáticamente.
          </DialogDescription>
        </DialogHeader>
        <AddZoneForm 
          eventId={eventId} 
          escenarioId={escenarioId}
          onSuccess={onSuccess} 
          onCancel={onClose} 
        />
      </DialogContent>
    </Dialog>
  );
}
