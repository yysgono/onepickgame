// Optional, synthesized effects; no downloaded audio or autoplay on page load.
export function makeArenaAudio() {
 let context = null, lastHit = 0;
 function tone(frequency, delay = 0, length = .09, volume = .035) {
  if (!context || context.state !== 'running') return;
  const start = context.currentTime + delay, oscillator = context.createOscillator(), gain = context.createGain();
  oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(volume, start); gain.gain.exponentialRampToValueAtTime(.001, start + length);
  oscillator.connect(gain); gain.connect(context.destination);
  oscillator.start(start); oscillator.stop(start + length);
 }
 return {
  async enable() {
   try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return false;
    if (!context) context = new Audio();
    await context.resume(); return context.state === 'running';
   } catch { return false; }
  },
  hit() {
   if (!context || context.currentTime - lastHit < .12) return;
   lastHit = context.currentTime; tone(340, 0, .045, .018);
  },
  gate() { tone(520); tone(780, .1); },
  win() { tone(523, 0, .22); tone(659, .13, .22); tone(784, .26, .4); },
  close() { const old = context; context = null; if (old) void old.close().catch(() => {}); },
 };
}
