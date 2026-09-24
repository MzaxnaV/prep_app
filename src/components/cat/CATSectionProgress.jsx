import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChevronDown, ChevronUp } from "lucide-react";
import moment from "moment";

const SECTION_COLORS = {
  VARC: { accent: '#3b82f6', label: 'text-blue-500', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
  DILR: { accent: '#10b981', label: 'text-emerald-500', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  Quant: { accent: '#f59e0b', label: 'text-amber-500', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
};

function calcSessionStats(s) {
  const attempted = s.questions_attempted || 0;
  const correct = s.questions_correct || 0;
  const incorrect = s.questions_incorrect ?? null;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : null;
  const negativePct = (incorrect !== null && attempted > 0) ? Math.round((incorrect / attempted) * 100) : null;
  const percentile = s.percentile ?? null;
  return { accuracy, negativePct, percentile, attempted };
}

// Summary strip for a single section
function SectionSummary({ sessions, colors, displayName }) {
  const sorted = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = sorted[sorted.length - 1];
  const latestStats = latest ? calcSessionStats(latest) : null;

  const oneWeekAgo = moment().subtract(7, 'days').toDate();
  const weekSessions = sorted.filter(s => new Date(s.date) >= oneWeekAgo);

  function avgOf(arr, fn) {
    const vals = arr.map(fn).filter(v => v !== null);
    if (!vals.length) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  const weekAvgAcc = avgOf(weekSessions, s => calcSessionStats(s).accuracy);
  const weekAvgNeg = avgOf(weekSessions, s => calcSessionStats(s).negativePct);
  const weekAvgPile = avgOf(weekSessions, s => calcSessionStats(s).percentile);

  const totalQ = sessions.reduce((s, sess) => s + (sess.questions_attempted || 0), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
      <MiniStat label="Sessions" value={sessions.length} />
      <MiniStat label="Total Qs" value={totalQ || '—'} />
      <MiniStat label="Latest Acc." value={latestStats?.accuracy != null ? `${latestStats.accuracy}%` : '—'} color="text-emerald-400" />
      <MiniStat label="Latest Neg." value={latestStats?.negativePct != null ? `${latestStats.negativePct}%` : '—'} color="text-red-400" />
      <MiniStat label="Latest %ile" value={latestStats?.percentile != null ? latestStats.percentile : '—'} />
      <MiniStat label="Latest Qs" value={latestStats?.attempted || '—'} />
      <MiniStat label="Wk Avg Acc." value={weekAvgAcc != null ? `${weekAvgAcc}%` : '—'} color="text-emerald-400" />
      <MiniStat label="Wk Avg Neg." value={weekAvgNeg != null ? `${weekAvgNeg}%` : '—'} color="text-red-400" />
      {weekAvgPile != null && <MiniStat label="Wk Avg %ile" value={weekAvgPile} />}
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="bg-muted/30 rounded-lg p-2">
      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-bold font-mono ${color || ''}`}>{value}</p>
    </div>
  );
}

function SectionChart({ sessions, colors, displayName }) {
  const data = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((s, idx) => {
        const { accuracy, negativePct, percentile } = calcSessionStats(s);
        return {
          label: `#${idx + 1} ${moment(s.date).format('MMM D')}`,
          accuracy,
          neg: negativePct,
          percentile,
        };
      });
  }, [sessions]);

  if (data.length === 0) return <p className="text-xs text-muted-foreground text-center py-4">No sessions logged yet.</p>;

  const hasNeg = data.some(d => d.neg !== null);
  const hasPile = data.some(d => d.percentile !== null);

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }}
            formatter={(v, name) => [v != null ? (name === '%ile' ? v : `${v}%`) : '—', name]}
          />
          <Legend wrapperStyle={{ fontSize: '10px' }} />
          <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Accuracy" connectNulls />
          {hasNeg && <Line type="monotone" dataKey="neg" stroke="#ef4444" strokeWidth={1.5} dot={{ r: 2 }} name="Negative%" connectNulls />}
          {hasPile && <Line type="monotone" dataKey="percentile" stroke={colors.accent} strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" name="%ile" connectNulls />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function CATSectionProgress({ sessions }) {
  const [open, setOpen] = useState({});

  const bySectionKey = useMemo(() => {
    const map = { VARC: [], DILR: [], Quant: [] };
    sessions.forEach(s => { if (map[s.subject]) map[s.subject].push(s); });
    return map;
  }, [sessions]);

  const SECTIONS = [
    { key: 'VARC', display: 'VARC' },
    { key: 'DILR', display: 'DILR' },
    { key: 'Quant', display: 'QA' },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
        Section Progress Over Time
      </h2>
      {SECTIONS.map(({ key, display }) => {
        const colors = SECTION_COLORS[key];
        const sectionSessions = bySectionKey[key];
        const isOpen = open[key];
        return (
          <div key={key} className={`rounded-xl border ${colors.border} overflow-hidden`}>
            <button
              onClick={() => setOpen(prev => ({ ...prev, [key]: !prev[key] }))}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${colors.label}`}>{display}</span>
                <span className="text-xs text-muted-foreground">{sectionSessions.length} sessions</span>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {isOpen && (
              <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                <SectionSummary sessions={sectionSessions} colors={colors} displayName={display} />
                <SectionChart sessions={sectionSessions} colors={colors} displayName={display} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
