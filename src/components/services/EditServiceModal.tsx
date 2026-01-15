"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EditServiceForm } from "./EditServiceForm";
import type { ComplementaryService } from "@/lib/types";

type EditServiceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  service: ComplementaryService;
};

export function EditServiceModal({ isOpen, onClose, onSuccess, service }: EditServiceModalProps) {

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar Servicio</DialogTitle>
          <DialogDescription>
            Modifica la información del servicio. Los cambios de información y de imagen se guardan por separado.
          </DialogDescription>
        </DialogHeader>
        <EditServiceForm service={service} onSuccess={onSuccess} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}
