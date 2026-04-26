"use client";

import { CheckScammerForm } from "../../components/CheckScammerForm";
import { PublicLayout } from "../../components/PublicLayout";
import { useI18n } from "../../i18n/useI18n";

export default function CheckPage() {
  return (
    <PublicLayout>
      <CheckContent />
    </PublicLayout>
  );
}

function CheckContent() {
  const { t } = useI18n();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-4xl font-black">{t("check.title")}</h1>
      <p className="mt-3 max-w-2xl text-slate-600">{t("check.subtitle")}</p>
      <div className="mt-8">
        <CheckScammerForm />
      </div>
    </main>
  );
}
