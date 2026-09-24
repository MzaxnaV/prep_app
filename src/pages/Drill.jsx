import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import moment from "moment";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { CheckCircle2, Circle, Play } from "lucide-react";
import { db } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DrillRunner from "../components/drill/DrillRunner";
import CalculationReference from "../components/drill/CalculationReference";
import MultiplicationReference from "../components/drill/MultiplicationReference";
import {
  TRACKS, MODES, CALLS_PER_RUN, buildRun, saveRun, saveZetamac, todaysFamilies, isGridDay, buildDay, hasCalls,
  drillBlockIndex, frequentMisses, cardById, faceOf, trackOf,
} from "@/lib/drill";

/**
 * A ladder, not a calendar. These were dated checkpoints, which meant they
 * expired: past the last date every target read as missed regardless of how the
 * score was actually moving. Now the next rung is chosen by your best score, so
 * the target advances when you do and never goes stale.
 */
const ZETAMAC_LADDER = [30, 35, 40];
const ZETAMAC_FINAL = ZETAMAC_LADDER[ZETAMAC_LADDER.length - 1];

export default function Drill() {
  const today = moment().format('YYYY-MM-DD');

  const { data: sessions = [] } = useQuery({
    queryKey: ['drillSessions'],
    queryFn: () => db.entities.DrillSession.list('-created_date', 500),
  });
  const { data: scores = [] } = useQuery({
    queryKey: ['zetamacScores'],
    queryFn: () => db.entities.ZetamacScore.list('date', 500),
  });

  // Evenings open on the multiplication track, which is evening work.
  const [track, setTrack] = useState(() => (moment().hour() >= 18 ? 'multiplication' : 'fractions'));
  // run: { track, mode, cards } while practising. summary: { mode, results } after a run finishes.
  const [run, setRun] = useState(null);
  const [summary, setSummary] = useState(null);

  const isFractions = track === 'fractions';
  const trackSessions = sessions.filter(s => trackOf(s) === track);
  const families = todaysFamilies(track);
  const gridDay = isGridDay(track);
  const day = buildDay();
  const todaysRuns = trackSessions.filter(s => s.date === today);
  const linked = drillBlockIndex() >= 0;

  function switchTrack(next) {
    setSummary(null);
    setTrack(next);
  }

  function start(mode) {
    const cards = buildRun(track, mode, trackSessions);
    if (cards.length === 0) return;
    setSummary(null);
    setRun({ track, mode, cards });
  }

  async function finish(results, durationSeconds) {
    const { track: runTrack, mode } = run;
    setRun(null);
    setSummary({ mode, results });
    await saveRun({ track: runTrack, mode, results, durationSeconds });
  }

  if (run) {
    const title = `${TRACKS[run.track].label} · ${run.mode === 'family' ? families.join(' · ') : MODES[run.mode].label}`;
    return (
      <div className="max-w-xl mx-auto">
        <DrillRunner title={title} cards={run.cards} onFinish={finish} onQuit={() => setRun(null)} />
      </div>
    );
  }

  const ran = mode => todaysRuns.some(r => r.mode === mode);
  const steps = [
    ...(isFractions ? [{ key: 'zetamac', label: 'Zetamac, first round logged', done: scores.some(s => s.date === today) }] : []),
    ...(gridDay
      ? [{ key: 'grid', label: 'Full grid, cold — count the errors', done: ran('grid') }]
      : [
          ...(hasCalls(track) ? [{ key: 'calls', label: `${CALLS_PER_RUN} calls — last run's misses come first`, done: ran('calls') }] : []),
          ...(families ? [{ key: 'family', label: `${day ? 'New' : 'Family'}: ${families.join(' · ')}`, done: ran('family') }] : []),
        ]),
  ];

  const logNote = !isFractions
    ? 'evening work, saved here only'
    : linked
      ? "logs to today's Calculation Speed Drill block"
      : "no drill block in today's schedule — saved here only";

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Calculation Drill</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {moment().format('dddd')}{day ? ` · build week, day ${day} of 7` : ''} · {TRACKS[track].slot} · {logNote}
        </p>
      </motion.div>

      <div className="flex gap-1 p-1 rounded-lg bg-muted/40 w-fit">
        {Object.entries(TRACKS).map(([key, t]) => (
          <button
            key={key}
            type="button"
            onClick={() => switchTrack(key)}
            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
              track === key ? 'bg-card shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {summary && <Summary {...summary} onClose={() => setSummary(null)} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-card border border-border p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Today</h2>
          <div className="space-y-3">
            {steps.map(step => (
              <div key={step.key} className="flex items-center gap-3">
                {step.done
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />}
                <span className={`text-sm flex-1 ${step.done ? 'text-muted-foreground' : ''}`}>{step.label}</span>
                {step.key !== 'zetamac' && (
                  <Button size="sm" variant={step.done ? 'outline' : 'default'} onClick={() => start(step.key)} className="gap-1.5 shrink-0">
                    <Play className="w-3 h-3" /> {step.done ? 'Again' : 'Start'}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {todaysRuns.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-2">
              {[...todaysRuns].reverse().map(r => (
                <span key={r.id} className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {MODES[r.mode].label} {r.known}/{r.total}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-2">
            <span className="text-[11px] text-muted-foreground self-center mr-1">Off-rotation:</span>
            {Object.entries(MODES)
              .filter(([key]) => !steps.some(s => s.key === key)
                && (key !== 'family' || families)
                && (key !== 'calls' || hasCalls(track)))
              .map(([key, m]) => (
                <Button key={key} size="sm" variant="ghost" onClick={() => start(key)} className="h-7 text-xs">
                  {m.label}
                </Button>
              ))}
          </div>
        </div>

        <ZetamacCard scores={scores} today={today} />
      </div>

      <MissesCard sessions={trackSessions} />

      {isFractions ? <CalculationReference /> : <MultiplicationReference />}
    </div>
  );
}

function Summary({ mode, results, onClose }) {
  const known = results.filter(r => r.ok).length;
  const misses = results.filter(r => !r.ok);
  return (
    <div className="rounded-xl bg-card border border-accent/30 p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm">
          <span className="font-semibold">{MODES[mode].label}</span>
          <span className="font-mono font-bold ml-3">{known}/{results.length}</span>
          {mode === 'grid' && <span className="text-muted-foreground ml-2">· {misses.length} errors</span>}
        </p>
        <Button size="sm" variant="ghost" onClick={onClose}>Dismiss</Button>
      </div>
      {misses.length === 0 ? (
        <p className="text-xs text-emerald-500">Clean run.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
          {misses.map((r, i) => {
            const card = cardById(r.card);
            const face = card ? faceOf(card) : {};
            return (card || r.prompt) && (
              <div key={i} className="flex justify-between gap-2 font-mono text-[11px] border-b border-border/40 pb-0.5">
                <span className="text-muted-foreground">{r.prompt ?? face.prompt}</span>
                <span className="font-semibold">{r.answer ?? face.answer}{r.slow ? ' ⏱' : ''}</span>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-3">These come first in your next {CALLS_PER_RUN} calls. ⏱ = knew it, too slowly.</p>
    </div>
  );
}

function ZetamacCard({ scores, today }) {
  const todays = scores.find(s => s.date === today);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    const score = Number(value);
    if (!value || Number.isNaN(score)) return;
    setSaving(true);
    await saveZetamac(score);
    setValue('');
    setSaving(false);
  }

  const data = scores.slice(-30).map(s => ({ date: moment(s.date).format('MMM D'), score: s.score }));
  const best = scores.reduce((m, s) => Math.max(m, s.score), 0);
  const next = ZETAMAC_LADDER.find(score => score > best) ?? ZETAMAC_FINAL;

  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Zetamac</h2>
        <span className="text-[11px] text-muted-foreground font-mono">
          {best >= ZETAMAC_FINAL ? `${ZETAMAC_FINAL}+ held` : `next ${next}`}
          {next !== ZETAMAC_FINAL && ` · ${ZETAMAC_FINAL}+ eventually`}
          {best ? ` · best ${best}` : ''}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">
        Default settings, 120s. Log the first round only: the cold score is the honest one.
      </p>

      <form onSubmit={save} className="flex items-center gap-2 mb-4">
        <Input
          type="number"
          min="0"
          placeholder={todays ? `today: ${todays.score}` : 'score'}
          value={value}
          onChange={e => setValue(e.target.value)}
          className="h-8 w-28 font-mono"
        />
        <Button type="submit" size="sm" disabled={saving || !value}>
          {todays ? 'Replace' : 'Save'}
        </Button>
        {todays && <span className="text-xs text-emerald-500 font-mono">today {todays.score}</span>}
      </form>

      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground/60 text-center py-8">No scores yet.</p>
      ) : (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[0, dataMax => Math.max(ZETAMAC_FINAL + 10, dataMax)]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={28} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <ReferenceLine y={next} stroke="#10b981" strokeDasharray="4 4" />
              {next !== ZETAMAC_FINAL && (
                <ReferenceLine y={ZETAMAC_FINAL} stroke="#10b981" strokeOpacity={0.35} strokeDasharray="2 4" />
              )}
              <Line type="monotone" dataKey="score" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function MissesCard({ sessions }) {
  const misses = frequentMisses(sessions);
  if (misses.length === 0) return null;
  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Keep missing</h2>
      <p className="text-[11px] text-muted-foreground mb-3">Last 7 days. Look these up on paper before the next run.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
        {misses.map(({ card, misses: n }) => (
          <div key={card.id} className="flex items-baseline justify-between gap-2 font-mono text-[11px] border-b border-border/40 pb-0.5">
            <span>{faceOf(card).prompt} <span className="text-muted-foreground">→ {faceOf(card).answer}</span></span>
            <span className="text-red-400">×{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
