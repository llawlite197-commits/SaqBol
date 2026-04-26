import { BlacklistTable } from "../../components/BlacklistTable";
import { WorkspaceLayout } from "../../components/WorkspaceLayout";

export default function BlacklistPage() {
  return (
    <WorkspaceLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-3xl font-black">Blacklist</h1>
          <p className="text-slate-500">Подозрительные телефоны, URL, email, карты и IBAN.</p>
        </div>
        <BlacklistTable />
      </div>
    </WorkspaceLayout>
  );
}
