import type { Complaint } from "../types";

const labels: Record<string, string> = {
  NEW: "Новое",
  UNDER_REVIEW: "На проверке",
  NEED_INFO: "Нужна информация",
  ASSIGNED: "Назначено",
  IN_PROGRESS: "В работе",
  RESOLVED: "Решено",
  REJECTED: "Отклонено",
  DUPLICATE: "Дубликат"
};

export function ComplaintStatusCard({ complaint }: { complaint: Complaint }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-slate-500">{complaint.complaintNumber}</p>
          <h3 className="mt-2 text-xl font-black">{complaint.title || complaint.description.slice(0, 80)}</h3>
        </div>
        <span className="rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-teal-900">
          {labels[complaint.currentStatus] ?? complaint.currentStatus}
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-500">
        {complaint.region?.nameRu ?? "Регион не указан"} · {complaint.fraudType?.nameRu ?? "Тип не указан"}
      </p>
    </div>
  );
}
