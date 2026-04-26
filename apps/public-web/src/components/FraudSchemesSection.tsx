"use client";

import Link from "next/link";
import type { TranslationKey } from "../i18n/translations";
import { useI18n } from "../i18n/useI18n";

const schemes = [
  {
    titleKey: "schemes.phone.title",
    descriptionKey: "schemes.phone.description",
    color: "#df4547",
    icon: "phone"
  },
  {
    titleKey: "schemes.online.title",
    descriptionKey: "schemes.online.description",
    color: "#35aee2",
    icon: "globe"
  },
  {
    titleKey: "schemes.bank.title",
    descriptionKey: "schemes.bank.description",
    color: "#eea51a",
    icon: "card"
  },
  {
    titleKey: "schemes.invest.title",
    descriptionKey: "schemes.invest.description",
    color: "#2ca665",
    icon: "trend"
  },
  {
    titleKey: "schemes.phishing.title",
    descriptionKey: "schemes.phishing.description",
    color: "#df4547",
    icon: "warning"
  },
  {
    titleKey: "schemes.marketplace.title",
    descriptionKey: "schemes.marketplace.description",
    color: "#35aee2",
    icon: "search"
  }
] satisfies Array<{
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  color: string;
  icon: string;
}>;

function SchemeIcon({ icon, color }: { icon: string; color: string }) {
  const common = { stroke: color, strokeWidth: 2.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (icon === "phone") return <path {...common} d="M7 5h4l2 5-2.5 1.7c1.2 2.4 3.1 4.3 5.8 5.8L18 16h5v4c0 1.1-.9 2-2 2C10.5 22 2 13.5 2 3c0-1.1.9-2 2-2h3v4Z" />;
  if (icon === "globe") return <><circle {...common} cx="12" cy="12" r="9" /><path {...common} d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" /></>;
  if (icon === "card") return <><rect {...common} x="3" y="6" width="18" height="12" rx="2" /><path {...common} d="M3 10h18" /></>;
  if (icon === "trend") return <path {...common} d="M3 17l6-6 4 4 8-8M17 7h4v4" />;
  if (icon === "warning") return <><path {...common} d="M12 3l10 18H2L12 3Z" /><path {...common} d="M12 9v5M12 18h.01" /></>;
  return <><circle {...common} cx="11" cy="11" r="7" /><path {...common} d="M20 20l-4-4" /></>;
}

export function FraudSchemesSection() {
  const { t } = useI18n();

  return (
    <section className="bg-white py-20">
      <div className="saq-container">
        <div className="text-center">
          <h2 className="text-4xl font-black tracking-[-0.04em] text-[#052447]">{t("schemes.title")}</h2>
          <p className="mt-4 text-xl text-[#60738a]">{t("schemes.subtitle")}</p>
        </div>
        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {schemes.map((scheme, index) => (
            <article key={scheme.titleKey} className="saq-card min-h-[250px] p-8 transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(6,36,71,0.11)]">
              <svg width="54" height="54" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <SchemeIcon icon={scheme.icon} color={scheme.color} />
              </svg>
              <h3 className="mt-6 text-2xl font-black text-[#052447]">{t(scheme.titleKey)}</h3>
              <p className="mt-4 text-lg leading-7 text-[#60738a]">{t(scheme.descriptionKey)}</p>
              <Link
                href={`/fraud-types#${index}`}
                className="mt-7 inline-flex items-center gap-2 font-extrabold text-[#f0b2b2] hover:text-[#df4547] transition"
              >
                {t("schemes.more")} <span>›</span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
