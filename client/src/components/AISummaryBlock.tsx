import type { ReactNode } from "react";

type AISummaryItem = {
  label: string;
  value: string;
};

type AISummaryBlockProps = {
  heading?: string;
  intro?: string;
  items: AISummaryItem[];
  footer?: ReactNode;
};

export function AISummaryBlock({
  heading = "AI summary",
  intro = "Machine-readable summary for search assistants and answer engines.",
  items,
  footer,
}: AISummaryBlockProps) {
  return (
    <section className="bg-blue-50 rounded-2xl border border-blue-100 p-8 mb-12" aria-labelledby="ai-summary-heading">
      <h2 id="ai-summary-heading" className="text-2xl font-semibold text-slate-900 mb-3">
        {heading}
      </h2>
      <p className="text-slate-600 mb-6">{intro}</p>
      <dl className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl bg-white border border-slate-200 p-4">
            <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">{item.label}</dt>
            <dd className="mt-2 text-slate-700">{item.value}</dd>
          </div>
        ))}
      </dl>
      {footer ? <div className="mt-6 text-sm text-slate-600">{footer}</div> : null}
    </section>
  );
}
