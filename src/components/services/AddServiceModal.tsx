
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AddServiceForm } from "./AddServiceForm";
import { UploadServiceImageForm } from "./UploadServiceImageForm";

type AddServiceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function AddServiceModal({ isOpen, onClose, onSuccess }: AddServiceModalProps) {
  const [step, setStep] = useState<"form" | "image">("form");
  const [newServiceId, setNewServiceId] = useState<string | null>(null);

  const handleFormSuccess = (serviceId: string) => {
    setNewServiceId(serviceId);
    setStep("image");
  };

  const handleClose = () => {
    setStep("form");
    setNewServiceId(null);
    onClose();
  };

  const handleFinalSuccess = () => {
    handleClose();
    onSuccess();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {step === "form" ? "Paso 1: Crear Nuevo Servicio" : "Paso 2: Subir Imagen (Opcional)"}
          </DialogTitle>
          <DialogDescription>
            {step === "form" 
              ? "Completa la información para registrar un nuevo servicio."
              : "El servicio fue creado. Ahora puedes subir una imagen representativa o finalizar."
            }
          </DialogDescription>
        </DialogHeader>
        {step === "form" ? (
          <AddServiceForm onSuccess={handleFormSuccess} onCancel={handleClose} />
        ) : newServiceId ? (
          <UploadServiceImageForm
            serviceId={newServiceId}
            onSuccess={handleFinalSuccess}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
