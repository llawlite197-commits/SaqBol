import { UserTable } from "../../components/UserTable";
import { WorkspaceLayout } from "../../components/WorkspaceLayout";

export default function UsersPage() {
  return (
    <WorkspaceLayout>
      <UserTable />
    </WorkspaceLayout>
  );
}
