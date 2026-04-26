"use client";

import { useState } from "react";
import { api } from "../lib/api";

export function ExportButton() {
  const [format, setFormat] = useState<"CSV" | "XLSX">("CSV");
  const [message, setMessage] = useState("");

  async function createExport() {
    setMessage("Готовим экспорт...");
    try {
      const job = await api.exportComplaints(format);
      setMessage(`Экспорт создан: ${job.fileName ?? job.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка экспорта");
    }
  }

  return (
    <div className="workspace-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-xl font-black">Экспорт жалоб</h2>
        <p className="text-sm text-slate-500">CSV/XLSX выгрузка с audit logging.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <select className="workspace-input" value={format} onChange={(event) => setFormat(event.target.value as "CSV" | "XLSX")}>
          <option value="CSV">CSV</option>
          <option value="XLSX">XLSX</option>
        </select>
        <button className="workspace-button" onClick={createExport}>Создать экспорт</button>
      </div>
      {message && <p className="text-sm font-bold text-slate-700">{message}</p>}
    </div>
  );
}
