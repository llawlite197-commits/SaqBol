import { DashboardCards } from "../../components/DashboardCards";
import { WorkspaceLayout } from "../../components/WorkspaceLayout";

export default function DashboardPage() {
  return (
    <WorkspaceLayout>
      <div className="space-y-5">
        <div>
          <p className="text-sm font-black tracking-[0.2em] text-teal-700">WORKSPACE</p>
          <h1 className="text-3xl font-black">Dashboard</h1>
        </div>
        <DashboardCards />
        <div className="workspace-card p-6">
          <h2 className="text-xl font-black">Операционный фокус</h2>
          <p className="mt-2 text-slate-600">Приоритет: новые обращения, SLA-риск, жалобы без исполнителя и обращения со статусом NEED_INFO.</p>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
