import { motion } from "framer-motion";
import { MOCK_TARGETS, QUESTION_TARGETS, NON_NEGOTIABLES, KEY_RISKS, getCurrentBlock } from "../lib/studyPlanData";
import { AlertTriangle, Shield, Target, Flame, Lock } from "lucide-react";

export default function Targets() {
  const block = getCurrentBlock();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Targets &amp; Rules</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {block ? `Currently ${block.label}.` : 'The standing rules, and what a score actually asks for.'}
        </p>
      </motion.div>

      {/* Non-negotiables */}
      <div className="rounded-xl bg-card border-2 border-accent/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-accent" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-accent">Non-Negotiable Rules</h2>
        </div>
        <div className="space-y-4">
          {NON_NEGOTIABLES.map((r, i) => (
            <div key={i} className="flex gap-4">
              <span className="text-2xl font-black text-accent/30 font-mono">{i + 1}</span>
              <div>
                <p className="text-sm font-bold">{r.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What the sections actually ask — in questions */}
      <div className="rounded-xl bg-card border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Targets in questions (marks / Q)
          </h2>
        </div>
        <p className="text-[11px] text-muted-foreground mb-4">
          CAT&nbsp;&rsquo;21 data from the Obsidian vault. More useful than percentiles — questions are what
          you decide about in the hall.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-xs text-muted-foreground font-medium">%ile</th>
                <th className="text-center py-2 text-xs text-muted-foreground font-medium">VARC /24</th>
                <th className="text-center py-2 text-xs text-muted-foreground font-medium">DILR /22</th>
                <th className="text-center py-2 text-xs text-muted-foreground font-medium">QA /22</th>
              </tr>
            </thead>
            <tbody>
              {QUESTION_TARGETS.map(t => (
                <tr key={t.pct} className={`border-b border-border/50 last:border-0 ${t.pct === '99' ? 'bg-emerald-500/5' : ''}`}>
                  <td className={`py-3 text-xs ${t.pct === '99' ? 'font-bold text-emerald-400' : 'font-medium'}`}>{t.pct}</td>
                  <td className="py-3 text-center font-mono text-xs text-blue-500">{t.varc}</td>
                  <td className="py-3 text-center font-mono text-xs text-emerald-500">{t.dilr}</td>
                  <td className="py-3 text-center font-mono text-xs text-purple-500">{t.qa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground/70 mt-3 leading-relaxed">
          DILR 99%ile is <strong>three sets cracked cleanly</strong>. VARC 99%ile leaves 9 questions untouched.
          QA 99%ile is roughly half the section. Use these whenever a mock feels catastrophic — count what
          you would have needed, not what you got.
        </p>
      </div>

      {/* Mock milestones — only once a campaign has set them. */}
      {MOCK_TARGETS.length > 0 && (
      <div className="rounded-xl bg-card border border-border p-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          Mock percentile milestones
        </h2>
        <p className="text-[11px] text-muted-foreground mb-4">
          Missing one by a little is information — it says which block to reweight. Missing DILR badly twice
          running is the trigger to change approach.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-xs text-muted-foreground font-medium">Milestone</th>
                <th className="text-center py-2 text-xs text-muted-foreground font-medium">Overall</th>
                <th className="text-center py-2 text-xs text-muted-foreground font-medium">VARC</th>
                <th className="text-center py-2 text-xs text-muted-foreground font-medium">DILR</th>
                <th className="text-center py-2 text-xs text-muted-foreground font-medium">QA</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TARGETS.map((t, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-3 text-xs font-medium">{t.milestone}</td>
                  <td className="py-3 text-center font-mono text-xs font-bold">{t.overall}</td>
                  <td className="py-3 text-center font-mono text-xs text-blue-500">{t.varc}</td>
                  <td className="py-3 text-center font-mono text-xs text-emerald-500">{t.dilr}</td>
                  <td className="py-3 text-center font-mono text-xs text-purple-500">{t.qa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Reading three cohorts */}
      <div className="rounded-xl bg-card border border-border p-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Reading three cohorts
        </h2>
        <div className="space-y-3">
          {[
            { src: 'AIMCAT', diff: 'Hardest paper, strongest cohort', use: 'Your floor estimate. Expect it to read markedly lower — that is the cohort, not you.', color: 'text-red-400' },
            { src: 'CL', diff: 'Closest to real CAT pattern', use: 'Trust this one for level. Best single predictor of exam day.', color: 'text-amber-400' },
            { src: 'Cracku', diff: 'Easiest cohort', use: 'Trend only, never level. Am I improving? — not, am I at 99?', color: 'text-emerald-400' },
          ].map(c => (
            <div key={c.src} className="flex gap-3 p-3 rounded-lg bg-muted/50">
              <span className={`text-xs font-bold w-16 shrink-0 ${c.color}`}>{c.src}</span>
              <div className="min-w-0">
                <p className="text-xs font-medium">{c.diff}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{c.use}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exam day strategy */}
      <div className="rounded-xl bg-card border border-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">CAT Exam Day Strategy</h2>
        </div>
        <div className="space-y-4">
          <ExamSection
            title="VARC (24 questions: 16 RC + 8 VA)"
            target="20–22 attempts · 85–90% accuracy · 45+ net"
            strategy="VA first (8 min) → RC (30 min) → leftover VA (2 min). One-pass reading, no re-reads."
            color="text-blue-500"
          />
          <ExamSection
            title="DILR (22 questions: 5 sets)"
            target="14–18 attempts · 90–95% accuracy · 40–48 net"
            strategy="Scan all sets (3–5 min) → solve 2 easy sets (24 min) → 3rd set (11 min). SET SELECTION is 50% of the battle."
            color="text-emerald-500"
          />
          <ExamSection
            title="QA (22 questions)"
            target="18–20 attempts · 85–90% accuracy · 40+ net"
            strategy="Easy Arithmetic first → Algebra → Geometry/NT last. 25s read, 15s evaluate, 2 min max. Skip ruthlessly."
            color="text-amber-500"
          />
        </div>
      </div>

      {/* Risks */}
      <div className="rounded-xl bg-card border border-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Key Risks to Watch</h2>
        </div>
        <div className="space-y-3">
          {KEY_RISKS.map((item, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-1 bg-amber-500/50 rounded-full shrink-0" />
              <div>
                <p className="text-sm font-semibold">{item.risk}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* One exam at a time — the rule, not a status report. */}
      <div className="rounded-xl bg-muted/30 border border-border p-5">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            The dormant exam stays dormant
          </h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Whichever exam is not the live one gets <strong>zero hours</strong>, and its progress pages are
          reference rather than a to-do list. A second exam never displaces the first by decision — it does
          so by expansion, an hour at a time. Set the live one&rsquo;s date in Settings and leave the other
          empty.
        </p>
      </div>
    </div>
  );
}

function ExamSection({ title, target, strategy, color }) {
  return (
    <div className="p-4 rounded-lg bg-muted/50">
      <p className={`text-sm font-bold ${color}`}>{title}</p>
      <p className="text-xs text-muted-foreground mt-1">Target: {target}</p>
      <p className="text-xs text-muted-foreground mt-1">Strategy: {strategy}</p>
    </div>
  );
}
