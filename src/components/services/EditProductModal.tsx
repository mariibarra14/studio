"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EditProductForm } from "./EditProductForm";
import type { Product } from "@/lib/types";

type EditProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product;
};

export function EditProductModal({ isOpen, onClose, onSuccess, product }: EditProductModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar Producto</DialogTitle>
          <DialogDescription>
            Modifica la información del producto. Los cambios se guardarán al hacer clic en "Guardar Cambios".
          </DialogDescription>
        </DialogHeader>
        <EditProductForm
          product={product}
          onSuccess={onSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
