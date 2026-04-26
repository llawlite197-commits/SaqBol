"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { roleLabels } from "../lib/rbac";

export function RolesTable() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.roles().then((result) => setItems(result.items ?? [])).catch(() => setItems([]));
  }, []);

  return (
    <div className="workspace-card p-6">
      <h2 className="text-xl font-black">Роли</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {(items.length ? items : (["CITIZEN", "OPERATOR", "SUPERVISOR", "ADMIN"] as const).map((code) => ({ code }))).map((role) => {
          const roleRecord = role as Record<string, unknown>;
          const code = String(roleRecord.code) as keyof typeof roleLabels;
          return (
            <div key={code} className="rounded-2xl bg-slate-50 p-4">
              <p className="font-black">{roleLabels[code] ?? String(roleRecord.nameRu ?? code)}</p>
              <p className="text-sm text-slate-500">{code}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
