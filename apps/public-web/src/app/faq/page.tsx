"use client";

import { PublicLayout } from "../../components/PublicLayout";
import type { TranslationKey } from "../../i18n/translations";
import { useI18n } from "../../i18n/useI18n";

const faq = [
  ["faq.q1", "faq.a1"],
  ["faq.q2", "faq.a2"],
  ["faq.q3", "faq.a3"]
] satisfies Array<[TranslationKey, TranslationKey]>;

export default function FaqPage() {
  return (
    <PublicLayout>
      <FaqContent />
    </PublicLayout>
  );
}

function FaqContent() {
  const { t } = useI18n();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-black">{t("faq.title")}</h1>
      <div className="mt-8 space-y-4">
        {faq.map(([question, answer]) => (
          <div key={question} className="rounded-3xl bg-white p-6">
            <h2 className="font-black">{t(question)}</h2>
            <p className="mt-2 text-slate-600">{t(answer)}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
