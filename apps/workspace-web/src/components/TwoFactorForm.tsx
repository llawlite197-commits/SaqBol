"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { clearTwoFactorChallenge, getTwoFactorMockCode, getTwoFactorSessionId } from "../lib/auth";

export function TwoFactorForm() {
  const router = useRouter();
  const [code, setCode] = useState(getTwoFactorMockCode() ?? "");
  const [error, setError] = useState("");
  const sessionId = getTwoFactorSessionId();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!sessionId) {
      setError("2FA session not found.");
      return;
    }
    try {
      await api.verify2fa(sessionId, code);
      clearTwoFactorChallenge();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка 2FA");
    }
  }

  return (
    <form onSubmit={submit} className="workspace-card w-full max-w-md p-8">
      <h1 className="text-3xl font-black">2FA verification</h1>
      <p className="mt-2 text-slate-600">Для MVP код уже подставлен из mock-ответа backend.</p>
      <input value={code} onChange={(e) => setCode(e.target.value)} className="workspace-input mt-6 w-full text-center text-2xl font-black tracking-[0.4em]" maxLength={6} />
      {error && <p className="mt-4 text-sm font-bold text-red-700">{error}</p>}
      <button className="workspace-button mt-6 w-full">Подтвердить</button>
    </form>
  );
}
