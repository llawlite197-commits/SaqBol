import Link from "next/link";
import { useI18n } from "../i18n/useI18n";

export function HeroSection() {
  const { t } = useI18n();

  return (
    <section
      className="relative min-h-[637px] overflow-hidden bg-slate-950 bg-cover bg-center text-white"
      style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
    >
      <div className="absolute inset-0 bg-[#061b2f]/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#061b2f] via-[#061b2f]/85 to-[#061b2f]/35" />

      <div className="saq-container relative flex min-h-[637px] items-center">
        <div className="max-w-[760px] pt-8">

          <h1 className="mt-7 text-5xl font-black leading-[0.95] tracking-[-0.06em] md:text-7xl">
            {t("hero.title")}
          </h1>

          <p className="mt-7 max-w-[760px] text-xl leading-9 text-slate-200 md:text-2xl md:leading-10">
            {t("hero.subtitle")}
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/complaints/new" className="saq-cta px-10 text-center">
              {t("hero.report")}
            </Link>

            <Link
              href="/check"
              className="rounded-lg bg-white px-10 py-4 text-center font-extrabold text-[#0b2c4d] shadow-sm transition hover:bg-slate-100"
            >
              {t("hero.check")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
