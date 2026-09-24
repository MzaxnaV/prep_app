import { CFA_WEEK_PLAN } from "../../lib/studyPlanData";
import { getCurrentWeek } from "../../lib/studyPlanData";

export default function WeekPlanTimeline() {
  const currentWeek = getCurrentWeek();

  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
        CFA Subject Sequence
      </h3>
      <div className="space-y-0">
        {CFA_WEEK_PLAN.map((item, i) => {
          const weekNumbers = item.weeks.split('-').map(Number);
          const startWeek = weekNumbers[0];
          const endWeek = weekNumbers[weekNumbers.length - 1];
          const isCurrent = currentWeek >= startWeek && currentWeek <= endWeek;
          const isPast = currentWeek > endWeek;

          return (
            <div key={i} className="flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full shrink-0 ${
                  isCurrent ? 'bg-accent ring-4 ring-accent/20' : isPast ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                }`} />
                {i < CFA_WEEK_PLAN.length - 1 && (
                  <div className={`w-0.5 flex-1 my-1 ${isPast ? 'bg-emerald-500/30' : 'bg-border'}`} />
                )}
              </div>

              {/* Content */}
              <div className={`pb-6 ${isCurrent ? '' : isPast ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground">W{item.weeks}</span>
                  <span className="text-[10px] text-muted-foreground">{item.dates}</span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">CURRENT</span>
                  )}
                </div>
                <p className="text-sm font-semibold mt-1">{item.subject}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}