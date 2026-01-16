"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import AuthenticatedLayout from "@/components/layout/authenticated-layout";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, MessageSquare, RefreshCw, PlusCircle } from "lucide-react";
import type { Forum, ApiEvent } from "@/lib/types";
import { ForumCard } from "@/components/community/ForumCard";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/app-context";
import { AddForumModal } from "@/components/community/AddForumModal";

export default function MyCommunityPage() {
  const { t } = useTranslation();
  const { user, userRole } = useApp();

  const [allForums, setAllForums] = useState<Forum[]>([]);
  const [allEvents, setAllEvents] = useState<ApiEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError(t('community.error_auth_desc'));
      setIsLoading(false);
      return;
    }

    try {
      const [forumsRes, eventsRes] = await Promise.all([
        fetch("http://localhost:44335/api/foros/todos", {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch("http://localhost:44335/api/events", {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
      ]);

      if (forumsRes.status === 401 || eventsRes.status === 401) {
        throw new Error(t('community.error_auth_desc'));
      }
      
      if (!forumsRes.ok || !eventsRes.ok) {
        throw new Error(t('community.error_loading_desc'));
      }
      
      const forumsData = await forumsRes.json();
      const eventsData = await eventsRes.json();

      setAllForums(forumsData);
      setAllEvents(eventsData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const myForums = useMemo(() => {
    if (!user || !allEvents.length || !allForums.length) return [];
    
    const myEventIds = new Set(allEvents.filter(e => e.organizadorId === user.id).map(e => e.id));
    
    return allForums.filter(forum => myEventIds.has(forum.eventoId));
  }, [allForums, allEvents, user]);

  const enrichedForums = useMemo(() => {
    if (myForums.length === 0 || allEvents.length === 0) return [];
    
    return myForums.map(forum => ({
      ...forum,
      event: allEvents.find(e => e.id === forum.eventoId)
    })).sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
  }, [myForums, allEvents]);


  const handleCreateSuccess = () => {
    setIsAddModalOpen(false);
    fetchData();
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-lg" />)}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg text-center p-8 mt-4 bg-card">
          <Alert variant="destructive" className="max-w-md border-0">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('community.error_loading_title')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchData} className="mt-6">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('events.retry')}
          </Button>
        </div>
      );
    }

    if (enrichedForums.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg text-center p-8 mt-4">
          <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-2xl font-semibold text-muted-foreground mb-2">
            {t('my_community.no_forums_title')}
          </p>
          <p className="text-muted-foreground">
            {t('my_community.no_forums_desc')}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrichedForums.map(({ event, ...forum }) => (
          <ForumCard
            key={forum.id}
            forum={forum}
            event={event}
          />
        ))}
      </div>
    );
  };

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t('my_community.title')}</h1>
            <p className="text-muted-foreground">{t('my_community.subtitle')}</p>
          </div>
          {(userRole === 'organizador' || userRole === 'administrador') && (
            <Button onClick={() => setIsAddModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Foro
            </Button>
          )}
        </div>
        {renderContent()}
      </main>

      {isAddModalOpen && (
        <AddForumModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </AuthenticatedLayout>
  );
}
