import { motion } from "framer-motion";
import moment from "moment";
import { CalendarDays, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import DataBackup from "../components/DataBackup";
import { EXAMS, useExamDates, setExamDate, daysUntil } from "../lib/examDates";

export default function Settings() {
  const dates = useExamDates();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Exam dates and the data you have logged against them.
        </p>
      </motion.div>

      <div className="rounded-xl bg-card border border-border p-4">
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Exam dates
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground mb-4 leading-relaxed">
          Leave a date empty and that exam goes dormant: no countdown, and nothing in the app
          assumes a deadline for it. Clearing a date never touches anything you have logged.
        </p>

        <div className="space-y-3">
          {EXAMS.map(exam => (
            <ExamDateRow key={exam.key} exam={exam} value={dates[exam.key]} />
          ))}
        </div>
      </div>

      <DataBackup />
    </div>
  );
}

function ExamDateRow({ exam, value }) {
  const days = daysUntil(value);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Label htmlFor={`date-${exam.key}`} className="text-xs w-20 shrink-0">
        {exam.label}
      </Label>

      <Input
        id={`date-${exam.key}`}
        type="date"
        value={value ?? ''}
        onChange={e => setExamDate(exam.key, e.target.value)}
        className="h-9 text-xs w-44"
      />

      {value ? (
        <>
          <span className={`text-xs font-mono ${exam.color}`}>
            {days > 0
              ? `${days}d · ${moment(value).format('ddd, MMM D YYYY')}`
              : days === 0
                ? 'Today'
                : `${moment(value).format('MMM D, YYYY')} — passed`}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExamDate(exam.key, null)}
            className="h-7 px-2 gap-1 text-muted-foreground"
          >
            <X className="w-3 h-3" /> Clear
          </Button>
        </>
      ) : (
        <span className="text-xs text-muted-foreground">Dormant — no date set</span>
      )}
    </div>
  );
}
