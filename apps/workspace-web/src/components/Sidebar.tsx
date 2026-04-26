"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getStaffUser } from "../lib/auth";
import { hasAnyRole } from "../lib/rbac";
import type { StaffRole } from "../types";

const items: Array<{ href: string; label: string; roles: StaffRole[] }> = [
  { href: "/dashboard", label: "Dashboard", roles: ["OPERATOR", "SUPERVISOR", "ADMIN"] },
  { href: "/complaints", label: "Жалобы", roles: ["OPERATOR", "SUPERVISOR", "ADMIN"] },
  { href: "/exports", label: "Export center", roles: ["OPERATOR", "SUPERVISOR", "ADMIN"] },
  { href: "/blacklist", label: "Blacklist", roles: ["OPERATOR", "SUPERVISOR", "ADMIN"] },
  { href: "/audit-logs", label: "Audit logs", roles: ["SUPERVISOR", "ADMIN"] },
  { href: "/news", label: "Новости", roles: ["ADMIN"] },
  { href: "/dictionaries/regions", label: "Регионы", roles: ["ADMIN"] },
  { href: "/dictionaries/fraud-types", label: "Типы мошенничества", roles: ["ADMIN"] },
  { href: "/users", label: "Пользователи", roles: ["ADMIN"] },
  { href: "/roles", label: "Роли", roles: ["ADMIN"] },
  { href: "/settings", label: "Настройки", roles: ["ADMIN"] }
];

export function Sidebar() {
  const pathname = usePathname();
  const user = getStaffUser();

  return (
    <aside className="hidden min-h-screen w-72 border-r border-slate-200 bg-slate-950 p-5 text-white lg:block">
      <Link href="/dashboard" className="block rounded-2xl bg-white/10 p-4">
        <p className="text-lg font-black tracking-[0.18em]">SAQBOL</p>
        <p className="text-xs text-slate-300">Workspace</p>
      </Link>
      <nav className="mt-6 space-y-1">
        {items.filter((item) => hasAnyRole(user, item.roles)).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className={`block rounded-xl px-4 py-3 text-sm font-bold ${active ? "bg-teal-600 text-white" : "text-slate-300 hover:bg-white/10"}`}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
