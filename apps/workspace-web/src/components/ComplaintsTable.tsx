"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Complaint } from "../types";
import { ComplaintFilters } from "./ComplaintFilters";

export function ComplaintsTable() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [items, setItems] = useState<Complaint[]>([]);

  useEffect(() => {
    api.complaints(filters).then((result) => setItems(result.items ?? [])).catch(() => setItems([]));
  }, [filters]);

  return (
    <div className="space-y-4">
      <ComplaintFilters filters={filters} setFilters={setFilters} />
      <div className="workspace-card overflow-hidden">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-4">Номер</th>
              <th className="p-4">Статус</th>
              <th className="p-4">Регион</th>
              <th className="p-4">Тип</th>
              <th className="p-4">Гражданин</th>
              <th className="p-4">Создано</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="p-4 font-mono font-bold"><Link href={`/complaints/${item.id}`}>{item.complaintNumber}</Link></td>
                <td className="p-4"><span className="rounded-full bg-teal-50 px-3 py-1 font-bold text-teal-800">{item.currentStatus}</span></td>
                <td className="p-4">{item.region?.nameRu ?? "-"}</td>
                <td className="p-4">{item.fraudType?.nameRu ?? "-"}</td>
                <td className="p-4">{item.citizenUser?.email ?? item.citizenUser?.phone ?? "-"}</td>
                <td className="p-4">{new Date(item.createdAt).toLocaleString("ru-RU")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-6 text-slate-500">Жалобы не найдены.</p>}
      </div>
    </div>
  );
}
