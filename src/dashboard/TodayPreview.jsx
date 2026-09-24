import { useMemo } from "react";
import { getTodaySchedule } from "../lib/studyPlanData";
import { getScheduleOverride, editableToDisplay } from "../lib/scheduleOverride";
import { Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import moment from "moment";

const TODAY = moment().format('YYYY-MM-DD');

export default function TodayPreview() {
  // Memoized so localStorage is read once per mount, not on every render
  const { schedule, hasOverride } = useMemo(() => {
    const override = getScheduleOverride(TODAY);
    return {
      schedule: override ? override.map(editableToDisplay) : getTodaySchedule(),
      hasOverride: !!override,
    };
  }, []);

  const now = moment();
  const nowMinutes = now.hours() * 60 + now.minutes();

  function isCurrentBlock(timeStr) {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
    if (!match) return false;
    const [, sh, sm, eh, em] = match.map(Number);
    return nowMinutes >= sh * 60 + sm && nowMinutes < eh * 60 + em;
  }

  const studyBlocks = schedule.filter(b => b.type !== 'break');

  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Today's Schedule</h3>
          {hasOverride && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 uppercase">
              Custom
            </span>
          )}
        </div>
        <Link to="/today" className="flex items-center gap-1 text-xs text-accent hover:underline font-medium">
          Full view <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {studyBlocks.slice(0, 5).map((block, i) => {
          const isCurrent = isCurrentBlock(block.time);
          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isCurrent ? 'bg-accent/10 border border-accent/30' : 'bg-muted/50'
              }`}
            >
              <span className="text-[11px] text-muted-foreground font-mono w-28 shrink-0">
                {block.time}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${isCurrent ? 'font-semibold' : ''}`}>
                  {block.activity}
                </p>
              </div>
              <ExamBadge exam={block.exam} />
            </div>
          );
        })}
        {studyBlocks.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            +{studyBlocks.length - 5} more blocks
          </p>
        )}
      </div>
    </div>
  );
}

function ExamBadge({ exam }) {
  if (exam === 'Break' || exam === 'Both') return null;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
      exam === 'CFA' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
    }`}>
      {exam}
    </span>
  );
}
