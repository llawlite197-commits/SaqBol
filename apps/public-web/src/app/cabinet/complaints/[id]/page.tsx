import { AuthGuard } from "../../../../components/AuthGuard";
import { ComplaintDetail } from "../../../../components/ComplaintDetail";
import { PublicLayout } from "../../../../components/PublicLayout";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CabinetComplaintDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <PublicLayout>
      <main className="mx-auto max-w-5xl px-4 py-12">
        <AuthGuard>
          <ComplaintDetail id={id} />
        </AuthGuard>
      </main>
    </PublicLayout>
  );
}
