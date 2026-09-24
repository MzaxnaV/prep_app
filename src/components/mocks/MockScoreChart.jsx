import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import moment from "moment";
import { useState } from "react";

// Providers are NOT comparable to each other — different papers, different cohorts.
// An AIMCAT 95 can be a CL 98 and a Cracku 99. Each gets its own series so a
// source switch never reads as improvement or decline.
const PROVIDERS = [
  { key: 'aimcat', label: 'AIMCAT', match: /aimcat|time/i, color: '#ef4444', note: 'Hardest paper + strongest cohort. Your floor estimate.' },
  { key: 'cl', label: 'CL', match: /career\s*launcher|^cl\b/i, color: '#f59e0b', note: 'Closest to real CAT pattern. Best predictor of exam day — trust this for level.' },
  { key: 'cracku', label: 'Cracku', match: /cracku/i, color: '#10b981', note: 'Easiest cohort. Trend only, never level.' },
  { key: 'other', label: 'Other', match: /.*/, color: '#6b7280', note: 'Unclassified platform.' },
];

const SECTIONS = [
  { key: 'overall_percentile', label: 'Overall' },
  { key: 'varc_percentile', label: 'VARC' },
  { key: 'dilr_percentile', label: 'DILR' },
  { key: 'quant_percentile', label: 'QA' },
];

function providerFor(platform) {
  const p = platform || '';
  return PROVIDERS.find(x => x.key !== 'other' && x.match.test(p)) || PROVIDERS[3];
}

export default function MockScoreChart({ mocks }) {
  const [section, setSection] = useState('overall_percentile');

  if (mocks.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">No mock tests logged yet. Take your first mock!</p>
      </div>
    );
  }

  // One row per date; each provider is its own key so recharts draws separate lines
  // with gaps rather than joining across providers.
  const byDate = new Map();
  [...mocks]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach(m => {
      const label = moment(m.date).format('MMM D');
      const row = byDate.get(label) || { date: label };
      const value = m[section];
      if (value != null) row[providerFor(m.platform).key] = value;
      byDate.set(label, row);
    });
  const data = [...byDate.values()];

  const present = PROVIDERS.filter(p => data.some(d => d[p.key] != null));

  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-1">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Percentile Trend — by provider
        </h3>
        <div className="flex gap-1">
          {SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={`text-[11px] px-2 py-1 rounded-md transition-colors ${
                section === s.key
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground mb-4">
        Compare each line only against itself. A source switch is not improvement or decline.
      </p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            {present.map(p => (
              <Line
                key={p.key}
                type="monotone"
                dataKey={p.key}
                stroke={p.color}
                strokeWidth={2}
                dot={{ r: 3 }}
                name={p.label}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {present.length > 1 && (
        <div className="mt-4 pt-3 border-t border-border space-y-1">
          {present.map(p => (
            <p key={p.key} className="text-[10px] text-muted-foreground flex gap-2">
              <span className="font-bold shrink-0" style={{ color: p.color }}>{p.label}</span>
              <span>{p.note}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
