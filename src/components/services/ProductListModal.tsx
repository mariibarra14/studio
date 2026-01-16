"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Package, ShoppingBag, DollarSign, Layers, PlusCircle, Trash2, Edit } from "lucide-react";
import type { ComplementaryService, Product } from "@/lib/types";
import { AddProductModal } from "./AddProductModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { EditProductModal } from "./EditProductModal";

type ProductListModalProps = {
  service: ComplementaryService;
  isOpen: boolean;
  onClose: () => void;
};

export function ProductListModal({ service, isOpen, onClose }: ProductListModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const handleAddProductSuccess = () => {
    setIsAddProductModalOpen(false);
    fetchProducts();
  };
  
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleEditProductSuccess = () => {
      setIsEditModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(true);
    const token = localStorage.getItem("accessToken");

    if (!token) {
        toast({ variant: "destructive", title: "Acceso Denegado", description: "Tu sesión ha expirado o no tienes permisos para realizar esta acción." });
        setIsDeleting(false);
        return;
    }

    try {
        const response = await fetch(`http://localhost:44335/api/ServComps/Prods/eliminarProducto?idProducto=${productToDelete.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const responseText = await response.text();

        if (response.ok && responseText.includes("Producto eliminado exitosamente")) {
            toast({ title: "¡Producto eliminado con éxito!" });
            fetchProducts(); // Refresh list
        } else {
            let errorMessage = "Error al eliminar: No pudimos borrar el producto en este momento. Por favor, intenta de nuevo.";
            if(response.status === 401) {
                errorMessage = "Acceso Denegado: Tu sesión ha expirado o no tienes permisos para realizar esta acción.";
            }
            throw new Error(errorMessage);
        }
    } catch (err: any) {
        toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
        setIsDeleting(false);
        setProductToDelete(null);
    }
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="overflow-hidden flex flex-col">
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
        <CardContent className="p-4 space-y-2 flex-grow">
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
        <CardFooter className="p-4 pt-0 grid grid-cols-2 gap-2">
            <Button variant="outline" className="w-full" onClick={() => handleOpenEditModal(product)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
            </Button>
            <Button variant="destructive" className="w-full" onClick={() => setProductToDelete(product)} disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
            </Button>
        </CardFooter>
    </Card>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {products.map(product => <ProductCard key={product.id} product={product} />)}
        </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex justify-between items-center">
                <div>
                    <DialogTitle className="text-2xl">Productos de: {service.nombre}</DialogTitle>
                    <DialogDescription>
                        Aquí se listan todos los productos disponibles para este servicio complementario.
                    </DialogDescription>
                </div>
                <Button variant="outline" onClick={() => setIsAddProductModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Producto
                </Button>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto">
              {renderContent()}
          </div>
          <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de que deseas eliminar este producto?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. El producto "{productToDelete?.nombre}" será eliminado permanentemente.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting ? <Loader2 className="animate-spin" /> : "Sí, eliminar"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onSuccess={handleAddProductSuccess}
        serviceId={service.id}
      />

      {isEditModalOpen && editingProduct && (
          <EditProductModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSuccess={handleEditProductSuccess}
              product={editingProduct}
          />
      )}
    </>
  );
}
