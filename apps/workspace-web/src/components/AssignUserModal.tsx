"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function AssignUserModal({ complaintId, onChanged }: { complaintId: string; onChanged: () => void }) {
  const [assigneeEmployeeId, setAssigneeEmployeeId] = useState("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2");
  const [employees, setEmployees] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.users({ accountType: "EMPLOYEE", limit: "100" })
      .then((result) => {
        setEmployees(result.items ?? []);
        const firstEmployeeProfile = (result.items?.[0]?.employeeProfile as Record<string, unknown> | undefined)?.id;
        if (typeof firstEmployeeProfile === "string") setAssigneeEmployeeId(firstEmployeeProfile);
      })
      .catch(() => setEmployees([]));
  }, []);

  async function submit() {
    await api.assignComplaint(complaintId, assigneeEmployeeId);
    onChanged();
  }

  return (
    <div className="workspace-card p-4">
      <p className="font-black">Назначить исполнителя</p>
      <select className="workspace-input mt-3 w-full" value={assigneeEmployeeId} onChange={(e) => setAssigneeEmployeeId(e.target.value)}>
        {employees.length === 0 && <option value={assigneeEmployeeId}>Demo Operator</option>}
        {employees.map((employee) => {
          const profile = employee.employeeProfile as Record<string, unknown> | undefined;
          const id = String(profile?.id ?? "");
          const label = `${String(profile?.lastName ?? "")} ${String(profile?.firstName ?? "")}`.trim() || String(employee.email ?? id);
          return <option key={id} value={id}>{label}</option>;
        })}
      </select>
      <button onClick={submit} className="workspace-button mt-3 w-full">Назначить</button>
    </div>
  );
}
