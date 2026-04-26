import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SaqBol.kz - защита от интернет-мошенничества",
  description: "Государственный портал для подачи жалоб и проверки подозрительных данных."
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
