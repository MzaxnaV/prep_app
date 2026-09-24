import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SLOW_MS } from "@/lib/drill";

/**
 * One run: prompt → reveal → mark. The clock stops at the reveal, not at the
 * mark, because recall is what's being timed. Keys: Space/Enter reveals, then
 * 1 or → for "knew it", 2 or ← for "missed". Esc quits without saving.
 */
export default function DrillRunner({ title, cards, onFinish, onQuit }) {
  const [index, setIndex] = useState(0);
  const [revealMs, setRevealMs] = useState(null);
  const results = useRef([]);
  const startedAt = useRef(0);
  const shownAt = useRef(0);

  useEffect(() => { startedAt.current = performance.now(); }, []);
  useEffect(() => { shownAt.current = performance.now(); }, [index]);

  const card = cards[index];
  const revealed = revealMs != null;
  const slow = revealed && revealMs > SLOW_MS;

  const reveal = useCallback(() => {
    if (!revealed) setRevealMs(Math.round(performance.now() - shownAt.current));
  }, [revealed]);

  const mark = useCallback(knew => {
    if (!revealed) return;
    // prompt/answer as shown — a card with options can be asked more than one way
    results.current.push({ card: card.id, prompt: card.prompt, answer: card.answer, ok: knew && !slow, slow, ms: revealMs });
    if (index + 1 >= cards.length) {
      onFinish(results.current, Math.round((performance.now() - startedAt.current) / 1000));
      return;
    }
    setIndex(index + 1);
    setRevealMs(null);
  },[revealed, card, slow, revealMs, index, cards.length, onFinish]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') return onQuit();
      if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        reveal();
      } else if (revealed && (e.key === '1' || e.key === 'ArrowRight')) {
        mark(true);
      } else if (revealed && (e.key === '2' || e.key === 'ArrowLeft')) {
        mark(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [revealed, reveal, mark, onQuit]);

  if (!card) return null;

  return (
    <div className="rounded-xl bg-card border border-border p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-[11px] text-muted-foreground font-mono">{index + 1} / {cards.length}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={onQuit} className="gap-1.5 text-muted-foreground">
          <X className="w-3.5 h-3.5" /> Quit
        </Button>
      </div>

      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-accent transition-all" style={{ width: `${(index / cards.length) * 100}%` }} />
      </div>

      <button
        type="button"
        onClick={reveal}
        disabled={revealed}
        className="w-full py-10 rounded-xl bg-muted/30 text-center disabled:cursor-default"
      >
        <p className="text-4xl sm:text-5xl font-bold font-mono tabular-nums">{card.prompt}</p>
        <p className="text-xs text-muted-foreground mt-3">{card.ask}</p>

        {revealed ? (
          <div className="mt-6 space-y-1">
            <p className="text-3xl font-bold font-mono tabular-nums text-accent">{card.answer}</p>
            {card.detail && <p className="text-xs text-muted-foreground font-mono">{card.detail}</p>}
            <p className={`text-[11px] font-mono mt-2 ${slow ? 'text-red-400' : 'text-muted-foreground'}`}>
              {(revealMs / 1000).toFixed(1)}s{slow ? ' — too slow, counts as a miss' : ''}
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground/60 mt-6">Say it in your head, then tap or press Space</p>
        )}
      </button>

      {revealed && (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => mark(false)} className="text-red-400 hover:text-red-400">
            Missed <span className="ml-2 text-[10px] text-muted-foreground font-mono">2 / ←</span>
          </Button>
          <Button onClick={() => mark(true)}>
            {slow ? 'Knew it, slowly' : 'Knew it'} <span className="ml-2 text-[10px] opacity-60 font-mono">1 / →</span>
          </Button>
        </div>
      )}

      {revealed && card.cue && (
        <p className="text-[11px] text-muted-foreground leading-snug border-t border-border pt-3">
          <span className="font-semibold">{card.family}:</span> {card.cue}
        </p>
      )}
    </div>
  );
}
