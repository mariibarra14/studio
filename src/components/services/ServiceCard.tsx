
"use client";

import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ComplementaryService } from "@/lib/types";

type ServiceCardProps = {
  service: ComplementaryService;
  onSelect: (serviceId: string) => void;
};

export function ServiceCard({ service, onSelect }: ServiceCardProps) {
  return (
    <Card 
        className="flex flex-col overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-transform duration-200"
        onClick={() => onSelect(service.id)}
    >
      <CardHeader className="p-0">
        <div className="relative aspect-video w-full bg-muted">
          {service.fotoServicio && service.fotoServicio !== 'string' ? (
            <Image
              src={service.fotoServicio}
              alt={service.nombre}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
             <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                Sin Imagen
             </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <Badge variant="outline" className="mb-2">{service.tipo}</Badge>
        <CardTitle className="text-xl mb-2">{service.nombre}</CardTitle>
        <CardDescription className="line-clamp-3 text-sm">
          {service.descripcion}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
