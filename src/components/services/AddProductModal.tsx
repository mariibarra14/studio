
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AddProductForm } from "./AddProductForm";

type AddProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serviceId: string;
};

export function AddProductModal({ isOpen, onClose, onSuccess, serviceId }: AddProductModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Agregar Nuevo Producto</DialogTitle>
          <DialogDescription>
            Completa la información para agregar un nuevo producto a este servicio.
          </DialogDescription>
        </DialogHeader>
        <AddProductForm
          serviceId={serviceId}
          onSuccess={onSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
