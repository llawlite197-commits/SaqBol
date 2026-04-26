"use client";

import { useState } from "react";
import { api } from "../lib/api";

export function FileUploader({ complaintId }: { complaintId: string }) {
  const [message, setMessage] = useState("");

  async function upload(file: File | undefined) {
    if (!file) return;
    setMessage("Загружаем...");
    try {
      await api.uploadComplaintFile(complaintId, file);
      setMessage("Файл загружен");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Ошибка загрузки");
    }
  }

  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6">
      <p className="font-bold">Приложить файл</p>
      <p className="mt-1 text-sm text-slate-500">jpg, png, pdf, doc, docx до 10MB</p>
      <input type="file" onChange={(event) => upload(event.target.files?.[0])} className="mt-4 block w-full text-sm" />
      {message && <p className="mt-3 text-sm font-semibold text-teal-800">{message}</p>}
    </div>
  );
}
