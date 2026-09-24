import { motion } from "framer-motion";

/**
 * `total` is the campaign length the countdown measures progress through. It is
 * optional: a date set by hand has no campaign start, and inventing one produced
 * a bar reading "-3 of 0 days". Without it the card is just the countdown.
 */
export default function CountdownCard({ title, days, total, color, icon: Icon }) {
  const hasProgress = Number.isFinite(total) && total > 0;
  const progress = hasProgress ? Math.max(0, Math.min(100, ((total - days) / total) * 100)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl bg-card border border-border p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-4xl font-bold font-mono ${color}`}>
              {days > 0 ? days : 0}
            </span>
            <span className="text-sm text-muted-foreground">days left</span>
          </div>
        </div>
        <div className={`p-3 rounded-xl bg-muted`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      
      {hasProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(progress)}% elapsed</span>
            <span>{total - days} of {total} days</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${color === 'text-amber-500' ? 'bg-amber-500' : 'bg-emerald-500'}`}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}