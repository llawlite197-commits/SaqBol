"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Complaint } from "../types";
import { AssignUserModal } from "./AssignUserModal";
import { ComplaintTimeline } from "./ComplaintTimeline";
import { InternalComments } from "./InternalComments";
import { StatusChangeModal } from "./StatusChangeModal";

export function ComplaintDetail({ id }: { id: string }) {
  const [complaint, setComplaint] = useState<Complaint | null>(null);

  function load() {
    api.complaint(id).then(setComplaint);
  }

  useEffect(load, [id]);

  if (!complaint) return <p>Загружаем карточку...</p>;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <section className="space-y-5">
        <div className="workspace-card p-6">
          <p className="font-mono text-sm text-slate-500">{complaint.complaintNumber}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-black">{complaint.title ?? "Жалоба"}</h1>
            <span className="rounded-full bg-teal-50 px-4 py-2 font-bold text-teal-800">{complaint.currentStatus}</span>
          </div>
          <p className="mt-5 whitespace-pre-wrap text-slate-700">{complaint.description}</p>
        </div>
        <div className="workspace-card p-5">
          <h2 className="font-black">Контакты</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {(complaint.contacts ?? []).map((contact) => (
              <div key={contact.id} className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-500">{contact.contactType}</p>
                <p className="font-mono">{contact.rawValue}</p>
              </div>
            ))}
          </div>
        </div>
        <InternalComments complaint={complaint} onChanged={load} />
        <ComplaintTimeline complaint={complaint} />
      </section>
      <aside className="space-y-5">
        <StatusChangeModal complaintId={complaint.id} onChanged={load} />
        <AssignUserModal complaintId={complaint.id} onChanged={load} />
      </aside>
    </div>
  );
}
