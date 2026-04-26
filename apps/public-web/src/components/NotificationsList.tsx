"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { NotificationItem } from "../types";

export function NotificationsList() {
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    api.notifications().then((result) => setItems(result.items ?? []));
  }, []);

  if (items.length === 0) return <p className="rounded-3xl bg-white p-8">Уведомлений пока нет.</p>;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <button key={item.id} onClick={() => api.readNotification(item.id)} className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left">
          <p className="font-black">{item.subject ?? "Уведомление"}</p>
          <p className="mt-2 text-slate-600">{item.body}</p>
          <p className="mt-3 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString("ru-RU")}</p>
        </button>
      ))}
    </div>
  );
}
