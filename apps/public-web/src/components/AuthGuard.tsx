"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isAuthenticated } from "../lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(isAuthenticated());
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="rounded-3xl bg-white p-8">Проверяем сессию...</div>;
  }

  if (!allowed) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8">
        <h2 className="text-2xl font-black text-amber-950">Требуется вход</h2>
        <p className="mt-2 text-amber-900">Для этого раздела нужно авторизоваться как гражданин.</p>
        <Link href="/login" className="mt-5 inline-flex rounded-2xl bg-teal-800 px-5 py-3 font-bold text-white">
          Войти
        </Link>
      </div>
    );
  }

  return children;
}
