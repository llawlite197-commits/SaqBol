"use client";

import { FormEvent, useState } from "react";
import { useI18n } from "../i18n/useI18n";
import { api } from "../lib/api";
import type { CheckResult } from "../types";
import { RiskResultCard } from "./RiskResultCard";

export function CheckScammerForm() {
  const { t } = useI18n();
  const [type, setType] = useState("PHONE");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      setResult(await api.checkScammer({ type, value }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("check.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[180px_1fr_auto]">
        <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3">
          <option value="PHONE">{t("check.type.phone")}</option>
          <option value="URL">{t("check.type.url")}</option>
          <option value="EMAIL">{t("check.type.email")}</option>
          <option value="CARD">{t("check.type.card")}</option>
          <option value="IBAN">IBAN</option>
        </select>
        <input value={value} onChange={(event) => setValue(event.target.value)} placeholder={t("check.placeholder")} className="rounded-2xl border border-slate-300 px-4 py-3" required />
        <button disabled={loading} className="rounded-2xl bg-teal-800 px-6 py-3 font-bold text-white disabled:opacity-60">
          {loading ? t("check.loading") : t("check.submit")}
        </button>
      </div>
      {error && <p className="mt-4 text-sm font-semibold text-red-700">{error}</p>}
      {result && <div className="mt-5"><RiskResultCard result={result} /></div>}
    </form>
  );
}
