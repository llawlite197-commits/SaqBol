"use client";

import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import type { TranslationKey } from "../i18n/translations";
import { useI18n } from "../i18n/useI18n";
import {
  CardFraudIcon,
  GlobeFraudIcon,
  GrowthFraudIcon,
  PhoneFraudIcon,
  SearchFraudIcon,
  WarningFraudIcon
} from "./FraudTypeIcons";

type FraudTypeItem = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconColor: string;
  iconBg: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  signsKeys: TranslationKey[];
  protectionKeys: TranslationKey[];
  whatToDoKey: TranslationKey;
};

const fraudTypes: FraudTypeItem[] = [
  {
    titleKey: "fraud.phone.title",
    icon: PhoneFraudIcon,
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
    descriptionKey: "fraud.phone.description",
    signsKeys: ["fraud.phone.sign.1", "fraud.phone.sign.2", "fraud.phone.sign.3", "fraud.phone.sign.4"],
    protectionKeys: ["fraud.phone.protect.1", "fraud.phone.protect.2", "fraud.phone.protect.3", "fraud.phone.protect.4"],
    whatToDoKey: "fraud.phone.whatToDo"
  },
  {
    titleKey: "fraud.online.title",
    icon: GlobeFraudIcon,
    iconColor: "text-sky-500",
    iconBg: "bg-sky-50",
    descriptionKey: "fraud.online.description",
    signsKeys: ["fraud.online.sign.1", "fraud.online.sign.2", "fraud.online.sign.3", "fraud.online.sign.4"],
    protectionKeys: ["fraud.online.protect.1", "fraud.online.protect.2", "fraud.online.protect.3", "fraud.online.protect.4"],
    whatToDoKey: "fraud.online.whatToDo"
  },
  {
    titleKey: "fraud.bank.title",
    icon: CardFraudIcon,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
    descriptionKey: "fraud.bank.description",
    signsKeys: ["fraud.bank.sign.1", "fraud.bank.sign.2", "fraud.bank.sign.3", "fraud.bank.sign.4"],
    protectionKeys: ["fraud.bank.protect.1", "fraud.bank.protect.2", "fraud.bank.protect.3", "fraud.bank.protect.4"],
    whatToDoKey: "fraud.bank.whatToDo"
  },
  {
    titleKey: "fraud.invest.title",
    icon: GrowthFraudIcon,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    descriptionKey: "fraud.invest.description",
    signsKeys: ["fraud.invest.sign.1", "fraud.invest.sign.2", "fraud.invest.sign.3", "fraud.invest.sign.4"],
    protectionKeys: ["fraud.invest.protect.1", "fraud.invest.protect.2", "fraud.invest.protect.3", "fraud.invest.protect.4"],
    whatToDoKey: "fraud.invest.whatToDo"
  },
  {
    titleKey: "fraud.social.title",
    icon: WarningFraudIcon,
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
    descriptionKey: "fraud.social.description",
    signsKeys: ["fraud.social.sign.1", "fraud.social.sign.2", "fraud.social.sign.3", "fraud.social.sign.4"],
    protectionKeys: ["fraud.social.protect.1", "fraud.social.protect.2", "fraud.social.protect.3", "fraud.social.protect.4"],
    whatToDoKey: "fraud.social.whatToDo"
  },
  {
    titleKey: "fraud.phishing.title",
    icon: SearchFraudIcon,
    iconColor: "text-sky-500",
    iconBg: "bg-sky-50",
    descriptionKey: "fraud.phishing.description",
    signsKeys: ["fraud.phishing.sign.1", "fraud.phishing.sign.2", "fraud.phishing.sign.3", "fraud.phishing.sign.4"],
    protectionKeys: ["fraud.phishing.protect.1", "fraud.phishing.protect.2", "fraud.phishing.protect.3", "fraud.phishing.protect.4"],
    whatToDoKey: "fraud.phishing.whatToDo"
  }
];

export function FraudTypesDetailedSection() {
  const { t } = useI18n();

  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-[#062747] md:text-4xl">
            {t("fraud.pageTitle")}
          </h1>
          <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">
            {t("fraud.pageText")}
          </p>
        </div>

        <div className="space-y-5">
          {fraudTypes.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.titleKey}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7"
              >
                <div className="flex flex-col gap-5 lg:flex-row">
                  <div className="lg:w-[32%]">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${item.iconBg} ${item.iconColor}`}>
                        <Icon className="h-9 w-9" />
                      </div>

                      <div>
                        <h2 className="text-xl font-black text-[#062747] md:text-2xl">
                          {t(item.titleKey)}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
                          {t(item.descriptionKey)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid flex-1 gap-5 md:grid-cols-2">
                    <div>
                      <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-red-500">
                        <span>!</span>
                        {t("fraud.signs")}
                      </h3>
                      <ul className="mt-3 space-y-2">
                        {item.signsKeys.map((key) => (
                          <li key={key} className="flex gap-2 text-sm leading-6 text-slate-600">
                            <span className="font-black text-red-500">›</span>
                            <span>{t(key)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-emerald-600">
                        <span>✓</span>
                        {t("fraud.protection")}
                      </h3>
                      <ul className="mt-3 space-y-2">
                        {item.protectionKeys.map((key) => (
                          <li key={key} className="flex gap-2 text-sm leading-6 text-slate-600">
                            <span className="font-black text-emerald-600">›</span>
                            <span>{t(key)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-sky-100 bg-sky-50 p-4 md:col-span-2">
                      <h3 className="text-xs font-black uppercase tracking-wide text-sky-700">
                        {t("fraud.whatToDo")}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {t(item.whatToDoKey)}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <Link href="/complaints/new" className="inline-flex rounded-lg bg-red-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-red-600">
                        {t("fraud.report")}
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
