import { useEffect, useRef, useState } from "react";
import { Pause, Play, Square, Volume2, VolumeX, CornerUpLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  KINDS, SECTIONS, fmtClock, settle, attempt, skip, doneReading, finish, leave, setKind, togglePause, returnTo, endSection,
} from "@/lib/sectionTimer";
import { chime, unlockChime } from "@/lib/chime";

const PHASE_LABEL = { decide: 'Deciding', read: 'Reading', solve: 'Solving' };

/**
 * The running section. Keys: A attempt · S skip · Enter done reading / done ·
 * L leave · T switch RC/VA while deciding · Space pause.
 */
export default function SectionTimer({ draft, onChange }) {
  const [now, setNow] = useState(() => Date.now());
  const [confirmEnd, setConfirmEnd] = useState(false);
  const draftRef = useRef(draft);
  const fired = useRef(null);

  useEffect(() => { draftRef.current = draft; }, [draft]);

  // Ticks the display, and chimes as the current item crosses its targets.
  useEffect(() => {
    function tick() {
      const t = Date.now();
      setNow(t);
      const d = settle(draftRef.current, t);
      const due = thresholds(d);
      if (fired.current == null) {
        // First tick after mounting (or a reload): whatever is already past doesn't ring again.
        fired.current = new Set(due.map(x => x.key));
        return;
      }
      const fresh = due.filter(x => !fired.current.has(x.key));
      fresh.forEach(x => fired.current.add(x.key));
      if (d.sound && fresh.length) chime(Math.max(...fresh.map(x => x.beeps)));
    }
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, []);

  const apply = fn => {
    unlockChime();
    onChange(fn(draft, Date.now()));
  };

  const live = settle(draft, now);
  const item = live.items[live.current];
  const K = KINDS[item.kind];
  const section = SECTIONS[draft.section];
  const phase = item.phase;
  const work = (item.read_ms + item.solve_ms) / 1000;

  useEffect(() => {
    function onKey(e) {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return;
      const k = e.key.toLowerCase();
      const act = fn => { e.preventDefault(); unlockChime(); onChange(fn(draft, Date.now())); };
      if (k === ' ') return act(togglePause);
      if (draft.paused) return;
      const cur = draft.items[draft.current];
      if (cur.phase === 'decide') {
        if (k === 'a') act(attempt);
        else if (k === 's') act(skip);
        else if (k === 't' && section.kinds.length > 1) {
          const next = section.kinds[(section.kinds.indexOf(cur.kind) + 1) % section.kinds.length];
          act(d => setKind(d, next));
        }
      } else if (cur.phase === 'read') {
        if (k === 'enter') act(doneReading);
        else if (k === 'l') act(leave);
      } else if (k === 'enter' || k === 'd') act(finish);
      else if (k === 'l') act(leave);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [draft, onChange, section]);

  // Phase clock against its target.
  const phaseSeconds = phase === 'decide' ? item.decide_ms / 1000 : phase === 'read' ? item.read_ms / 1000 : work;
  const phaseTarget = phase === 'decide' ? K.decide : phase === 'read' ? K.read : K.cap;
  const tone = phase === 'decide'
    ? (phaseSeconds > K.decide ? 'text-red-400' : phaseSeconds > K.decide * 0.75 ? 'text-amber-400' : '')
    : phase === 'read'
      ? (phaseSeconds > K.read ? 'text-amber-400' : '')
      : (work > K.cap ? 'text-red-400' : work > K.warn ? 'text-amber-400' : '');
  const note = phase === 'read' && phaseSeconds > K.read ? K.readNote
    : phase === 'solve' && work > K.cap ? K.capNote
    : phase === 'solve' && work > K.warn ? K.warnNote
    : null;

  const elapsed = live.elapsed_ms / 1000;
  const limit = draft.limit_min * 60;
  const over = limit && elapsed > limit;
  const backlog = live.items
    .map((it, i) => ({ it, i }))
    .filter(({ it, i }) => i !== live.current && (it.status === 'left' || it.status === 'skipped'));
  const done = live.items.filter(it => it.status !== 'open');

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="rounded-xl bg-card border border-border p-5 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{section.label} · timed practice</p>
            <p className="text-[11px] text-muted-foreground font-mono">
              {done.length} done · {done.filter(it => it.decision === 'skip').length} skipped
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" title={draft.sound ? 'Mute chimes' : 'Chime at targets'}
              onClick={() => apply(d => ({ ...d, sound: !d.sound }))}>
              {draft.sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => apply(togglePause)}>
              {draft.paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {draft.paused ? 'Resume' : 'Pause'}
            </Button>
            <Button size="sm" variant={confirmEnd ? 'destructive' : 'outline'} className="gap-1.5"
              onClick={() => (confirmEnd ? apply(endSection) : setConfirmEnd(true))}
              onBlur={() => setConfirmEnd(false)}>
              <Square className="w-3 h-3" /> {confirmEnd ? 'Confirm end' : 'End'}
            </Button>
          </div>
        </div>

        {/* Session clock */}
        <div>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-mono tabular-nums ${over ? 'text-red-400' : ''}`}>
              {limit ? (over ? `+${fmtClock(elapsed - limit)}` : fmtClock(limit - elapsed)) : fmtClock(elapsed)}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              {limit ? (over ? `over ${draft.limit_min} min` : `left of ${draft.limit_min} min`) : 'elapsed · no limit'}
            </span>
          </div>
          {limit > 0 && (
            <div className="h-1 bg-muted rounded-full overflow-hidden mt-2">
              <div className={`h-full transition-all ${over ? 'bg-red-400' : 'bg-accent'}`}
                style={{ width: `${Math.min(100, (elapsed / limit) * 100)}%` }} />
            </div>
          )}
        </div>

        {/* Current item */}
        <div className={`rounded-xl bg-muted/30 p-5 text-center ${draft.paused ? 'opacity-50' : ''}`}>
          <div className="flex items-center justify-center gap-2 mb-3">
            {phase === 'decide' && section.kinds.length > 1 ? (
              <div className="flex gap-1 p-0.5 rounded-md bg-muted/60">
                {section.kinds.map(k => (
                  <button key={k} type="button" onClick={() => apply(d => setKind(d, k))}
                    className={`text-xs px-2.5 py-1 rounded ${item.kind === k ? 'bg-card shadow-sm font-semibold' : 'text-muted-foreground'}`}>
                    {KINDS[k].label}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-sm font-semibold">{K.label} {item.n}</span>
            )}
            {item.visits > 1 && <span className="text-[10px] text-amber-400 font-mono">visit {item.visits}</span>}
          </div>

          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {draft.paused ? 'Paused' : PHASE_LABEL[phase]}
          </p>
          <p className={`text-6xl font-bold font-mono tabular-nums my-2 ${tone}`}>{fmtClock(phaseSeconds)}</p>
          <p className="text-[11px] text-muted-foreground font-mono">
            {phase === 'decide' && `call by ${fmtClock(K.decide)}`}
            {phase === 'read' && `read in ${fmtClock(K.read)} · decided in ${fmtClock(item.decide_ms / 1000)}`}
            {phase === 'solve' && `aim ${fmtClock(K.warn)} · cap ${fmtClock(K.cap)} · decided in ${fmtClock(item.decide_ms / 1000)}`}
          </p>
          {phaseTarget && phaseSeconds > phaseTarget && phase === 'decide' && (
            <p className="text-xs text-red-400 mt-3">Past {fmtClock(K.decide)} — if it isn&apos;t clear yet, that is the answer. Skip.</p>
          )}
          {note && <p className={`text-xs mt-3 ${work > K.cap ? 'text-red-400' : 'text-amber-400'}`}>{note}</p>}
        </div>

        {phase === 'decide' && (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => apply(skip)} disabled={draft.paused}>
              Skip <Kbd>S</Kbd>
            </Button>
            <Button onClick={() => apply(attempt)} disabled={draft.paused}>
              Attempt <Kbd>A</Kbd>
            </Button>
          </div>
        )}
        {phase === 'read' && (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => apply(leave)} disabled={draft.paused}>
              Leave <Kbd>L</Kbd>
            </Button>
            <Button onClick={() => apply(doneReading)} disabled={draft.paused}>
              Done reading <Kbd>↵</Kbd>
            </Button>
          </div>
        )}
        {phase === 'solve' && (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => apply(leave)} disabled={draft.paused}>
              Leave for now <Kbd>L</Kbd>
            </Button>
            <Button onClick={() => apply(finish)} disabled={draft.paused}>
              Done <Kbd>↵</Kbd>
            </Button>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground/70 text-center">
          {K.rule} Space pauses{section.kinds.length > 1 ? ' · T switches RC / VA while deciding' : ''}.
        </p>
      </div>

      {backlog.length > 0 && (
        <div className="rounded-xl bg-card border border-border p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Come back to</h3>
          <div className="space-y-1">
            {backlog.map(({ it, i }) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="flex-1">
                  {KINDS[it.kind].label} {it.n}
                  <span className="text-muted-foreground"> · {it.status === 'left' ? 'left mid-way' : 'skipped'}</span>
                </span>
                <span className="font-mono text-muted-foreground">{fmtClock((it.read_ms + it.solve_ms) / 1000)}</span>
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" disabled={draft.paused}
                  onClick={() => apply((d, t) => returnTo(d, i, t))}>
                  <CornerUpLeft className="w-3 h-3" /> Return
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {done.map(it => (
            <span key={it.n} className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              it.status === 'done' ? 'bg-emerald-500/15 text-emerald-400'
                : it.status === 'left' ? 'bg-amber-500/15 text-amber-400'
                : 'bg-muted text-muted-foreground'
            }`}>
              {it.n} · {fmtClock(it.decide_ms / 1000)}
              {it.decision === 'attempt' ? ` + ${fmtClock((it.read_ms + it.solve_ms) / 1000)}` : ' skip'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Kbd({ children }) {
  return <span className="ml-2 text-[10px] opacity-60 font-mono">{children}</span>;
}

/** Targets the current item and the session have already passed, with how loudly each rings. */
function thresholds(d) {
  const out = [];
  if (d.stage !== 'running') return out;
  if (d.limit_min && d.elapsed_ms >= d.limit_min * 60000) out.push({ key: 'limit', beeps: 4 });
  const it = d.items[d.current];
  if (!it) return out;
  const K = KINDS[it.kind];
  const key = name => `${it.n}:${name}`;
  if (it.phase === 'decide' && it.decide_ms >= K.decide * 1000) out.push({ key: key('decide'), beeps: 1 });
  if (K.read && it.phase === 'read' && it.read_ms >= K.read * 1000) out.push({ key: key('read'), beeps: 1 });
  const work = it.read_ms + it.solve_ms;
  if (it.phase !== 'decide' && work >= K.warn * 1000) out.push({ key: key('warn'), beeps: 2 });
  if (it.phase !== 'decide' && work >= K.cap * 1000) out.push({ key: key('cap'), beeps: 3 });
  return out;
}
