import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Crosshair, ArrowRight, RefreshCw } from 'lucide-react';
import { db } from '@/api/client';
import { ACTION_PLAN, reviewStatus, splitActions } from '@/lib/actionPlan';
import { deriveMockState } from '@/lib/mockState';
import moment from 'moment';

/**
 * The daily nudge. Deliberately shallow — the headline claim plus the next few
 * dated actions. Everything else is on /action; this card must never grow into
 * a second copy of it.
 */
export default function ActionPlanCard() {
  const { next } = splitActions();
  const review = reviewStatus();
  const upcoming = next.slice(0, 3);

  const { data: mocks = [] } = useQuery({
    queryKey: ['mockTests'],
    queryFn: () => db.entities.MockTest.list('-date', 200),
  });

  // Dormant: no targets, so a derived diagnosis would be meaningless. Same
  // reasoning as pages/ActionPlan.jsx — the card and the page must not disagree.
  const derived = useMemo(() => deriveMockState(mocks, ACTION_PLAN.targets), [mocks]);
  const state = ACTION_PLAN.dormant ? null : derived;
  const headline = (state?.headlineState && ACTION_PLAN.claims[state.headlineState]) || ACTION_PLAN.headline;

  return (
    <Link
      to="/action"
      className="block rounded-xl bg-card border-2 border-accent/30 p-5 hover:border-accent/50 transition-colors"
    >
      <div className="flex items-center gap-2 mb-3">
        <Crosshair className="w-4 h-4 text-accent" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-accent flex-1">Action Plan</h2>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
      </div>

      <p className="text-sm font-semibold leading-snug">{headline.claim}</p>
      {state ? (
        <p className="text-[11px] text-muted-foreground mt-1">
          {state.totals.att} attempted → {state.totals.right} right on{' '}
          {moment(state.latest.date).format('MMM D')}
          {state.voidedLabels.length > 0 && `, ${state.voidedLabels.join('/')} excluded`}.
          {' '}Next checkpoint {moment(ACTION_PLAN.horizon.until).format('MMM D')}.
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground mt-1">
          {ACTION_PLAN.dormant ? 'No campaign running.' : 'No full mock logged yet.'}
        </p>
      )}

      {review.due && (
        <div className="mt-3 flex items-center gap-2 text-[11px] text-amber-400">
          <RefreshCw className="w-3 h-3 shrink-0" />
          Past its horizon — rewrite against the latest mock.
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">Next up</p>
          {upcoming.map(a => {
            const isToday = moment(a.date).isSame(moment(), 'day');
            return (
              <div key={a.date + a.label} className="flex gap-2.5 items-baseline">
                <span className={`text-[10px] font-mono w-11 shrink-0 ${
                  isToday ? 'text-accent font-bold' : 'text-muted-foreground'
                }`}>
                  {isToday ? 'Today' : moment(a.date).format('MMM D')}
                </span>
                <span className="text-[11px] text-muted-foreground leading-snug">{a.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </Link>
  );
}
