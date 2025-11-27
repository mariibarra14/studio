
"use client";

import { useState, useRef } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File;
  onCropComplete: (croppedFile: File) => void;
  aspectRatio?: number;
}

export function ImageCropperModal({ 
  isOpen, 
  onClose, 
  imageFile, 
  onCropComplete, 
  aspectRatio = 16/9 
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const generateCroppedImage = async (): Promise<File | null> => {
    if (!imgRef.current || !completedCrop || completedCrop.width === 0 || completedCrop.height === 0) {
      return null;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], imageFile.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(croppedFile);
        } else {
          resolve(null);
        }
      }, 'image/jpeg', 0.9);
    });
  };

  const handleApplyCrop = async () => {
    if (!completedCrop) {
      return;
    }

    setIsCropping(true);
    try {
      const croppedFile = await generateCroppedImage();
      if (croppedFile) {
        onCropComplete(croppedFile);
      }
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsCropping(false);
    }
  };

  const imageUrl = URL.createObjectURL(imageFile);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Recortar Imagen del Evento</DialogTitle>
          <DialogDescription>
            Ajusta el recuadro para seleccionar la parte de la imagen que quieres mostrar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow flex items-center justify-center min-h-0 p-4 bg-muted/50 rounded-lg">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            minWidth={200}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Recortar"
              style={{ maxHeight: '65vh', objectFit: 'contain' }}
              onLoad={(e) => {
                const { width, height } = e.currentTarget;
                const newCrop: Crop = {
                  unit: '%',
                  width: 80,
                  height: (80 * height) / width / aspectRatio,
                  x: 10,
                  y: 10,
                };
                setCrop(newCrop);
              }}
            />
          </ReactCrop>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCropping}>
            Cancelar
          </Button>
          <Button 
            onClick={handleApplyCrop} 
            disabled={!completedCrop || isCropping}
          >
            {isCropping ? <Loader2 className="animate-spin" /> : 'Aplicar Recorte'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
