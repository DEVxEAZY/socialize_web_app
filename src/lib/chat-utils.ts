import type { Conversation } from "@/types";

export function getConversationDisplayTitle(
  conv: Conversation,
  currentUserId: number
): string {
  if (conv.type === "group") return conv.title || "Grupo";
  const other = conv.members.find((m) => m.user.id !== currentUserId);
  if (other) return other.user.displayName;
  return conv.title || "Conversa";
}
