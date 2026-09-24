import { useRef, useState } from "react";
import { Download, Upload, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { COLLECTION_NAMES as COLLECTIONS, STORAGE_PREFIX as PREFIX } from "@/lib/localStore";
import { SETTINGS_KEY, refreshExamDates } from "@/lib/examDates";

const CONFIRM_WORD = 'RESET';

export default function DataBackup() {
  const fileRef = useRef(null);
  const [status, setStatus] = useState(null); // { type: 'ok'|'err', msg }
  const [confirm, setConfirm] = useState('');
  const [exported, setExported] = useState(false);

  function handleExport() {
    const backup = {};
    for (const name of COLLECTIONS) {
      try {
        backup[name] = JSON.parse(localStorage.getItem(`${PREFIX}${name}`) || '[]');
      } catch {
        backup[name] = [];
      }
    }
    // Settings are one blob, not a collection, so they need naming explicitly —
    // COLLECTIONS only covers arrays of records. Without this an export/restore
    // round trip silently dropped the exam dates.
    try {
      backup._settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    } catch {
      backup._settings = {};
    }
    backup._exported_at = new Date().toISOString();
    setExported(true);

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prep-app-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus({ type: 'ok', msg: 'Backup downloaded.' });
    setTimeout(() => setStatus(null), 3000);
  }

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        let count = 0;
        for (const name of COLLECTIONS) {
          if (Array.isArray(data[name])) {
            localStorage.setItem(`${PREFIX}${name}`, JSON.stringify(data[name]));
            count += data[name].length;
          }
        }
        if (data._settings && typeof data._settings === 'object') {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(data._settings));
          refreshExamDates();
        }
        setStatus({ type: 'ok', msg: `Restored ${count} records. Reload the page to see changes.` });
      } catch {
        setStatus({ type: 'err', msg: 'Invalid backup file.' });
      }
      // reset input so the same file can be re-selected
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  /**
   * Clears every collection plus the settings blob. Gated behind a typed word
   * rather than a confirm() because it is unrecoverable — there is no server
   * copy and no undo, so a misplaced click would cost the whole logged history.
   */
  function handleReset() {
    for (const name of COLLECTIONS) localStorage.removeItem(`${PREFIX}${name}`);
    localStorage.removeItem(SETTINGS_KEY);
    refreshExamDates();
    setConfirm('');
    setStatus({ type: 'ok', msg: 'All data cleared. Reload the page.' });
  }

  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Data Backup</p>
      <div className="flex items-center gap-3 flex-wrap">
        <Button size="sm" variant="outline" onClick={handleExport} className="gap-2">
          <Download className="w-3.5 h-3.5" /> Export JSON
        </Button>
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
          <Upload className="w-3.5 h-3.5" /> Import JSON
        </Button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        {status && (
          <span className={`flex items-center gap-1.5 text-xs ${status.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
            {status.type === 'ok' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {status.msg}
          </span>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">
        Export before updating the app. Covers all {COLLECTIONS.length} collections — sessions, mocks,
        progress, the DILR / QA / VARC logs and timed runs, the calculation drill — and your exam dates.
      </p>

      <div className="mt-4 pt-4 border-t border-red-500/20">
        <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">Danger zone</p>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Erases every logged record — mocks, sessions, lab entries, drill and Zetamac scores — and
          clears your exam dates. This cannot be undone and there is no server copy.
          {!exported && <span className="text-amber-400"> Export first.</span>}
        </p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Input
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder={`Type ${CONFIRM_WORD} to enable`}
            className="h-8 text-xs w-52"
            aria-label={`Type ${CONFIRM_WORD} to enable the reset`}
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={confirm !== CONFIRM_WORD}
            onClick={handleReset}
            className="gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" /> Reset all data
          </Button>
        </div>
      </div>
    </div>
  );
}
