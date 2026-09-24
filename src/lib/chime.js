// Short beeps for the section timer — eyes are on paper, so the cues have to be audible.
// Browsers only start audio from a user gesture: call unlockChime() in a click handler.

let ctx = null;

export function unlockChime() {
  try {
    ctx ||= new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    ctx = null;
  }
}

export function chime(count = 1) {
  if (!ctx) return;
  try {
    for (let i = 0; i < count; i++) {
      const t = ctx.currentTime + i * 0.22;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  } catch {
    // No audio: the colours still change.
  }
}
