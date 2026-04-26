"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isStaffAuthenticated } from "../lib/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(isStaffAuthenticated());
    setReady(true);
  }, []);

  if (!ready) return <div className="workspace-card p-6">Проверяем доступ...</div>;

  if (!allowed) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100 p-6">
        <div className="workspace-card max-w-md p-8">
          <h1 className="text-2xl font-black">Требуется вход сотрудника</h1>
          <p className="mt-3 text-slate-600">Откройте рабочую сессию через 2FA.</p>
          <Link href="/login" className="workspace-button mt-5 inline-flex">Войти</Link>
        </div>
      </div>
    );
  }

  return children;
}
