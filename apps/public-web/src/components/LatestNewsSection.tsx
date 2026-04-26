"use client";

import Link from "next/link";
import type { TranslationKey } from "../i18n/translations";
import { useI18n } from "../i18n/useI18n";

const news = [
  { titleKey: "news.demo.1", date: "15.02.2026", tagKey: "news.tag.warning" },
  { titleKey: "news.demo.2", date: "12.02.2026", tagKey: "news.tag.news" },
  { titleKey: "news.demo.3", date: "10.02.2026", tagKey: "news.tag.law" },
  { titleKey: "news.demo.4", date: "08.02.2026", tagKey: "news.tag.case" },
  { titleKey: "news.demo.5", date: "05.02.2026", tagKey: "news.tag.stats" }
] satisfies Array<{ titleKey: TranslationKey; date: string; tagKey: TranslationKey }>;

export function LatestNewsSection() {
  const { t } = useI18n();

  return (
    <section className="bg-white py-20">
      <div className="saq-container">
        <div className="mb-10 flex items-end justify-between gap-5">
          <h2 className="text-3xl font-black text-[#052447]">{t("news.latest")}</h2>
          <Link href="/news" className="font-extrabold text-[#df4547]">{t("news.all")} →</Link>
        </div>
        <div className="space-y-5">
          {news.map((item, index) => (
            <Link
              href="/news"
              key={item.titleKey}
              className={`flex items-center gap-5 rounded-lg border border-[#d6e1ec] p-6 transition hover:border-[#35aee2] ${index === 0 ? "bg-[#edf3f8]" : "bg-white"}`}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#60738a]" aria-hidden="true">
                <path d="M7 3h7l4 4v14H7V3Z" stroke="currentColor" strokeWidth="2" />
                <path d="M14 3v5h5M9 13h6M9 17h6" stroke="currentColor" strokeWidth="2" />
              </svg>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-[#052447]">{t(item.titleKey)}</h3>
                <div className="mt-2 flex items-center gap-4 text-sm text-[#60738a]">
                  <span>{item.date}</span>
                  <span className="rounded bg-[#edf3f8] px-2 py-1">{t(item.tagKey)}</span>
                </div>
              </div>
              <span className="text-2xl text-[#9aacbd]">›</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
