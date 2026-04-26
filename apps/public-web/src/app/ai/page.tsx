"use client";

import { PublicLayout } from "../../components/PublicLayout";
import { useI18n } from "../../i18n/useI18n";

export default function AiPage() {
  return (
    <PublicLayout>
      <AiContent />
    </PublicLayout>
  );
}

function AiContent() {
  const { t } = useI18n();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-4xl font-black">{t("ai.title")}</h1>
      <p className="mb-6 text-slate-600">{t("ai.question")}</p>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-700">{t("ai.welcome")}</p>
        <p className="mt-3 text-sm text-slate-500">{t("ai.openHint")}</p>
      </div>
    </main>
  );
}
