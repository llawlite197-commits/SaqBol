import Link from "next/link";
import { AuthGuard } from "../../components/AuthGuard";
import { PublicLayout } from "../../components/PublicLayout";

const links = [
  { href: "/cabinet/complaints", label: "Мои жалобы", text: "Статусы, история и файлы" },
  { href: "/complaints/new", label: "Новая жалоба", text: "Подать обращение" },
  { href: "/cabinet/notifications", label: "Уведомления", text: "Изменения статусов" },
  { href: "/cabinet/profile", label: "Профиль", text: "Данные гражданина" }
];

export default function CabinetPage() {
  return (
    <PublicLayout>
      <main className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <AuthGuard>
          <h1 className="text-4xl font-black">Личный кабинет</h1>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {links.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-3xl bg-white p-6 shadow-sm hover:shadow-lg">
                <h2 className="text-xl font-black">{item.label}</h2>
                <p className="mt-2 text-slate-600">{item.text}</p>
              </Link>
            ))}
          </div>
        </AuthGuard>
      </main>
    </PublicLayout>
  );
}
