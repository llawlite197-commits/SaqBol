"use client";

import { NewsList } from "../../components/NewsList";
import { PublicLayout } from "../../components/PublicLayout";
import { useI18n } from "../../i18n/useI18n";

export default function NewsPage() {
  return (
    <PublicLayout>
      <NewsContent />
    </PublicLayout>
  );
}

function NewsContent() {
  const { t } = useI18n();

  return (
    <main className="bg-white py-20">
      <div className="saq-container">
        <h1 className="text-4xl font-black text-[#052447]">{t("news.latest")}</h1>
        <div className="mt-10">
          <NewsList />
        </div>
      </div>
    </main>
  );
}
