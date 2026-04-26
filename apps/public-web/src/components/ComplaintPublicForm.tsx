"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n/useI18n";
import { api } from "../lib/api";

type DictionaryItem = {
  id: string;
  label: string;
};

type SubmitStatus =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export function ComplaintPublicForm() {
  const { language, t } = useI18n();
  const [fullName, setFullName] = useState("");
  const [iin, setIin] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [damageAmount, setDamageAmount] = useState("");
  const [regionId, setRegionId] = useState("");
  const [fraudTypeId, setFraudTypeId] = useState("");
  const [description, setDescription] = useState("");
  const [scammerData, setScammerData] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [regions, setRegions] = useState<DictionaryItem[]>([]);
  const [fraudTypes, setFraudTypes] = useState<DictionaryItem[]>([]);
  const [status, setStatus] = useState<SubmitStatus>({ type: "idle" });

  const selectedFileText = useMemo(() => {
    if (files.length === 0) {
      return t("complaint.fileDrop");
    }

    if (files.length === 1) {
      return files[0].name;
    }

    return `${files.length} ${t("complaint.filesSelected")}`;
  }, [files, t]);

  useEffect(() => {
    async function loadDictionaries() {
      try {
        const [regionsResult, fraudTypesResult] = await Promise.all([
          api.regions(),
          api.fraudTypes()
        ]);

        setRegions(
          regionsResult.map((region) => ({
            id: region.id,
            label: language === "kz"
              ? region.nameKz ?? region.nameRu ?? region.code ?? t("complaint.region")
              : region.nameRu ?? region.nameKz ?? region.code ?? t("complaint.region")
          }))
        );

        setFraudTypes(
          fraudTypesResult.map((fraudType) => ({
            id: fraudType.id,
            label: language === "kz"
              ? fraudType.nameKz ?? fraudType.nameRu ?? fraudType.code ?? t("complaint.fraudType")
              : fraudType.nameRu ?? fraudType.nameKz ?? fraudType.code ?? t("complaint.fraudType")
          }))
        );
      } catch {
        setRegions([]);
        setFraudTypes([]);
      }
    }

    loadDictionaries();
  }, [language, t]);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;

    const nextFiles = Array.from(fileList);
    const invalidFile = nextFiles.find((file) => file.size > 10 * 1024 * 1024);

    if (invalidFile) {
      setStatus({
        type: "error",
        message: t("complaint.error.fileSize")
      });
      return;
    }

    setFiles(nextFiles);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ type: "idle" });

    if (!fullName.trim()) {
      setStatus({ type: "error", message: t("complaint.error.fullName") });
      return;
    }

    if (!/^\d{12}$/.test(iin)) {
      setStatus({ type: "error", message: t("complaint.error.iin") });
      return;
    }

    if (!phone.trim()) {
      setStatus({ type: "error", message: t("complaint.error.phone") });
      return;
    }

    if (!email.trim()) {
      setStatus({ type: "error", message: t("complaint.error.email") });
      return;
    }

    if (!incidentDate) {
      setStatus({ type: "error", message: t("complaint.error.incidentDate") });
      return;
    }

    if (!regionId) {
      setStatus({ type: "error", message: t("complaint.error.region") });
      return;
    }

    if (!fraudTypeId) {
      setStatus({ type: "error", message: t("complaint.error.fraudType") });
      return;
    }

    if (description.trim().length < 300) {
      setStatus({
        type: "error",
        message: t("complaint.error.description")
      });
      return;
    }

    try {
      setStatus({ type: "loading" });

      const formData = new FormData();
      formData.append("fullName", fullName.trim());
      formData.append("iin", iin);
      formData.append("phone", phone.trim());
      formData.append("email", email.trim());
      formData.append("incidentDate", incidentDate);
      formData.append("damageAmount", damageAmount || "0");
      formData.append("regionId", regionId);
      formData.append("fraudTypeId", fraudTypeId);
      formData.append("description", description.trim());
      formData.append("scammerData", scammerData.trim());

      files.forEach((file) => {
        formData.append("files", file);
      });

      const result = await api.createComplaint(formData);

      setStatus({
        type: "success",
        message: `${t("complaint.success")} ${result.complaintNumber ?? result.number ?? t("complaint.created")}`
      });

      setDescription("");
      setScammerData("");
      setIin("");
      setFiles([]);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : t("complaint.error.submit")
      });
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10"
    >
      <div className="mb-6 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M7 10V8a5 5 0 0 1 10 0v2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <rect
              x="5"
              y="10"
              width="14"
              height="10"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M12 14v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <p className="leading-6">{t("complaint.securityNote")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label={t("complaint.fullName")} required>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="saq-form-input"
            placeholder={t("complaint.fullNamePlaceholder")}
          />
        </Field>

        <Field label={t("complaint.iin")} required>
          <input
            type="text"
            inputMode="numeric"
            maxLength={12}
            value={iin}
            onChange={(event) => setIin(event.target.value.replace(/\D/g, "").slice(0, 12))}
            className="saq-form-input"
            placeholder={t("complaint.iinPlaceholder")}
          />
        </Field>

        <Field label={t("complaint.phone")} required>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="saq-form-input"
            placeholder="+7 (777) 123-45-67"
          />
        </Field>

        <Field label={t("complaint.email")} required>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="saq-form-input"
            placeholder="example@mail.kz"
          />
        </Field>

        <Field label={t("complaint.incidentDate")} required>
          <input
            type="date"
            value={incidentDate}
            onChange={(event) => setIncidentDate(event.target.value)}
            className="saq-form-input"
          />
        </Field>

        <Field label={`${t("complaint.damageAmount")} (₸)`}>
          <input
            type="number"
            min="0"
            value={damageAmount}
            onChange={(event) => setDamageAmount(event.target.value)}
            className="saq-form-input"
            placeholder="0"
          />
        </Field>

        <Field label={t("complaint.region")}>
          <select
            value={regionId}
            onChange={(event) => setRegionId(event.target.value)}
            className="saq-form-input"
          >
            <option value="">{t("complaint.regionSelect")}</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t("complaint.fraudType")}>
          <select
            value={fraudTypeId}
            onChange={(event) => setFraudTypeId(event.target.value)}
            className="saq-form-input"
          >
            <option value="">{t("complaint.fraudTypeSelect")}</option>
            {fraudTypes.map((fraudType) => (
              <option key={fraudType.id} value={fraudType.id}>
                {fraudType.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label={t("complaint.description")}
          required
          hint={t("complaint.descriptionHint")}
          className="md:col-span-2"
        >
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            minLength={300}
            className="saq-form-input min-h-[122px] resize-y py-4"
            placeholder={t("complaint.descriptionPlaceholder")}
          />
        </Field>

        <Field
          label={t("complaint.scammerData")}
          hint={t("complaint.scammerDataHint")}
          className="md:col-span-2"
        >
          <input
            value={scammerData}
            onChange={(event) => setScammerData(event.target.value)}
            className="saq-form-input"
            placeholder={t("complaint.scammerDataPlaceholder")}
          />
        </Field>

        <div className="md:col-span-2">
          <p className="mb-3 text-base font-extrabold text-[#062747]">
            {t("complaint.files")} <span className="font-bold text-slate-500">({t("complaint.fileLimit")})</span>
          </p>

          <label
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleFiles(event.dataTransfer.files);
            }}
            className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-slate-500 transition hover:border-sky-400 hover:bg-sky-50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-2xl text-slate-500 shadow-sm">
              ⇧
            </span>
            <span className="text-base">{selectedFileText}</span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(event) => handleFiles(event.target.files)}
            />
          </label>
        </div>
      </div>

      {status.type === "error" && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {status.message}
        </div>
      )}

      {status.type === "success" && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {status.message}
        </div>
      )}

      <button
        type="submit"
        disabled={status.type === "loading"}
        className="mt-8 w-full rounded-lg bg-[#dc4346] px-6 py-5 text-base font-black text-white shadow-sm transition hover:bg-[#c93538] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status.type === "loading" ? t("complaint.submitting") : t("complaint.submit")}
      </button>

      <p className="mt-6 text-center text-sm text-slate-500">
        {t("complaint.consent")}
      </p>
    </form>
  );
}

function Field({
  label,
  required,
  hint,
  className,
  children
}: {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-3 block text-base font-extrabold text-[#062747]">
        {label} {required && <span>*</span>}
        {hint && <span className="font-bold"> ({hint})</span>}
      </span>
      {children}
    </label>
  );
}
