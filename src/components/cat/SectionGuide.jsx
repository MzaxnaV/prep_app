import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

const SECTION_DATA = {
  VARC: {
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    phase1: {
      title: 'VARC Maintenance — Phase 1',
      blocks: [
        { label: 'Daily (30 min)', detail: 'Rotate: RC passage from Aeon → para-jumble/odd-sentence from VARC1000 → RC from different domain → repeat.' },
        { label: 'Evening', detail: 'Light reading (Aeon essays or fiction) doubles as passive VARC training.' },
        { label: 'Goal', detail: 'Stay sharp without spending heavy time. VARC is a strength — maintain it.' },
      ],
    },
    phase2: {
      title: 'VARC Intensive — Phase 2',
      blocks: [
        { label: '10:45 – 12:15', detail: '5–8 VA questions (10 min) → 4–5 RC passages at 14 min each (70 min) → review (10 min).' },
        { label: 'Exam target', detail: 'Attempt 20–22 of 24 questions. 85–90% accuracy. VA first (8 min) → RC (30 min).' },
        { label: 'Goal', detail: '99%ile is 14–15 of 24 correct. Speed reading, one pass then answer.' },
      ],
    },
    resources: [
      { name: 'VARC1000', url: '#', desc: 'VA practice — para-jumbles, odd-sentence, RC' },
      { name: 'CAT PYQs (2iim)', url: 'https://online.2iim.com', desc: '2017–2025 past year questions' },
      { name: 'Aeon Essays', url: 'https://aeon.co/essays', desc: 'High-quality reading for RC training' },
      { name: 'Nishit Sinha — Verbal Ability (Pearson)', url: '#', desc: 'Core VA book' },
    ],
  },
  DILR: {
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    phase1: {
      title: 'DILR Practice Guide — Phase 1',
      blocks: [
        { label: 'Weeks 1–4', detail: 'Learn all set types: arrangements, grouping, distribution, caselets, puzzles. Untimed — 2 sets + review. Use Nishit Sinha + Elites Grid + PYQs 2017–2019.' },
        { label: 'Weeks 5–8', detail: 'Timed practice. 60-second triage: read set, decide attempt/skip. 3 sets timed (12 min each). PYQs 2020–2023 + Aptitude Jab + Cracku.' },
        { label: 'Weeks 9–14', detail: 'Weekly DILR sectionals (40 min). Track accuracy by set type. 3–4 sets timed (10 min each). IMS + Cracku sectionals.' },
        { label: 'Weeks 15–20', detail: 'Integrated into Sunday full mocks. Set selection under pressure.' },
      ],
    },
    phase2: {
      title: 'DILR Intensive — Phase 2',
      blocks: [
        { label: 'Morning (9–10:30)', detail: '3–4 sets timed at 8–12 min each + detailed review. PYQs, Cracku, IMS sectionals, Elites Grid.' },
        { label: 'Afternoon (2:45–4:15)', detail: 'Weak set types from mock analysis. Focus on lowest-accuracy set categories.' },
        { label: 'Exam target', detail: 'Attempt 14–18 of 22 (3–4 sets). 90–95% accuracy. Scan all sets (3–5 min) → 2 easy sets → 3rd set. SET SELECTION is 50% of the battle.' },
      ],
    },
    resources: [
      { name: 'CAT PYQs 2017–2025 (2iim)', url: 'https://online.2iim.com', desc: 'Best free PYQ bank' },
      { name: 'Elites Grid — LRDI Playlist', url: 'https://www.youtube.com/@ElitesGrid', desc: 'YouTube walkthroughs for all DILR set types' },
      { name: 'Aptitude Jab — LRDI Playlist', url: 'https://www.youtube.com/@aptitudejab', desc: 'Harder DILR sets + explanations' },
      { name: 'Cracku DILR Sectionals', url: 'https://cracku.in', desc: 'Best for targeted DILR sectional practice' },
      { name: 'Nishit Sinha — LR & DI (Pearson)', url: '#', desc: 'Core DILR book — fundamentals' },
    ],
  },
  Quant: {
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    phase1: {
      title: 'CAT QA — Phase 1 (Daily 45 min, 5:15–6:00)',
      blocks: [
        { label: 'Daily slot', detail: '45 min dedicated CAT QA practice at the end of each study day (5:15–6:00). Separate from CFA — do not conflate them.' },
        { label: 'Weeks 1–8', detail: 'Sarvesh K. Verma — Arithmetic first (percentages, profit/loss, TSD, time-work, ratios, averages, mixtures). 20–25 questions per session.' },
        { label: 'Weeks 9–20', detail: 'Add Algebra (equations, inequalities, logs, progressions) and Number Theory. Mix in CAT PYQs from 2iim. Track accuracy per topic.' },
      ],
    },
    phase2: {
      title: 'Quant Intensive — Phase 2',
      blocks: [
        { label: '12:30 – 2:00', detail: '20 questions timed at 2 min each (50 min) → review all wrong answers (40 min).' },
        { label: 'Priority order', detail: 'Arithmetic first (40% of section) → Algebra → Geometry/Number Theory last.' },
        { label: 'Exam target', detail: 'Attempt 18–20 of 22. 85–90% accuracy. Know when to skip — 2 min max per question.' },
      ],
    },
    resources: [
      { name: 'Sarvesh K. Verma — Quant Aptitude', url: '#', desc: 'Primary book — start with Arithmetic' },
      { name: 'Rodha Playlist', url: 'https://www.youtube.com/@Rodha', desc: 'YouTube — conceptual clarity, all topics' },
      { name: 'CAT PYQs (2iim)', url: 'https://online.2iim.com', desc: '2017–2025 Quant past questions' },
      { name: 'Cracku Quant', url: 'https://cracku.in', desc: 'Sectional Quant practice + mocks' },
      { name: 'Takshzila', url: '#', desc: 'Quant shortcuts and speed techniques' },
      { name: 'Patrick100', url: '#', desc: 'Speed math + number theory drills' },
    ],
  },
};

export default function SectionGuide({ section, phase }) {
  const [open, setOpen] = useState(false);
  const data = SECTION_DATA[section];
  const guide = phase === 1 ? data.phase1 : data.phase2;

  return (
    <div className={`rounded-xl border ${data.borderColor} overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${data.color}`}>{section === 'Quant' ? 'QA' : section}</span>
          <span className="text-xs text-muted-foreground">{guide.title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          {/* Practice Guide */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Practice Guide</p>
            {guide.blocks.map((b, i) => (
              <div key={i} className={`flex gap-3 p-3 rounded-lg ${data.bgColor}`}>
                <span className={`text-[10px] font-bold ${data.color} w-24 shrink-0 pt-0.5 uppercase`}>{b.label}</span>
                <p className="text-xs text-foreground/80">{b.detail}</p>
              </div>
            ))}
          </div>

          {/* Resources */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Resources</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.resources.map((r, i) => (
                <a
                  key={i}
                  href={r.url !== '#' ? r.url : undefined}
                  target={r.url !== '#' ? '_blank' : undefined}
                  rel="noreferrer"
                  className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                >
                  <div className="flex-1">
                    <p className="text-xs font-medium group-hover:text-foreground">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.desc}</p>
                  </div>
                  {r.url !== '#' && <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}