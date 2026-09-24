import { useQuery } from "@tanstack/react-query";
import { db } from "@/api/client";
import { motion } from "framer-motion";
import MockForm from "../components/mocks/MocksForm";
import MockScoreChart from "../components/mocks/MockScoreChart";
import MockAnalysisDialog from "../components/mocks/MockAnalysisDialog";
import { isAnalysed } from "@/lib/mockAnalysis";
import { Plus, TrendingUp, Calendar, Pencil, NotebookPen, CircleDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import moment from "moment";

export default function MockTests() {
  const [showForm, setShowForm] = useState(false);
  // Mock being edited, or null when logging a new one
  const [editingMock, setEditingMock] = useState(null);
  // { mock } when analysing a specific mock, {} when picking one first
  const [analysing, setAnalysing] = useState(null);

  const { data: mocks = [], refetch } = useQuery({
    queryKey: ['mockTests'],
    queryFn: () => db.entities.MockTest.list('-date', 100),
  });

  const catMocks = mocks.filter(m => m.exam_type === 'CAT Full' || m.exam_type === 'CAT Sectional');
  const cfaMocks = mocks.filter(m => m.exam_type === 'CFA Full' || m.exam_type === 'CFA Qbank');
  const unanalysed = mocks.filter(m => !isAnalysed(m));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Mock Tests</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {catMocks.length} CAT mocks · {cfaMocks.length} CFA mocks · Target: 40-60 total
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setAnalysing({})} size="sm" variant="outline" className="gap-2">
              <NotebookPen className="w-4 h-4" /> Write Analysis
            </Button>
            <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Log Mock
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Rule #2: no new test until the last one is written up. */}
      {unanalysed.length > 0 && (
        <button
          onClick={() => setAnalysing({})}
          className="w-full flex items-center gap-3 rounded-xl bg-amber-500/5 border border-amber-500/25 p-4 text-left hover:bg-amber-500/10 transition-colors"
        >
          <CircleDashed className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-muted-foreground flex-1">
            <strong className="text-amber-400">
              {unanalysed.length} mock{unanalysed.length > 1 ? 's' : ''} not yet analysed
            </strong>
            {' — '}a mock you don&rsquo;t analyse in writing is worth roughly nothing. No new test until
            the last one is written up.
          </p>
        </button>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total Mocks" value={mocks.length} target="40-60" icon={Calendar} />
        <StatCard
          label="Latest CAT %ile"
          value={(() => {
            const m = catMocks[0];
            if (!m) return '—';
            const v = m.overall_percentile ?? m.varc_percentile ?? m.dilr_percentile ?? m.quant_percentile;
            return v != null ? `${v}` : '—';
          })()}
          icon={TrendingUp}
        />
        <StatCard
          label="CFA Latest"
          value={cfaMocks[0]?.cfa_score_pct ? `${cfaMocks[0].cfa_score_pct}%` : '—'}
          icon={TrendingUp}
        />
        <StatCard
          label="Best VARC"
          value={catMocks.some(m => m.varc_percentile) ? `${Math.max(...catMocks.map(m => m.varc_percentile || 0))}` : '—'}
          icon={TrendingUp}
        />
        <StatCard
          label="Best DILR"
          value={catMocks.some(m => m.dilr_percentile) ? `${Math.max(...catMocks.map(m => m.dilr_percentile || 0))}` : '—'}
          icon={TrendingUp}
        />
        <StatCard
          label="Best QA"
          value={catMocks.some(m => m.quant_percentile) ? `${Math.max(...catMocks.map(m => m.quant_percentile || 0))}` : '—'}
          icon={TrendingUp}
        />
      </div>

      <MockScoreChart mocks={catMocks} />

      {/* Mock List */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          All Mock Tests
        </h2>
        {mocks.length === 0 ? (
          <div className="rounded-xl bg-card border border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">No mocks logged yet.</p>
          </div>
        ) : (
          mocks.map((mock) => (
            <MockCard
              key={mock.id}
              mock={mock}
              onEdit={() => setEditingMock(mock)}
              onAnalyse={() => setAnalysing({ mock })}
            />
          ))
        )}
      </div>

      {showForm && <MockForm onClose={() => { setShowForm(false); refetch(); }} />}

      {editingMock && (
        <MockForm
          mock={editingMock}
          onClose={() => { setEditingMock(null); refetch(); }}
        />
      )}

      {analysing && (
        <MockAnalysisDialog
          mocks={mocks}
          initialMock={analysing.mock ?? null}
          onClose={() => { setAnalysing(null); refetch(); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, target, icon: Icon }) {
  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold font-mono">{value}</p>
      {target && <p className="text-[10px] text-muted-foreground">Target: {target}</p>}
    </div>
  );
}

/**
 * A written analysis field. These are paragraphs, not a sentence — rendering the
 * raw string into a single <p> collapsed every break and produced a wall of text
 * that was unreadable at exactly the moment it matters, reviewing the last mock.
 *
 * Blank lines split paragraphs; single newlines are kept (`whitespace-pre-line`)
 * so numbered rules stay one per line. Deliberately not markdown — see PlanBody
 * for the places that need it.
 */
function NoteBlock({ label, tone, text }) {
  if (!text?.trim()) return null;
  const paras = text.trim().split(/\n\s*\n/);

  return (
    <div>
      <p className={`text-[10px] ${tone} uppercase font-bold`}>{label}</p>
      <div className="mt-1 space-y-2">
        {paras.map((p, i) => (
          <p key={i} className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

function MockCard({ mock, onEdit, onAnalyse }) {
  const [expanded, setExpanded] = useState(false);
  const isCat = mock.exam_type === 'CAT Full' || mock.exam_type === 'CAT Sectional';
  const analysed = isAnalysed(mock);

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isCat ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
            }`}>
              {mock.exam_type}
            </span>
            <span className="text-sm font-medium">{moment(mock.date).format('MMM D, YYYY')}</span>
            {mock.platform && <span className="text-xs text-muted-foreground">{mock.platform}</span>}
            {!analysed && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                Not analysed
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isCat && mock.overall_percentile && (
              <span className="text-sm font-bold font-mono">{mock.overall_percentile}%ile</span>
            )}
            {!isCat && mock.cfa_score_pct && (
              <span className="text-sm font-bold font-mono">{mock.cfa_score_pct}%</span>
            )}
          </div>
        </div>
        
        {isCat && (
          <div className="flex gap-4 mt-2">
            {mock.varc_percentile && <span className="text-xs text-blue-500 font-mono">VARC: {mock.varc_percentile}%ile</span>}
            {mock.dilr_percentile && <span className="text-xs text-emerald-500 font-mono">DILR: {mock.dilr_percentile}%ile</span>}
            {mock.quant_percentile && <span className="text-xs text-purple-500 font-mono">QA: {mock.quant_percentile}%ile</span>}
          </div>
        )}
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
          {/* Q/A Breakup */}
          {isCat && (mock.varc_total || mock.varc_correct || mock.dilr_total || mock.dilr_correct || mock.quant_total || mock.quant_correct) && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1.5">Q/A Breakdown</p>
              <div className="grid grid-cols-5 gap-1 text-[9px] text-muted-foreground font-bold mb-1 px-1">
                <span />
                <span className="text-center">Correct</span>
                <span className="text-center">Wrong</span>
                <span className="text-center">Skipped</span>
                <span className="text-center">Score</span>
              </div>
              {[['VARC','varc'],['DILR','dilr'],['QA','quant']].map(([label, prefix]) => {
                const c = mock[`${prefix}_correct`], i = mock[`${prefix}_incorrect`], s = mock[`${prefix}_skipped`], t = mock[`${prefix}_total`];
                if (!c && !i && !t) return null;
                const acc = c && t ? Math.round(c/t*100) : null;
                const sc = mock[`${prefix}_score`];
                return (
                  <div key={prefix} className="grid grid-cols-5 gap-1 items-center px-1 py-0.5 rounded hover:bg-muted/20">
                    <span className="text-[10px] font-bold text-muted-foreground">{label} {acc !== null && <span className="text-emerald-400 font-mono">({acc}%)</span>}</span>
                    <span className="text-xs font-mono text-emerald-400 text-center">{c ?? '—'}</span>
                    <span className="text-xs font-mono text-red-400 text-center">{i ?? '—'}</span>
                    <span className="text-xs font-mono text-muted-foreground text-center">{s ?? '—'}</span>
                    <span className="text-xs font-mono text-amber-400 text-center">{sc ?? '—'}</span>
                  </div>
                );
              })}
              {mock.overall_score != null && (
                <p className="text-[10px] text-amber-400 font-mono mt-1 px-1">Score: {mock.overall_score}</p>
              )}
            </div>
          )}
          {!isCat && (mock.cfa_correct || mock.cfa_total) && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Q/A Breakdown</p>
              <div className="flex gap-4 text-xs font-mono">
                {mock.cfa_correct != null && <span className="text-emerald-400">Correct: {mock.cfa_correct}</span>}
                {mock.cfa_incorrect != null && <span className="text-red-400">Wrong: {mock.cfa_incorrect}</span>}
                {mock.cfa_skipped != null && <span className="text-muted-foreground">Skipped: {mock.cfa_skipped}</span>}
                {(mock.cfa_score ?? mock.cfa_computed_score) != null && <span className="text-amber-400">Score: {mock.cfa_score ?? mock.cfa_computed_score}</span>}
              </div>
            </div>
          )}
          {/* Difficulty Breakup */}
          {mock.difficulty_breakup && (() => {
            try {
              const db_ = JSON.parse(mock.difficulty_breakup);
              return (
                <div>
                  <p className="text-[10px] text-purple-400 uppercase font-bold mb-1">Difficulty Breakup</p>
                  <div className="grid grid-cols-4 gap-1 text-[9px] text-muted-foreground font-bold mb-1 px-1">
                    <span />
                    <span className="text-center text-emerald-400">Correct</span>
                    <span className="text-center text-red-400">Wrong</span>
                    <span className="text-center">Skip</span>
                  </div>
                  {Object.entries(db_).map(([cat, v]) => (
                    <div key={cat} className="grid grid-cols-4 gap-1 px-1 py-0.5">
                      <span className="text-[10px] text-muted-foreground">{cat}</span>
                      <span className="text-xs font-mono text-emerald-400 text-center">{v.c}</span>
                      <span className="text-xs font-mono text-red-400 text-center">{v.i}</span>
                      <span className="text-xs font-mono text-muted-foreground text-center">{v.s}</span>
                    </div>
                  ))}
                </div>
              );
            } catch { return null; }
          })()}
          <NoteBlock label="Key Mistakes" tone="text-red-400" text={mock.key_mistakes} />
          <NoteBlock label="Strategy Notes" tone="text-blue-400" text={mock.strategy_notes} />
          <NoteBlock label="Time Analysis" tone="text-amber-400" text={mock.time_analysis} />
          <div className="flex justify-end gap-2 pt-1">
            <Button size="sm" variant={analysed ? 'outline' : 'default'} onClick={onAnalyse} className="gap-1.5">
              <NotebookPen className="w-3.5 h-3.5" /> {analysed ? 'Edit Analysis' : 'Write Analysis'}
            </Button>
            <Button size="sm" variant="outline" onClick={onEdit} className="gap-1.5">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}