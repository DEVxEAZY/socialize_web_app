"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { EventCard } from "@/components/event-card";
import type { Event, Category } from "@/types";

export default function FeedPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mode, setMode] = useState<"recommended" | "all">("recommended");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [eventsRes, catsRes] = await Promise.all([
        api.getEvents(mode),
        api.getCategories(),
      ]);
      setEvents(eventsRes.events);
      setCategories(catsRes.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar eventos");
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-4 px-4 pt-4">
      <div className="flex items-center justify-between border-b border-ig-border pb-3">
        <h1 className="text-2xl font-semibold text-gradient-ig tracking-tight">Socialize</h1>
        <button
          onClick={loadData}
          className="p-2 text-ig-muted hover:text-ig-text transition-colors"
          aria-label="Atualizar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
        </button>
      </div>

      <div className="flex gap-2 pb-2">
        <button
          onClick={() => setMode("recommended")}
          className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors
            ${mode === "recommended"
              ? "bg-ig-text text-white"
              : "bg-transparent text-ig-muted border border-ig-border hover:text-ig-text"
            }`}
        >
          Recomendados
        </button>
        <button
          onClick={() => setMode("all")}
          className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors
            ${mode === "all"
              ? "bg-ig-text text-white"
              : "bg-transparent text-ig-muted border border-ig-border hover:text-ig-text"
            }`}
        >
          Todos
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-sm px-4 py-3 text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            onClick={loadData}
            className="font-semibold text-primary-500 hover:text-primary-600"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-ig-border border-t-ig-text" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <svg className="w-12 h-12 text-ig-border mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <p className="text-ig-muted text-sm">Nenhum evento encontrado</p>
          {mode === "recommended" && (
            <button
              onClick={() => setMode("all")}
              className="text-sm font-semibold text-primary-500 hover:text-primary-600"
            >
              Ver todos os eventos
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-ig-border pb-4 -mx-4">
          {events.map((event) => (
            <div key={event.id} className="px-4 py-3">
              <EventCard event={event} categories={categories} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
