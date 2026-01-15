"use client";

import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
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
        <Badge variant="secondary" className="mb-2">{service.tipo}</Badge>
        <CardTitle className="text-xl mb-2">{service.nombre}</CardTitle>
        <CardDescription className="line-clamp-3 text-sm">
          {service.descripcion}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-4 border-t mt-auto">
        <div className="flex w-full justify-end gap-2">
            <Button 
                variant="outline" 
                size="sm" 
                disabled 
                onClick={(e) => e.stopPropagation()}
            >
                <Edit className="mr-2 h-4 w-4" />
                Editar
            </Button>
            <Button 
                variant="destructive" 
                size="sm" 
                disabled
                onClick={(e) => e.stopPropagation()}
            >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
