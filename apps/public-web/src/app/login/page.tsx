import { LoginForm } from "../../components/LoginForm";
import { PublicLayout } from "../../components/PublicLayout";

export default function LoginPage() {
  return (
    <PublicLayout>
      <main className="px-4 py-16">
        <LoginForm />
      </main>
    </PublicLayout>
  );
}
