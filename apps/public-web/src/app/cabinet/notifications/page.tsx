import { AuthGuard } from "../../../components/AuthGuard";
import { NotificationsList } from "../../../components/NotificationsList";
import { PublicLayout } from "../../../components/PublicLayout";

export default function CabinetNotificationsPage() {
  return (
    <PublicLayout>
      <main className="mx-auto max-w-4xl px-4 py-12">
        <AuthGuard>
          <h1 className="mb-8 text-4xl font-black">Уведомления</h1>
          <NotificationsList />
        </AuthGuard>
      </main>
    </PublicLayout>
  );
}
