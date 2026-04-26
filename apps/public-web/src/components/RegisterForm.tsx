"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    phone: "",
    password: "",
    firstName: "",
    lastName: "",
    preferredLanguage: "ru"
  });
  const [error, setError] = useState("");

  function update(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api.register(form);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось зарегистрироваться");
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-black">Регистрация</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input placeholder="Имя" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3" required />
        <input placeholder="Фамилия" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3" required />
        <input placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3" required />
        <input placeholder="Телефон" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3" required />
        <input type="password" placeholder="Пароль" value={form.password} onChange={(e) => update("password", e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3 md:col-span-2" required />
      </div>
      {error && <p className="mt-4 text-sm font-bold text-red-700">{error}</p>}
      <button className="mt-6 rounded-2xl bg-teal-800 px-6 py-3 font-bold text-white">Создать аккаунт</button>
    </form>
  );
}
