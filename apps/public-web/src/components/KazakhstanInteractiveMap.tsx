"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { MapRegionStat, MapStatsResponse, RiskLevel } from "../types";
import { useI18n } from "../i18n/useI18n";
import type { TranslationKey } from "../i18n/translations";
import { demoMapStats } from "../data/demo-map-stats";
import { kazakhstanMapRegions } from "../data/kazakhstan-map-paths";
import { kazakhstanMapMeta } from "../data/kazakhstan-map-meta";

const riskLabelKeys: Record<RiskLevel, TranslationKey> = {
  LOW: "map.riskLOW",
  MEDIUM: "map.riskMEDIUM",
  HIGH: "map.riskHIGH"
};

const riskStyles: Record<RiskLevel, string> = {
  LOW: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  MEDIUM: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  HIGH: "border-red-400/30 bg-red-400/10 text-red-200"
};

const codeAliases: Record<string, string> = {
  astana: "ASTANA",
  almaty_city: "ALMATY_CITY",
  shymkent: "SHYMKENT",
  akmola: "AKMOLA",
  aktobe: "AKTOBE",
  atyrau: "ATYRAU",
  east_kazakhstan: "EAST_KAZAKHSTAN",
  karaganda: "KARAGANDA",
  kostanay: "KOSTANAY",
  mangystau: "MANGYSTAU",
  pavlodar: "PAVLODAR",
  turkistan: "TURKISTAN",
  zhambyl: "ZHAMBYL",
  west_kazakhstan: "WEST_KAZAKHSTAN",
  kyzylorda: "KYZYLORDA",
  north_kazakhstan: "NORTH_KAZAKHSTAN",
  almaty_region: "ALMATY_REGION",
  abay: "ABAI",
  zhetysu: "ZHETISU",
  ulytau: "ULYTAU"
};

function normalizeCode(code: string) {
  return codeAliases[code] ?? code.toUpperCase();
}

function formatKzt(value: number) {
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0
  }).format(value);
}

function emptyRegion(code: string): MapRegionStat {
  const meta = kazakhstanMapMeta[code];

  return {
    id: code,
    code,
    nameRu: meta?.nameRu ?? code,
    nameKz: meta?.nameKz ?? meta?.nameRu ?? code,
    totalComplaints: 0,
    totalDamageAmount: 0,
    fraudTypes: [],
    scammerContacts: []
  };
}

function getComplaintTone(totalComplaints: number) {
  if (totalComplaints >= 100) return "border-red-300/60 bg-red-500/15 text-red-100";
  if (totalComplaints >= 50) return "border-amber-300/60 bg-amber-500/15 text-amber-100";
  return "border-emerald-300/50 bg-emerald-500/10 text-emerald-100";
}

function getRegionFill(region: MapRegionStat | undefined, selected: boolean, hovered: boolean) {
  if (selected) return "#2f5f73";
  if (hovered) return "#244b5d";
  const total = region?.totalComplaints ?? 0;
  if (total >= 100) return "#5f2c35";
  if (total >= 50) return "#5b4630";
  return "#34343b";
}

function getMarkerFill(selected: boolean, hovered: boolean) {
  if (selected) return "#ef4444";
  if (hovered) return "#0ea5e9";
  return "#2f2f37";
}

export function KazakhstanInteractiveMap() {
  const { language, t } = useI18n();
  const [data, setData] = useState<MapStatsResponse | null>(null);
  const [selectedRegionCode, setSelectedRegionCode] = useState("ASTANA");
  const [hoveredRegionCode, setHoveredRegionCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    api
      .mapStats()
      .then((response) => {
        if (!isMounted) return;
        setData(response);
        setSelectedRegionCode(response.summary.topRegion?.code ?? "ASTANA");
      })
      .catch(() => {
        if (!isMounted) return;
        setData(demoMapStats);
        setSelectedRegionCode(demoMapStats.summary.topRegion?.code ?? "ASTANA");
        setError(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [t]);

  const regionsByCode = useMemo(() => {
    return new Map(
      (data?.regions ?? []).map((region) => [normalizeCode(region.code), region])
    );
  }, [data]);

  const selectedRegion = regionsByCode.get(selectedRegionCode) ?? emptyRegion(selectedRegionCode);

  function selectRegion(code: string) {
    setSelectedRegionCode(normalizeCode(code));
  }

  function regionName(region: Pick<MapRegionStat, "nameRu" | "nameKz">) {
    return language === "kz" ? region.nameKz || region.nameRu : region.nameRu;
  }

  if (isLoading) {
    return (
      <main className="min-h-[70vh] bg-[#202026] py-16">
        <div className="saq-container rounded-3xl border border-white/10 bg-[#34343b] p-10 text-center shadow-2xl">
          <p className="text-lg font-bold text-slate-100">{t("map.loading")}</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[70vh] bg-[#202026] py-16">
        <div className="saq-container rounded-3xl border border-red-300/30 bg-red-950/40 p-10 text-center shadow-2xl">
          <p className="text-lg font-bold text-red-100">{t("map.error")}</p>
          <p className="mt-2 text-sm text-red-200">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#202026] text-white">
      <section className="border-b border-white/10 bg-[#0b2c4d] py-12">
        <div className="saq-container">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#35b9f2]">SaqBol.kz Map</p>
              <h1 className="mt-4 text-3xl font-black md:text-5xl">{t("map.fraudTitle")}</h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">{t("map.subtitle")}</p>
              <p className="mt-3 text-sm font-bold text-slate-400">{t("map.maskedNotice")}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[480px]">
              <SummaryTile label={t("map.regionsCount")} value={String(data?.summary.totalRegions ?? 20)} />
              <SummaryTile label={t("map.complaintsLabel")} value={String(data?.summary.totalComplaints ?? 0)} />
              <SummaryTile
                label={t("map.topRegion")}
                value={data?.summary.topRegion ? regionName(data.summary.topRegion) : "-"}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="saq-container grid gap-6 py-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#34343b] shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="text-xl font-black">{t("map.selectRegion")}</h2>
              <p className="mt-1 text-sm text-slate-400">{t("map.updated")}</p>
            </div>
            <div className="flex gap-2 text-xs font-bold">
              <span className="rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-emerald-100">0-49</span>
              <span className="rounded-full border border-amber-300/40 bg-amber-400/10 px-3 py-1 text-amber-100">50-99</span>
              <span className="rounded-full border border-red-300/40 bg-red-400/10 px-3 py-1 text-red-100">100+</span>
            </div>
          </div>

          <div className="overflow-hidden bg-[#2f2f37] p-3 md:p-6">
            <svg
              viewBox="0 0 1036.93 569.163"
              role="img"
              aria-label={t("map.fraudTitle")}
              className="h-auto w-full max-w-full rounded-2xl bg-[#2f2f37]"
              preserveAspectRatio="xMidYMid meet"
            >
              <path
                d="M90 405 C195 386 295 432 392 445 C508 460 612 414 718 437 C806 456 889 439 996 395"
                fill="none"
                stroke="#075985"
                strokeLinecap="round"
                strokeWidth="8"
                opacity="0.35"
              />

              {kazakhstanMapRegions
                .filter((mapRegion) => mapRegion.kind === "region" && mapRegion.path)
                .map((mapRegion) => {
                  const meta = kazakhstanMapMeta[mapRegion.code];
                  const region = regionsByCode.get(mapRegion.code);
                  const selected = selectedRegionCode === mapRegion.code;
                  const hovered = hoveredRegionCode === mapRegion.code;

                  return (
                    <path
                      key={mapRegion.code}
                      data-region-code={mapRegion.code}
                      d={mapRegion.path}
                      transform={mapRegion.transform}
                      fill={getRegionFill(region, selected, hovered)}
                      fillRule="evenodd"
                      stroke={selected ? "#ffffff" : "#d8a0ad"}
                      strokeWidth={selected ? 1.8 : 1}
                      opacity={selected ? 0.96 : hovered ? 0.88 : 0.78}
                      className="cursor-pointer outline-none transition-all duration-200"
                      tabIndex={0}
                      role="button"
                      aria-label={region ? regionName(region) : meta?.nameRu ?? mapRegion.code}
                      onMouseEnter={() => setHoveredRegionCode(mapRegion.code)}
                      onMouseLeave={() => setHoveredRegionCode(null)}
                      onFocus={() => setHoveredRegionCode(mapRegion.code)}
                      onBlur={() => setHoveredRegionCode(null)}
                      onClick={() => selectRegion(mapRegion.code)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          selectRegion(mapRegion.code);
                        }
                      }}
                    />
                  );
                })}

              {kazakhstanMapRegions.map((mapRegion) => {
                const meta = kazakhstanMapMeta[mapRegion.code];
                const region = regionsByCode.get(mapRegion.code) ?? emptyRegion(mapRegion.code);
                const selected = selectedRegionCode === mapRegion.code;
                const hovered = hoveredRegionCode === mapRegion.code;
                const markerRadius = mapRegion.kind === "city" ? 8 : 7;
                const labelWidth = mapRegion.kind === "city" ? 76 : 112;
                const labelFontSize = mapRegion.kind === "city" ? 11 : 13;
                const labelX = meta?.labelX ?? mapRegion.labelX;
                const labelY = meta?.labelY ?? mapRegion.labelY;
                const markerX = meta?.markerX ?? mapRegion.markerX;
                const markerY = meta?.markerY ?? mapRegion.markerY;
                const shortLabel = meta?.shortLabel ?? mapRegion.code;
                const complaintCountLabel = String(region.totalComplaints);
                const complaintCountFontSize = complaintCountLabel.length >= 3 ? 6 : 8;

                return (
                  <g
                    key={`${mapRegion.code}-marker`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredRegionCode(mapRegion.code)}
                    onMouseLeave={() => setHoveredRegionCode(null)}
                    onClick={(event) => {
                      event.stopPropagation();
                      selectRegion(mapRegion.code);
                    }}
                  >
                    <foreignObject
                      x={labelX - labelWidth / 2}
                      y={labelY - 11}
                      width={labelWidth}
                      height="24"
                      pointerEvents="none"
                    >
                      <div
                        className={`select-none text-center font-black leading-6 drop-shadow ${
                          selected ? "text-white" : "text-[#f3b8c4]"
                        }`}
                        style={{ fontSize: labelFontSize }}
                      >
                        {shortLabel}
                      </div>
                    </foreignObject>

                    <circle
                      cx={markerX}
                      cy={markerY}
                      r="13"
                      fill="transparent"
                      tabIndex={0}
                      role="button"
                      aria-label={regionName(region)}
                      className="outline-none"
                      onFocus={() => setHoveredRegionCode(mapRegion.code)}
                      onBlur={() => setHoveredRegionCode(null)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          selectRegion(mapRegion.code);
                        }
                      }}
                    />
                    <circle
                      cx={markerX}
                      cy={markerY}
                      r={selected ? markerRadius + 2 : markerRadius}
                      fill={getMarkerFill(selected, hovered)}
                      stroke={selected || hovered ? "#ffffff" : "#f3b8c4"}
                      strokeWidth="2"
                      className="outline-none transition-all duration-200"
                    />
                    <text
                      x={markerX}
                      y={markerY + 3.5}
                      textAnchor="middle"
                      pointerEvents="none"
                      className="select-none fill-white font-black"
                      style={{ fontSize: complaintCountFontSize }}
                    >
                      {complaintCountLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <RegionDetailPanel region={selectedRegion} />
      </section>
    </main>
  );

  function RegionDetailPanel({ region }: { region: MapRegionStat }) {
    return (
      <aside className="rounded-3xl border border-white/10 bg-[#34343b] p-5 shadow-2xl md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#35b9f2]">{region.code}</p>
            <h2 className="mt-2 text-3xl font-black">{regionName(region)}</h2>
          </div>
          <span className={`rounded-full border px-3 py-1.5 text-sm font-black ${getComplaintTone(region.totalComplaints)}`}>
            {region.totalComplaints} {t("map.complaints")}
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <MetricCard label={t("map.complaintsLabel")} value={String(region.totalComplaints)} />
          <MetricCard label={t("map.totalDamage")} value={formatKzt(region.totalDamageAmount)} />
        </div>

        <SectionTitle title={t("map.fraudTypes")} />
        <div className="space-y-3">
          {region.fraudTypes.length > 0 ? (
            region.fraudTypes.map((fraudType) => (
              <div key={fraudType.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-bold text-slate-100">
                    {language === "kz" ? fraudType.nameKz || fraudType.nameRu : fraudType.nameRu}
                  </p>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-black text-slate-100">
                    {fraudType.count}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <EmptyLine text={t("general.empty")} />
          )}
        </div>

        <SectionTitle title={t("map.scammerInfo")} />
        <div className="space-y-3">
          {region.scammerContacts.length > 0 ? (
            region.scammerContacts.map((contact) => (
              <div key={`${contact.type}-${contact.value}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{contact.type}</p>
                    <p className="mt-1 font-mono text-sm font-bold text-slate-100">{contact.value}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${riskStyles[contact.riskLevel]}`}>
                    {t(riskLabelKeys[contact.riskLevel])}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  {contact.complaintsCount} {t("map.complaints")}
                </p>
              </div>
            ))
          ) : (
            <EmptyLine text={t("general.empty")} />
          )}
        </div>
      </aside>
    );
  }
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 truncate text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h3 className="mb-3 mt-7 text-lg font-black text-slate-100">{title}</h3>;
}

function EmptyLine({ text }: { text: string }) {
  return <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">{text}</p>;
}
