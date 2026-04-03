export interface User {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  locationLabel: string | null;
  bio: string | null;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: number;
  email: string;
  displayName: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  isEventCategory: boolean;
  isInterestCategory: boolean;
}

export interface Event {
  id: number;
  creatorId: number;
  categoryId: number;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  timezone: string | null;
  locationText: string | null;
  locationLat: number | null;
  locationLng: number | null;
  status: "draft" | "published" | "cancelled" | "completed";
  visibility: "public" | "friends" | "private";
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  friendsCount: number;
  createdCount: number;
  participatedCount: number;
  savedCount: number;
  likedCount: number;
}

export interface ProfileResponse {
  user: User;
  interests: Category[];
  stats: Stats;
}

export interface EventsResponse {
  mode?: string;
  tab?: string;
  events: Event[];
}

export interface ApiError {
  error: string;
}

/** Subconjunto de utilizador exposto no chat (API) */
export interface ChatUser {
  id: number;
  displayName: string;
  avatarUrl: string | null;
  locationLabel: string | null;
}

export interface ChatLastMessage {
  id: number;
  body: string;
  createdAt: string;
  senderId: number;
}

export interface ConversationMember {
  role: string;
  joinedAt: string;
  lastReadAt: string | null;
  user: ChatUser;
}

export interface Conversation {
  id: number;
  type: "direct" | "group";
  title: string;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  memberCount: number;
  lastMessage: ChatLastMessage | null;
  members: ConversationMember[];
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  body: string;
  createdAt: string;
  sender: ChatUser;
}

export interface ConversationsResponse {
  type: "all" | "direct" | "group";
  conversations: Conversation[];
}

export interface ConversationResponse {
  conversation: Conversation;
}

export interface MessagesResponse {
  conversation: Conversation;
  messages: Message[];
}

export interface SendMessageResponse {
  message: Message;
}

export interface MarkReadResponse {
  conversationId: number;
  readAt: string;
}
