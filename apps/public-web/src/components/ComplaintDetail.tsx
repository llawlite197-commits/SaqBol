"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Complaint } from "../types";
import { ComplaintStatusCard } from "./ComplaintStatusCard";
import { ComplaintTimeline } from "./ComplaintTimeline";
import { FileUploader } from "./FileUploader";

export function ComplaintDetail({ id }: { id: string }) {
  const [complaint, setComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    api.complaintById(id).then(setComplaint);
  }, [id]);

  if (!complaint) return <p>Загружаем карточку...</p>;

  return (
    <div className="space-y-6">
      <ComplaintStatusCard complaint={complaint} />
      <div className="rounded-3xl bg-white p-6">
        <h2 className="text-xl font-black">Описание</h2>
        <p className="mt-3 whitespace-pre-wrap text-slate-700">{complaint.description}</p>
      </div>
      <FileUploader complaintId={complaint.id} />
      <div>
        <h2 className="mb-4 text-xl font-black">История статусов</h2>
        <ComplaintTimeline items={complaint.statusHistory} />
      </div>
    </div>
  );
}
