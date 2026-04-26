export function SettingsPanel() {
  return (
    <div className="workspace-card p-6">
      <h2 className="text-xl font-black">Настройки системы</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-bold text-slate-600">SLA NEW, часов</span>
          <input className="workspace-input mt-2 w-full" defaultValue="24" />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-600">Максимальный размер файла</span>
          <input className="workspace-input mt-2 w-full" defaultValue="10MB" />
        </label>
      </div>
      <button className="workspace-button mt-5">Сохранить mock</button>
    </div>
  );
}
