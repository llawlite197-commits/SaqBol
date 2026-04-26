import { DictionaryTable } from "../../../components/DictionaryTable";
import { WorkspaceLayout } from "../../../components/WorkspaceLayout";

export default function RegionsPage() {
  return (
    <WorkspaceLayout>
      <DictionaryTable kind="regions" />
    </WorkspaceLayout>
  );
}
