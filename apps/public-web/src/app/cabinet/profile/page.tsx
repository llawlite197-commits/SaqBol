"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "../../../components/AuthGuard";
import { PublicLayout } from "../../../components/PublicLayout";
import { api } from "../../../lib/api";
import type { AuthUser } from "../../../types";

export default function CabinetProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    api.me().then((value) => setUser(value as AuthUser)).catch(() => setUser(null));
  }, []);

  return (
    <PublicLayout>
      <main className="mx-auto max-w-4xl px-4 py-12">
        <AuthGuard>
          <div className="rounded-[2rem] bg-white p-8 shadow-sm">
            <h1 className="text-4xl font-black">Профиль</h1>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Info label="Email" value={user?.email} />
              <Info label="Телефон" value={user?.phone} />
              <Info label="Имя" value={user?.citizenProfile?.firstName} />
              <Info label="Фамилия" value={user?.citizenProfile?.lastName} />
            </div>
          </div>
        </AuthGuard>
      </main>
    </PublicLayout>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-bold">{value ?? "Не указано"}</p>
    </div>
  );
}
