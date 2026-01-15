
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Package, ShoppingBag, DollarSign, Layers } from "lucide-react";
import type { ComplementaryService, Product } from "@/lib/types";

type ProductListModalProps = {
  service: ComplementaryService;
  isOpen: boolean;
  onClose: () => void;
};

export function ProductListModal({ service, isOpen, onClose }: ProductListModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!service.id) return;
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("Sesión expirada: No tiene permisos para ver esta información. Reingrese al sistema.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:44335/api/ServComps/Prods/getProductosByIdServicio?idServicio=${service.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        throw new Error("Sesión expirada: No tiene permisos para ver esta información. Reingrese al sistema.");
      }
      if (response.status === 404) {
        setProducts([]);
        return;
      }
      if (!response.ok) {
        throw new Error("Error de carga: No pudimos obtener los productos de este servicio. Intente nuevamente.");
      }

      const data: Product[] = await response.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [service.id]);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen, fetchProducts]);

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="overflow-hidden">
        <CardHeader className="p-0">
             <div className="relative aspect-video w-full bg-muted">
                {product.fotoProducto && product.fotoProducto !== 'string' ? (
                    <Image src={product.fotoProducto} alt={product.nombre} fill className="object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Package className="h-10 w-10"/>
                    </div>
                )}
             </div>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
            <CardTitle className="text-lg">{product.nombre}</CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">{product.descripcion}</p>
            <div className="flex justify-between items-center pt-2 border-t">
                <div className="flex items-center text-primary font-bold">
                    <DollarSign className="h-4 w-4 mr-1"/>
                    <span>{product.precio.toFixed(2)}</span>
                </div>
                 <div className="flex items-center text-muted-foreground text-sm">
                    <Layers className="h-4 w-4 mr-1"/>
                    <span>Stock: {product.cantidad}</span>
                </div>
            </div>
        </CardContent>
    </Card>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      );
    }

    if (products.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">No hay productos</h3>
            <p className="text-sm text-muted-foreground">Este servicio aún no tiene productos asociados.</p>
        </div>
      )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            {products.map(product => <ProductCard key={product.id} product={product} />)}
        </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Productos de: {service.nombre}</DialogTitle>
          <DialogDescription>
            Aquí se listan todos los productos disponibles para este servicio complementario.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto">
            {renderContent()}
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
