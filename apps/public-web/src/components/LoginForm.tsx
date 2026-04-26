"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";

export function LoginForm() {
  const router = useRouter();
  const [login, setLogin] = useState("citizen@saqbol.local");
  const [password, setPassword] = useState("Citizen123!Secure");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.login(login, password);
      router.push("/cabinet");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось войти");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-black">Вход гражданина</h1>
      <p className="mt-2 text-slate-600">Используйте email или телефон, указанный при регистрации.</p>
      <label className="mt-6 block text-sm font-bold">Email или телефон</label>
      <input value={login} onChange={(e) => setLogin(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
      <label className="mt-4 block text-sm font-bold">Пароль</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
      {error && <p className="mt-4 text-sm font-bold text-red-700">{error}</p>}
      <button disabled={loading} className="mt-6 w-full rounded-2xl bg-teal-800 px-5 py-3 font-bold text-white disabled:opacity-60">
        {loading ? "Входим..." : "Войти"}
      </button>
      <div className="mt-5 flex justify-between text-sm">
        <Link href="/register" className="font-bold text-teal-800">Регистрация</Link>
        <Link href="/forgot-password" className="text-slate-500">Забыли пароль?</Link>
      </div>
    </form>
  );
}
