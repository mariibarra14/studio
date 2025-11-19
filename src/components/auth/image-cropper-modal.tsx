
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

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
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
  const aspect = 1;

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

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
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
      completedCrop.width,
      completedCrop.height
    );
    
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error("Canvas is empty");
        return;
      }
      const croppedFile = new File([blob], "cropped_image.png", { type: "image/png" });
      onCropComplete(croppedFile);
    }, "image/png");
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon />
            Recortar Imagen
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center">
          {imageSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              className="max-h-[60vh]"
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imageSrc}
                style={{ transform: `scale(${zoom})` }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          )}
          <div className="w-full max-w-xs space-y-4 p-4">
            <div className="flex items-center gap-2">
              <ZoomOut />
              <Slider
                defaultValue={[1]}
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(value) => setZoom(value[0])}
              />
              <ZoomIn />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleConfirmCrop}>Confirmar Recorte</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

