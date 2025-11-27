
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EditEventForm } from './edit-event-form';
import type { ApiEvent, Venue } from '@/lib/types';
import { getAllCategories, type Category } from '@/lib/categories';
import { Skeleton } from '../ui/skeleton';

type EditEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  event: ApiEvent | null;
  onUpdateSuccess: () => void;
};

export function EditEventModal({ isOpen, onClose, event, onUpdateSuccess }: EditEventModalProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoadingVenues, setIsLoadingVenues] = useState(true);
  const categories = getAllCategories();

  useEffect(() => {
    if (isOpen) {
      const fetchVenues = async () => {
        setIsLoadingVenues(true);
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setIsLoadingVenues(false);
          return;
        }

        try {
          const response = await fetch('http://localhost:44335/api/events/escenarios', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setVenues(data.items || []);
          }
        } catch (error) {
          console.error("Failed to fetch venues", error);
        } finally {
          setIsLoadingVenues(false);
        }
      };
      fetchVenues();
    }
  }, [isOpen]);

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar Evento</DialogTitle>
          <DialogDescription>
            Realiza cambios en la información de tu evento. Haz clic en "Guardar Cambios" cuando termines.
          </DialogDescription>
        </DialogHeader>
        {isLoadingVenues ? (
            <div className="py-4 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <Skeleton className="h-10 w-full" />
            </div>
        ) : (
            <EditEventForm
                event={event}
                venues={venues}
                categories={categories}
                onSuccess={onUpdateSuccess}
                onCancel={onClose}
            />
        )}
      </DialogContent>
    </Dialog>
  );
}
