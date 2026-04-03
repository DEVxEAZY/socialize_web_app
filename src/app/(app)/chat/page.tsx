"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getConversationDisplayTitle } from "@/lib/chat-utils";
import type { Conversation } from "@/types";
import { formatDateTime } from "@/lib/utils";

export default function ChatListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [formError, setFormError] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [userIdInput, setUserIdInput] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setListError("");
    try {
      const res = await api.getConversations({ type: "all", limit: 100 });
      setConversations(res.conversations);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Erro ao carregar conversas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleNewDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = Number(userIdInput.trim());
    if (!Number.isFinite(id) || id <= 0) {
      setFormError("Informe um ID de usuario valido");
      return;
    }
    if (user && id === user.id) {
      setFormError("Use o ID de outro usuario");
      return;
    }
    setCreating(true);
    setFormError("");
    try {
      const { conversation } = await api.createDirectConversation(id);
      setNewOpen(false);
      setUserIdInput("");
      router.push(`/chat/${conversation.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao criar conversa");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col px-4 pb-4 pt-4">
      <div className="flex items-center justify-between border-b border-ig-border pb-3">
        <h1 className="text-xl font-semibold text-ig-text">Mensagens</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setNewOpen((o) => !o);
              setFormError("");
            }}
            className="rounded-md border border-ig-border px-3 py-1.5 text-sm font-semibold text-ig-text hover:bg-ig-bg"
          >
            Nova
          </button>
          <button
            type="button"
            onClick={load}
            className="p-2 text-ig-muted transition-colors hover:text-ig-text"
            aria-label="Atualizar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
          </button>
        </div>
      </div>

      {newOpen && (
        <form
          onSubmit={handleNewDirect}
          className="mt-3 space-y-2 rounded-sm border border-ig-border bg-ig-bg p-3"
        >
          <p className="text-xs text-ig-muted">
            Conversa direta pelo ID do usuario (o backend nao expoe busca por nome).
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              step={1}
              placeholder="ID do usuario"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              className="min-w-0 flex-1 rounded-[3px] border border-ig-border bg-white px-3 py-2 text-sm text-ig-text placeholder:text-ig-muted focus:border-ig-muted focus:outline-none"
            />
            <button
              type="submit"
              disabled={creating}
              className="shrink-0 rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {creating ? "..." : "Ir"}
            </button>
          </div>
        </form>
      )}

      {listError && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-sm border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{listError}</span>
          <button type="button" onClick={load} className="font-semibold text-primary-500 hover:text-primary-600">
            Tentar de novo
          </button>
        </div>
      )}
      {formError && newOpen && (
        <p className="mt-2 text-sm text-red-600">{formError}</p>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ig-border border-t-ig-text" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-ig-muted">Nenhuma conversa ainda</p>
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="mt-3 text-sm font-semibold text-primary-500 hover:text-primary-600"
          >
            Iniciar uma conversa
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-ig-border -mx-4 mt-2">
          {conversations.map((c) => {
            const title = user
              ? getConversationDisplayTitle(c, user.id)
              : c.title;
            const preview = c.lastMessage?.body ?? "Sem mensagens";
            return (
              <li key={c.id}>
                <Link
                  href={`/chat/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ig-bg"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] p-[2px]">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-ig-text">
                      {title.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold text-ig-text">{title}</span>
                      {c.lastMessage && (
                        <span className="shrink-0 text-[11px] text-ig-muted">
                          {formatDateTime(c.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm text-ig-muted">{preview}</p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-primary-500 px-1.5 text-[10px] font-bold text-white">
                      {c.unreadCount > 99 ? "99+" : c.unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
