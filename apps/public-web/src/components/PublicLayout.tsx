"use client";

import { ReactNode } from "react";
import { I18nProvider } from "../i18n/I18nProvider";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AiChatWidget } from "./AiChatWidget";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <AiChatWidget />
      </div>
    </I18nProvider>
  );
}
