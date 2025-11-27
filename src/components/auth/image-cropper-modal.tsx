
"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Slider } from "@/components/ui/slider";
import { CropIcon, ZoomIn, ZoomOut } from "lucide-react";

type ImageCropperModalProps = {
  isOpen: boolean;
  onClose: () => void;
  imageSrc?: string;
  onCropComplete: (croppedFile: File) => void;
};

// Configuración para banner horizontal (16:9 - formato estándar para banners)
const BANNER_ASPECT = 16 / 9; // 👈 Cambiado a 16:9 para formato horizontal
const BANNER_WIDTH = 1200;    // Ancho recomendado para banners
const BANNER_HEIGHT = 675;    // Alto calculado (1200 / 16 * 9 = 675)

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 80, // 👈 Área de recorte inicial un poco más pequeña para mejor ajuste
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function ImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
}: ImageCropperModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [zoom, setZoom] = useState(1);
  const aspect = BANNER_ASPECT; // 👈 Usamos el aspect ratio de banner

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect));
  }

  async function handleConfirmCrop() {
    if (!completedCrop || !imgRef.current) {
      return;
    }

    const canvas = document.createElement("canvas");
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    // 👇 Establecemos dimensiones fijas para el banner
    canvas.width = BANNER_WIDTH;
    canvas.height = BANNER_HEIGHT;
    
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }
    
    // Dibujamos la imagen recortada redimensionada a las dimensiones del banner
    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      BANNER_WIDTH,  // 👈 Ancho fijo del banner
      BANNER_HEIGHT  // 👈 Alto fijo del banner
    );
    
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error("Canvas is empty");
        return;
      }
      const croppedFile = new File([blob], "banner_image.jpg", { 
        type: "image/jpeg"  // 👈 Cambiado a JPEG para mejor compresión
      });
      onCropComplete(croppedFile);
    }, "image/jpeg", 0.9); // 👈 Calidad del 90% para JPEG
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl"> {/* 👈 Contenedor más ancho */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon />
            Recortar Imagen para Banner
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Recorta tu imagen en formato horizontal (16:9). El área de recorte se ajustará automáticamente a {BANNER_WIDTH}x{BANNER_HEIGHT}px.
          </p>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center">
          {imageSrc && (
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-2 bg-blue-50">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                className="max-h-[50vh]"
                minWidth={100}
                minHeight={56} // 👈 Mínimo proporcional al aspect ratio
                keepSelection={true}
              >
                <img
                  ref={imgRef}
                  alt="Imagen para recortar"
                  src={imageSrc}
                  style={{ 
                    transform: `scale(${zoom})`,
                    maxHeight: "50vh",
                    width: "auto"
                  }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </div>
          )}
          
          <div className="w-full max-w-md space-y-4 p-4 mt-4">
            <div className="flex items-center gap-3">
              <ZoomOut className="text-gray-500" />
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Zoom: {zoom.toFixed(1)}x
                </label>
                <Slider
                  value={[zoom]}
                  min={0.5}  // 👈 Zoom out más permitido
                  max={3}
                  step={0.1}
                  onValueChange={(value) => setZoom(value[0])}
                />
              </div>
              <ZoomIn className="text-gray-500" />
            </div>
            
            <div className="text-xs text-gray-500 space-y-1">
              <p>• El recorte se ajustará automáticamente a formato 16:9</p>
              <p>• Usa el zoom para enfocar mejor la imagen</p>
              <p>• Arrastra el recorte para seleccionar la mejor parte</p>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button 
            onClick={handleConfirmCrop}
            disabled={!completedCrop}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Confirmar Recorte para Banner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
