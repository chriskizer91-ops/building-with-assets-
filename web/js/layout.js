// Where everything on the console goes, in "art pixels": the chunky pixels the shell is drawn
// in. One art pixel is P device pixels. The game screen itself is not drawn in art pixels: the
// game runs at the phone's full resolution inside the hole the layout leaves for it.
//
// Two shapes: "side" (a wide handheld: d-pad left, A/B right, for a phone held sideways) and
// "stack" (a tall handheld: screen on top, controls below, for a phone held upright).
// Both are worked out and the one with the bigger screen wins.

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export const SHAPES = {
  fill: { label: 'Fill the space', aspect: null },
  '16:9': { label: 'Wide 16:9', aspect: 16 / 9 },
  '3:2': { label: 'Handheld 3:2', aspect: 3 / 2 },
  '4:3': { label: 'Classic 4:3', aspect: 4 / 3 },
};

export function layoutConsole({ cssW, cssH, dpr, shape = 'fill', touch = true, fill = true }) {
  const DW = Math.max(1, Math.round(cssW * dpr));
  const DH = Math.max(1, Math.round(cssH * dpr));
  const P = Math.max(2, Math.round(Math.min(DW, DH) / (touch ? 170 : 240)));
  const AW = Math.ceil(DW / P), AH = Math.ceil(DH / P);
  const margin = fill ? 0 : Math.max(4, Math.round(Math.min(AW, AH) * 0.035));
  const shadow = fill ? 0 : 3;
  const body = { x: margin, y: margin, w: AW - 2 * margin - shadow, h: AH - 2 * margin - shadow };
  const aspect = (SHAPES[shape] || SHAPES.fill).aspect;

  const side = sideLayout(body, aspect, touch);
  const stack = stackLayout(body, aspect, touch);
  let L = side && stack ? (area(side.screen) >= area(stack.screen) ? side : stack) : side || stack;
  if (!L) return bare(cssW, cssH);

  if (!fill) L = hug(L, AW, AH, shadow);
  L.P = P; L.AW = AW; L.AH = AH; L.DW = DW; L.DH = DH; L.dpr = dpr; L.fill = fill; L.shadow = shadow;
  const k = P / dpr; // art px -> css px
  L.toCss = (r) => ({ x: r.x * k, y: r.y * k, w: (r.w ?? r.d ?? r.s) * k, h: (r.h ?? r.d ?? r.s) * k });
  L.screenCss = L.toCss(L.screen);
  L.cssW = cssW; L.cssH = cssH;
  return L;
}

function area(r) { return r.w * r.h; }

function bare(cssW, cssH) {
  return { mode: 'bare', screenCss: { x: 0, y: 0, w: cssW, h: cssH }, cssW, cssH };
}

// On a big window the console doesn't need to fill it: shrink the body to fit snugly round
// the bezel and controls, and centre it, so a fixed-shape screen doesn't leave empty plastic.
function hug(L, AW, AH, shadow) {
  const b = L.body;
  let dx = 0, dy = 0, cutW = 0, cutH = 0;
  if (L.mode === 'side') {
    const spareW = b.w - (L.wing * 2 + L.bezel.w);
    if (spareW > 0) cutW = spareW;
    const spareH = b.h - (L.top + L.bottom + L.bezel.h);
    if (spareH > 0) cutH = Math.min(spareH, Math.max(0, b.h - L.minH));
  } else {
    const spareW = b.w - (L.sidePad * 2 + L.bezel.w);
    if (spareW > 0) cutW = Math.min(spareW, Math.max(0, b.w - L.minW));
    const spareH = b.h - L.usedH;
    if (spareH > 0) cutH = spareH;
  }
  if (!cutW && !cutH) return L;
  const nw = b.w - cutW, nh = b.h - cutH;
  const nx = Math.floor((AW - nw - shadow) / 2), ny = Math.floor((AH - nh - shadow) / 2);
  // rebuild with the snug body so every part is placed relative to it
  const again = (L.mode === 'side' ? sideLayout : stackLayout)({ x: nx, y: ny, w: nw, h: nh }, L.aspect, L.touch);
  return again || L;
}

function sideLayout(body, aspect, touch) {
  const ctl = Math.round(clamp(body.h * (touch ? 0.36 : 0.26), 30, 70));
  const btnD = Math.round(clamp(ctl * 0.44, 11, 30));
  const pairW = btnD * 2 + Math.round(btnD * 0.3);
  const wing = Math.max(ctl, pairW) + Math.round(ctl * 0.34);
  const top = 11, bottom = 18;
  const bpx = 4, bpt = 9, bpb = 4;
  const regionW = body.w - 2 * wing, regionH = body.h - top - bottom;
  let sw = regionW - 2 * bpx, sh = regionH - bpt - bpb;
  if (sw < 48 || sh < 32) return null;
  if (aspect) {
    if (sw / sh > aspect) sw = Math.floor(sh * aspect);
    else sh = Math.floor(sw / aspect);
  }
  const L = { mode: 'side', body: { ...body, r: Math.max(6, Math.round(Math.min(body.w, body.h) * 0.07)) }, aspect, touch, wing, top, bottom };
  L.minH = top + bottom + ctl + btnD + 40;
  const bezel = { w: sw + 2 * bpx, h: sh + bpt + bpb };
  bezel.x = body.x + wing + Math.floor((regionW - bezel.w) / 2);
  bezel.y = body.y + top + Math.floor((regionH - bezel.h) / 2);
  L.bezel = bezel;
  L.screen = { x: bezel.x + bpx, y: bezel.y + bpt, w: sw, h: sh };
  L.bezelText = { x: bezel.x + 3, y: bezel.y + 2, w: bezel.w - 6 };

  const rightX = body.x + body.w - wing;
  const midY = body.y + Math.round(body.h * 0.47);
  L.dpad = { s: ctl, x: body.x + Math.floor((wing - ctl) / 2) + 1, y: midY - Math.floor(ctl / 2) };
  const pairH = btnD + Math.round(btnD * 0.62);
  const px0 = rightX + Math.floor((wing - pairW) / 2) - 1, py0 = midY - Math.floor(pairH / 2);
  L.b = { d: btnD, x: px0, y: py0 + pairH - btnD };
  L.a = { d: btnD, x: px0 + pairW - btnD, y: py0 };

  const pillW = clamp(Math.round(ctl * 0.4), 13, 22), pillH = 5;
  const pillY = Math.min(Math.max(L.dpad.y + ctl, L.b.y + btnD) + Math.round(ctl * 0.26), body.y + body.h - 15);
  L.select = { x: body.x + Math.floor((wing - pillW) / 2), y: pillY, w: pillW, h: pillH };
  L.start = { x: rightX + Math.floor((wing - pillW) / 2), y: pillY, w: pillW, h: pillH };

  const sd = clamp(Math.round(btnD * 0.62), 9, 17);
  const roundY = Math.max(body.y + top + 3, Math.min(L.dpad.y, L.a.y) - sd - Math.round(ctl * 0.3));
  L.home = { d: sd, x: body.x + Math.floor((wing - sd) / 2), y: roundY };
  L.menu = { d: sd, x: rightX + Math.floor((wing - sd) / 2), y: roundY };

  const spW = 20, spH = 10;
  if (body.y + body.h - spH - 7 > pillY + pillH + 9) {
    L.speaker = { x: body.x + body.w - spW - L.body.r - 3, y: body.y + body.h - spH - 7, w: spW, h: spH };
  }
  L.logo = { x: bezel.x, y: bezel.y + bezel.h + 5, w: bezel.w };
  L.slot = slotFor(bezel, body);
  L.led = { x: body.x + Math.max(8, L.body.r + 2), y: body.y + 4 };
  return L;
}

function stackLayout(body, aspect, touch) {
  const ctl = Math.round(clamp(body.w * (touch ? 0.34 : 0.2), 30, 70));
  const btnD = Math.round(clamp(ctl * 0.44, 11, 30));
  const sd = clamp(Math.round(btnD * 0.62), 9, 17);
  const sidePad = Math.max(6, Math.round(body.w * 0.045));
  const top = 11, logoBand = 17;
  const ctlBand = ctl + sd + 22;
  const bpx = 4, bpt = 9, bpb = 4;
  const regionW = body.w - 2 * sidePad, regionH = body.h - top - logoBand - ctlBand - 6;
  let sw = regionW - 2 * bpx, sh = regionH - bpt - bpb;
  if (sw < 48 || sh < 32) return null;
  if (aspect) {
    if (sw / sh > aspect) sw = Math.floor(sh * aspect);
    else sh = Math.floor(sw / aspect);
  }
  const L = { mode: 'stack', body: { ...body, r: Math.max(6, Math.round(Math.min(body.w, body.h) * 0.06)) }, aspect, touch, sidePad };
  const bezel = { w: sw + 2 * bpx, h: sh + bpt + bpb };
  bezel.x = body.x + sidePad + Math.floor((regionW - bezel.w) / 2);
  bezel.y = body.y + top;
  L.bezel = bezel;
  L.screen = { x: bezel.x + bpx, y: bezel.y + bpt, w: sw, h: sh };
  L.bezelText = { x: bezel.x + 3, y: bezel.y + 2, w: bezel.w - 6 };
  L.logo = { x: bezel.x, y: bezel.y + bezel.h + 5, w: bezel.w };
  L.minW = Math.max(ctl + btnD * 2 + 40, 120);
  L.usedH = top + bezel.h + logoBand + ctlBand + 6;

  // the controls sit at the bottom; on a tall phone the space above them stays plain plastic
  const cy = Math.max(L.logo.y + logoBand - 2, body.y + body.h - ctlBand - 4);
  L.dpad = { s: ctl, x: body.x + sidePad + 2, y: cy };
  const pairW = btnD * 2 + Math.round(btnD * 0.3), pairH = btnD + Math.round(btnD * 0.62);
  const px0 = body.x + body.w - sidePad - pairW - 2, py0 = cy + Math.floor((ctl - pairH) / 2);
  L.b = { d: btnD, x: px0, y: py0 + pairH - btnD };
  L.a = { d: btnD, x: px0 + pairW - btnD, y: py0 };
  // one row under them: HOME, SELECT, START, MENU
  const rowY = cy + ctl + 9;
  const pillW = clamp(Math.round(ctl * 0.4), 13, 22), pillH = 5;
  const midX = body.x + Math.floor(body.w / 2);
  const pillY = rowY + Math.floor((sd - pillH) / 2);
  L.select = { x: midX - pillW - 4, y: pillY, w: pillW, h: pillH };
  L.start = { x: midX + 4, y: pillY, w: pillW, h: pillH };
  L.home = { d: sd, x: body.x + sidePad + 4, y: rowY };
  L.menu = { d: sd, x: body.x + body.w - sidePad - 4 - sd, y: rowY };
  L.slot = slotFor(bezel, body);
  L.led = { x: body.x + Math.max(8, L.body.r + 2), y: body.y + 4 };
  return L;
}

function slotFor(bezel, body) {
  const w = Math.max(40, Math.min(120, Math.floor(bezel.w * 0.42)));
  return { x: bezel.x + Math.floor((bezel.w - w) / 2), y: body.y + 1, w, h: 8 };
}
