"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Eraser, Send, Sparkles, User } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "阅读主旨题总选错，应该怎么定位？",
  "英语二大作文图表描述段怎么写才不丢分？",
  "完形填空的逻辑关系题怎么判断？",
  "翻译怎么抓采分点？我总被扣分。",
  "小作文书信格式有哪些必须注意的细节？",
];

const GREETING =
  "你好，我是 Echo 英语二 AI 老师。可以问我阅读定位、完形逻辑、翻译采分点、大小作文结构，也可以把具体句子发来一起分析。我只讲考研英语（二）。";

export default function AskPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streaming]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(text: string) {
    const content = text.trim();
    if (!content || streaming) return;
    const history: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setError("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-19) }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "AI 服务暂时不可用，请稍后再试。");
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("无法读取 AI 输出，请重试。");

      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (const part of parts) {
          const line = part.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload) as { text?: string; error?: string };
            if (json.error) throw new Error(json.error);
            if (json.text) {
              acc += json.text;
              setMessages([...history, { role: "assistant", content: acc }]);
            }
          } catch (chunkErr) {
            if (chunkErr instanceof Error && chunkErr.message !== "Unexpected end of JSON input") {
              throw chunkErr;
            }
          }
        }
      }

      if (!acc) {
        setMessages([...history, { role: "assistant", content: "AI 没有返回内容，请再试一次。" }]);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMessages(history);
      setError(err instanceof Error ? err.message : "AI 调用失败，请重试。");
    } finally {
      abortRef.current = null;
      setStreaming(false);
    }
  }

  return (
    <div className="container-page max-w-4xl space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">AI Tutor</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">AI 考研英语答疑</h1>
          <p className="mt-1 text-[13px] text-ink-muted">只回答英语二相关问题 · 基于原项目评分规则</p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              abortRef.current?.abort();
              setMessages([]);
              setError("");
            }}
            className="btn btn-outline btn-sm"
          >
            <Eraser size={14} /> 清空对话
          </button>
        )}
      </header>

      <div className="card flex min-h-[58vh] flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
          <div className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Bot size={18} />
            </span>
            <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-slate-50 px-4 py-3 text-[13.5px] leading-7 text-slate-700">
              {GREETING}
            </div>
          </div>

          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end gap-3">
                <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-brand-600 px-4 py-3 text-[13.5px] leading-7 text-white">
                  {m.content}
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <User size={18} />
                </span>
              </div>
            ) : (
              <div key={i} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Bot size={18} />
                </span>
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-md bg-slate-50 px-4 py-3 text-[13.5px] leading-7 text-slate-700">
                  {m.content || (
                    <span className="inline-flex items-center gap-1 text-ink-muted">
                      <Sparkles size={13} className="animate-pulse" /> 正在思考…
                    </span>
                  )}
                </div>
              </div>
            ),
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <p className="mx-4 mb-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] leading-6 text-rose-700">
            {error}
          </p>
        )}

        <div className="border-t border-slate-100 bg-white p-3 sm:p-4">
          {messages.length === 0 && (
            <div className="no-scrollbar mb-2.5 flex gap-2 overflow-x-auto">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  disabled={streaming}
                  className="shrink-0 rounded-full border border-brand-100 bg-brand-50/70 px-3 py-1.5 text-[12px] font-medium text-brand-700 transition hover:bg-brand-100 disabled:opacity-60"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={2}
              maxLength={4000}
              placeholder="输入你的问题，回车发送，Shift + 回车换行…"
              className="input max-h-32 min-h-[48px] flex-1 resize-none py-3"
            />
            <button
              type="button"
              onClick={() => send(input)}
              disabled={streaming || !input.trim()}
              className="btn-primary h-12 w-14 shrink-0 px-0"
              aria-label="发送"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-ink-muted">
            AI 回答仅供学习参考；真题客观题答案以官方答案为准。
          </p>
        </div>
      </div>
    </div>
  );
}
