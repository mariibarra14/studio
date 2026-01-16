"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Edit, Trash2 } from "lucide-react";
import type { Forum, ApiEvent } from "@/lib/types";

type ForumCardProps = {
  forum: Forum;
  event: ApiEvent | undefined;
  userId?: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function ForumCard({ forum, event, userId, onEdit, onDelete }: ForumCardProps) {
  const { i18n, t } = useTranslation();
  const locale = i18n.language === 'es' ? es : enUS;
  
  const isOwner = userId && forum.creadorId === userId;
  const canManage = isOwner && onEdit && onDelete;

  return (
    <Card className="h-full flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl group">
      <Link href={`/community/${forum.id}`} className="block">
        <CardHeader className="p-0">
          <div className="relative aspect-video w-full bg-muted">
            {event?.imagenUrl ? (
              <Image
                src={event.imagenUrl}
                alt={event.nombre}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : null}
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-4 flex flex-col justify-end">
                <h3 className="font-semibold text-lg text-white drop-shadow-md">{event?.nombre || t('community.unknown_event')}</h3>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">{forum.titulo}</CardTitle>
          <CardDescription className="line-clamp-3">{forum.descripcion}</CardDescription>
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-0 justify-between items-center text-sm text-muted-foreground">
         <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{format(new Date(forum.fechaCreacion), "dd MMM, yyyy", { locale })}</span>
         </div>
         {canManage ? (
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={onEdit}><Edit className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
         ) : (
           <Link href={`/community/${forum.id}`} className="inline-flex items-center text-primary group-hover:underline">
             {t('community.join_discussion')}
             <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
           </Link>
         )}
      </CardFooter>
    </Card>
  );
}
