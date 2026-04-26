"use client";

import { ComplaintPublicForm } from "../../../components/ComplaintPublicForm";
import { PublicLayout } from "../../../components/PublicLayout";
import { useI18n } from "../../../i18n/useI18n";

export default function NewComplaintPage() {
  return (
    <PublicLayout>
      <NewComplaintContent />
    </PublicLayout>
  );
}

function NewComplaintContent() {
  const { t } = useI18n();

  return (
    <main className="bg-white">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-[#062747] md:text-5xl">
            {t("complaint.title")}
          </h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">
            {t("complaint.subtitle")}
          </p>
        </div>
        <ComplaintPublicForm />
      </section>
    </main>
  );
}
