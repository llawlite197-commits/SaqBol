"use client";

import type { ComplaintStatus } from "../types";

const statuses: ComplaintStatus[] = ["NEW", "UNDER_REVIEW", "NEED_INFO", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED", "DUPLICATE"];

export function ComplaintFilters({
  filters,
  setFilters
}: {
  filters: Record<string, string>;
  setFilters: (value: Record<string, string>) => void;
}) {
  return (
    <div className="workspace-card grid gap-3 p-4 md:grid-cols-5">
      <input className="workspace-input" placeholder="Поиск" value={filters.search ?? ""} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
      <select className="workspace-input" value={filters.status ?? ""} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
        <option value="">Все статусы</option>
        {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
      <input className="workspace-input" type="date" value={filters.dateFrom ?? ""} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
      <input className="workspace-input" type="date" value={filters.dateTo ?? ""} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
      <button className="workspace-button" onClick={() => setFilters({})}>Сбросить</button>
    </div>
  );
}
