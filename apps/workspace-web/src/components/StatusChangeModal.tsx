"use client";

import { useState } from "react";
import { api } from "../lib/api";
import type { ComplaintStatus } from "../types";

const statuses: ComplaintStatus[] = ["UNDER_REVIEW", "NEED_INFO", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED", "DUPLICATE"];

export function StatusChangeModal({ complaintId, onChanged }: { complaintId: string; onChanged: () => void }) {
  const [status, setStatus] = useState<ComplaintStatus>("UNDER_REVIEW");
  const [reasonText, setReasonText] = useState("");

  async function submit() {
    await api.updateStatus(complaintId, status, reasonText);
    onChanged();
  }

  return (
    <div className="workspace-card p-4">
      <p className="font-black">Сменить статус</p>
      <select className="workspace-input mt-3 w-full" value={status} onChange={(e) => setStatus(e.target.value as ComplaintStatus)}>
        {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <textarea className="workspace-input mt-3 w-full" placeholder="Причина" value={reasonText} onChange={(e) => setReasonText(e.target.value)} />
      <button onClick={submit} className="workspace-button mt-3 w-full">Сохранить</button>
    </div>
  );
}
