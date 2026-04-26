import Link from "next/link";
import { useI18n } from "../i18n/useI18n";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="bg-[#0b2c4d] text-slate-300">
      <div className="saq-container grid gap-12 py-16 md:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <svg width="34" height="39" viewBox="0 0 36 42" fill="none" aria-hidden="true">
              <path d="M18 3L31 8.2V18.8C31 27.6 25.7 35.3 18 38.8C10.3 35.3 5 27.6 5 18.8V8.2L18 3Z" stroke="#35B9F2" strokeWidth="3" />
            </svg>
            <span className="text-2xl font-black text-white">SaqBol.kz</span>
          </Link>
          <p className="mt-7 max-w-sm text-lg leading-8">
            {t("footer.description")}
          </p>
        </div>
        <div className="space-y-4">
          <p className="font-black uppercase tracking-wide text-slate-500">{t("footer.sections")}</p>
          <Link href="/fraud-types" className="block hover:text-white">{t("nav.fraudTypes")}</Link>
          <Link href="/learn" className="block hover:text-white">{t("nav.prevent")}</Link>
          <Link href="/complaints/new" className="block hover:text-white">{t("nav.complaint")}</Link>
          <Link href="/check" className="block hover:text-white">{t("nav.check")}</Link>
        </div>
        <div className="space-y-4">
          <p className="font-black uppercase tracking-wide text-slate-500">{t("footer.partners")}</p>
          <p>{t("footer.partner.afm")}</p>
          <p>{t("footer.partner.ser")}</p>
          <p>{t("footer.partner.cyber")}</p>
        </div>
        <div className="space-y-4">
          <p className="font-black uppercase tracking-wide text-slate-500">{t("footer.legal")}</p>
          <Link href="/contacts" className="block hover:text-white">{t("footer.privacy")}</Link>
          <Link href="/faq" className="block hover:text-white">{t("footer.terms")}</Link>
          <Link href="/contacts" className="block hover:text-white">{t("footer.consent")}</Link>
        </div>
      </div>
      <div className="saq-container border-t border-white/10 py-8 text-center text-sm text-slate-500">
        {t("footer.rights")}
      </div>
    </footer>
  );
}
