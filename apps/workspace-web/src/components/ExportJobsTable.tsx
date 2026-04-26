"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { getAccessToken } from "../lib/auth";
import type { ExportJob } from "../types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:4000/api/v1";

export function ExportJobsTable() {
  const [items, setItems] = useState<ExportJob[]>([]);

  useEffect(() => {
    api.exportJobs().then((result) => setItems(result.items ?? [])).catch(() => setItems([]));
  }, []);

  async function download(job: ExportJob) {
    const response = await fetch(`${apiBaseUrl}/admin/export/jobs/${job.id}/download`, {
      headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` }
    });
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = job.fileName ?? `export-${job.id}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="workspace-card overflow-hidden">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="p-4">Файл</th>
            <th className="p-4">Тип</th>
            <th className="p-4">Статус</th>
            <th className="p-4">Строк</th>
            <th className="p-4">Создано</th>
            <th className="p-4">Скачать</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-slate-100">
              <td className="p-4 font-bold">{item.fileName ?? item.id}</td>
              <td className="p-4">{item.jobType}</td>
              <td className="p-4">{item.jobStatus}</td>
              <td className="p-4">{item.rowCount ?? "-"}</td>
              <td className="p-4">{new Date(item.createdAt).toLocaleString("ru-RU")}</td>
              <td className="p-4">
                <button className="font-bold text-teal-700" onClick={() => download(item)}>
                  download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p className="p-6 text-slate-500">Экспортов пока нет.</p>}
    </div>
  );
}
