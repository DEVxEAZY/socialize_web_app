const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://socializeserverbackend-production.up.railway.app";

function normalizeCategory(raw: unknown): import("@/types").Category {
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id),
    slug: String(r.slug ?? ""),
    name: String(r.name ?? ""),
    // API pode enviar camelCase ou snake_case; sem flag, assume categoria de evento (doc / seed).
    isEventCategory: Boolean(
      r.isEventCategory ?? r.is_event_category ?? true
    ),
    isInterestCategory: Boolean(
      r.isInterestCategory ?? r.is_interest_category ?? true
    ),
  };
}

function normalizeChatUser(raw: unknown): import("@/types").ChatUser {
  const r = raw as Record<string, unknown>;
  const av = r.avatarUrl ?? r.avatar_url;
  const loc = r.locationLabel ?? r.location_label;
  return {
    id: Number(r.id),
    displayName: String(r.displayName ?? r.display_name ?? ""),
    avatarUrl: av == null ? null : String(av),
    locationLabel: loc == null ? null : String(loc),
  };
}

function normalizeLastMessage(
  raw: unknown
): import("@/types").ChatLastMessage | null {
  if (raw == null || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id),
    body: String(r.body ?? ""),
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
    senderId: Number(r.senderId ?? r.sender_id),
  };
}

function normalizeConversationMember(
  raw: unknown
): import("@/types").ConversationMember {
  const r = raw as Record<string, unknown>;
  return {
    role: String(r.role ?? "member"),
    joinedAt: String(r.joinedAt ?? r.joined_at ?? ""),
    lastReadAt:
      r.lastReadAt === null || r.last_read_at === null
        ? null
        : String(r.lastReadAt ?? r.last_read_at ?? ""),
    user: normalizeChatUser(r.user),
  };
}

function normalizeConversation(raw: unknown): import("@/types").Conversation {
  const r = raw as Record<string, unknown>;
  const t = String(r.type ?? "direct");
  const type: "direct" | "group" = t === "group" ? "group" : "direct";
  const membersRaw = r.members;
  const members = Array.isArray(membersRaw)
    ? membersRaw.map(normalizeConversationMember)
    : [];
  return {
    id: Number(r.id),
    type,
    title: String(r.title ?? ""),
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
    updatedAt: String(r.updatedAt ?? r.updated_at ?? ""),
    unreadCount: Number(r.unreadCount ?? r.unread_count ?? 0),
    memberCount: Number(r.memberCount ?? r.member_count ?? members.length),
    lastMessage: normalizeLastMessage(r.lastMessage ?? r.last_message),
    members,
  };
}

function normalizeMessage(raw: unknown): import("@/types").Message {
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id),
    conversationId: Number(r.conversationId ?? r.conversation_id),
    senderId: Number(r.senderId ?? r.sender_id),
    body: String(r.body ?? ""),
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
    sender: normalizeChatUser(r.sender),
  };
}

/** Erro HTTP com status; usado para nao confundir 401 de login com sessao expirada. */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

function pathBase(path: string): string {
  const i = path.indexOf("?");
  return i === -1 ? path : path.slice(0, i);
}

/** Endpoints onde 401 significa credenciais/codigo invalidos, nao sessao expirada. */
function isAuthCredentialPath(path: string): boolean {
  const p = pathBase(path);
  return (
    p === "/api/auth/login" ||
    p === "/api/auth/register" ||
    p === "/api/auth/forgot-password" ||
    p === "/api/auth/reset-password"
  );
}

function shouldAttachBearer(path: string): boolean {
  return !isAuthCredentialPath(path);
}

let sessionRedirectScheduled = false;

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("socialize_token");
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token && shouldAttachBearer(path)) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      let errBody: { error?: string } = {};
      try {
        errBody = (await res.json()) as { error?: string };
      } catch {
        /* corpo vazio ou nao JSON */
      }
      if (isAuthCredentialPath(path)) {
        throw new ApiRequestError(
          errBody.error || "Credenciais invalidas",
          401
        );
      }
      if (typeof window !== "undefined") {
        const hadToken = localStorage.getItem("socialize_token") !== null;
        localStorage.removeItem("socialize_token");
        if (hadToken && !sessionRedirectScheduled) {
          sessionRedirectScheduled = true;
          window.location.replace("/login");
        }
      }
      throw new ApiRequestError(errBody.error || "Sessao expirada", 401);
    }

    let data: { error?: string } & Record<string, unknown>;
    try {
      data = (await res.json()) as { error?: string } & Record<string, unknown>;
    } catch {
      throw new ApiRequestError("Resposta invalida do servidor", res.status);
    }

    if (!res.ok) {
      throw new ApiRequestError(data.error || "Erro desconhecido", res.status);
    }

    return data as T;
  }

  get<T>(path: string) {
    return this.request<T>("GET", path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>("POST", path, body);
  }

  del<T>(path: string) {
    return this.request<T>("DELETE", path);
  }

  // Auth
  login(email: string, password: string) {
    return this.post<{ user: { id: number; email: string; displayName: string }; token: string }>(
      "/api/auth/login",
      { email, password }
    );
  }

  register(email: string, password: string, displayName: string) {
    return this.post<{ user: { id: number; email: string; displayName: string }; token: string }>(
      "/api/auth/register",
      { email, password, displayName }
    );
  }

  forgotPassword(email: string) {
    return this.post<{ message: string }>("/api/auth/forgot-password", { email });
  }

  resetPassword(token: string, newPassword: string) {
    return this.post<{ message: string }>("/api/auth/reset-password", { token, newPassword });
  }

  // User
  getMe() {
    return this.get<{ user: import("@/types").User }>("/api/me");
  }

  getProfile() {
    return this.get<import("@/types").ProfileResponse>("/api/profile/me");
  }

  getMyEvents(tab: "created" | "participated" | "saved") {
    return this.get<import("@/types").EventsResponse>(`/api/profile/me/events?tab=${tab}`);
  }

  // Categories
  async getCategories() {
    const res = await this.get<{ categories?: unknown[] }>("/api/categories");
    const raw = Array.isArray(res.categories) ? res.categories : [];
    return {
      categories: raw.map(normalizeCategory),
    };
  }

  // Events
  getEvents(mode: "recommended" | "all" = "recommended", limit = 50) {
    return this.get<import("@/types").EventsResponse>(
      `/api/events?mode=${mode}&limit=${limit}`
    );
  }

  createEvent(data: {
    categoryId: number;
    title: string;
    startsAt: string;
    endsAt?: string;
    timezone?: string;
    locationText?: string;
    description?: string;
    visibility?: "public" | "friends" | "private";
  }) {
    return this.post<{ event: import("@/types").Event }>("/api/events", data);
  }

  // Interactions
  participate(eventId: number) {
    return this.post<{ eventId: number; status: string }>(
      `/api/events/${eventId}/participate`
    );
  }

  like(eventId: number) {
    return this.post<{ eventId: number; liked: boolean }>(
      `/api/events/${eventId}/like`
    );
  }

  unlike(eventId: number) {
    return this.del<{ eventId: number; liked: boolean }>(
      `/api/events/${eventId}/like`
    );
  }

  favorite(eventId: number) {
    return this.post<{ eventId: number; saved: boolean }>(
      `/api/events/${eventId}/favorite`
    );
  }

  unfavorite(eventId: number) {
    return this.del<{ eventId: number; saved: boolean }>(
      `/api/events/${eventId}/favorite`
    );
  }

  // Chat
  async getConversations(params?: {
    type?: "all" | "direct" | "group";
    limit?: number;
  }) {
    const q = new URLSearchParams();
    if (params?.type) q.set("type", params.type);
    if (params?.limit != null) q.set("limit", String(params.limit));
    const qs = q.toString();
    const path = `/api/chat/conversations${qs ? `?${qs}` : ""}`;
    const res = await this.get<{
      type?: string;
      conversations?: unknown[];
    }>(path);
    const raw = Array.isArray(res.conversations) ? res.conversations : [];
    return {
      type: (res.type as "all" | "direct" | "group") ?? "all",
      conversations: raw.map(normalizeConversation),
    } satisfies import("@/types").ConversationsResponse;
  }

  async createDirectConversation(userId: number) {
    const res = await this.post<{ conversation?: unknown }>(
      "/api/chat/conversations/direct",
      { userId }
    );
    return {
      conversation: normalizeConversation(res.conversation ?? {}),
    } satisfies import("@/types").ConversationResponse;
  }

  async createGroupConversation(title: string, memberIds: number[]) {
    const res = await this.post<{ conversation?: unknown }>(
      "/api/chat/conversations/group",
      { title, memberIds }
    );
    return {
      conversation: normalizeConversation(res.conversation ?? {}),
    } satisfies import("@/types").ConversationResponse;
  }

  async getMessages(
    conversationId: number,
    params?: { limit?: number; beforeId?: number }
  ) {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set("limit", String(params.limit));
    if (params?.beforeId != null) q.set("beforeId", String(params.beforeId));
    const qs = q.toString();
    const path = `/api/chat/conversations/${conversationId}/messages${qs ? `?${qs}` : ""}`;
    const res = await this.get<{
      conversation?: unknown;
      messages?: unknown[];
    }>(path);
    const messagesRaw = Array.isArray(res.messages) ? res.messages : [];
    return {
      conversation: normalizeConversation(res.conversation ?? {}),
      messages: messagesRaw.map(normalizeMessage),
    } satisfies import("@/types").MessagesResponse;
  }

  async sendMessage(conversationId: number, body: string) {
    const res = await this.post<{ message?: unknown }>(
      `/api/chat/conversations/${conversationId}/messages`,
      { body }
    );
    return {
      message: normalizeMessage(res.message ?? {}),
    } satisfies import("@/types").SendMessageResponse;
  }

  async markConversationRead(conversationId: number) {
    return this.post<import("@/types").MarkReadResponse>(
      `/api/chat/conversations/${conversationId}/read`,
      {}
    );
  }
}

export const api = new ApiClient();
