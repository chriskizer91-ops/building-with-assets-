// Each game keeps its saves in its own corner of the phone's web storage, under an address
// made from its title (see saveKeyFor). To read or change them, the console briefly opens a
// tiny invisible page at that same address (web/__mooncart/saves.html) and talks to it.

import { native } from './native.js';

let seq = 0;

function talk(key, op, payload = {}, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;width:1px;height:1px;left:-10px;top:-10px;border:0;opacity:0;pointer-events:none';
    frame.setAttribute('aria-hidden', 'true');
    const id = ++seq;
    let timer = 0;
    const done = (fn, v) => {
      clearTimeout(timer);
      removeEventListener('message', onMsg);
      frame.remove();
      fn(v);
    };
    const onMsg = (e) => {
      if (e.source !== frame.contentWindow) return;
      const m = e.data;
      if (!m || m.mooncart !== 1) return;
      if (m.op === 'ready') frame.contentWindow.postMessage({ mooncart: 1, op, id, ...payload }, '*');
      else if (m.op === 'reply' && m.id === id) done(m.ok ? resolve : reject, m.data);
    };
    addEventListener('message', onMsg);
    timer = setTimeout(() => done(reject, new Error('The save helper did not answer')), timeout);
    frame.src = native.helperUrl(key);
    document.body.append(frame);
  });
}

export const saves = {
  dump: (key) => talk(key, 'saves:dump'),
  restore: (key, local, replace = true) => talk(key, 'saves:restore', { local, replace }),
  clear: (key) => talk(key, 'saves:clear'),
  async dumpAll(keys) {
    const out = {};
    for (const k of [...new Set(keys)]) {
      try {
        const d = await saves.dump(k);
        if (d && d.local && Object.keys(d.local).length) out[k] = d.local;
      } catch (e) { console.warn('saves', k, e); }
    }
    return out;
  },
};

export function savesSize(local) {
  let n = 0;
  for (const [k, v] of Object.entries(local || {})) n += (k.length + String(v).length) * 2;
  return n;
}
