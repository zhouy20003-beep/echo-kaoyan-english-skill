import type {
  ClozeResult,
  ModelEssayResult,
  ReadingResult,
  TranslationResult,
  WritingResult,
} from "@/lib/ai-schemas";
import { CheckCircle2, Lightbulb, TriangleAlert } from "lucide-react";

export function AiErrorNotice({ message }: { message: string }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] leading-6 text-amber-900">
      <TriangleAlert size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <p className="text-[12px] font-bold uppercase tracking-wide text-brand-600">{title}</p>
      <div className="mt-1 text-[13.5px] leading-7 text-slate-700">{children}</div>
    </div>
  );
}

function OptionRows({ items }: { items: { option: string; verdict: string; reason: string }[] }) {
  return (
    <ul className="mt-1 space-y-1.5">
      {items.map((item) => (
        <li key={item.option} className="flex gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
              /正确|对/.test(item.verdict) && !/错误/.test(item.verdict)
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {item.option}
          </span>
          <span>
            <span className={`mr-1 font-semibold ${/错误/.test(item.verdict) ? "text-rose-600" : "text-emerald-700"}`}>
              {item.verdict}
            </span>
            <span className="text-slate-600">{item.reason}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ReadingAiView({ result }: { result: ReadingResult }) {
  return (
    <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/40 p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-brand-600 px-2 py-1 text-[12px] font-bold text-white">
          正确答案 {result.answer}
        </span>
        {result.answerMeaning && <span className="text-[13px] text-ink-soft">{result.answerMeaning}</span>}
      </div>
      {result.location && (
        <Section title="原文定位">
          <p className="rounded-lg bg-white/80 px-3 py-2 font-serif italic text-slate-700">{result.location}</p>
          {result.locationTranslation && <p className="mt-1.5">{result.locationTranslation}</p>}
        </Section>
      )}
      {result.questionTranslation && <Section title="题干与选项翻译">{result.questionTranslation}</Section>}
      {result.optionAnalysis.length > 0 && (
        <Section title="选项分析">
          <OptionRows items={result.optionAnalysis} />
        </Section>
      )}
      {result.method && <Section title="解题思路">{result.method}</Section>}
      {result.trap && <Section title="干扰项特征">{result.trap}</Section>}
    </div>
  );
}

export function ClozeAiView({ result }: { result: ClozeResult }) {
  return (
    <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/40 p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-brand-600 px-2 py-1 text-[12px] font-bold text-white">
          {result.answer} · {result.answerWord}
        </span>
      </div>
      {result.sentence && (
        <Section title="还原后的句子">
          <p className="rounded-lg bg-white/80 px-3 py-2 font-serif text-slate-700">{result.sentence}</p>
          {result.sentenceTranslation && <p className="mt-1.5">{result.sentenceTranslation}</p>}
        </Section>
      )}
      {result.contextLogic && <Section title="上下文逻辑">{result.contextLogic}</Section>}
      {result.optionAnalysis.length > 0 && (
        <Section title="选项分析">
          <OptionRows items={result.optionAnalysis} />
        </Section>
      )}
      {result.collocation && <Section title="搭配与语法">{result.collocation}</Section>}
      {result.method && <Section title="方法总结">{result.method}</Section>}
    </div>
  );
}

function ScoreBadge({ score, max }: { score: number; max: number }) {
  return (
    <div className="flex items-baseline gap-1 rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-brand-100">
      <span className="text-2xl font-extrabold text-brand-700">{score}</span>
      <span className="text-[12px] text-ink-muted">/ {max}</span>
    </div>
  );
}

export function TranslationAiView({ result }: { result: TranslationResult }) {
  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <ScoreBadge score={result.score} max={15} />
        <div>
          <p className="text-[15px] font-bold text-ink">{result.band}</p>
          <p className="text-[12.5px] text-ink-muted">{result.bandLabel}</p>
        </div>
      </div>

      {result.unitScores.length > 0 && (
        <div className="card overflow-hidden">
          <p className="border-b border-slate-100 px-4 py-2.5 text-[13px] font-bold text-ink">采分点得分</p>
          <table className="w-full text-[13px]">
            <thead className="bg-slate-50 text-[11px] text-ink-muted">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">原文单元</th>
                <th className="w-16 px-2 py-2 text-center font-semibold">得分</th>
                <th className="px-3 py-2 text-left font-semibold">说明</th>
              </tr>
            </thead>
            <tbody>
              {result.unitScores.map((u, i) => (
                <tr key={i} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-2 font-serif text-slate-700">{u.unit}</td>
                  <td className="px-2 py-2 text-center font-bold text-brand-700">{u.score}/{u.max}</td>
                  <td className="px-3 py-2 text-slate-600">{u.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.sentenceAnalysis.length > 0 && (
        <div>
          <p className="mb-2 text-[13px] font-bold text-ink">逐句分析</p>
          <div className="space-y-2">
            {result.sentenceAnalysis.map((s, i) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-white p-3">
                <p className="font-serif text-[13px] text-slate-700">{s.source}</p>
                <p className="mt-1 text-[13px] text-ink-soft">你的译文：{s.userTranslation || "—"}</p>
                {s.reference && <p className="mt-0.5 text-[13px] text-emerald-700">参考：{s.reference}</p>}
                {s.comment && <p className="mt-1 text-[12.5px] text-ink-muted">{s.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.errors.length > 0 && (
        <Section title="错误与扣分点">
          <ul className="space-y-1.5">
            {result.errors.map((e, i) => (
              <li key={i} className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-900">
                <span className="font-semibold">[{e.type}]</span> {e.example}
                {e.fix && <span className="block text-rose-700">→ {e.fix}</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {result.revisedTranslation && (
        <Section title="修改后译文">
          <p className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-100">{result.revisedTranslation}</p>
        </Section>
      )}

      {result.advice.length > 0 && (
        <Section title="提分建议">
          <ul className="list-disc space-y-1 pl-5">
            {result.advice.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

export function WritingAiView({
  result,
  model,
}: {
  result?: WritingResult;
  model?: ModelEssayResult;
}) {
  if (model) {
    return (
      <div className="mt-4 space-y-4">
        {model.taskBreakdown.length > 0 && (
          <Section title="题目要求拆解">
            <ul className="list-disc space-y-1 pl-5">
              {model.taskBreakdown.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </Section>
        )}
        {model.modelEssays.map((essay, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-bold text-brand-700">{essay.label}</p>
              {essay.wordCount > 0 && <span className="text-[11.5px] text-ink-muted">{essay.wordCount} 词</span>}
            </div>
            <p className="mt-2 whitespace-pre-line font-serif text-[14px] leading-7 text-slate-800">{essay.text}</p>
          </div>
        ))}
        {model.structure.length > 0 && (
          <Section title="结构梳理">
            <ul className="list-disc space-y-1 pl-5">
              {model.structure.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </Section>
        )}
        {model.reusable.length > 0 && (
          <Section title="可复用知识点">
            <div className="flex flex-wrap gap-1.5">
              {model.reusable.map((r, i) => (
                <span key={i} className="rounded-lg bg-white px-2.5 py-1.5 text-[12.5px] text-slate-700 ring-1 ring-slate-100">{r}</span>
              ))}
            </div>
          </Section>
        )}
        {model.reminders.length > 0 && (
          <Section title="自写提醒">
            <ul className="list-disc space-y-1 pl-5">
              {model.reminders.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </Section>
        )}
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <ScoreBadge score={result.score} max={result.maxScore} />
        <div>
          <p className="text-[15px] font-bold text-ink">{result.band}</p>
          <p className="text-[12.5px] text-ink-muted">{result.bandLabel}</p>
        </div>
        {result.wordCount > 0 && (
          <span className="chip">实测 {result.wordCount} 词</span>
        )}
      </div>

      {result.dimensions.length > 0 && (
        <div className="card p-4">
          <p className="mb-2 text-[13px] font-bold text-ink">分项评分</p>
          <div className="space-y-2">
            {result.dimensions.map((d, i) => {
              const pct = d.max > 0 ? Math.round((d.score / d.max) * 100) : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="font-medium text-ink-soft">{d.name}</span>
                    <span className="font-bold text-brand-700">{d.score}/{d.max}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                  </div>
                  {d.comment && <p className="mt-1 text-[12px] text-ink-muted">{d.comment}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {result.strengths.length > 0 && (
        <Section title="做得好的地方">
          <ul className="list-disc space-y-1 pl-5 text-emerald-800">
            {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </Section>
      )}

      {result.errors.length > 0 && (
        <Section title="逐句批改">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-[12.5px]">
              <thead className="bg-slate-50 text-[11px] text-ink-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">原句</th>
                  <th className="px-3 py-2 text-left font-semibold">问题</th>
                  <th className="px-3 py-2 text-left font-semibold">修改</th>
                </tr>
              </thead>
              <tbody>
                {result.errors.map((e, i) => (
                  <tr key={i} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-2 font-serif text-slate-700">{e.original}</td>
                    <td className="px-3 py-2 text-rose-700">{e.issue}</td>
                    <td className="px-3 py-2 text-emerald-800">{e.fix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {result.revisedEssay && (
        <Section title="修改后版本">
          <p className="whitespace-pre-line rounded-xl bg-white px-3 py-2.5 font-serif ring-1 ring-slate-100">{result.revisedEssay}</p>
        </Section>
      )}

      {result.advice.length > 0 && (
        <Section title="修改建议">
          <ul className="list-disc space-y-1 pl-5">
            {result.advice.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </Section>
      )}

      {result.modelEssay?.text && (
        <Section title={`参考范文${result.modelEssay.label ? ` · ${result.modelEssay.label}` : ""}`}>
          <p className="whitespace-pre-line rounded-xl bg-white px-3 py-2.5 font-serif ring-1 ring-slate-100">
            {result.modelEssay.text}
          </p>
        </Section>
      )}

      {result.reusable.length > 0 && (
        <Section title="下次可复用">
          <div className="flex flex-wrap gap-1.5">
            {result.reusable.map((r, i) => (
              <span key={i} className="rounded-lg bg-white px-2.5 py-1.5 text-[12.5px] text-slate-700 ring-1 ring-slate-100">{r}</span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

export function SuccessHint({ text }: { text: string }) {
  return (
    <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[13px] text-emerald-800">
      <CheckCircle2 size={15} /> {text}
    </div>
  );
}

export function TipLine({ text }: { text: string }) {
  return (
    <p className="mt-2 flex items-start gap-1.5 text-[12.5px] leading-6 text-ink-muted">
      <Lightbulb size={14} className="mt-0.5 shrink-0 text-amber-500" />
      {text}
    </p>
  );
}
