import { ComplaintsTable } from "../../components/ComplaintsTable";
import { WorkspaceLayout } from "../../components/WorkspaceLayout";

export default function ComplaintsPage() {
  return (
    <WorkspaceLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-3xl font-black">Реестр жалоб</h1>
          <p className="text-slate-500">Поиск, фильтры и быстрый переход в карточку обращения.</p>
        </div>
        <ComplaintsTable />
      </div>
    </WorkspaceLayout>
  );
}
