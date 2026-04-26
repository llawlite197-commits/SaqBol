import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SaqBol.kz Workspace",
  description: "Закрытая рабочая сторона SaqBol.kz"
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
