import { PublicLayout } from "../../components/PublicLayout";
import { RegisterForm } from "../../components/RegisterForm";

export default function RegisterPage() {
  return (
    <PublicLayout>
      <main className="px-4 py-16">
        <RegisterForm />
      </main>
    </PublicLayout>
  );
}
