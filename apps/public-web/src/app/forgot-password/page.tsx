import { PublicLayout } from "../../components/PublicLayout";

export default function ForgotPasswordPage() {
  return (
    <PublicLayout>
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-[2rem] bg-white p-8">
          <h1 className="text-3xl font-black">Восстановление доступа</h1>
          <p className="mt-4 text-slate-600">
            Для MVP восстановление пароля будет подключено позже. Обратитесь в поддержку или используйте тестовую учетную запись.
          </p>
        </div>
      </main>
    </PublicLayout>
  );
}
