"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";

type AuditRow = Record<string, unknown>;

export function AuditLogTable() {
  const [items, setItems] = useState<AuditRow[]>([]);

  useEffect(() => {
    api.auditLogs().then((result) => setItems(result.items ?? [])).catch(() => setItems([]));
  }, []);

  return (
    <div className="workspace-card overflow-hidden">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="p-4">Дата</th>
            <th className="p-4">Пользователь</th>
            <th className="p-4">Действие</th>
            <th className="p-4">Сущность</th>
            <th className="p-4">IP</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={String(item.id ?? index)} className="border-t border-slate-100">
              <td className="p-4">{item.createdAt ? new Date(String(item.createdAt)).toLocaleString("ru-RU") : "-"}</td>
              <td className="p-4">{String((item.actorUser as Record<string, unknown> | undefined)?.email ?? item.actorUserId ?? "-")}</td>
              <td className="p-4 font-bold">{String(item.actionType ?? "-")}</td>
              <td className="p-4">{String(item.entityType ?? "-")}</td>
              <td className="p-4">{String(item.ipAddress ?? "-")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p className="p-6 text-slate-500">Журнал действий пока пуст.</p>}
    </div>
  );
}
