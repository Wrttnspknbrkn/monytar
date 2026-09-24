import { JOURNEY, REJECTED_INFO, FAQS, GLOSSARY, TASKS } from "@/components/help/guide-data"
import { CLOSING, EXAMPLE_RULES, HANDBOOK_UPDATED, HERO, LOOP, ROLE_CARDS, TIPS } from "./handbook-content"

const fmt = (n: number) => n.toLocaleString("en-US")

/**
 * The printed / PDF edition. Hidden on screen, shown when printing, and fully
 * expanded (no tabs, accordions or dialogs) so nothing is lost on paper.
 * Plain <img> tags on purpose: print must not wait for lazy loading.
 */
export function PrintHandbook() {
  return (
    <div className="hidden text-[11pt] leading-relaxed text-black print:block">
      <section className="break-after-page pt-[18mm]">
        <p className="text-[10pt] font-bold uppercase tracking-[0.2em] text-blue-700">{HERO.kicker}</p>
        <h1 className="mt-3 font-display text-[34pt] leading-[1.05] tracking-tight">{HERO.title}</h1>
        <p className="mt-4 max-w-[150mm] text-[13pt] text-slate-600">{HERO.sub}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/help/nav-identity.png" alt="Monytar dashboard" className="mt-8 w-full rounded-lg border border-slate-300" />
        <p className="mt-6 text-[9pt] text-slate-500">Updated {HANDBOOK_UPDATED}</p>
      </section>

      <section className="break-after-page">
        <h2 className="font-display text-[20pt]">How it works</h2>
        <ol className="mt-4 grid grid-cols-3 gap-4">
          {LOOP.map((s) => (
            <li key={s.n} className="rounded-lg border border-slate-300 p-4">
              <p className="text-[9pt] font-bold uppercase text-blue-700">
                Step {s.n} · {s.who}
              </p>
              <p className="mt-1 font-display text-[15pt]">{s.title}</p>
              <p className="mt-1 text-slate-600">{s.line}</p>
            </li>
          ))}
        </ol>

        <h2 className="mt-8 font-display text-[20pt]">The four roles</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {ROLE_CARDS.map((r) => (
            <div key={r.role} className="break-inside-avoid rounded-lg border border-slate-300 p-3">
              <p className="font-display text-[13pt]">{r.name}</p>
              <p className="text-slate-600">{r.line}</p>
              <ul className="mt-1 list-disc pl-5">
                {r.can.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <h2 className="mt-8 font-display text-[20pt]">How an expense moves</h2>
        <ol className="mt-3 grid grid-cols-4 gap-3">
          {JOURNEY.map((j) => (
            <li key={j.id} className="break-inside-avoid rounded-lg border border-slate-300 p-3">
              <p className="font-display text-[12pt] capitalize">{j.status}</p>
              <p className="text-[10pt] text-slate-600">{j.means}</p>
              <p className="mt-1 text-[10pt]">
                <b>Do:</b> {j.next}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-[10pt]">
          <b>Rejected?</b> {REJECTED_INFO.means} {REJECTED_INFO.next}
        </p>

        <h2 className="mt-8 font-display text-[20pt]">Rules, in plain English</h2>
        <p className="mt-2 text-[10pt] text-slate-600">Example amounts — every company sets its own.</p>
        <ul className="mt-1 list-disc pl-5">
          <li>Under {fmt(EXAMPLE_RULES.autoApproveUnder)}: approved automatically.</li>
          <li>{fmt(EXAMPLE_RULES.receiptFrom)} or more: a receipt is required.</li>
          <li>{fmt(EXAMPLE_RULES.financeReviewFrom)} or more: finance reviews as well as the manager.</li>
        </ul>
      </section>

      <h2 className="break-before-page font-display text-[20pt]">Step-by-step guides</h2>
      {TASKS.map((t) => (
        <section key={t.id} className="mt-6 break-inside-avoid">
          <p className="text-[9pt] font-bold uppercase text-blue-700">For {t.roles.length === 4 ? "everyone" : t.roles.join(" · ")}</p>
          <h3 className="font-display text-[15pt]">{t.title}</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/images/help/${t.image}.png`} alt={t.title} className="mt-2 max-h-[120mm] w-auto max-w-full rounded-lg border border-slate-300" />
          <ol className="mt-2 list-decimal pl-5">
            {t.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          {t.tip && <p className="mt-1 text-[10pt] text-slate-600">Tip: {t.tip}</p>}
        </section>
      ))}

      <section className="mt-8 break-before-page">
        <h2 className="font-display text-[20pt]">Five habits that make approval fast</h2>
        <ol className="mt-3 list-decimal pl-5">
          {TIPS.map((t) => (
            <li key={t.title}>
              <b>{t.title}.</b> {t.line}
            </li>
          ))}
        </ol>

        <h2 className="mt-8 font-display text-[20pt]">Quick answers</h2>
        <dl className="mt-2">
          {FAQS.map((f) => (
            <div key={f.q} className="mb-2 break-inside-avoid">
              <dt className="font-bold">{f.q}</dt>
              <dd className="text-slate-700">{f.a}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-8 font-display text-[20pt]">Words you&apos;ll see</h2>
        <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
          {GLOSSARY.map((g) => (
            <div key={g.term} className="break-inside-avoid">
              <dt className="font-bold">{g.term}</dt>
              <dd className="text-slate-700">{g.def}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 rounded-lg border border-slate-300 p-4">
          <p className="font-display text-[15pt]">{CLOSING.title}</p>
          <p className="text-slate-700">{CLOSING.line}</p>
        </div>
      </section>
    </div>
  )
}
