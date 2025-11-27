"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessImage = async () => {
    setIsProcessing(true);
    try {
      // For simplicity, we are just resizing the image. 
      // A more advanced version could use the zoom/pan values to crop.
      const resizedFile = await resizeImage(imageFile, 1200, 1200 / aspectRatio);
      onCropComplete(resizedFile);
      onClose();
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error al procesar la imagen. Por favor, inténtelo de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Failed to get canvas context'));
        }

        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            reject(new Error('Canvas to Blob failed'));
          }
        }, 'image/jpeg', 0.9);
      };
      img.onerror = () => {
        reject(new Error('Image failed to load'));
      };
    });
  };

  if (!imageFile) return null;

  const imageUrl = URL.createObjectURL(imageFile);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Ajustar Imagen del Evento</DialogTitle>
          <p className="text-sm text-muted-foreground">
            La imagen se ajustará automáticamente para el evento.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div 
            className="border rounded-lg p-4 bg-muted/50 max-h-[50vh] overflow-hidden flex items-center justify-center"
          >
            <img
              src={imageUrl}
              alt="Vista previa"
              className="max-w-full max-h-[40vh] object-contain transition-transform duration-200 ease-out"
              style={{
                transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
              }}
            />
          </div>

          <div className="space-y-4 pt-4">
            <div>
              <label htmlFor="zoom-slider" className="text-sm font-medium">Zoom:</label>
              <input
                id="zoom-slider"
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full mt-1 accent-primary"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pos-x-slider" className="text-sm font-medium">Posición Horizontal (X):</label>
                <input
                  id="pos-x-slider"
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={position.x}
                  onChange={(e) => setPosition(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                  className="w-full mt-1 accent-primary"
                />
              </div>
              <div>
                <label htmlFor="pos-y-slider" className="text-sm font-medium">Posición Vertical (Y):</label>
                <input
                  id="pos-y-slider"
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={position.y}
                  onChange={(e) => setPosition(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                  className="w-full mt-1 accent-primary"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button 
            onClick={handleProcessImage} 
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : 'Aplicar Ajustes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
