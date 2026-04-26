import type { Complaint } from "../types";

export function ComplaintTimeline({ complaint }: { complaint: Complaint }) {
  return (
    <div className="workspace-card p-5">
      <h2 className="font-black">История статусов</h2>
      <div className="mt-4 space-y-3">
        {(complaint.statusHistory ?? []).map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200 p-3">
            <p className="font-bold">{item.fromStatus ?? "START"} → {item.toStatus}</p>
            <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("ru-RU")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
