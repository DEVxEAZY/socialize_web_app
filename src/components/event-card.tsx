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
    <article className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] p-[2px]">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-[10px] font-bold text-ig-text">
              {event.title.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <h3 className="truncate text-sm font-semibold text-ig-text">{event.title}</h3>
            <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-ig-muted">
              <span>{formatRelative(event.startsAt)}</span>
              <span aria-hidden>·</span>
              <span>{formatDateTime(event.startsAt)}</span>
            </div>
          </div>
        </div>
        {category && <CategoryBadge name={category.name} slug={category.slug} />}
      </div>

      {event.description && (
        <p className="line-clamp-3 text-sm leading-snug text-ig-text">
          <span className="font-semibold">{event.title}</span>{" "}
          <span className="font-normal">{event.description}</span>
        </p>
      )}

      {event.locationText && (
        <div className="flex items-center gap-1.5 text-xs text-ig-muted">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <span className="truncate">{event.locationText}</span>
        </div>
      )}

      <div className="flex items-center gap-4 pt-1">
        <button
          type="button"
          onClick={handleLike}
          disabled={busyAction !== null}
          className={`p-0 transition-opacity ${liked ? "text-[#ed4956]" : "text-ig-text"} ${busyAction !== null ? "opacity-50" : ""}`}
          aria-label={liked ? "Descurtir" : "Curtir"}
        >
          <svg className="h-6 w-6" fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={busyAction !== null}
          className={`p-0 transition-opacity ${saved ? "text-ig-text" : "text-ig-text"} ${busyAction !== null ? "opacity-50" : ""}`}
          aria-label={saved ? "Remover dos salvos" : "Salvar"}
        >
          <svg className="h-6 w-6" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleParticipate}
          disabled={participating || busyAction !== null}
          className={`ml-auto rounded-md px-3 py-1.5 text-xs font-semibold transition-colors
            ${participating ? "text-ig-muted" : "bg-primary-500 text-white hover:bg-primary-600"}
            ${participating || busyAction !== null ? "cursor-default" : ""}`}
        >
          {participating ? "Participando" : "Participar"}
        </button>
      </div>
    </article>
  );
}
