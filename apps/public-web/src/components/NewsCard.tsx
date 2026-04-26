import Link from "next/link";
import { useI18n } from "../i18n/useI18n";
import type { NewsItem } from "../types";

export function NewsCard({ item }: { item: NewsItem }) {
  const { language, t } = useI18n();
  const title = language === "kz" ? item.titleKz ?? item.titleRu : item.titleRu ?? item.titleKz;
  const summary = language === "kz" ? item.summaryKz ?? item.summaryRu : item.summaryRu ?? item.summaryKz;

  return (
    <Link href={`/news/${item.slug}`} className="flex items-center gap-5 rounded-lg border border-[#d6e1ec] bg-white p-6 transition hover:border-[#35aee2] hover:bg-[#edf3f8]">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#60738a]" aria-hidden="true">
        <path d="M7 3h7l4 4v14H7V3Z" stroke="currentColor" strokeWidth="2" />
        <path d="M14 3v5h5M9 13h6M9 17h6" stroke="currentColor" strokeWidth="2" />
      </svg>
      <div className="min-w-0 flex-1">
        <h3 className="font-black text-[#052447]">{title}</h3>
        <div className="mt-2 flex items-center gap-4 text-sm text-[#60738a]">
          <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString(language === "kz" ? "kk-KZ" : "ru-RU") : t("news.title")}</span>
          {summary && <span className="rounded bg-[#edf3f8] px-2 py-1">{summary}</span>}
        </div>
      </div>
      <span className="text-2xl text-[#9aacbd]">›</span>
    </Link>
  );
}
