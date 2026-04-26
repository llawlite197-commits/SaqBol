"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "../i18n/useI18n";

export function Header() {
  const [open, setOpen] = useState(false);
  const { language, setLanguage, t } = useI18n();

  const navItems = [
    { href: "/", label: t("nav.home") },
    { href: "/fraud-types", label: t("nav.fraudTypes") },
    { href: "/learn", label: t("nav.prevent") },
    { href: "/complaints/new", label: t("nav.complaint") },
    { href: "/check", label: t("nav.check") },
    { href: "/map", label: t("nav.map") },
    { href: "/news", label: t("nav.news") }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b2f4f] text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <svg
            width="40"
            height="40"
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden="true"
            className="text-sky-400"
          >
            <path
              d="M32 6L51 13V28C51 42.5 42.8 53.5 32 58C21.2 53.5 13 42.5 13 28V13L32 6Z"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinejoin="round"
            />
          </svg>

          <span className="text-2xl font-black tracking-tight text-white">
            SaqBol<span className="text-sky-400">.kz</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2 text-sm font-bold text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher
            language={language}
            setLanguage={setLanguage}
            kzLabel={t("nav.kz")}
            ruLabel={t("nav.ru")}
          />

          <Link
            href="/complaints/new"
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-black text-white transition hover:bg-red-600"
          >
            {t("nav.report")}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white lg:hidden"
          aria-label={t("nav.openMenu")}
        >
          {open ? (
            <span className="text-2xl leading-none">×</span>
          ) : (
            <span className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-5 bg-white" />
              <span className="block h-0.5 w-5 bg-white" />
              <span className="block h-0.5 w-5 bg-white" />
            </span>
          )}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#0b2f4f] px-4 pb-4 lg:hidden">
          <nav className="mx-auto grid max-w-7xl gap-1 pt-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-bold text-white/90 hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-3 flex items-center justify-between gap-3">
              <LanguageSwitcher
                language={language}
                setLanguage={setLanguage}
                kzLabel={t("nav.kz")}
                ruLabel={t("nav.ru")}
              />

              <Link
                href="/complaints/new"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-center text-sm font-black text-white"
              >
                {t("nav.report")}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function LanguageSwitcher({
  language,
  setLanguage,
  kzLabel,
  ruLabel
}: {
  language: "ru" | "kz";
  setLanguage: (language: "ru" | "kz") => void;
  kzLabel: string;
  ruLabel: string;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1">
      <button
        type="button"
        onClick={() => setLanguage("kz")}
        className={
          language === "kz"
            ? "rounded-lg bg-white px-2 py-1 text-xs font-black text-[#0b2f4f]"
            : "rounded-lg px-2 py-1 text-xs font-black text-white/60"
        }
      >
        {kzLabel}
      </button>

      <button
        type="button"
        onClick={() => setLanguage("ru")}
        className={
          language === "ru"
            ? "rounded-lg bg-white px-2 py-1 text-xs font-black text-[#0b2f4f]"
            : "rounded-lg px-2 py-1 text-xs font-black text-white/60"
        }
      >
        {ruLabel}
      </button>
    </div>
  );
}
