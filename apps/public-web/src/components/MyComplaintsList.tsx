"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Complaint } from "../types";
import { ComplaintStatusCard } from "./ComplaintStatusCard";

export function MyComplaintsList() {
  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.myComplaints()
      .then((result) => setItems(result.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Загружаем обращения...</p>;

  if (items.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8">
        <p className="text-slate-600">У вас пока нет жалоб.</p>
        <Link href="/complaints/new" className="mt-4 inline-flex rounded-2xl bg-teal-800 px-5 py-3 font-bold text-white">Подать первую жалобу</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Link key={item.id} href={`/cabinet/complaints/${item.id}`} className="block">
          <ComplaintStatusCard complaint={item} />
        </Link>
      ))}
    </div>
  );
}
