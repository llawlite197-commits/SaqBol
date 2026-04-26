"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/useI18n";
import { api } from "../lib/api";
import type { ChatMessage } from "../types";

function createMessage(role: ChatMessage["role"], text: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    text
  };
}

export function AiChatWidget() {
  const { language, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createMessage("assistant", t("ai.welcome"))
  ]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages((current) => {
      if (current.length !== 1 || current[0]?.role !== "assistant") return current;
      return [createMessage("assistant", t("ai.welcome"))];
    });
  }, [language, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();

    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    setMessages((current) => [...current, createMessage("user", text)]);
    setIsLoading(true);

    try {
      const response = await api.aiChat(text);
      setMessages((current) => [
        ...current,
        createMessage("assistant", response.answer || t("ai.error"))
      ]);
    } catch {
      setMessages((current) => [...current, createMessage("assistant", t("ai.error"))]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[100] grid h-16 w-16 place-items-center rounded-full bg-[#df4547] text-white shadow-[0_18px_45px_rgba(223,69,71,0.35)] transition hover:-translate-y-1 hover:bg-[#c93639] focus:outline-none focus:ring-4 focus:ring-red-200"
          aria-label={t("ai.open")}
        >
          <svg width="31" height="31" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M20.5 11.5a8 8 0 0 1-11.2 7.35L4 20.5l1.65-5.15A8 8 0 1 1 20.5 11.5Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M8.5 11.5h7M8.5 14h4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {isOpen && (
        <section className="fixed bottom-6 right-4 z-[100] w-[calc(100vw-2rem)] max-w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:right-6">
          <header className="flex items-start justify-between gap-4 bg-[#0b2c4d] p-4 text-white">
            <div>
              <h2 className="text-lg font-black">{t("ai.title")}</h2>
              <p className="mt-1 text-xs font-medium text-slate-300">{t("ai.subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label={t("ai.close")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          <div className="flex max-h-[480px] min-h-[420px] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "rounded-br-md bg-[#0b2c4d] text-white"
                        : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                    {t("general.loading")}...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="border-t border-slate-200 bg-white p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("ai.placeholder")}
                  rows={2}
                  className="min-h-[44px] flex-1 resize-none rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-[#35b9f2] focus:ring-4 focus:ring-sky-100"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="rounded-2xl bg-[#df4547] px-4 py-3 text-sm font-black text-white transition hover:bg-[#c93639] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {t("ai.send")}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}
    </>
  );
}
