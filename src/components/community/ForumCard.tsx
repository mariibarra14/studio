"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar } from "lucide-react";
import type { Forum, ApiEvent } from "@/lib/types";

type ForumCardProps = {
  forum: Forum;
  event: ApiEvent | undefined;
};

export function ForumCard({ forum, event }: ForumCardProps) {
  const { i18n, t } = useTranslation();
  const locale = i18n.language === 'es' ? es : enUS;

  return (
    <Link href={`/community/${forum.id}`} className="block group">
      <Card className="h-full flex flex-col overflow-hidden transition-shadow duration-300 group-hover:shadow-xl">
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
        <CardFooter className="p-4 pt-0 justify-between items-center text-sm text-muted-foreground">
           <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(forum.fechaCreacion), "dd MMM, yyyy", { locale })}</span>
           </div>
           <Button variant="ghost" className="h-auto p-1 text-primary group-hover:underline">
             {t('community.join_discussion')}
             <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
           </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
