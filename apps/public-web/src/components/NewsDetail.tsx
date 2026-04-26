"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { NewsItem } from "../types";

export function NewsDetail({ slug }: { slug: string }) {
  const [item, setItem] = useState<NewsItem | null>(null);

  useEffect(() => {
    api.newsBySlug(slug).then(setItem).catch(() => setItem(null));
  }, [slug]);

  if (!item) return <p className="rounded-3xl bg-white p-8">Загружаем новость...</p>;

  return (
    <article className="rounded-[2rem] bg-white p-8 shadow-sm">
      <p className="text-sm font-bold text-teal-800">{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("ru-RU") : "Новость"}</p>
      <h1 className="mt-4 text-4xl font-black">{item.titleRu}</h1>
      <p className="mt-5 text-lg text-slate-600">{item.summaryRu}</p>
      <div className="mt-8 whitespace-pre-wrap text-lg leading-8 text-slate-800">{item.contentRu}</div>
    </article>
  );
}
