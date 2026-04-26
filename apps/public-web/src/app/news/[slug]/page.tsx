import { NewsDetail } from "../../../components/NewsDetail";
import { PublicLayout } from "../../../components/PublicLayout";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <PublicLayout>
      <main className="mx-auto max-w-4xl px-4 py-12">
        <NewsDetail slug={slug} />
      </main>
    </PublicLayout>
  );
}
