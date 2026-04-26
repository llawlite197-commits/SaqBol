"use client";

import { PublicLayout } from "../../components/PublicLayout";
import { useI18n } from "../../i18n/useI18n";

export default function ContactsPage() {
  return (
    <PublicLayout>
      <ContactsContent />
    </PublicLayout>
  );
}

function ContactsContent() {
  const { t } = useI18n();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="rounded-[2rem] bg-white p-8">
        <h1 className="text-4xl font-black">{t("contacts.title")}</h1>
        <p className="mt-3 text-slate-500">{t("contacts.subtitle")}</p>
        <p className="mt-4 text-slate-600">{t("contacts.phone")}: 1414</p>
        <p className="mt-2 text-slate-600">{t("contacts.email")}: support@saqbol.kz</p>
        <p className="mt-2 text-slate-600">{t("contacts.address")}: {t("contacts.addressValue")}</p>
      </div>
    </main>
  );
}
