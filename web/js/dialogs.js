// Pop-up windows: questions, confirmations, pick-a-folder, and the bigger forms (Properties,
// Settings, Help) built on top of them.

import { el } from './util.js';
import { closeMenus } from './menu.js';

const stack = [];

export function dialogOpen() { return stack.length > 0; }

// buttons: [{ label, value, primary, danger }]; resolves with the chosen value (null when dismissed)
export function modal({ title, body, buttons = [{ label: 'OK', value: true, primary: true }], className = '', onOpen, dismissValue = null, focusInput = false }) {
  closeMenus();
  return new Promise((resolve) => {
    const prevFocus = document.activeElement;
    const back = el('div', { class: 'modal-back' });
    const box = el('div', { class: 'modal ' + className, role: 'dialog', 'aria-modal': 'true', 'aria-label': title });
    const x = el('button', { class: 'modal-x', type: 'button', 'aria-label': 'Close', text: '✕' });
    const foot = el('div', { class: 'modal-buttons' });
    const content = typeof body === 'function' ? body() : body;
    box.append(el('div', { class: 'modal-title' }, el('span', { text: title }), x), el('div', { class: 'modal-body' }, content), foot);
    back.append(box);
    const api = {
      close(v) {
        const i = stack.indexOf(api);
        if (i >= 0) stack.splice(i, 1);
        back.remove();
        removeEventListener('keydown', onKey, true);
        if (prevFocus && prevFocus.focus) try { prevFocus.focus({ preventScroll: true }); } catch { /* gone */ }
        resolve(v);
      },
      box,
    };
    const valueOf = (b) => (typeof b.value === 'function' ? b.value() : b.value);
    for (const b of buttons) {
      const btn = el('button', { class: 'btn' + (b.primary ? ' primary' : '') + (b.danger ? ' danger' : ''), type: 'button', text: b.label });
      btn.addEventListener('click', () => {
        const v = valueOf(b);
        if (b.validate && !b.validate()) return;
        api.close(v);
      });
      foot.append(btn);
    }
    x.addEventListener('click', () => api.close(dismissValue));
    back.addEventListener('pointerdown', (e) => { if (e.target === back) back.dataset.down = '1'; });
    back.addEventListener('click', (e) => { if (e.target === back && back.dataset.down) api.close(dismissValue); delete back.dataset.down; });
    const onKey = (e) => {
      if (stack[stack.length - 1] !== api) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); api.close(dismissValue); }
      else if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SELECT') {
        const p = buttons.find((b) => b.primary);
        if (p) { e.preventDefault(); e.stopPropagation(); if (!p.validate || p.validate()) api.close(valueOf(p)); }
      }
      e.stopPropagation();
    };
    addEventListener('keydown', onKey, true);
    stack.push(api);
    document.getElementById('modal-root').append(back);
    const touch = matchMedia('(pointer: coarse)').matches;
    const first = (focusInput || !touch ? box.querySelector('input[type=text], textarea') : null) || foot.querySelector('.primary') || foot.querySelector('button');
    if (first) setTimeout(() => { first.focus({ preventScroll: true }); if (first.select && first.type === 'text') first.select(); }, 30);
    if (onOpen) onOpen(api);
  });
}

// closes the top dialog (Android back button)
export function closeTopDialog() {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top.close(null);
  return true;
}

export async function prompt(title, { label = '', value = '', ok = 'OK', note = '', selectBase = false } = {}) {
  const input = el('input', { type: 'text', value, class: 'field', spellcheck: 'false', autocomplete: 'off' });
  const body = el('div', { class: 'form' }, label ? el('label', { class: 'lbl', text: label }) : null, input, note ? el('p', { class: 'note', text: note }) : null);
  const v = await modal({
    title, body, focusInput: true,
    buttons: [{ label: 'Cancel', value: null }, { label: ok, primary: true, value: () => input.value.trim(), validate: () => !!input.value.trim() }],
    onOpen: () => {
      if (selectBase) setTimeout(() => { const dot = input.value.lastIndexOf('.'); input.setSelectionRange(0, dot > 0 ? dot : input.value.length); }, 40);
    },
  });
  return v;
}

export async function confirm(title, message, { ok = 'OK', cancel = 'Cancel', danger = false, checkbox = null } = {}) {
  let box = null;
  const body = el('div', { class: 'form' },
    ...String(message).split('\n\n').map((p) => el('p', { text: p })),
    checkbox ? el('label', { class: 'check' }, (box = el('input', { type: 'checkbox', checked: checkbox.checked ? true : null })), el('span', { text: checkbox.label })) : null);
  const v = await modal({ title, body, buttons: [{ label: cancel, value: false }, { label: ok, value: true, primary: !danger, danger }], dismissValue: false });
  return checkbox ? { ok: !!v, checked: !!(box && box.checked) } : !!v;
}

export function alertBox(title, message) {
  const body = el('div', { class: 'form' }, ...String(message).split('\n\n').map((p) => el('p', { text: p })));
  return modal({ title, body, buttons: [{ label: 'OK', value: true, primary: true }] });
}

// choices: [{ label, value, primary, danger }]
export function choose(title, message, choices) {
  const body = el('div', { class: 'form' }, ...String(message).split('\n\n').map((p) => el('p', { text: p })));
  return modal({ title, body, buttons: choices });
}

// Pick a destination folder from the library tree.
export function pickFolder(lib, { title = 'Move to', exclude = [], current = null } = {}) {
  let chosen = current || lib.root;
  const tree = el('div', { class: 'tree pick' });
  const draw = () => {
    tree.replaceChildren();
    const walk = (id, depth) => {
      const f = lib.get(id);
      const blocked = exclude.some((x) => lib.isInside(id, x));
      const row = el('button', { type: 'button', class: 'tree-row' + (id === chosen ? ' on' : '') + (blocked ? ' off' : ''), style: { paddingLeft: 8 + depth * 16 + 'px' } },
        el('i', { class: 'ico ico-' + (id === lib.root ? 'home' : 'folder') }), el('span', { text: id === lib.root ? 'Library' : f.name }));
      if (!blocked) row.addEventListener('click', () => { chosen = id; draw(); });
      tree.append(row);
      for (const c of lib.children(id)) if (c.type === 'folder') walk(c.id, depth + 1);
    };
    walk(lib.root, 0);
  };
  draw();
  return modal({ title, body: tree, buttons: [{ label: 'Cancel', value: null }, { label: 'Move here', primary: true, value: () => chosen }] });
}

// A labelled row for forms.
export function row(label, control, note) {
  return el('div', { class: 'frow' }, el('label', { class: 'lbl', text: label }), el('div', { class: 'fctl' }, control, note ? el('div', { class: 'note', text: note }) : null));
}

export function select(options, value) {
  const s = el('select', { class: 'field' });
  for (const [v, label] of options) s.append(el('option', { value: v, text: label, selected: v === value ? true : null }));
  return s;
}

export function checkbox(label, checked) {
  const input = el('input', { type: 'checkbox', checked: checked ? true : null });
  return { el: el('label', { class: 'check' }, input, el('span', { text: label })), input };
}
