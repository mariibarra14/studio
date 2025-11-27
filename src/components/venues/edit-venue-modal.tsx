
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EditVenueForm } from "./edit-venue-form";
import type { Venue } from "@/lib/types";

type EditVenueModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  venue: Venue;
};

export function EditVenueModal({ isOpen, onClose, onSuccess, venue }: EditVenueModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar Escenario</DialogTitle>
          <DialogDescription>
            Modifica la información del escenario. La ubicación geográfica (ciudad, estado, país) no se puede cambiar.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <EditVenueForm 
            venue={venue} 
            onSuccess={onSuccess} 
            onCancel={onClose} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
