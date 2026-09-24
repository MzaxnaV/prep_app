import { useMemo, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, FileText, Lock, Archive } from 'lucide-react';
import PlanBody from '@/components/plan/PlanBody';
import { PLAN_STATUS, sectionsForTrack, TRACKS } from '@/lib/planContent';

const VIEW_KEY = 'prep-app:plan-track';

function loadView() {
  try {
    const saved = localStorage.getItem(VIEW_KEY);
    return saved && TRACKS[saved] ? saved : 'cat';
  } catch {
    return 'cat';
  }
}

export default function MasterPlan() {
  const [view, setView] = useState(loadView);
  const sections = useMemo(() => sectionsForTrack(view), [view]);
  const [collapsed, setCollapsed] = useState(
    () => new Set(sectionsForTrack(loadView()).filter(s => s.archived).map(s => s.id))
  );

  // Any id on the page — a section or one of its subsections — mapped to the
  // section that has to be open for it to be visible.
  const ownerOf = useMemo(() => {
    const map = new Map();
    for (const s of sections) {
      map.set(s.id, s.id);
      for (const c of s.children) map.set(c.id, s.id);
    }
    return map;
  }, [sections]);

  const chooseView = useCallback(v => {
    setView(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch { /* private mode — the default is fine */ }
  }, []);

  const toggle = useCallback(id => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const reveal = useCallback(id => {
    const owner = ownerOf.get(id);
    if (!owner) return;
    setCollapsed(prev => {
      if (!prev.has(owner)) return prev;
      const next = new Set(prev);
      next.delete(owner);
      return next;
    });
    // Let the section expand before measuring where to scroll.
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [ownerOf]);

  // Cross-references between sections are plain #anchors. Without this they
  // silently fail whenever the target sits inside a collapsed section.
  useEffect(() => {
    const jump = () => {
      const id = window.location.hash.slice(1);
      if (id) reveal(id);
    };
    jump();
    window.addEventListener('hashchange', jump);
    return () => window.removeEventListener('hashchange', jump);
  }, [reveal]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Master Plan</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Method that stays true whenever you sit the exam. Schedules and targets live on their own pages.
            </p>
          </div>
          <TrackTabs view={view} onChange={chooseView} />
        </div>
      </motion.div>

      <div className="grid xl:grid-cols-[190px_1fr] gap-6 items-start">
        <TableOfContents sections={sections} onJump={reveal} />

        <div className="space-y-4 min-w-0">
          <div className="rounded-xl bg-card border border-border p-6">
            <PlanBody text={PLAN_STATUS} />
          </div>

          {sections.length === 0 && <EmptyTrack label={TRACKS[view]?.label ?? view} />}

          {sections.map(section => (
            <Section
              key={section.id}
              section={section}
              collapsed={collapsed.has(section.id)}
              onToggle={() => toggle(section.id)}
            />
          ))}

          {sections.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing in the plan is tagged for this track.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TrackTabs({ view, onChange }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/60 border border-border">
      {Object.values(TRACKS).map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            view === t.id
              ? 'bg-card shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** A track can legitimately have no sections — say so rather than render a gap. */
function EmptyTrack({ label }) {
  return (
    <div className="rounded-xl bg-muted/30 border border-dashed border-border p-4 flex gap-3">
      <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground leading-relaxed">
        No {label} method written up yet. Add a section to <code>PLAN</code> in
        {' '}<code>src/lib/planContent.js</code> with <code>track: '{label.toLowerCase()}'</code> and it
        appears here.
      </p>
    </div>
  );
}

function TableOfContents({ sections, onJump }) {
  return (
    <nav className="hidden xl:block sticky top-8">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 mb-3 px-2">
        Contents
      </p>
      <ul className="space-y-0.5">
        {sections.map(s => (
          <li key={s.id}>
            <button
              onClick={() => onJump(s.id)}
              className={`w-full text-left px-2 py-1.5 rounded text-[11px] leading-snug transition-colors hover:bg-muted/60 hover:text-foreground ${
                s.archived ? 'text-muted-foreground/50' : 'text-muted-foreground'
              }`}
            >
              {s.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Section({ section, collapsed, onToggle }) {
  const { archived } = section;

  return (
    <section id={section.id} className="rounded-xl bg-card border border-border scroll-mt-8">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-muted/30 transition-colors rounded-xl"
      >
        {archived ? (
          <Archive className="w-4 h-4 text-muted-foreground/50 shrink-0" />
        ) : (
          <FileText className="w-4 h-4 text-muted-foreground/50 shrink-0" />
        )}
        <h2 className={`flex-1 text-sm font-bold uppercase tracking-wider ${
          archived ? 'text-muted-foreground' : 'text-foreground'
        }`}>
          {section.title}
        </h2>
        {archived && (
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">
            for the record
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
            collapsed ? '' : 'rotate-180'
          }`}
        />
      </button>

      {!collapsed && (
        <div className="px-5 pb-5 -mt-1">
          {section.showBody && <PlanBody text={section.body} />}

          {section.children.map(child => (
            <div key={child.id} id={child.id} className="mt-6 pt-5 border-t border-border/60 scroll-mt-8">
              <h3 className="text-sm font-semibold mb-2">{child.title}</h3>
              <PlanBody text={child.body} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
