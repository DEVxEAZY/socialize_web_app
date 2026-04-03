"use client";

import { getCategoryColor } from "@/lib/utils";

interface CategoryBadgeProps {
  name: string;
  slug: string;
}

export function CategoryBadge({ name, slug }: CategoryBadgeProps) {
  const { bg, text } = getCategoryColor(slug);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {name}
    </span>
  );
}
