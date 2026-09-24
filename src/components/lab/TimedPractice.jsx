import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import { Play, ChevronDown, ChevronRight, Check, Trash2 } from "lucide-react";
import { db } from "@/api/client";
import { queryClientInstance } from "@/lib/query-client";
import { Button } from "@/components/ui/button";
import TimeAnalysis from "./TimeAnalysis";
import LogQuestionDialog from "../qa/LogQuestionDialog";
import LogSetDialog from "../dilr/LogSetDialog";
import LogVARCDialog from "../varc/LogVARCDialog";
import {
  KINDS, SECTIONS, analyse, fmtClock, median, workSeconds, worthLogging, logTarget, markLogged, deleteSection,
} from "@/lib/sectionTimer";

const LIMITS = [0, 20, 40, 60];
const DIALOGS = {
  qa: { Dialog: LogQuestionDialog, queryKey: 'qaQuestions' },
  dilr: { Dialog: LogSetDialog, queryKey: 'dilrSets' },
  varc: { Dialog: LogVARCDialog, queryKey: 'varcItems' },
};

/** The tab's timer card: start a run, and the runs so far with their items ready to log. */
export default function TimedPractice({ section, onStart, openId, setOpenId }) {
  const [limit, setLimit] = useState(0);
  const [logging, setLogging] = useState(null); // { record, item, dialog, defaults }

  const { data: all = [] } = useQuery({
    queryKey: ['timedSections'],
    queryFn: () => db.entities.TimedSection.list('-started_at', 500),
  });
  const sessions = all.filter(s => s.section === section);
  const recent = sessions.slice(0, 5);
  const kinds = SECTIONS[section].kinds;

  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Timed practice</h3>
          <div className="text-[11px] text-muted-foreground mt-1 space-y-0.5">
            {kinds.map(k => (
              <p key={k}>
                <span className="font-semibold">{KINDS[k].label}:</span> decide by {fmtClock(KINDS[k].decide)} · {KINDS[k].rule}
              </p>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 p-0.5 rounded-md bg-muted/40">
            {LIMITS.map(m => (
              <button key={m} type="button" onClick={() => setLimit(m)}
                className={`text-[11px] px-2 py-1 rounded ${limit === m ? 'bg-card shadow-sm font-semibold' : 'text-muted-foreground'}`}>
                {m ? `${m}m` : 'No limit'}
              </button>
            ))}
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => onStart(section, limit)}>
            <Play className="w-3 h-3" /> Start
          </Button>
        </div>
      </div>

      {recent.length > 0 && <Trend sessions={recent} kinds={kinds} />}

      {sessions.length > 0 && (
        <div className="mt-3 space-y-1">
          {sessions.slice(0, 10).map(s => (
            <SessionRow key={s.id} record={s} open={openId === s.id}
              onToggle={() => setOpenId(openId === s.id ? null : s.id)}
              onLog={item => setLogging({ record: s, item, ...logTarget(s, item) })} />
          ))}
        </div>
      )}

      {logging && (() => {
        const { Dialog, queryKey } = DIALOGS[logging.dialog];
        return (
          <Dialog
            single
            defaults={logging.defaults}
            onSaved={async () => {
              await markLogged(logging.record.id, logging.item.n);
              queryClientInstance.invalidateQueries({ queryKey: [queryKey] });
            }}
            onClose={() => setLogging(null)}
          />
        );
      })()}
    </div>
  );
}

/** Medians across the last few runs, against the targets. */
function Trend({ sessions, kinds }) {
  const items = sessions.flatMap(s => s.items);
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] border-t border-border pt-3">
      <span className="text-muted-foreground">Last {sessions.length} runs:</span>
      {kinds.map(k => {
        const ks = items.filter(it => it.kind === k);
        if (ks.length === 0) return null;
        const K = KINDS[k];
        const decide = median(ks.map(it => it.decide_seconds));
        const work = median(ks.filter(it => it.decision === 'attempt').map(workSeconds));
        return (
          <span key={k} className="font-mono">
            {kinds.length > 1 && <span className="font-sans font-semibold">{K.label} </span>}
            decide <span className={decide > K.decide ? 'text-amber-400' : 'text-emerald-400'}>{fmtClock(decide)}</span>
            {' · '}solve <span className={work == null ? '' : work > K.warn ? 'text-amber-400' : 'text-emerald-400'}>{work == null ? '—' : fmtClock(work)}</span>
          </span>
        );
      })}
    </div>
  );
}

function SessionRow({ record, open, onToggle, onLog }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const a = analyse(record);
  const answered = a.byKind.reduce((t, k) => t + k.answered, 0);
  const correct = a.byKind.reduce((t, k) => t + k.correct, 0);

  return (
    <div className="rounded-lg border border-border/60">
      <button type="button" onClick={onToggle} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-muted/30">
        {open ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
        <span className="font-mono text-muted-foreground w-24 shrink-0">{moment(record.started_at).format('MMM D, HH:mm')}</span>
        <span className="flex-1 truncate">
          {a.byKind.map(k => `${k.attempted}/${k.total} ${k.label.toLowerCase()}`).join(' · ')}
        </span>
        <span className="font-mono shrink-0">{answered ? `${correct}/${answered}` : '—'}</span>
        <span className="font-mono text-muted-foreground w-12 text-right shrink-0">{fmtClock(record.elapsed_seconds)}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-4 border-t border-border/60">
          <div className="mt-3"><TimeAnalysis record={record} /></div>

          <div>
            <p className="text-[11px] text-muted-foreground mb-2">
              Into the lab log — the timer fills in the times; you add the topic or set type. ● = worth logging.
            </p>
            <div className="space-y-1">
              {record.items.map(it => {
                const K = KINDS[it.kind];
                const result = K.unit === 'question'
                  ? (it.decision === 'skip' ? 'skipped' : it.result?.toLowerCase() ?? 'unmarked')
                  : (it.decision === 'skip' ? 'skipped' : `${it.questions_correct ?? '?'}/${it.questions_answered ?? '?'}${it.status === 'left' ? ' · left' : ''}`);
                return (
                  <div key={it.n} className="flex items-center gap-2 text-xs py-0.5">
                    <span className={`w-2 text-center ${worthLogging(it) && !it.logged ? 'text-accent' : 'text-transparent'}`}>●</span>
                    <span className="font-mono text-muted-foreground w-5">{it.n}</span>
                    <span className="flex-1 truncate">{K.label} <span className="text-muted-foreground">· {result}</span></span>
                    <span className="font-mono text-muted-foreground">
                      {fmtClock(it.decide_seconds)}{it.decision === 'attempt' ? ` + ${fmtClock(workSeconds(it))}` : ''}
                    </span>
                    {it.logged ? (
                      <span className="flex items-center gap-1 text-emerald-400 w-14 justify-end"><Check className="w-3 h-3" /> logged</span>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-6 text-xs w-14" onClick={() => onLog(it)}>Log</Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="sm" variant={confirmDelete ? 'destructive' : 'ghost'} className="gap-1.5 h-7 text-xs"
              onClick={() => (confirmDelete ? deleteSection(record.id) : setConfirmDelete(true))}
              onBlur={() => setConfirmDelete(false)}>
              <Trash2 className="w-3 h-3" /> {confirmDelete ? 'Delete this run' : 'Delete'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
