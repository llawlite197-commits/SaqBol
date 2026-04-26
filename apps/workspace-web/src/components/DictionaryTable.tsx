"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { DictionaryItem } from "../types";

type DictionaryKind = "regions" | "fraud-types";

export function DictionaryTable({ kind }: { kind: DictionaryKind }) {
  const [items, setItems] = useState<DictionaryItem[]>([]);
  const [code, setCode] = useState("");
  const [nameRu, setNameRu] = useState("");
  const title = kind === "regions" ? "Регионы" : "Типы мошенничества";

  function load() {
    const request = kind === "regions" ? api.regions : api.fraudTypes;
    request().then(setItems).catch(() => setItems([]));
  }

  useEffect(load, [kind]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const body = kind === "regions" ? { code, nameRu, kind: "REGION", isActive: true } : { code, nameRu, isActive: true };
    if (kind === "regions") await api.createRegion(body);
    else await api.createFraudType(body);
    setCode("");
    setNameRu("");
    load();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <form onSubmit={submit} className="workspace-card space-y-3 p-5">
        <h2 className="text-xl font-black">Добавить</h2>
        <input className="workspace-input w-full" placeholder="code" value={code} onChange={(event) => setCode(event.target.value)} />
        <input className="workspace-input w-full" placeholder="Название RU" value={nameRu} onChange={(event) => setNameRu(event.target.value)} />
        <button className="workspace-button w-full">Создать</button>
      </form>
      <div className="workspace-card overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-xl font-black">{title}</h2>
        </div>
        {items.map((item) => (
          <div key={item.id} className="grid gap-2 border-b border-slate-100 p-4 md:grid-cols-3">
            <span className="font-mono text-sm">{item.code}</span>
            <span className="font-bold">{item.nameRu}</span>
            <span className={item.isActive === false ? "text-red-700" : "text-teal-700"}>{item.isActive === false ? "inactive" : "active"}</span>
          </div>
        ))}
        {items.length === 0 && <p className="p-6 text-slate-500">Справочник пуст.</p>}
      </div>
    </div>
  );
}
