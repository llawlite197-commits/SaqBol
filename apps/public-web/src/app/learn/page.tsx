import { PublicLayout } from "../../components/PublicLayout";

const materials = [
  "Как распознать фишинговую ссылку",
  "Что делать, если вы сообщили код из SMS",
  "Как безопасно покупать в интернете",
  "Как сохранить доказательства мошенничества"
];

export default function LearnPage() {
  return (
    <PublicLayout>
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-4xl font-black">Обучающие материалы</h1>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {materials.map((item) => (
            <div key={item} className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">{item}</h2>
              <p className="mt-3 text-slate-600">Краткая памятка для граждан. Полная база знаний будет расширяться.</p>
            </div>
          ))}
        </div>
      </main>
    </PublicLayout>
  );
}
