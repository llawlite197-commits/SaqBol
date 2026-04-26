"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { BlacklistEntry } from "../types";

export function BlacklistTable() {
  const [items, setItems] = useState<BlacklistEntry[]>([]);
  const [type, setType] = useState("PHONE");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");

  function load() {
    api.blacklist().then((result) => setItems(result.items ?? [])).catch(() => setItems([]));
  }

  useEffect(load, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await api.createBlacklist({ type, value, notes, isActive: true, sourceType: "MANUAL" });
    setValue("");
    setNotes("");
    load();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <form onSubmit={submit} className="workspace-card space-y-3 p-5">
        <h2 className="text-xl font-black">Добавить в blacklist</h2>
        <select className="workspace-input w-full" value={type} onChange={(event) => setType(event.target.value)}>
          {["PHONE", "URL", "EMAIL", "CARD", "IBAN"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <input className="workspace-input w-full" placeholder="Значение" value={value} onChange={(event) => setValue(event.target.value)} />
        <textarea className="workspace-input min-h-24 w-full" placeholder="Комментарий" value={notes} onChange={(event) => setNotes(event.target.value)} />
        <button className="workspace-button w-full">Добавить</button>
      </form>
      <div className="workspace-card overflow-hidden">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-4">Тип</th>
              <th className="p-4">Значение</th>
              <th className="p-4">Нормализовано</th>
              <th className="p-4">Статус</th>
              <th className="p-4">Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="p-4 font-bold">{item.entryType}</td>
                <td className="p-4">{item.rawValue}</td>
                <td className="p-4 font-mono text-xs">{item.normalizedValue}</td>
                <td className="p-4">{item.isActive ? "active" : "inactive"}</td>
                <td className="p-4">
                  <button className="font-bold text-red-700" onClick={() => api.deleteBlacklist(item.id).then(load)}>
                    delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-6 text-slate-500">Blacklist пуст.</p>}
      </div>
    </div>
  );
}
