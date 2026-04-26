"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import type { FraudType, Region } from "../types";

export function ComplaintFormStepper() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [regions, setRegions] = useState<Region[]>([]);
  const [fraudTypes, setFraudTypes] = useState<FraudType[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    regionId: "",
    fraudTypeId: "",
    incidentDate: "",
    damageAmount: "",
    contactType: "PHONE",
    contactValue: ""
  });

  useEffect(() => {
    Promise.all([api.regions(), api.fraudTypes()])
      .then(([nextRegions, nextFraudTypes]) => {
        setRegions(nextRegions);
        setFraudTypes(nextFraudTypes);
        setForm((current) => ({
          ...current,
          regionId: nextRegions[0]?.id ?? "",
          fraudTypeId: nextFraudTypes[0]?.id ?? ""
        }));
      })
      .catch(() => setError("Не удалось загрузить справочники"));
  }, []);

  function update(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("description", form.description);
      payload.append("regionId", form.regionId);
      payload.append("fraudTypeId", form.fraudTypeId);
      payload.append("incidentDate", form.incidentDate);
      payload.append("damageAmount", form.damageAmount || "0");
      if (form.contactValue) {
        payload.append("contacts", JSON.stringify([{ type: form.contactType, value: form.contactValue, isPrimary: true }]));
      }

      const complaint = await api.createComplaint(payload);
      router.push(`/cabinet/complaints/${complaint.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось подать жалобу");
    }
  }

  return (
    <form onSubmit={submit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex gap-2">
        {[1, 2, 3].map((item) => (
          <span key={item} className={`h-2 flex-1 rounded-full ${item <= step ? "bg-teal-800" : "bg-slate-200"}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-black">1. Описание случая</h2>
          <input placeholder="Короткий заголовок" value={form.title} onChange={(e) => update("title", e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
          <textarea placeholder="Опишите, что произошло" value={form.description} onChange={(e) => update("description", e.target.value)} className="min-h-40 w-full rounded-2xl border border-slate-300 px-4 py-3" required />
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4 md:grid-cols-2">
          <h2 className="text-2xl font-black md:col-span-2">2. Категория и регион</h2>
          <select value={form.fraudTypeId} onChange={(e) => update("fraudTypeId", e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3" required>
            {fraudTypes.map((item) => <option key={item.id} value={item.id}>{item.nameRu}</option>)}
          </select>
          <select value={form.regionId} onChange={(e) => update("regionId", e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3" required>
            {regions.map((item) => <option key={item.id} value={item.id}>{item.nameRu}</option>)}
          </select>
          <input type="date" value={form.incidentDate} onChange={(e) => update("incidentDate", e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3" />
          <input type="number" placeholder="Сумма ущерба, ₸" value={form.damageAmount} onChange={(e) => update("damageAmount", e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3" />
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-4 md:grid-cols-[180px_1fr]">
          <h2 className="text-2xl font-black md:col-span-2">3. Подозрительный контакт</h2>
          <select value={form.contactType} onChange={(e) => update("contactType", e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3">
            <option value="PHONE">Телефон</option>
            <option value="URL">URL</option>
            <option value="EMAIL">Email</option>
            <option value="CARD">Карта</option>
            <option value="IBAN">IBAN</option>
          </select>
          <input placeholder="Значение" value={form.contactValue} onChange={(e) => update("contactValue", e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3" />
        </div>
      )}

      {error && <p className="mt-4 text-sm font-bold text-red-700">{error}</p>}

      <div className="mt-8 flex justify-between gap-3">
        <button type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} className="rounded-2xl border border-slate-300 px-5 py-3 font-bold">
          Назад
        </button>
        {step < 3 ? (
          <button type="button" onClick={() => setStep((current) => Math.min(3, current + 1))} className="rounded-2xl bg-teal-800 px-5 py-3 font-bold text-white">
            Далее
          </button>
        ) : (
          <button className="rounded-2xl bg-teal-800 px-5 py-3 font-bold text-white">
            Отправить жалобу
          </button>
        )}
      </div>
    </form>
  );
}
