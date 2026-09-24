import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import QATab from "../components/lab/QATab";
import DILRTab from "../components/lab/DILRTab";
import VARCTab from "../components/lab/VARCTab";
import TimedPractice from "../components/lab/TimedPractice";
import SectionTimer from "../components/lab/SectionTimer";
import TimerReview from "../components/lab/TimerReview";
import { loadDraft, storeDraft, startDraft } from "@/lib/sectionTimer";
import { unlockChime } from "@/lib/chime";

// CAT sections only — CFA Quantitative Methods lives under CFA Progress.
const TABS = {
  qa: { label: 'QA', Body: QATab },
  dilr: { label: 'DILR', Body: DILRTab },
  varc: { label: 'VARC', Body: VARCTab },
};

export default function Lab() {
  const [params, setParams] = useSearchParams();
  const tab = TABS[params.get('tab')] ? params.get('tab') : 'qa';

  // A section in progress takes the page over until it's saved or discarded, whichever tab it came from.
  const [draft, setDraft] = useState(loadDraft);
  const [openId, setOpenId] = useState(null);

  function update(next) {
    setDraft(next);
    storeDraft(next);
  }

  function start(section, limitMin) {
    unlockChime();
    update(startDraft(section, limitMin, Date.now()));
  }

  if (draft?.stage === 'running') return <SectionTimer draft={draft} onChange={update} />;
  if (draft?.stage === 'review') {
    return (
      <TimerReview
        draft={draft}
        onChange={update}
        onDiscard={() => update(null)}
        onSaved={row => {
          update(null);
          setOpenId(row.id);
          setParams({ tab: row.section }, { replace: true });
        }}
      />
    );
  }

  const { Body } = TABS[tab];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Lab</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Timed practice and the logs behind it, one CAT section per tab.
        </p>
      </motion.div>

      <div className="flex gap-1 p-1 rounded-lg bg-muted/40 w-fit">
        {Object.entries(TABS).map(([key, t]) => (
          <button
            key={key}
            type="button"
            onClick={() => setParams({ tab: key }, { replace: true })}
            className={`text-sm px-4 py-1.5 rounded-md transition-colors ${
              tab === key ? 'bg-card shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Body key={tab}>
        <TimedPractice section={tab} onStart={start} openId={openId} setOpenId={setOpenId} />
      </Body>
    </div>
  );
}
