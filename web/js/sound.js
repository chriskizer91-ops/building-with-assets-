// The console's own little noises, made on the fly (no sound files): a boot chime, menu blips.

let ctx = null;
let enabled = true;

export function setSoundsEnabled(on) { enabled = !!on; }

function ac() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, start, dur, { type = 'square', vol = 0.06, slide = 0 } = {}) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + start;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export function sfx(name) {
  if (!enabled) return;
  switch (name) {
    case 'move': tone(660, 0, 0.04, { vol: 0.03 }); break;
    case 'select': tone(784, 0, 0.06, { vol: 0.05 }); tone(1175, 0.06, 0.1, { vol: 0.05 }); break;
    case 'back': tone(523, 0, 0.05, { vol: 0.04 }); tone(392, 0.05, 0.08, { vol: 0.04 }); break;
    case 'open': tone(392, 0, 0.05, { vol: 0.04, type: 'triangle' }); tone(587, 0.05, 0.08, { vol: 0.05, type: 'triangle' }); break;
    case 'error': tone(196, 0, 0.18, { vol: 0.05, slide: 0.7 }); break;
    case 'boot':
      // "ba-ding": a low note, then a bright one that rings
      tone(1047, 0, 0.09, { vol: 0.07 });
      tone(2093, 0.1, 0.9, { vol: 0.06, type: 'square' });
      tone(2093, 0.1, 1.0, { vol: 0.03, type: 'triangle' });
      break;
    case 'insert': tone(220, 0, 0.05, { vol: 0.05, type: 'triangle' }); tone(165, 0.05, 0.08, { vol: 0.05, type: 'triangle' }); break;
    default: break;
  }
}

// Mobile browsers only allow sound after a touch; call this from the first one.
export function unlockAudio() { ac(); }
