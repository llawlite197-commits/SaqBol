import { ExportButton } from "../../components/ExportButton";
import { ExportJobsTable } from "../../components/ExportJobsTable";
import { WorkspaceLayout } from "../../components/WorkspaceLayout";

export default function ExportsPage() {
  return (
    <WorkspaceLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-3xl font-black">Export center</h1>
          <p className="text-slate-500">Выгрузки жалоб с журналированием действий.</p>
        </div>
        <ExportButton />
        <ExportJobsTable />
      </div>
    </WorkspaceLayout>
  );
}
