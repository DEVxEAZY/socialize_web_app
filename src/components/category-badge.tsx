"use client";

import { getCategoryColor } from "@/lib/utils";

interface CategoryBadgeProps {
  name: string;
  slug: string;
}

export function CategoryBadge({ name, slug }: CategoryBadgeProps) {
  const { bg, text } = getCategoryColor(slug);

  return (
    <span
      className={`inline-flex max-w-[7rem] shrink-0 items-center truncate rounded-sm border border-ig-border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${bg} ${text}`}
    >
      {name}
    </span>
  );
}
