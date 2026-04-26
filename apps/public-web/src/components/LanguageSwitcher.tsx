"use client";

export function LanguageSwitcher() {
  return (
    <div className="flex items-center gap-3 text-sm font-extrabold">
      <button className="text-slate-400">Қаз</button>
      <span className="h-5 w-px bg-white/25" />
      <button className="text-white">Рус</button>
    </div>
  );
}
