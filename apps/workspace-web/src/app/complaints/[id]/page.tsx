import { ComplaintDetail } from "../../../components/ComplaintDetail";
import { WorkspaceLayout } from "../../../components/WorkspaceLayout";

export default async function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <WorkspaceLayout>
      <ComplaintDetail id={id} />
    </WorkspaceLayout>
  );
}
