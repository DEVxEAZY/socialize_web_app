"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getConversationDisplayTitle } from "@/lib/chat-utils";
import type { Conversation, Message } from "@/types";

function sortMessagesAsc(messages: Message[]): Message[] {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export default function ChatThreadPage() {
  const params = useParams();
  const conversationId = Number(params.conversationId);
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const invalidId = !Number.isFinite(conversationId) || conversationId <= 0;

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  const loadThread = useCallback(async () => {
    if (invalidId) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      const res = await api.getMessages(conversationId, { limit: 100 });
      setConversation(res.conversation);
      setMessages(sortMessagesAsc(res.messages));
      try {
        await api.markConversationRead(conversationId);
      } catch {
        /* leitura opcional */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar mensagens");
    } finally {
      setLoading(false);
    }
  }, [conversationId, invalidId]);

  useEffect(() => {
    setLoading(true);
    loadThread();
  }, [loadThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (invalidId) return;
    const t = window.setInterval(() => {
      void loadThread();
    }, 12000);
    return () => clearInterval(t);
  }, [conversationId, invalidId, loadThread]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void loadThread();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [loadThread]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending || invalidId) return;
    setSending(true);
    setError("");
    try {
      await api.sendMessage(conversationId, trimmed);
      setBody("");
      await loadThread();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setSending(false);
    }
  };

  if (invalidId) {
    return (
      <div className="px-4 py-8 text-center text-sm text-ig-muted">
        Conversa invalida.{" "}
        <Link href="/chat" className="font-semibold text-primary-500">
          Voltar
        </Link>
      </div>
    );
  }

  const title =
    conversation && user
      ? getConversationDisplayTitle(conversation, user.id)
      : "Conversa";

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col">
      <header className="flex items-center gap-3 border-b border-ig-border px-2 py-2">
        <Link
          href="/chat"
          className="flex h-9 w-9 shrink-0 items-center justify-center text-ig-text hover:text-ig-muted"
          aria-label="Voltar"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-center text-base font-semibold text-ig-text">
          {title}
        </h1>
        <span className="w-9" aria-hidden />
      </header>

      {error && (
        <div className="mx-4 mt-3 rounded-sm border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ig-border border-t-ig-text" />
          </div>
        ) : (
          <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
            {messages.map((m) => {
              const mine = user != null && m.senderId === user.id;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? "bg-primary-500 text-white"
                        : "border border-ig-border bg-ig-bg text-ig-text"
                    }`}
                  >
                    {!mine && (
                      <p className="mb-0.5 text-[11px] font-semibold text-ig-muted">
                        {m.sender.displayName}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="border-t border-ig-border bg-white p-3 safe-bottom"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Mensagem..."
            className="min-w-0 flex-1 rounded-full border border-ig-border bg-ig-bg px-4 py-2.5 text-sm text-ig-text placeholder:text-ig-muted focus:border-ig-muted focus:bg-white focus:outline-none"
            maxLength={4000}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="shrink-0 rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-40"
          >
            {sending ? "..." : "Enviar"}
          </button>
        </div>
      </form>
    </div>
  );
}
