"use client";

import { useState } from "react";
import { api } from "../lib/api";
import type { Complaint } from "../types";

export function InternalComments({ complaint, onChanged }: { complaint: Complaint; onChanged: () => void }) {
  const [text, setText] = useState("");

  async function submit() {
    if (!text.trim()) return;
    await api.addComment(complaint.id, text);
    setText("");
    onChanged();
  }

  return (
    <div className="workspace-card p-5">
      <h2 className="font-black">Внутренние комментарии</h2>
      <div className="mt-4 space-y-3">
        {(complaint.comments ?? []).map((comment) => (
          <div key={comment.id} className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm text-slate-700">{comment.commentText}</p>
            <p className="mt-1 text-xs text-slate-400">{new Date(comment.createdAt).toLocaleString("ru-RU")}</p>
          </div>
        ))}
      </div>
      <textarea className="workspace-input mt-4 w-full" value={text} onChange={(e) => setText(e.target.value)} placeholder="Добавить комментарий" />
      <button onClick={submit} className="workspace-button mt-3">Добавить</button>
    </div>
  );
}
