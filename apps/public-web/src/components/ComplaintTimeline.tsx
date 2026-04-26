import type { ComplaintStatusHistory } from "../types";

export function ComplaintTimeline({ items = [] }: { items?: ComplaintStatusHistory[] }) {
  if (items.length === 0) {
    return <p className="text-slate-500">История статусов пока пуста.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="font-bold text-slate-900">{item.fromStatus ?? "START"} → {item.toStatus}</p>
          <p className="mt-1 text-sm text-slate-500">{new Date(item.createdAt).toLocaleString("ru-RU")}</p>
          {item.reasonText && <p className="mt-2 text-sm text-slate-600">{item.reasonText}</p>}
        </div>
      ))}
    </div>
  );
}
