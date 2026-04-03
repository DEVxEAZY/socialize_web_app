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
    <div className="px-4 pt-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            onClick={retryData}
            className="font-medium text-red-700 hover:text-red-800"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xl font-bold">
            {profileUser?.displayName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{profileUser?.displayName}</h1>
            {profileUser?.bio && <p className="text-sm text-slate-500">{profileUser.bio}</p>}
            {profileUser?.locationLabel && (
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          aria-label="Sair"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </button>
      </div>

      {/* Stats */}
      {profileLoading ? (
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl p-3 border border-slate-100 animate-pulse h-[68px]" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: "Amigos", value: stats.friendsCount },
            { label: "Criados", value: stats.createdCount },
            { label: "Participei", value: stats.participatedCount },
            { label: "Salvos", value: stats.savedCount },
            { label: "Curtidos", value: stats.likedCount },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-3 text-center border border-slate-100">
              <p className="text-lg font-bold text-slate-900">{s.value}</p>
              <p className="text-[10px] text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Interests */}
      {interests.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-700">Interesses</h3>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <CategoryBadge key={interest.id} name={interest.name} slug={interest.slug} />
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors
              ${tab === t.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Event list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent" />
        </div>
      ) : events.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-8">
          Nenhum evento {tab === "created" ? "criado" : tab === "participated" ? "participando" : "salvo"}
        </p>
      ) : (
        <div className="space-y-3 pb-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              categories={categories}
              initialSaved={tab === "saved"}
              initialParticipating={tab === "participated"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
