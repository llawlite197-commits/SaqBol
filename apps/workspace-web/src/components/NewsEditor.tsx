"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { NewsItem } from "../types";

export function NewsEditor() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [titleRu, setTitleRu] = useState("");
  const [summaryRu, setSummaryRu] = useState("");
  const [contentRu, setContentRu] = useState("");
  const [message, setMessage] = useState("");

  function load() {
    api.adminNews().then((result) => setItems(result.items ?? [])).catch(() => setItems([]));
  }

  useEffect(load, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await api.createNews({ titleRu, summaryRu, contentRu, status: "DRAFT" });
      setTitleRu("");
      setSummaryRu("");
      setContentRu("");
      setMessage("Новость создана.");
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка сохранения");
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <form onSubmit={submit} className="workspace-card space-y-3 p-5">
        <h2 className="text-xl font-black">Новая новость</h2>
        <input className="workspace-input w-full" placeholder="Заголовок RU" value={titleRu} onChange={(event) => setTitleRu(event.target.value)} />
        <textarea className="workspace-input min-h-24 w-full" placeholder="Краткое описание" value={summaryRu} onChange={(event) => setSummaryRu(event.target.value)} />
        <textarea className="workspace-input min-h-40 w-full" placeholder="Контент" value={contentRu} onChange={(event) => setContentRu(event.target.value)} />
        <button className="workspace-button w-full">Сохранить draft</button>
        {message && <p className="text-sm font-bold text-slate-700">{message}</p>}
      </form>
      <div className="workspace-card overflow-hidden">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-black">{item.titleRu}</p>
              <p className="text-sm text-slate-500">{item.slug} · {item.status}</p>
            </div>
            <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white" onClick={() => api.publishNews(item.id).then(load)}>
              Publish
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="p-6 text-slate-500">Новостей пока нет.</p>}
      </div>
    </div>
  );
}
