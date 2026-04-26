"use client";

import { FraudSchemesSection } from "../components/FraudSchemesSection";
import { HeroSection } from "../components/HeroSection";
import { KazakhstanMap } from "../components/KazakhstanMap";
import { LatestNewsSection } from "../components/LatestNewsSection";
import { PublicLayout } from "../components/PublicLayout";
import { StatsCards } from "../components/StatsCards";
import { useI18n } from "../i18n/useI18n";

export default function PublicHomePage() {
  return (
    <PublicLayout>
      <HeroSection />
      <StatsCards />
      <FraudSchemesSection />
      <HomeMapSection />
      <LatestNewsSection />
    </PublicLayout>
  );
}

function HomeMapSection() {
  const { t } = useI18n();

  return (
    <section className="bg-[#0b2c4d] py-20 text-white">
      <div className="saq-container text-center">
        <svg width="70" height="70" viewBox="0 0 24 24" fill="none" className="mx-auto text-[#35b9f2]" aria-hidden="true">
          <path d="M12 22s7-5.4 7-12A7 7 0 1 0 5 10c0 6.6 7 12 7 12Z" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
        </svg>
        <h2 className="mt-5 text-4xl font-black tracking-[-0.04em]">{t("map.title")}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-xl leading-8 text-slate-300">
          {t("map.subtitle")}
        </p>
        <div className="mt-10">
          <KazakhstanMap />
        </div>
      </div>
    </section>
  );
}
