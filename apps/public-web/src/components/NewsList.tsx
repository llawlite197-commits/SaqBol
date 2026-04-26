"use client";

import { useEffect, useState } from "react";
import { useI18n } from "../i18n/useI18n";
import { api } from "../lib/api";
import type { NewsItem } from "../types";
import { NewsCard } from "./NewsCard";

export function NewsList() {
  const { t } = useI18n();
  const [items, setItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    api.news().then((result) => setItems(result.items ?? [])).catch(() => setItems([]));
  }, []);

  if (items.length === 0) {
    const fallback = [
      { id: "1", titleRu: t("news.demo.1"), titleKz: t("news.demo.1"), slug: "whatsapp-scam", summaryRu: t("news.tag.warning"), summaryKz: t("news.tag.warning"), publishedAt: "2026-02-15T00:00:00.000Z" },
      { id: "2", titleRu: t("news.demo.2"), titleKz: t("news.demo.2"), slug: "afm-blocked-accounts", summaryRu: t("news.tag.news"), summaryKz: t("news.tag.news"), publishedAt: "2026-02-12T00:00:00.000Z" },
      { id: "3", titleRu: t("news.demo.3"), titleKz: t("news.demo.3"), slug: "fin-services-law", summaryRu: t("news.tag.law"), summaryKz: t("news.tag.law"), publishedAt: "2026-02-10T00:00:00.000Z" },
      { id: "4", titleRu: t("news.demo.4"), titleKz: t("news.demo.4"), slug: "phishing-network", summaryRu: t("news.tag.case"), summaryKz: t("news.tag.case"), publishedAt: "2026-02-08T00:00:00.000Z" }
    ];
    return (
      <div className="space-y-5">
        {fallback.map((item) => <NewsCard key={item.slug} item={item} />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {items.map((item) => <NewsCard key={item.id} item={item} />)}
    </div>
  );
}
