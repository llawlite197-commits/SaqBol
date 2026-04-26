import { DictionaryTable } from "../../../components/DictionaryTable";
import { WorkspaceLayout } from "../../../components/WorkspaceLayout";

export default function FraudTypesPage() {
  return (
    <WorkspaceLayout>
      <DictionaryTable kind="fraud-types" />
    </WorkspaceLayout>
  );
}
