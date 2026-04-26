"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { MapRegionStat, MapStatsResponse, RiskLevel } from "../types";
import { useI18n } from "../i18n/useI18n";
import type { TranslationKey } from "../i18n/translations";

const riskStyles: Record<RiskLevel, string> = {
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  HIGH: "border-red-200 bg-red-50 text-red-700"
};

const riskLabelKeys: Record<RiskLevel, TranslationKey> = {
  LOW: "map.riskLOW",
  MEDIUM: "map.riskMEDIUM",
  HIGH: "map.riskHIGH"
};

function formatKzt(value: number) {
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0
  }).format(value);
}

function getRegionTone(totalComplaints: number) {
  if (totalComplaints >= 8) return "border-red-200 bg-red-50 text-red-700";
  if (totalComplaints >= 4) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export function KazakhstanFraudMap() {
  const { language, t } = useI18n();
  const [data, setData] = useState<MapStatsResponse | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    api
      .mapStats()
      .then((response) => {
        if (!isMounted) return;
        setData(response);
        setSelectedRegionId(response.regions[0]?.id ?? null);
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setError(requestError instanceof Error ? requestError.message : t("map.error"));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [t]);

  const selectedRegion = useMemo(() => {
    if (!data) return null;
    return data.regions.find((region) => region.id === selectedRegionId) ?? data.regions[0] ?? null;
  }, [data, selectedRegionId]);

  const regionName = (region: Pick<MapRegionStat, "nameRu" | "nameKz">) =>
    language === "kz" ? region.nameKz || region.nameRu : region.nameRu;

  if (isLoading) {
    return (
      <main className="min-h-[70vh] bg-slate-50 py-16">
        <div className="saq-container rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-bold text-[#0b2c4d]">{t("map.loading")}</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[70vh] bg-slate-50 py-16">
        <div className="saq-container rounded-3xl border border-red-200 bg-red-50 p-10 text-center shadow-sm">
          <p className="text-lg font-bold text-red-700">{t("map.error")}</p>
          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  if (!data || data.regions.length === 0 || !selectedRegion) {
    return (
      <main className="min-h-[70vh] bg-slate-50 py-16">
        <div className="saq-container rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-bold text-[#0b2c4d]">{t("map.empty")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-slate-50">
      <section className="bg-[#0b2c4d] py-16 text-white">
        <div className="saq-container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-300/40 bg-sky-300/10 text-[#35b9f2]">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 22s7-5.4 7-12A7 7 0 1 0 5 10c0 6.6 7 12 7 12Z" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <h1 className="mt-6 text-3xl font-black md:text-5xl">{t("map.fraudTitle")}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">{t("map.subtitle")}</p>
            <p className="mt-4 text-sm font-bold text-slate-400">{t("map.maskedNotice")}</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            <SummaryCard label={t("map.regionsCount")} value={String(data.summary.totalRegions)} />
            <SummaryCard label={t("map.complaintsLabel")} value={String(data.summary.totalComplaints)} />
            <SummaryCard label={t("map.topRegion")} value={data.summary.topRegion ? regionName(data.summary.topRegion) : "-"} />
            <SummaryCard
              label={t("map.topFraudType")}
              value={
                data.summary.topFraudType
                  ? language === "kz"
                    ? data.summary.topFraudType.nameKz || data.summary.topFraudType.nameRu
                    : data.summary.topFraudType.nameRu
                  : "-"
              }
            />
          </div>
        </div>
      </section>

      <section className="saq-container grid gap-6 py-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-[#08284a]">{t("map.selectRegion")}</h2>
              <p className="mt-1 text-sm text-slate-500">{t("map.updated")}</p>
            </div>
            <span className="rounded-full bg-[#eaf4ff] px-4 py-2 text-sm font-bold text-[#0b2c4d]">
              {t("map.regionsCount")}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.regions.map((region) => {
              const selected = selectedRegion.id === region.id;
              return (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => setSelectedRegionId(region.id)}
                  className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                    selected ? "border-[#35b9f2] bg-[#eff8ff] shadow-sm" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-[#08284a]">{regionName(region)}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{region.code}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${getRegionTone(region.totalComplaints)}`}>
                      {region.totalComplaints}
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-slate-500">{t("map.complaintsLabel")}</p>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#35b9f2]">{t("map.stats")}</p>
              <h2 className="mt-2 text-3xl font-black text-[#08284a]">{regionName(selectedRegion)}</h2>
            </div>
            <span className={`rounded-full border px-3 py-1.5 text-sm font-black ${getRegionTone(selectedRegion.totalComplaints)}`}>
              {selectedRegion.totalComplaints} {t("map.complaints")}
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">{t("map.complaintsLabel")}</p>
              <p className="mt-2 text-3xl font-black text-[#08284a]">{selectedRegion.totalComplaints}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">{t("map.totalDamage")}</p>
              <p className="mt-2 text-xl font-black text-[#08284a]">{formatKzt(selectedRegion.totalDamageAmount)}</p>
            </div>
          </div>

          <SectionTitle title={t("map.fraudTypes")} />
          {selectedRegion.fraudTypes.length > 0 ? (
            <div className="space-y-3">
              {selectedRegion.fraudTypes.map((fraudType) => (
                <div key={fraudType.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-bold text-[#08284a]">
                      {language === "kz" ? fraudType.nameKz || fraudType.nameRu : fraudType.nameRu}
                    </p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700">
                      {fraudType.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyLine text={t("map.noComplaints")} />
          )}

          <SectionTitle title={t("map.scammerInfo")} />
          {selectedRegion.scammerContacts.length > 0 ? (
            <div className="space-y-3">
              {selectedRegion.scammerContacts.map((contact) => (
                <div key={`${contact.type}-${contact.value}`} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{contact.type}</p>
                      <p className="mt-1 font-mono text-sm font-bold text-[#08284a]">{contact.value}</p>
                    </div>
                    <RiskBadge riskLevel={contact.riskLevel} label={t(riskLabelKeys[contact.riskLevel])} />
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    {contact.complaintsCount} {t("map.complaints")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyLine text={t("map.noContacts")} />
          )}
        </aside>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
      <p className="text-sm font-bold text-slate-300">{label}</p>
      <p className="mt-2 truncate text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h3 className="mb-3 mt-8 text-lg font-black text-[#08284a]">{title}</h3>;
}

function EmptyLine({ text }: { text: string }) {
  return <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">{text}</p>;
}

function RiskBadge({ riskLevel, label }: { riskLevel: RiskLevel; label: string }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black ${riskStyles[riskLevel]}`}>
      {label}
    </span>
  );
}
