"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { saveStaffSession } from "../lib/auth";

export function StaffLoginForm() {
  const router = useRouter();
  const [login, setLogin] = useState("admin@example.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    try {
      const session = await api.staffLogin(login, password);

      saveStaffSession(session);

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    }
  }

  return (
    <form onSubmit={submit} className="workspace-card w-full max-w-md p-8">
      <p className="text-sm font-black tracking-[0.2em] text-teal-800">
        SAQBOL WORKSPACE
      </p>

      <h1 className="mt-4 text-3xl font-black">Вход сотрудника</h1>

      <input
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        className="workspace-input mt-6 w-full"
        placeholder="Email"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="workspace-input mt-3 w-full"
        placeholder="Пароль"
      />

      {error && <p className="mt-4 text-sm font-bold text-red-700">{error}</p>}

      <button className="workspace-button mt-6 w-full">Войти</button>
    </form>
  );
}