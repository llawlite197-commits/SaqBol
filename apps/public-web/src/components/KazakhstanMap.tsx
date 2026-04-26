"use client";

import { useI18n } from "../i18n/useI18n";

export function KazakhstanMap() {
  const { t } = useI18n();
  const regions = ["Астана", "Алматы", "Шымкент", "Абай", "Акмолинская", "Актюбинская", "Алматинская", "Атырауская", "ВКО", "Жамбылская", "Жетісу", "ЗКО"];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#092641] p-8 shadow-2xl shadow-black/10">
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,#fff_1px,transparent_1px),linear-gradient(#fff_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {regions.map((region, index) => (
            <div key={region} className="rounded-xl border border-white/10 bg-white/7 p-4 text-white">
              <p className="font-bold">{region}</p>
              <p className="mt-2 text-sm text-slate-300">{(index + 2) * 7} {t("map.complaints")}</p>
              <div className="mt-3 h-1.5 rounded-full bg-white/10">
                <div className="h-1.5 rounded-full bg-[#35b9f2]" style={{ width: `${30 + index * 5}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
