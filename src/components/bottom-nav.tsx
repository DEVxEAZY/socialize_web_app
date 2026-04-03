"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/feed",
    label: "Feed",
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    href: "/events/create",
    label: "Criar",
    icon: (_active: boolean) => (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
    special: true,
  },
  {
    href: "/profile",
    label: "Perfil",
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ig-border safe-bottom z-50">
      <div className="flex items-center justify-around h-[49px] max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors
                ${item.special
                  ? "text-ig-text -mt-1"
                  : active
                    ? "text-ig-text"
                    : "text-ig-muted hover:text-ig-text"
                }`}
            >
              {item.special ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-[3px] border-[1.5px] border-ig-text">
                  {item.icon(active)}
                </span>
              ) : (
                item.icon(active)
              )}
              {!item.special && (
                <span className="text-[10px] font-normal tracking-tight">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
