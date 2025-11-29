
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
  aspectRatio: "square" | "banner";
};

// Configuración para banner horizontal (16:9)
const BANNER_ASPECT = 16 / 9;
const BANNER_WIDTH = 1200;
const BANNER_HEIGHT = 675;

// Configuración para avatar cuadrado (1:1)
const SQUARE_ASPECT = 1 / 1;
const SQUARE_SIZE = 400;


function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 80,
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
  aspectRatio,
}: ImageCropperModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [zoom, setZoom] = useState(1);
  
  const isBanner = aspectRatio === 'banner';
  const aspect = isBanner ? BANNER_ASPECT : SQUARE_ASPECT;
  const outputWidth = isBanner ? BANNER_WIDTH : SQUARE_SIZE;
  const outputHeight = isBanner ? BANNER_HEIGHT : SQUARE_SIZE;
  const title = isBanner ? "Recortar Imagen para Banner" : "Recortar Foto de Perfil";
  const buttonText = isBanner ? "Confirmar Recorte para Banner" : "Confirmar Foto de Perfil";


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
    
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }
    
    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      outputWidth,
      outputHeight
    );
    
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error("Canvas is empty");
        return;
      }
      const croppedFile = new File([blob], "cropped_image.jpg", { 
        type: "image/jpeg"
      });
      onCropComplete(croppedFile);
    }, "image/jpeg", 0.9);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon />
            {title}
          </DialogTitle>
           <p className="text-sm text-gray-600 mt-2">
            Ajusta el zoom y la selección para obtener el mejor resultado.
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
                minWidth={isBanner ? 100 : 50}
                minHeight={isBanner ? 56 : 50}
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
                  min={0.5}
                  max={3}
                  step={0.1}
                  onValueChange={(value) => setZoom(value[0])}
                />
              </div>
              <ZoomIn className="text-gray-500" />
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
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
