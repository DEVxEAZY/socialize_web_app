const API_BASE = "https://socializeserverbackend-production.up.railway.app";

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

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("socialize_token");
        window.location.href = "/login";
      }
      throw new Error("Sessao expirada");
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erro desconhecido");
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
  getCategories() {
    return this.get<{ categories: import("@/types").Category[] }>("/api/categories");
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
}

export const api = new ApiClient();
