"use client";

import { useEffect, useState } from "react";
import type { Event, Category } from "@/types";
import { CategoryBadge } from "./category-badge";
import { formatDateTime, formatRelative } from "@/lib/utils";
import { api } from "@/lib/api";

interface EventCardProps {
  event: Event;
  categories: Category[];
  initialSaved?: boolean;
  initialParticipating?: boolean;
}

export function EventCard({
  event,
  categories,
  initialSaved = false,
  initialParticipating = false,
}: EventCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(initialSaved);
  const [participating, setParticipating] = useState(initialParticipating);
  const [busyAction, setBusyAction] = useState<"like" | "save" | "participate" | null>(null);

  const category = categories.find((c) => c.id === event.categoryId);

  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  useEffect(() => {
    setParticipating(initialParticipating);
  }, [initialParticipating]);

  const handleLike = async () => {
    if (busyAction) return;
    setBusyAction("like");
    try {
      if (liked) {
        await api.unlike(event.id);
      } else {
        await api.like(event.id);
      }
      setLiked(!liked);
    } catch {
      /* ignore */
    } finally {
      setBusyAction(null);
    }
  };

  const handleSave = async () => {
    if (busyAction) return;
    setBusyAction("save");
    try {
      if (saved) {
        await api.unfavorite(event.id);
      } else {
        await api.favorite(event.id);
      }
      setSaved(!saved);
    } catch {
      /* ignore */
    } finally {
      setBusyAction(null);
    }
  };

  const handleParticipate = async () => {
    if (participating || busyAction) return;
    setBusyAction("participate");
    try {
      await api.participate(event.id);
      setParticipating(true);
    } catch {
      /* ignore */
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{event.title}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{formatRelative(event.startsAt)}</span>
            <span>-</span>
            <span>{formatDateTime(event.startsAt)}</span>
          </div>
        </div>
        {category && <CategoryBadge name={category.name} slug={category.slug} />}
      </div>

      {event.description && (
        <p className="text-sm text-slate-600 line-clamp-2">{event.description}</p>
      )}

      {event.locationText && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <span className="truncate">{event.locationText}</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        <button
          onClick={handleLike}
          disabled={busyAction !== null}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
            ${liked ? "bg-red-50 text-red-600" : "text-slate-500 hover:bg-slate-50"}
            ${busyAction !== null ? "opacity-70" : ""}`}
        >
          <svg className="w-4 h-4" fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          Curtir
        </button>

        <button
          onClick={handleSave}
          disabled={busyAction !== null}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
            ${saved ? "bg-primary-50 text-primary-600" : "text-slate-500 hover:bg-slate-50"}
            ${busyAction !== null ? "opacity-70" : ""}`}
        >
          <svg className="w-4 h-4" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
          Salvar
        </button>

        <button
          onClick={handleParticipate}
          disabled={participating || busyAction !== null}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ml-auto
            ${participating ? "bg-green-50 text-green-600" : "bg-primary-50 text-primary-600 hover:bg-primary-100"}
            ${busyAction !== null ? "opacity-70" : ""}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={participating ? "M4.5 12.75l6 6 9-13.5" : "M12 4.5v15m7.5-7.5h-15"} />
          </svg>
          {participating ? "Participando" : "Participar"}
        </button>
      </div>
    </div>
  );
}
