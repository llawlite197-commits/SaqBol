"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Row = Record<string, unknown>;

export function UserTable() {
  const [items, setItems] = useState<Row[]>([]);

  useEffect(() => {
    api.users().then((result) => setItems(result.items ?? [])).catch(() => setItems([]));
  }, []);

  return (
    <div className="workspace-card overflow-hidden">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="p-4">Email</th>
            <th className="p-4">Телефон</th>
            <th className="p-4">Тип</th>
            <th className="p-4">Роли</th>
            <th className="p-4">Профиль</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const employeeProfile = item.employeeProfile as Record<string, unknown> | null;
            const citizenProfile = item.citizenProfile as Record<string, unknown> | null;
            const profile = employeeProfile ?? citizenProfile;
            return (
              <tr key={String(item.id)} className="border-t border-slate-100">
                <td className="p-4 font-bold">{String(item.email ?? "-")}</td>
                <td className="p-4">{String(item.phone ?? "-")}</td>
                <td className="p-4">{String(item.accountType ?? "-")}</td>
                <td className="p-4">{Array.isArray(item.roles) ? item.roles.join(", ") : "-"}</td>
                <td className="p-4">{`${String(profile?.lastName ?? "")} ${String(profile?.firstName ?? "")}`.trim() || "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {items.length === 0 ? <p className="p-6 text-slate-500">Пользователей для отображения нет.</p> : null}
    </div>
  );
}
