"use client";

import { useRouter } from "next/navigation";
import { getStaffUser } from "../lib/auth";
import { api } from "../lib/api";
import { roleLabels } from "../lib/rbac";

export function Topbar() {
  const router = useRouter();
  const user = getStaffUser();
  const role = user?.roles?.[0];

  function logout() {
    api.logout().finally(() => router.push("/login"));
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
      <div>
        <p className="text-sm text-slate-500">Рабочее место</p>
        <h1 className="text-xl font-black">SaqBol.kz</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right text-sm sm:block">
          <p className="font-bold">{user?.email ?? "employee"}</p>
          <p className="text-slate-500">{role ? roleLabels[role] : "Сотрудник"}</p>
        </div>
        <button onClick={logout} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold">Выйти</button>
      </div>
    </header>
  );
}
