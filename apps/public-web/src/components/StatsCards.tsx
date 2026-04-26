"use client";

import { useEffect, useState } from "react";
import { useI18n } from "../i18n/useI18n";
import { api } from "../lib/api";

export function StatsCards() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api.publicStats().then(setStats).catch(() => setStats(null));
  }, []);

  const cards = [
    { label: t("stats.complaints"), value: stats?.totalComplaints ?? "42 800+" },
    { label: t("stats.damage"), value: "₸18.7 млрд" },
    { label: t("stats.resolution"), value: "67%" },
    { label: t("stats.regions"), value: "20" }
  ];

  return (
    <section className="border-b border-[#d6e1ec] bg-[#eaf0f5]">
      <div className="saq-container grid gap-8 py-14 text-center sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label}>
            <p className="text-4xl font-black tracking-[-0.04em] text-[#052447]">{String(card.value)}</p>
            <p className="mt-2 text-base text-[#60738a]">{card.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
