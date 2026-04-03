const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  esporte: { bg: "bg-green-100", text: "text-green-700" },
  cultura: { bg: "bg-purple-100", text: "text-purple-700" },
  musica: { bg: "bg-pink-100", text: "text-pink-700" },
  trilha: { bg: "bg-amber-100", text: "text-amber-700" },
  yoga: { bg: "bg-teal-100", text: "text-teal-700" },
};

export function getCategoryColor(slug: string) {
  return CATEGORY_COLORS[slug] || { bg: "bg-slate-100", text: "text-slate-700" };
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}d atras`;
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Amanha";
  if (diffDays <= 7) return `Em ${diffDays} dias`;
  return formatDate(iso);
}
