import { getCurrentPhase, getCurrentWeek, getCFASubjectForWeek, getGapFillRotation } from "../lib/studyPlanData";
import { BookOpen, Zap } from "lucide-react";

export default function PhaseIndicator() {
  const phase = getCurrentPhase();
  const week = getCurrentWeek();
  const cfaSubject = getCFASubjectForWeek(week);
  const gapFill = getGapFillRotation();

  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          phase === 1 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
        }`}>
          PHASE {phase}
        </div>
        <span className="text-sm text-muted-foreground font-mono">Week {week}</span>
      </div>
      
      {phase === 1 ? (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <BookOpen className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{cfaSubject.subject}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{cfaSubject.detail}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Zap className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{gapFill.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{gapFill.topics}</p>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm font-semibold">Full CAT Prep</p>
          <p className="text-xs text-muted-foreground mt-1">DILR 3hrs · VARC 1.5hrs · Quant 1.5hrs · Flex 1.5hrs</p>
        </div>
      )}
    </div>
  );
}