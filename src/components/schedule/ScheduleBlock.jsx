import { CheckCircle, Circle, Clock, Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function ScheduleBlock({ block, index, isCurrent, isCompleted, onLog }) {
  const isBreak = block.type === 'break';

  if (isBreak) {
    return (
      <div className="flex items-center gap-4 px-4 py-2 opacity-50">
        <span className="text-[11px] text-muted-foreground font-mono w-28 shrink-0">{block.time}</span>
        <div className="flex-1 border-t border-dashed border-border" />
        <span className="text-[11px] text-muted-foreground">{block.activity}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-start gap-4 px-4 py-4 rounded-xl transition-all ${
        isCurrent
          ? 'bg-accent/10 border-2 border-accent/40 shadow-sm'
          : isCompleted
          ? 'bg-muted/30 opacity-70'
          : 'bg-card border border-border'
      }`}
    >
      <span className="text-[11px] text-muted-foreground font-mono w-28 shrink-0 pt-0.5">
        {block.time}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
            {block.activity}
          </p>
          {isCurrent && (
            <span className="flex items-center gap-1 text-[10px] text-accent font-bold uppercase">
              <Clock className="w-3 h-3" /> Now
            </span>
          )}
        </div>
        {block.detail && (
          <p className="text-xs text-muted-foreground mt-1">{block.detail}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] font-mono text-muted-foreground">{block.duration} min</span>
          <ExamBadge exam={block.exam} />
          <TypeBadge type={block.type} />
        </div>
      </div>

      <div className="shrink-0 mt-0.5">
        {isCompleted ? (
          <CheckCircle className="w-5 h-5 text-emerald-500" />
        ) : (
          <button
            type="button"
            title="Log session for this block"
            onClick={onLog}
            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-accent transition-colors px-2 py-1 rounded-lg border border-border hover:border-accent/40 hover:bg-accent/5"
          >
            <Plus className="w-3 h-3" />
            Log
          </button>
        )}
      </div>
    </motion.div>
  );
}

function ExamBadge({ exam }) {
  if (exam === 'Break' || exam === 'Both') return null;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
      exam === 'CFA' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
    }`}>
      {exam}
    </span>
  );
}

function TypeBadge({ type }) {
  const colors = {
    'new-material': 'bg-blue-500/10 text-blue-500',
    'gap-fill': 'bg-purple-500/10 text-purple-500',
    'practice': 'bg-amber-500/10 text-amber-500',
    'revision': 'bg-cyan-500/10 text-cyan-500',
    'mock': 'bg-red-500/10 text-red-500',
    'analysis': 'bg-orange-500/10 text-orange-500',
    'planning': 'bg-slate-500/10 text-slate-500',
  };
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colors[type] || 'bg-muted text-muted-foreground'}`}>
      {type}
    </span>
  );
}
