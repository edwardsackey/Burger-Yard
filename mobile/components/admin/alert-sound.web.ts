// Web Audio beep, no asset file needed. Loops every 1.2s until stopAlertSound()
// is called — deliberately persistent so a new order can't be missed while
// the admin is away from the screen or heads-down in the kitchen.
let ctx: AudioContext | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;

function beep() {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.35, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.35);
}

export function startAlertSound(): void {
  if (intervalId) return;
  beep();
  intervalId = setInterval(beep, 1200);
}

export function stopAlertSound(): void {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
}
