
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EditZoneForm } from "./edit-zone-form";
import type { Zone } from "@/lib/types";

type EditZoneModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventId: string;
  zone: Zone;
};

export function EditZoneModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  eventId, 
  zone
}: EditZoneModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar Zona</DialogTitle>
          <DialogDescription>
            Modifica el nombre y el precio de la zona. Otros campos no son editables.
          </DialogDescription>
        </DialogHeader>
        <EditZoneForm 
          eventId={eventId}
          zone={zone}
          onSuccess={onSuccess} 
          onCancel={onClose} 
        />
      </DialogContent>
    </Dialog>
  );
}
