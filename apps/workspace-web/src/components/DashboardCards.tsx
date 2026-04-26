"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function DashboardCards() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api.dashboardStats().then(setStats).catch(() => setStats(null));
  }, []);

  const dashboardCards =
    stats?.cards && typeof stats.cards === "object" ? (stats.cards as Record<string, unknown>) : {};
  const cards: Array<[string, string]> = [
    ["NEW", String(dashboardCards.newComplaints ?? "0")],
    ["IN PROGRESS", String(dashboardCards.inProgress ?? "0")],
    ["RESOLVED", String(dashboardCards.resolved ?? "0")],
    ["SLA RISK", String(dashboardCards.overdueSlaMock ?? "0")]
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, value]) => (
        <div key={String(label)} className="workspace-card p-5">
          <p className="text-xs font-black tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-black">{String(value)}</p>
        </div>
      ))}
    </div>
  );
}
