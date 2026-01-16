
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { useApp } from "@/context/app-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft, Send, Calendar, MessageSquare, Edit, Trash2, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Forum, EnrichedForumThread, ForumThread } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { EditForumModal } from "@/components/community/EditForumModal";
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


export default function ForumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const forumId = params.id as string;
  const { user } = useApp();
  const { i18n } = useApp();
  const { t } = useTranslation();
  const locale = i18n.language === 'es' ? es : enUS;
  const { toast } = useToast();

  const [forum, setForum] = useState<Forum | null>(null);
  const [threads, setThreads] = useState<EnrichedForumThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingForum, setEditingForum] = useState<Forum | null>(null);
  const [deletingForum, setDeletingForum] = useState<Forum | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isOwner = useMemo(() => user && forum && user.id === forum.creadorId, [user, forum]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("Tu sesión ha expirado.");
      setIsLoading(false);
      return;
    }

    try {
      const [forumRes, threadsRes] = await Promise.all([
        fetch(`http://localhost:44335/api/foros/${forumId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`http://localhost:44335/api/foros/${forumId}/hilos`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);
      
      if (!forumRes.ok) throw new Error("No se pudo cargar el foro.");
      const forumData = await forumRes.json();
      setForum(forumData);

      if (threadsRes.status === 404) {
        setThreads([]);
        setIsLoading(false);
        return;
      }
      if (!threadsRes.ok) throw new Error("No se pudieron cargar los hilos de discusión.");
      
      const rawThreads: ForumThread[] = await threadsRes.json();

      // Enrich threads and comments with author info
      const authorIds = new Set<string>();
      rawThreads.forEach(thread => {
        authorIds.add(thread.autorId);
        thread.comentarios.forEach(comment => authorIds.add(comment.autorId));
      });
      
      const authorCache = new Map<string, any>();
      const authorPromises = Array.from(authorIds).map(async (authorId) => {
        try {
          const userRes = await fetch(`http://localhost:44335/api/Usuarios/getUsuarioById?id=${authorId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            authorCache.set(authorId, userData);
          }
        } catch (e) {
          console.error(`Failed to fetch author ${authorId}`, e);
        }
      });
      await Promise.all(authorPromises);
      
      const enrichedThreads: EnrichedForumThread[] = rawThreads.map(thread => ({
        ...thread,
        author: authorCache.get(thread.autorId) || { nombre: "Usuario", apellido: "Desconocido", fotoPerfil: null },
        comentarios: thread.comentarios.map(comment => ({
          ...comment,
          author: authorCache.get(comment.autorId) || { nombre: "Usuario", apellido: "Desconocido", fotoPerfil: null },
        })).sort((a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()),
      }));

      setThreads(enrichedThreads.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()));

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [forumId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleEditSuccess = () => {
    setEditingForum(null);
    fetchData(); // Refetch forum data to show updates
  };

  const handleDeleteForum = async () => {
    if (!deletingForum) return;

    setIsProcessing(true);
    const token = localStorage.getItem("accessToken");

    try {
      const response = await fetch(`http://localhost:44335/api/foros/${deletingForum.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 204) {
        toast({ title: "Foro eliminado correctamente." });
        router.push('/community/my');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "No se pudo eliminar el foro.");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error al eliminar", description: err.message });
    } finally {
      setIsProcessing(false);
      setDeletingForum(null);
    }
  };


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="p-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
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
    
    if (threads.length === 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
            <MessageSquare className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">Aún no hay discusiones</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                ¡Sé el primero en iniciar un nuevo hilo de discusión en este foro!
            </p>
        </div>
      );
    }

    return (
      <ScrollArea className="flex-1 p-6">
        <Accordion type="single" collapsible className="w-full space-y-4">
          {threads.map((thread) => (
            <AccordionItem key={thread.id} value={thread.id} className="border rounded-lg bg-card">
              <AccordionTrigger className="p-4 hover:no-underline">
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-base">{thread.titulo}</h4>
                  <div className="text-xs text-muted-foreground flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1.5">
                         <Avatar className="h-5 w-5">
                            <AvatarImage src={thread.author?.fotoPerfil || undefined} />
                            <AvatarFallback className="text-xs">{thread.author?.nombre[0]}{thread.author?.apellido[0]}</AvatarFallback>
                         </Avatar>
                         <span>{thread.author?.nombre} {thread.author?.apellido}</span>
                      </div>
                      <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3"/>{format(new Date(thread.fechaCreacion), "dd MMM yyyy", { locale })}</span>
                      <span className="flex items-center gap-1.5"><MessageSquare className="h-3 w-3"/>{thread.comentarios.length} Comentarios</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 pt-0">
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap border-b pb-4 mb-4">{thread.contenido}</p>
                  <div className="space-y-4">
                      <h5 className="font-semibold text-sm">Comentarios</h5>
                      {thread.comentarios.length > 0 ? (
                        thread.comentarios.map(comment => (
                           <div key={comment.id} className="flex items-start gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.author?.fotoPerfil || undefined} />
                                <AvatarFallback>{comment.author?.nombre[0]}{comment.author?.apellido[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 bg-muted/50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 text-xs">
                                  <p className="font-semibold">{comment.author?.nombre} {comment.author?.apellido}</p>
                                  <p className="text-muted-foreground">{format(new Date(comment.fechaCreacion), "dd MMM, HH:mm", { locale })}</p>
                                </div>
                                <p className="text-sm mt-1 whitespace-pre-wrap">{comment.contenido}</p>
                              </div>
                           </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No hay comentarios en este hilo.</p>
                      )}
                  </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    );
  };

  return (
    <AuthenticatedLayout>
      <main className="flex flex-col h-[calc(100vh-57px)]">
        <div className="border-b p-4">
            <div className="flex items-start gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href={isOwner ? "/community/my" : "/community"}><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold">{forum?.titulo || <Skeleton className="h-6 w-48" />}</h1>
                    <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
                        <p className="flex-1">{forum?.descripcion || <Skeleton className="h-4 w-64 mt-1" />}</p>
                        {forum && (
                            <div className="flex items-center gap-1.5 shrink-0">
                                <Calendar className="h-4 w-4" />
                                <span>Creado el {format(new Date(forum.fechaCreacion), "dd MMM, yyyy", { locale })}</span>
                            </div>
                        )}
                    </div>
                </div>
                {isOwner && forum && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingForum(forum)}>
                      <Edit className="mr-2 h-4 w-4"/>
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeletingForum(forum)}>
                      <Trash2 className="mr-2 h-4 w-4"/>
                      Eliminar
                    </Button>
                  </div>
                )}
            </div>
        </div>
        {renderContent()}
      </main>

      {editingForum && (
        <EditForumModal
          forum={editingForum}
          isOpen={!!editingForum}
          onClose={() => setEditingForum(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      <AlertDialog open={!!deletingForum} onOpenChange={() => setDeletingForum(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres eliminar este foro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente y no se puede deshacer. El foro "{deletingForum?.titulo}" será eliminado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteForum} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="animate-spin" /> : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AuthenticatedLayout>
  );
}
