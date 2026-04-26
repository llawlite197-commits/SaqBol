import { AuthGuard } from "../../../components/AuthGuard";
import { MyComplaintsList } from "../../../components/MyComplaintsList";
import { PublicLayout } from "../../../components/PublicLayout";

export default function CabinetComplaintsPage() {
  return (
    <PublicLayout>
      <main className="mx-auto max-w-5xl px-4 py-12">
        <AuthGuard>
          <h1 className="mb-8 text-4xl font-black">Мои жалобы</h1>
          <MyComplaintsList />
        </AuthGuard>
      </main>
    </PublicLayout>
  );
}
