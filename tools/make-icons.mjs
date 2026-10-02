#!/usr/bin/env node
// Draws Mooncart's icon (a little pixel handheld with the moon on its screen) and writes it at
// every size Android and the web page need. No image tools needed: PNGs are encoded here.
//   node tools/make-icons.mjs

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { crc32 } from './zip.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PAL = {
  o: '#2b2445', h: '#d6d0f0', b: '#b6aedb', l: '#8b82b8', s: '#3a3553', k: '#1b1634',
  y: '#f4e6b8', w: '#ffffff', d: '#2f2a40', r: '#c23b7e', p: '#5d5677',
};
const ART = [
  '...oooooooooooooooooo...',
  '..ohhhhhhhhhhhhhhhhhlo..',
  '..ohsssssssssssssssslo..',
  '..ohskkkkkkkkkkkkkkslo..',
  '..ohskkkkyykkkwkkkkslo..',
  '..ohskkkyykkkkkkkkkslo..',
  '..ohskkkyykkkkkkwkkslo..',
  '..ohskkkyykkkkkkkkkslo..',
  '..ohskkkkyykkwkkkkkslo..',
  '..ohskkkkkkkkkkkkkkslo..',
  '..ohskkkkkkkkkkkkkkslo..',
  '..ohskkkkkkkkkkkkkkslo..',
  '..ohsssssssssssssssblo..',
  '..ohbbbbbbbbbbbbbbbblo..',
  '..ohbbbbbbbbbbbbbbbblo..',
  '..ohbbbdbbbbbbbbbrrblo..',
  '..ohbbbdbbbbbbbbbrrblo..',
  '..ohbdddddbbbbrrbbbblo..',
  '..ohbbbdbbbbbbrrbbbblo..',
  '..ohbbbdbbbbbbbbbbbblo..',
  '..ohbbbbbbbbbbbbbbbblo..',
  '..ohbbbbbppbppbbbbbblo..',
  '..olllllllllllllllllo...',
  '...ooooooooooooooooo....',
];
const NIGHT = '#231c44';

function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 255]; }

// RGBA canvas
function canvas(w, h, fill = null) {
  const px = Buffer.alloc(w * h * 4);
  if (fill) { const c = hex(fill); for (let i = 0; i < w * h; i++) px.set(c, i * 4); }
  return { w, h, px };
}
function drawArt(cv, scale, ox, oy) {
  ART.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = PAL[row[x]];
      if (!c) continue;
      const rgba = hex(c);
      for (let j = 0; j < scale; j++) for (let i = 0; i < scale; i++) {
        const X = ox + x * scale + i, Y = oy + y * scale + j;
        if (X >= 0 && Y >= 0 && X < cv.w && Y < cv.h) cv.px.set(rgba, (Y * cv.w + X) * 4);
      }
    }
  });
}
function roundCorners(cv, r) {
  for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) {
    const dx = x < r ? r - x - 0.5 : x >= cv.w - r ? x - (cv.w - r) + 0.5 : 0;
    const dy = y < r ? r - y - 0.5 : y >= cv.h - r ? y - (cv.h - r) + 0.5 : 0;
    if (dx * dx + dy * dy > r * r) cv.px[(y * cv.w + x) * 4 + 3] = 0;
  }
}
function stars(cv, n, seed = 3) {
  let s = seed;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rnd() * cv.w), y = Math.floor(rnd() * cv.h);
    cv.px.set(hex(rnd() > 0.7 ? '#fff6d6' : '#7f76b8'), (y * cv.w + x) * 4);
  }
}

function png(cv) {
  const raw = Buffer.alloc((cv.w * 4 + 1) * cv.h);
  for (let y = 0; y < cv.h; y++) { raw[y * (cv.w * 4 + 1)] = 0; cv.px.copy(raw, y * (cv.w * 4 + 1) + 1, y * cv.w * 4, (y + 1) * cv.w * 4); }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(cv.w, 0); ihdr.writeUInt32BE(cv.h, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

function write(rel, data) {
  const f = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, data);
  console.log('wrote', rel);
}

const DENS = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [name, d] of Object.entries(DENS)) {
  // older Android: the handheld on its own, 48dp
  const legacy = canvas(48 * d, 48 * d);
  drawArt(legacy, 2 * d, 0, 0);
  write(`android/res/mipmap-${name}/ic_launcher.png`, png(legacy));
  // Android 8+: drawn on a 108dp layer, kept inside the 66dp middle that every icon shape shows
  const size = 108 * d, safe = 66 * d;
  const scale = Math.floor(safe / 24);
  const fg = canvas(size, size);
  drawArt(fg, scale, Math.floor((size - 24 * scale) / 2), Math.floor((size - 24 * scale) / 2));
  write(`android/res/mipmap-${name}/ic_launcher_foreground.png`, png(fg));
}
write('android/res/mipmap-anydpi-v26/ic_launcher.xml', `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/icon_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`);

// the web page's icon, and a big one for the README
const web = canvas(192, 192);
drawArt(web, 8, 0, 0);
write('web/icon.png', png(web));
const big = canvas(512, 512, NIGHT);
stars(big, 160);
drawArt(big, 18, (512 - 24 * 18) / 2, (512 - 24 * 18) / 2);
roundCorners(big, 96);
write('docs/icon.png', png(big));
