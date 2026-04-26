import { NewsEditor } from "../../components/NewsEditor";
import { WorkspaceLayout } from "../../components/WorkspaceLayout";

export default function NewsPage() {
  return (
    <WorkspaceLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-3xl font-black">Управление новостями</h1>
          <p className="text-slate-500">Draft/publish процесс для публичного портала.</p>
        </div>
        <NewsEditor />
      </div>
    </WorkspaceLayout>
  );
}
