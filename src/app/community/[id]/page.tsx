
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { useApp } from "@/context/app-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft, Send, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

type ForumDetails = {
  id: string;
  eventoId: string;
  titulo: string;
  descripcion: string;
  fechaCreacion: string;
  creadorId: string;
};

type Message = {
  id: string;
  contenido: string;
  fechaCreacion: string;
  usuarioId: string;
  usuario: {
    id: string;
    nombre: string;
    apellido: string;
    fotoPerfil: string | null;
  };
};

const messageSchema = z.object({
  content: z.string().min(1, "El mensaje no puede estar vacío.").max(1000, "El mensaje no puede superar los 1000 caracteres."),
});

export default function ForumDetailPage() {
  const params = useParams();
  const forumId = params.id as string;
  const { user, i18n } = useApp();
  const { t } = useTranslation();
  const locale = i18n.language === 'es' ? es : enUS;

  const [forum, setForum] = useState<ForumDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const form = useForm({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: "" },
  });

  const fetchData = useCallback(async () => {
    setError(null);
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("Tu sesión ha expirado.");
      setIsLoading(false);
      return;
    }

    try {
      // Fetch forum details
      const forumRes = await fetch(`http://localhost:44335/api/foros/${forumId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!forumRes.ok) throw new Error("No se pudo cargar el foro.");
      const forumData = await forumRes.json();
      setForum(forumData);

      // Fetch messages
      const messagesRes = await fetch(`http://localhost:44335/api/foros/${forumId}/mensajes`, {
          headers: { 'Authorization': `Bearer ${token}` },
      });
      if (messagesRes.status === 404) {
          setMessages([]);
      } else if (messagesRes.ok) {
          const messagesData: Message[] = await messagesRes.json();
          // Enrich messages with user info
          const enrichedMessages = await Promise.all(messagesData.map(async (msg) => {
              const userRes = await fetch(`http://localhost:44335/api/Usuarios/getUsuarioById?id=${msg.usuarioId}`, { headers: { 'Authorization': `Bearer ${token}` } });
              const userData = userRes.ok ? await userRes.json() : { nombre: "Usuario", apellido: "Desconocido", fotoPerfil: null };
              return { ...msg, usuario: userData };
          }));
          setMessages(enrichedMessages.sort((a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()));
      } else {
          throw new Error("No se pudieron cargar los mensajes.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [forumId]);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSendMessage = async (values: { content: string }) => {
    if (!user) return;
    const token = localStorage.getItem("accessToken");

    try {
      const response = await fetch('http://localhost:44335/api/foros/mensajes/crear', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foroId,
          usuarioId: user.id,
          contenido: values.content,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo enviar el mensaje.");
      }

      form.reset();
      fetchData(); // Refetch messages
    } catch (err: any) {
      console.error(err);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="p-6 space-y-4">
          <div className="pt-6 space-y-6">
            <div className="flex gap-4 items-start"><Skeleton className="h-12 w-12 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div></div>
            <div className="flex gap-4 items-start"><Skeleton className="h-12 w-12 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div></div>
          </div>
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
    
    if (!forum) {
        return (
            <div className="p-6 text-center">
                <p>Foro no encontrado.</p>
            </div>
        )
    }

    return (
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          {messages.length > 0 ? (
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={msg.usuario.fotoPerfil || undefined} />
                    <AvatarFallback>
                      {msg.usuario.nombre[0]}{msg.usuario.apellido[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold">{msg.usuario.nombre} {msg.usuario.apellido}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(msg.fechaCreacion), "dd MMM, HH:mm", { locale })}</p>
                    </div>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{msg.contenido}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground h-full flex flex-col justify-center items-center">
              <p className="font-semibold text-lg">¡Sé el primero en comentar!</p>
              <p className="text-sm">Todavía no hay mensajes en este foro.</p>
            </div>
          )}
        </ScrollArea>
        <div className="p-4 border-t bg-background">
          <form onSubmit={form.handleSubmit(handleSendMessage)} className="flex items-center gap-4">
            <Textarea
              placeholder="Escribe tu mensaje..."
              className="flex-1 resize-none"
              rows={1}
              {...form.register("content")}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  form.handleSubmit(handleSendMessage)();
                }
              }}
            />
            <Button type="submit" size="icon" disabled={form.formState.isSubmitting}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Enviar mensaje</span>
            </Button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <AuthenticatedLayout>
      <main className="flex flex-col h-[calc(100vh-57px)]">
        <div className="border-b p-4">
            <div className="flex items-start gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/community"><ArrowLeft className="h-4 w-4" /></Link>
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
            </div>
        </div>
        {renderContent()}
      </main>
    </AuthenticatedLayout>
  );
}
