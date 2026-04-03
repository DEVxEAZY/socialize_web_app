"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { EventCard } from "@/components/event-card";
import { CategoryBadge } from "@/components/category-badge";
import type { Event, Category, Stats } from "@/types";

type Tab = "created" | "participated" | "saved";

const TABS: { key: Tab; label: string }[] = [
  { key: "created", label: "Criados" },
  { key: "participated", label: "Participando" },
  { key: "saved", label: "Salvos" },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [profileUser, setProfileUser] = useState(user);
  const [interests, setInterests] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<Tab>("created");
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setProfileUser(user);
  }, [user]);

  const loadProfileData = useCallback(async () => {
    setProfileLoading(true);
    setError("");
    try {
      const [profileRes, catsRes] = await Promise.all([
        api.getProfile(),
        api.getCategories(),
      ]);
      setProfileUser(profileRes.user);
      setInterests(profileRes.interests);
      setStats(profileRes.stats);
      setCategories(catsRes.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar perfil");
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getMyEvents(tab);
      setEvents(res.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar eventos");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const retryData = () => {
    loadProfileData();
    loadEvents();
  };

  return (
    <div className="space-y-5 px-4 pb-4 pt-4">
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-sm border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button
            onClick={retryData}
            className="font-semibold text-primary-500 hover:text-primary-600"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between border-b border-ig-border pb-4">
        <div className="flex items-center gap-4">
          <div className="rounded-full p-[2px] ring-gradient-ig">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-2xl font-light text-ig-text">
              {profileUser?.displayName?.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-ig-text">{profileUser?.displayName}</h1>
            {profileUser?.bio && <p className="text-sm text-ig-muted">{profileUser.bio}</p>}
            {profileUser?.locationLabel && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-ig-muted">
                <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {profileUser.locationLabel}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={logout}
          className="p-2 text-ig-muted transition-colors hover:text-[#ed4956]"
          aria-label="Sair"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </button>
      </div>

      {/* Stats */}
      {profileLoading ? (
        <div className="grid grid-cols-5 gap-1 border-b border-ig-border pb-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-sm bg-ig-bg" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-5 gap-1 border-b border-ig-border pb-4 text-center">
          {[
            { label: "Amigos", value: stats.friendsCount },
            { label: "Criados", value: stats.createdCount },
            { label: "Participei", value: stats.participatedCount },
            { label: "Salvos", value: stats.savedCount },
            { label: "Curtidos", value: stats.likedCount },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-base font-semibold text-ig-text">{s.value}</p>
              <p className="text-[10px] text-ig-muted">{s.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Interests */}
      {interests.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-ig-muted">Interesses</h3>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <CategoryBadge key={interest.id} name={interest.name} slug={interest.slug} />
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-ig-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`relative flex-1 py-2.5 text-center text-sm font-semibold transition-colors
              ${tab === t.key ? "text-ig-text" : "text-ig-muted hover:text-ig-text"}`}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ig-text" aria-hidden />
            )}
          </button>
        ))}
      </div>

      {/* Event list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ig-border border-t-ig-text" />
        </div>
      ) : events.length === 0 ? (
        <p className="py-8 text-center text-sm text-ig-muted">
          Nenhum evento {tab === "created" ? "criado" : tab === "participated" ? "participando" : "salvo"}
        </p>
      ) : (
        <div className="divide-y divide-ig-border pb-4 -mx-4">
          {events.map((event) => (
            <div key={event.id} className="px-4 py-3">
              <EventCard
                event={event}
                categories={categories}
                initialSaved={tab === "saved"}
                initialParticipating={tab === "participated"}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
