import { AuditLogTable } from "../../components/AuditLogTable";
import { WorkspaceLayout } from "../../components/WorkspaceLayout";

export default function AuditLogsPage() {
  return (
    <WorkspaceLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-3xl font-black">Audit logs</h1>
          <p className="text-slate-500">Видимость действий сотрудников и администраторов.</p>
        </div>
        <AuditLogTable />
      </div>
    </WorkspaceLayout>
  );
}
