import type { CheckResult } from "../types";
import { useI18n } from "../i18n/useI18n";

const styles = {
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-900",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-900",
  HIGH: "border-red-200 bg-red-50 text-red-900"
};

export function RiskResultCard({ result }: { result: CheckResult }) {
  const { t } = useI18n();
  const riskText = {
    LOW: t("risk.low"),
    MEDIUM: t("risk.medium"),
    HIGH: t("risk.high")
  }[result.riskLevel];

  return (
    <div className={`rounded-3xl border p-6 ${styles[result.riskLevel]}`}>
      <p className="text-sm font-bold uppercase tracking-[0.18em]">{t("check.result")}</p>
      <h3 className="mt-3 text-2xl font-black">{result.normalizedValue}</h3>
      <p className="mt-2 text-lg font-black">{riskText}</p>
      <p className="mt-3 leading-7">{result.explanation}</p>
    </div>
  );
}
