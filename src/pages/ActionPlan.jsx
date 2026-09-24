import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Crosshair, CalendarCheck, GitBranch, Gauge, Ban, RefreshCw } from 'lucide-react';
import PlanBody from '@/components/plan/PlanBody';
import { db } from '@/api/client';
import { ACTION_PLAN, reviewStatus, splitActions } from '@/lib/actionPlan';
import { STATE_META, deriveMockState } from '@/lib/mockState';
import moment from 'moment';

const TONE_TEXT = {
  red: 'text-red-400',
  amber: 'text-amber-400',
  blue: 'text-blue-400',
  emerald: 'text-emerald-400',
};

const TONE_CHIP = {
  red: 'bg-red-500/10 text-red-400',
  amber: 'bg-amber-500/10 text-amber-400',
  blue: 'bg-blue-500/10 text-blue-400',
  emerald: 'bg-emerald-500/10 text-emerald-400',
};

const pct = v => (v == null ? '—' : `${Math.round(v * 100)}%`);
const range = r => (!r ? '—' : r[0] === r[1] ? `${r[0]}` : `${r[0]}–${r[1]}`);

const TAG_STYLES = {
  analysis: 'bg-blue-500/10 text-blue-400',
  test: 'bg-emerald-500/10 text-emerald-400',
  habit: 'bg-purple-500/10 text-purple-400',
  checkpoint: 'bg-amber-500/10 text-amber-400',
};

export default function ActionPlan() {
  const { past, next } = splitActions();
  const review = reviewStatus();

  const { data: mocks = [] } = useQuery({
    queryKey: ['mockTests'],
    queryFn: () => db.entities.MockTest.list('-date', 200),
  });

  // A dormant plan has no targets, and `diagnose()` treats "no target" as "at
  // target" — so deriving here would read any logged mock as converting and
  // congratulate you against a campaign that was called off. Show the authored
  // headline instead, and no derived table under it.
  const derived = useMemo(() => deriveMockState(mocks, ACTION_PLAN.targets), [mocks]);
  const state = ACTION_PLAN.dormant ? null : derived;
  const headline = (state?.headlineState && ACTION_PLAN.claims[state.headlineState]) || ACTION_PLAN.headline;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Action Plan</h1>
        {/* basis/updated are null while dormant — `moment(null)` formats as
            "Invalid date", so each part is rendered only when it exists. */}
        <p className="text-muted-foreground text-sm mt-1">
          {ACTION_PLAN.horizon.label}
          {ACTION_PLAN.basis && ` · from ${ACTION_PLAN.basis}`}
          {ACTION_PLAN.updated && ` · updated ${moment(ACTION_PLAN.updated).format('MMM D')}`}
        </p>
      </motion.div>

      {review.due ? (
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/25 p-4 flex gap-3">
          <RefreshCw className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <strong className="text-amber-400">This action plan is past its horizon.</strong> It was
            written against {ACTION_PLAN.basis} and expired{' '}
            {moment(ACTION_PLAN.horizon.until).format('MMM D')}. Rewrite it against the latest mock.
          </p>
        </div>
      ) : null}

      {/* The headline claim — chosen by the data, written by hand. */}
      <HeadlineCard headline={headline} state={state} />

      {/* Calendar — omitted entirely when there is nothing dated, rather than
          rendering an empty card that looks like a loading failure. */}
      {(next.length > 0 || past.length > 0) && (
        <div className="rounded-xl bg-card border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarCheck className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              What happens when
            </h2>
          </div>
          <div className="space-y-2">
            {next.map(a => <ActionRow key={a.date + a.label} action={a} />)}
            {past.length > 0 && (
              <>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 pt-3">
                  Passed
                </p>
                {past.map(a => <ActionRow key={a.date + a.label} action={a} passed />)}
              </>
            )}
          </div>
        </div>
      )}

      {/* Prose sections */}
      {ACTION_PLAN.sections.map(s => (
        <div key={s.id} id={s.id} className="rounded-xl bg-card border border-border p-6 scroll-mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3">{s.title}</h2>
          <PlanBody text={s.body} />
        </div>
      ))}

      {/* Decision gates */}
      <div className="rounded-xl bg-card border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <GitBranch className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            What would actually change the plan
          </h2>
        </div>
        <p className="text-[11px] text-muted-foreground mb-4">
          {ACTION_PLAN.dormant
            ? 'The plan is to stop, so these are the conditions that would start something — not course corrections.'
            : 'Missing a milestone by a little is information — it says which block to reweight. These are the triggers that mean something.'}
        </p>
        <div className="space-y-3">
          {ACTION_PLAN.gates.map((g, i) => (
            <div key={i} className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-amber-400">{g.trigger}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">→ {g.then}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Leading indicators — measure a campaign, so hidden when there is none. */}
      {ACTION_PLAN.indicators.length > 0 && (
      <div className="rounded-xl bg-card border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Gauge className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            How you&rsquo;ll know it&rsquo;s working
          </h2>
        </div>
        <p className="text-[11px] text-muted-foreground mb-4">
          Percentiles lag and swing across sources. These move first, and all of them are already in the app.
        </p>
        <div className="space-y-2">
          {ACTION_PLAN.indicators.map((ind, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <span className="text-xs font-black text-muted-foreground/30 font-mono w-4 shrink-0">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">{ind.label}</p>
                <p className="text-[11px] text-muted-foreground">{ind.target}</p>
              </div>
              {ind.route ? (
                <Link to={ind.route} className="text-[11px] text-emerald-500 hover:underline shrink-0">
                  {ind.where}
                </Link>
              ) : (
                <span className="text-[11px] text-muted-foreground/60 shrink-0">{ind.where}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Don'ts */}
      <div className="rounded-xl bg-card border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Ban className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            What not to do
          </h2>
        </div>
        <div className="space-y-2">
          {ACTION_PLAN.donts.map((d, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-1 bg-red-500/40 rounded-full shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed py-0.5">{d}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground/70 text-center">
        Standing reasoning lives on the <Link to="/plan" className="text-emerald-500 hover:underline">Master Plan</Link>.
        This page is only what to do next, and is rewritten after every checkpoint.
      </p>
    </div>
  );
}

/**
 * Where you are, from the latest logged full mock. The claim is authored; which
 * claim appears, and every number under it, is derived — so this card cannot
 * fall out of date the way its hand-typed predecessor did.
 */
function HeadlineCard({ headline, state }) {
  const meta = state?.headlineState ? STATE_META[state.headlineState] : null;

  return (
    <div className="rounded-xl bg-card border-2 border-accent/30 p-6">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <Crosshair className="w-5 h-5 text-accent shrink-0" />
        <h2 className="text-lg font-bold tracking-tight">{headline.claim}</h2>
        {meta && (
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${TONE_CHIP[meta.tone]}`}>
            {meta.label}
            {state.sectionsInHeadlineState.length > 0 && ` · ${state.sectionsInHeadlineState.join(', ')}`}
          </span>
        )}
      </div>

      {state && (
        <p className="text-[11px] text-muted-foreground mb-3">
          From {state.latest.platform || 'an unnamed source'}, {moment(state.latest.date).format('MMM D')}
          {' · '}
          {state.sampleSize === 1
            ? 'first comparable mock'
            : `${state.sampleSize} comparable mocks`}
          {!state.canClaimTrend && ' — too few for a trend'}
          {state.voidedLabels.length > 0 && (
            <span className="text-amber-400">
              {' · '}{state.voidedLabels.join(', ')} excluded — not a measurement
            </span>
          )}
        </p>
      )}

      <PlanBody text={headline.detail} />

      {state && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Section</th>
                <th className="text-center py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Latest</th>
                <th className="text-center py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Coverage</th>
                <th className="text-center py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Accuracy</th>
                <th className="text-center py-2 text-[11px] font-medium text-emerald-500 uppercase tracking-wide">Target</th>
                <th className="text-right py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">State</th>
              </tr>
            </thead>
            <tbody>
              {state.sections.map(s => <SectionRow key={s.key} section={s} />)}
            </tbody>
          </table>
          {meta && <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">{meta.gloss}</p>}
        </div>
      )}
    </div>
  );
}

function SectionRow({ section }) {
  const { figures, target, delta, state, voided, label } = section;
  const meta = state ? STATE_META[state] : null;

  if (voided || !figures) {
    return (
      <tr className="border-b border-border/50 last:border-0">
        <td className="py-2.5 text-xs font-bold">{label}</td>
        <td colSpan={4} className="py-2.5 text-center text-xs text-muted-foreground/70 italic">
          {voided ? 'marked as not a measurement' : 'not logged'}
        </td>
        <td className="py-2.5 text-right text-[10px] text-muted-foreground/50 uppercase">—</td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border/50 last:border-0">
      <td className="py-2.5 text-xs font-bold">{label}</td>
      <td className="py-2.5 text-center font-mono text-xs whitespace-nowrap">
        {figures.att} att → <span className="text-emerald-400">{figures.right}</span>
        {delta && (delta.att !== 0 || delta.right !== 0) && (
          <span className="text-[10px] text-muted-foreground/60 ml-1">
            ({delta.att >= 0 ? '+' : ''}{delta.att}/{delta.right >= 0 ? '+' : ''}{delta.right})
          </span>
        )}
      </td>
      <td className="py-2.5 text-center font-mono text-xs text-muted-foreground">
        {pct(figures.coverage)}
        {figures.total ? <span className="text-muted-foreground/50"> of {figures.total}</span> : null}
      </td>
      <td className={`py-2.5 text-center font-mono text-xs ${meta ? TONE_TEXT[meta.tone] : 'text-muted-foreground'}`}>
        {pct(figures.accuracy)}
      </td>
      <td className="py-2.5 text-center font-mono text-xs text-emerald-500 whitespace-nowrap">
        {range(target?.att)} → <strong>{range(target?.right)}</strong>
        {target?.note && <span className="block text-[10px] text-emerald-500/60">{target.note}</span>}
      </td>
      <td className="py-2.5 text-right">
        {meta && (
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${TONE_CHIP[meta.tone]}`}>
            {meta.label}
          </span>
        )}
      </td>
    </tr>
  );
}

function ActionRow({ action, passed }) {
  const isToday = moment(action.date).isSame(moment(), 'day');

  return (
    <div className={`flex gap-3 p-3 rounded-lg ${
      isToday ? 'bg-accent/10 border border-accent/30' : 'bg-muted/40'
    } ${passed ? 'opacity-45' : ''}`}>
      <div className="w-16 shrink-0">
        <p className={`text-xs font-mono font-bold ${isToday ? 'text-accent' : 'text-muted-foreground'}`}>
          {isToday ? 'Today' : moment(action.date).format('MMM D')}
        </p>
        <p className="text-[10px] text-muted-foreground/60">{moment(action.date).format('ddd')}</p>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-semibold">{action.label}</p>
          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${TAG_STYLES[action.tag] ?? ''}`}>
            {action.tag}
          </span>
        </div>
        {action.detail && (
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{action.detail}</p>
        )}
      </div>
    </div>
  );
}
