(function () {
  const P = window.PLAN;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DAYMS = 86400000;
  const toD = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const toS = (d) => d.toISOString().slice(0, 10);
  const addDays = (s, n) => toS(new Date(toD(s).getTime() + n * DAYMS));
  const diffDays = (a, b) => Math.round((toD(b) - toD(a)) / DAYMS);
  const fmt = (s, o) => toD(s).toLocaleDateString('en-GB', Object.assign({ timeZone: 'UTC' }, o || { weekday: 'short', day: 'numeric', month: 'short' }));
  const todayCairo = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const END = addDays(P.START, P.WEEKS * 7 - 1);
  const weekOf = (s) => { const d = diffDays(P.START, s); return d < 0 || d >= P.WEEKS * 7 ? null : Math.floor(d / 7) + 1; };
  const weekStart = (w) => addDays(P.START, (w - 1) * 7);
  const baseBlock = (w) => (w === 4 || w === 8 || w === 12 ? 'dl' : w <= 3 ? 'b1' : w <= 7 ? 'b2' : 'b3');
  const BLOCKS = {
    b1: { name: 'Foundation', weeks: 'Weeks 1–3', desc: 'Learn the movements, moderate loads, build work capacity.' },
    b2: { name: 'Strength', weeks: 'Weeks 5–7', desc: 'Heavier loads, fewer reps, longer circuit intervals.' },
    b3: { name: 'Power', weeks: 'Weeks 9–11', desc: 'Heaviest lifts, more plyo volume, contrast work.' },
    dl: { name: 'Deload', weeks: 'Weeks 4, 8, 12', desc: '~60% volume, same technique. Week 12 doubles as the re-test week.' }
  };
  const phaseOf = (w) => (w && w >= 7 ? 'late' : 'early');
  const dow = (s) => toD(s).getUTCDay();
  const R = P.RAMADAN;
  const PEOPLE = { a: { start: 96, target: 89.9, tLabel: '< 90 kg', min: 0.3, max: 0.8 }, b: { start: 71, target: 67, tLabel: '67 kg', min: 0.2, max: 0.6 } };
  const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
  const num = (v) => { const x = parseFloat(v); return isNaN(x) ? null : x; };
  const parseTime = (t) => { if (t == null || t === '') return null; if (typeof t === 'number') return t; const p = String(t).trim().split(':'); if (p.length === 1) return num(p[0]); const s = (+p[0]) * 60 + parseFloat(p[1]); return isNaN(s) ? null : s; };
  const fmtTime = (s) => { if (s == null) return '–'; const m = Math.floor(s / 60), r = s - m * 60; return m + ':' + (r < 10 ? '0' : '') + (Math.round(r * 10) / 10).toFixed(r % 1 ? 1 : 0); };
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };

  /* ================= Store ================= */
  const COLS = ['log', 'sessions', 'swims', 'daily', 'bench', 'inbody', 'health', 'reviews'];
  const store = { log: [], sessions: [], swims: [], daily: [], bench: [], inbody: [], health: [], reviews: [] };
  const cfg = { names: { a: 'Ahmed', b: 'Yousr' }, supps: { a: P.SUPPS.a, b: P.SUPPS.b }, settings: { ramadan: false } };
  let db = null, mode = 'loading', statusMsg = 'Connecting to the shared log…', statusCls = '';
  const LOCALKEY = 'swimplan-store-v2';
  const names = () => cfg.names;
  const chains = {};
  const findDoc = (col, id) => store[col].find((d) => d._id === id);

  function persistLocal() { lsSet(LOCALKEY, { store, cfg }); }
  async function put(col, id, data) {
    const rec = Object.assign({}, data);
    if (!db) {
      store[col] = store[col].filter((d) => d._id !== id).concat([Object.assign({ _id: id }, rec)]);
      persistLocal(); setStatus('Saved on this device.', 'good'); rerender(); return true;
    }
    const key = col + '/' + id;
    const run = async () => { try { await db.collection(col).doc(id).set(rec); setStatus('Saved.', 'good'); return true; } catch (e) { handleDbErr(e, 'save'); return false; } };
    chains[key] = (chains[key] || Promise.resolve()).then(run);
    return chains[key];
  }
  async function del(col, id) {
    if (!db) { store[col] = store[col].filter((d) => d._id !== id); persistLocal(); rerender(); return; }
    try { await db.collection(col).doc(id).delete(); } catch (e) { handleDbErr(e, 'delete'); }
  }
  async function putCfg(name, data) {
    if (!db) { cfg[name] = data; persistLocal(); renderAll(); return; }
    try { await db.doc('config/' + name).set(data); setStatus('Saved.', 'good'); } catch (e) { handleDbErr(e, 'save'); }
  }
  function setStatus(msg, cls) { statusMsg = msg; statusCls = cls || ''; $$('.status[data-status]').forEach((s) => { s.textContent = msg; s.className = 'status ' + statusCls; }); }
  function handleDbErr(e, what) {
    const c = e && e.code;
    if (c === 'invalid_argument') { mode = 'readonly'; setStatus('You can view this log but not change it. Ask Ahmed to share the page with you as a Contributor.', 'warn'); }
    else if (c === 'quota_exceeded') setStatus('Storage is full. Delete some old entries to save new ones.', 'warn');
    else setStatus('Couldn\'t ' + what + ' just now. Check your connection and try again.', 'warn');
  }
  function localMode() {
    mode = 'local';
    const saved = lsGet(LOCALKEY, null);
    if (saved) { COLS.forEach((c) => (store[c] = saved.store[c] || [])); Object.assign(cfg, saved.cfg || {}); }
    setStatus('Saving on this device only. Open the page on claude.ai to share the log between you.', 'warn');
    renderAll();
  }
  async function initDb() {
    if (!window.claude || typeof window.claude.use !== 'function') return localMode();
    const timer = setTimeout(() => setStatus('Can\'t reach the shared log yet. Entries will appear once it connects.', 'warn'), 10000);
    let d = null;
    try { d = await window.claude.use('db'); } catch (e) { d = null; }
    if (!d) { clearTimeout(timer); return localMode(); }
    db = d; mode = 'shared';
    let pending = null;
    const soon = () => { if (pending) return; pending = setTimeout(() => { pending = null; rerender(); }, 120); };
    COLS.forEach((c) => db.collection(c).onSnapshot((snap) => {
      store[c] = snap.docs.map((x) => Object.assign({ _id: x.id }, x.data()));
      if (!snap.metadata.fromCache) { clearTimeout(timer); if (statusCls === 'warn' && mode === 'shared') setStatus('Shared log: entries sync between you.', ''); else if (statusMsg.startsWith('Connecting')) setStatus('Shared log: entries sync between you.', ''); }
      soon();
    }, (e) => { clearTimeout(timer); setStatus(e && e.code === 'revoked' ? 'The shared log isn\'t available in this view.' : 'The shared log stopped updating. Reopen the page to reconnect.', 'warn'); }));
    ['names', 'supps', 'settings'].forEach((n) => db.doc('config/' + n).onSnapshot((s) => {
      if (s.exists) { const v = s.data(); if (n === 'names') cfg.names = { a: v.a || 'Ahmed', b: v.b || 'Yousr' }; else cfg[n] = Object.assign({}, cfg[n], v); renderAll(); }
    }, () => {}));
  }

  /* ================= Figures ================= */
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const visible = new Set();
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)))) : null;
  const el = (tag, attrs, parent) => { const x = document.createElementNS(NS, tag); for (const k in attrs) x.setAttribute(k, attrs[k]); if (parent) parent.appendChild(x); return x; };
  const FALL = { e2: 'e', w2: 'w', k2: 'k', f2: 'f' };
  const pt = (pose, k) => pose[k] || pose[FALL[k]];
  function buildFig(div) {
    const t = P.T[div.dataset.tpl];
    if (!t) return;
    const svg = el('svg', { viewBox: '0 -16 200 176', role: 'img', 'aria-label': div.dataset.label || 'exercise diagram' });
    el('line', { x1: 0, y1: 150.5, x2: 200, y2: 150.5, stroke: 'currentColor', 'stroke-opacity': .25, 'stroke-width': 2 }, svg);
    (t.scene || []).forEach((s) => {
      const st = { fill: 'currentColor', 'fill-opacity': .12, stroke: 'currentColor', 'stroke-opacity': .35, 'stroke-width': 1.5 };
      if (s.type === 'bench' || s.type === 'box') el('rect', Object.assign({ x: s.x, y: s.y, width: s.w, height: s.h, rx: 3 }, st), svg);
      if (s.type === 'pullbar') el('line', { x1: 64, y1: s.y, x2: 136, y2: s.y, stroke: 'currentColor', 'stroke-opacity': .5, 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);
      if (s.type === 'rail') el('line', { x1: 40, y1: s.y, x2: 170, y2: s.y, stroke: 'currentColor', 'stroke-opacity': .4, 'stroke-width': 4 }, svg);
      if (s.type === 'wall') el('line', { x1: s.x, y1: -16, x2: s.x, y2: 150, stroke: 'currentColor', 'stroke-opacity': .25, 'stroke-width': 3 }, svg);
      if (s.type === 'bike') {
        const g = { stroke: 'currentColor', 'stroke-opacity': .35, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' };
        el('circle', Object.assign({ cx: 58, cy: 134, r: 15 }, g), svg); el('circle', Object.assign({ cx: 150, cy: 134, r: 15 }, g), svg);
        el('polyline', Object.assign({ points: '58,134 90,100 104,132 150,134 140,80 132,80' }, g), svg);
      }
    });
    const ref = { t, svg, L: {} };
    const hl = (div.dataset.hl || '').split(',');
    const limb = (k, back) => { const on = hl.includes(k.replace('2', '')); return (ref.L[k] = el('line', { stroke: on ? 'var(--hl)' : 'currentColor', 'stroke-width': k === 'torso' ? 12 : back ? 7 : 9, 'stroke-linecap': 'round', 'stroke-opacity': back ? (on ? .55 : .35) : 1 }, svg)); };
    ['ua2', 'fa2', 'th2', 'sh2'].forEach((k) => limb(k, true));
    ['torso', 'th', 'sh', 'ua', 'fa'].forEach((k) => limb(k, false));
    ref.J = ['e', 'k', 'p', 'n'].map(() => el('circle', { r: 3.2, fill: 'var(--surface)' }, svg));
    ref.head = el('circle', { r: 10, fill: 'currentColor' }, svg);
    const pr = t.prop;
    if (pr) {
      if (pr.type === 'band' || pr.type === 'landmine' || pr.type === 'kneeband') ref.prop = el('line', { stroke: 'var(--her)', 'stroke-width': pr.type === 'landmine' ? 4 : 2.5, 'stroke-dasharray': pr.type === 'landmine' ? '' : '5 4', 'stroke-linecap': 'round' }, svg);
      else if (pr.type === 'db') ref.prop = el('rect', { width: 18, height: 8, rx: 2, fill: 'var(--her)' }, svg);
      else if (pr.type === 'kb') ref.prop = el('circle', { r: 7, fill: 'var(--her)' }, svg);
      else ref.prop = el('circle', { r: pr.type === 'ball' || pr.type === 'wheel' ? 9 : 12, fill: pr.type === 'ball' ? 'var(--her)' : 'none', stroke: 'var(--her)', 'stroke-width': pr.type === 'ball' ? 0 : 4 }, svg);
    }
    div.innerHTML = ''; div.style.color = 'var(--fig)'; div.appendChild(svg); div._fig = ref;
    const sv = div.dataset.v;
    draw(ref, sv != null ? +sv : reduce ? 1 : 0);
    if (io && !reduce && sv == null) io.observe(div);
  }
  function draw(ref, v) {
    const { A, B } = ref.t;
    const g = (k) => { const a = pt(A, k), b = pt(B, k); return [a[0] + (b[0] - a[0]) * v, a[1] + (b[1] - a[1]) * v]; };
    const set = (ln, a, b) => { ln.setAttribute('x1', a[0]); ln.setAttribute('y1', a[1]); ln.setAttribute('x2', b[0]); ln.setAttribute('y2', b[1]); };
    const n = g('n'), p = g('p'), L = ref.L;
    set(L.torso, n, p); set(L.ua, n, g('e')); set(L.fa, g('e'), g('w')); set(L.th, p, g('k')); set(L.sh, g('k'), g('f'));
    set(L.ua2, n, g('e2')); set(L.fa2, g('e2'), g('w2')); set(L.th2, p, g('k2')); set(L.sh2, g('k2'), g('f2'));
    const h = g('h'); ref.head.setAttribute('cx', h[0]); ref.head.setAttribute('cy', h[1]);
    if (ref.J) ['e', 'k', 'p', 'n'].forEach((k, i) => { const q = g(k); ref.J[i].setAttribute('cx', q[0]); ref.J[i].setAttribute('cy', q[1]); });
    const pr = ref.t.prop;
    if (pr && ref.prop) {
      if (pr.type === 'kneeband') set(ref.prop, g('k'), g('k2'));
      else {
        const at = g(pr.at);
        if (pr.type === 'band' || pr.type === 'landmine') set(ref.prop, at, pr.anchor);
        else if (pr.type === 'db') { ref.prop.setAttribute('x', at[0] - 9); ref.prop.setAttribute('y', at[1] - 4); }
        else if (pr.type === 'kb') { ref.prop.setAttribute('cx', at[0]); ref.prop.setAttribute('cy', at[1] + 7); }
        else { ref.prop.setAttribute('cx', at[0]); ref.prop.setAttribute('cy', at[1]); }
      }
    }
  }
  let slow = false;
  const SEGS = { th: ['glutes', 'gluteMed', 'quads', 'hams', 'adductors', 'hipflex'], sh: ['calves', 'shins', 'quads', 'hams'], ua: ['chest', 'frontdelt', 'sidedelt', 'reardelt', 'rotcuff', 'triceps', 'biceps', 'lats', 'upperback'], fa: ['forearms', 'biceps', 'triceps'], torso: ['abs', 'obliques', 'lowerback', 'lats'] };
  const hlFor = (ex) => Object.keys(SEGS).filter((k) => (ex.pri || []).some((m) => SEGS[k].includes(m))).join(',');
  function loop(ts) {
    const per = slow ? 5600 : 2800, ph = (ts % per) / per;
    const v = ph < .4 ? 0.5 - 0.5 * Math.cos((ph / .4) * Math.PI) : ph < .5 ? 1 : ph < .9 ? 0.5 + 0.5 * Math.cos(((ph - .5) / .4) * Math.PI) : 0;
    visible.forEach((d) => { if (d.isConnected && d._fig) draw(d._fig, v); else visible.delete(d); });
    requestAnimationFrame(loop);
  }
  if (!reduce) requestAnimationFrame(loop);
  const fig = (exId, cls, v) => { const ex = P.EX[exId]; return `<div class="fig ${cls || ''}" data-tpl="${ex.t}" data-hl="${hlFor(ex)}" ${v != null ? `data-v="${v}"` : ''} data-label="${esc(ex.n)} diagram"></div>`; };
  /* Muscle map: front + back */
  function muscleMap(pri, sec) {
    const c = (m) => (pri.includes(m) ? 'var(--hl)' : sec.includes(m) ? 'color-mix(in srgb, var(--hl) 38%, transparent)' : 'none');
    const E = (m, x, y, rx, ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c(m)}"/>`;
    const base = (ox) => `<g transform="translate(${ox},0)" fill="var(--surface-2)" stroke="var(--line)" stroke-width="1.5"><circle cx="60" cy="20" r="13"/><rect x="54" y="31" width="12" height="9"/><rect x="36" y="40" width="48" height="80" rx="16"/><rect x="21" y="44" width="15" height="50" rx="7"/><rect x="84" y="44" width="15" height="50" rx="7"/><rect x="17" y="92" width="13" height="46" rx="6"/><rect x="90" y="92" width="13" height="46" rx="6"/><rect x="39" y="112" width="42" height="26" rx="10"/><rect x="39" y="132" width="20" height="64" rx="9"/><rect x="61" y="132" width="20" height="64" rx="9"/><rect x="41" y="194" width="16" height="52" rx="7"/><rect x="63" y="194" width="16" height="52" rx="7"/></g>`;
    const front = [E('frontdelt', 34, 49, 8, 8), E('frontdelt', 86, 49, 8, 8), E('sidedelt', 29, 52, 4, 7), E('sidedelt', 91, 52, 4, 7), E('chest', 50, 59, 11, 9), E('chest', 70, 59, 11, 9), E('biceps', 28, 70, 6, 15), E('biceps', 92, 70, 6, 15), E('forearms', 23, 112, 5, 17), E('forearms', 97, 112, 5, 17), `<rect x="52" y="73" width="16" height="40" rx="5" fill="${c('abs')}"/>`, E('obliques', 43, 92, 5, 15), E('obliques', 77, 92, 5, 15), E('hipflex', 50, 124, 7, 7), E('hipflex', 70, 124, 7, 7), E('quads', 49, 162, 8, 25), E('quads', 71, 162, 8, 25), E('adductors', 56.5, 150, 3, 15), E('adductors', 63.5, 150, 3, 15), E('shins', 49, 218, 5, 21), E('shins', 71, 218, 5, 21)].join('');
    const back = [E('upperback', 60, 54, 18, 11), E('reardelt', 34, 49, 8, 8), E('reardelt', 86, 49, 8, 8), E('rotcuff', 47, 64, 7, 6), E('rotcuff', 73, 64, 7, 6), E('lats', 46, 84, 8, 18), E('lats', 74, 84, 8, 18), E('triceps', 28, 70, 6, 15), E('triceps', 92, 70, 6, 15), E('forearms', 23, 112, 5, 17), E('forearms', 97, 112, 5, 17), `<rect x="52" y="96" width="16" height="18" rx="5" fill="${c('lowerback')}"/>`, E('gluteMed', 45, 117, 7, 5), E('gluteMed', 75, 117, 7, 5), E('glutes', 50, 128, 10, 10), E('glutes', 70, 128, 10, 10), E('hams', 49, 164, 8, 25), E('hams', 71, 164, 8, 25), E('calves', 49, 214, 6, 18), E('calves', 71, 214, 6, 18)].join('');
    return `<svg class="mmap" viewBox="0 0 270 262" role="img" aria-label="Muscles worked">${base(0)}<g transform="translate(0,0)">${front}</g>${base(140)}<g transform="translate(140,0)">${back}</g><text x="60" y="260" text-anchor="middle" font-size="11" fill="var(--muted)">Front</text><text x="200" y="260" text-anchor="middle" font-size="11" fill="var(--muted)">Back</text></svg>`;
  }
  const altList = (ex, max) => (ex.alts || ex.alt.map((a) => [a, ''])).slice(0, max || 4).map(([a, t]) => `<span class="altpill">${t ? `<em class="${altTagCls(t)}">${esc(t)}</em>` : ''}${esc(a)}</span>`).join('');
  const altTagCls = (t) => ({ Easier: 'good', Harder: 'dl', 'No equipment': 'swim', Machine: 'gym', 'Joint-friendly': 'good' }[t] || '');
  const hydrate = (root) => $$('.fig[data-tpl]', root).forEach((d) => { if (!d._fig) buildFig(d); });

  /* ================= Exercise modal ================= */
  const sessionsFor = (id) => Object.values(P.SESSIONS).filter((s) => s.parts.some((x) => x.items.some((it) => (Array.isArray(it) ? it[0] : it) === id)));
  const yt = (q) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q + ' exercise form');
  function openEx(id) {
    const ex = P.EX[id]; if (!ex) return;
    const pri = ex.pri || [], sec = ex.sec || [];
    $('#exdlg-body').innerHTML = `
      <div class="row between"><h2 id="exdlg-title">${esc(ex.n)}</h2><button class="btn sm" id="exclose">Close</button></div>
      <div class="row">${sessionsFor(id).map((s) => `<span class="chip gym">${esc(s.short)}</span>`).join('')}${ex.aim ? `<span class="chip">${esc(ex.aim)}</span>` : ''}</div>
      <div class="exviz">${fig(id, 'bigfig')}<div class="frames"><div><span class="small muted">Start</span>${fig(id, 'still', 0)}</div><div><span class="small muted">Finish</span>${fig(id, 'still', 1)}</div></div></div>
      <div class="row"><button class="btn sm" id="exslow" aria-pressed="${slow}">${slow ? 'Normal speed' : 'Slow motion'}</button><span class="small muted">Highlighted limbs and the shaded areas below are the muscles doing the work. The coloured object is the equipment.</span></div>
      <div class="targets">${muscleMap(pri, sec)}<div><h4>What it trains</h4>
        <p><strong>Main muscles:</strong> ${esc(pri.map((m) => P.MUSCLES[m]).join(', ') || '–')}</p>
        ${sec.length ? `<p><strong>Also works:</strong> ${esc(sec.map((m) => P.MUSCLES[m]).join(', '))}</p>` : ''}
        ${ex.aim ? `<p><strong>Aim:</strong> ${esc(ex.aim)}</p>` : ''}
        ${ex.why ? `<p><strong>For swimming:</strong> ${esc(ex.why)}</p>` : ''}</div></div>
      <div><h4>How to do it</h4><ol>${ex.cues.map((c) => `<li>${esc(c)}</li>`).join('')}</ol></div>
      <div><h4>Alternatives</h4><div class="alts">${(ex.alts || ex.alt.map((a) => [a, ''])).map(([a, t]) => `<div class="altrow">${t ? `<span class="chip ${altTagCls(t)}">${esc(t)}</span>` : ''}<span>${esc(a)}</span><a class="small" href="${yt(a)}" target="_blank" rel="noopener">demo</a></div>`).join('')}</div></div>
      <div class="row"><a class="btn primary" href="${ex.demo}" target="_blank" rel="noopener">Watch demo videos</a><span class="muted small">Opens a YouTube search in a new tab</span></div>`;
    hydrate($('#exdlg-body'));
    const d = $('#exdlg'); $('#exclose').onclick = () => d.close();
    $('#exslow').onclick = (e) => { slow = !slow; e.target.textContent = slow ? 'Normal speed' : 'Slow motion'; };
    if (!d.open) d.showModal();
  }
  $('#exdlg').addEventListener('click', (e) => { if (e.target.id === 'exdlg') e.target.close(); });
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-ex]'); if (b && !e.target.closest('input,select,textarea,label')) { e.preventDefault(); openEx(b.dataset.ex); } });

  document.addEventListener('click', (e) => { const b = e.target.closest('[data-recipe]'); if (b) { e.preventDefault(); state.recipe = b.dataset.recipe; if (location.hash === '#recipes') renderRecipes(); else location.hash = '#recipes'; } });
  /* ================= Plan helpers ================= */
  const ramadanOn = () => !!cfg.settings.ramadan;
  const inRamadan = (s) => s >= R.start;
  const dayPlan = (s) => (ramadanOn() && inRamadan(s) ? P.RDAYS : P.DAYS)[dow(s)];
  const blockFor = (s) => { const w = weekOf(s); if (!w) return 'b1'; if (ramadanOn() && inRamadan(s)) return 'dl'; return baseBlock(w); };
  const blockChip = (b, s) => `<span class="chip ${b === 'dl' ? 'dl' : 'gym'}">${s && ramadanOn() && inRamadan(s) ? 'Ramadan · deload volume' : BLOCKS[b].name}</span>`;
  const gymDateFor = (w, sid) => { const off = { D: 0, A: 2, B: 3, C: 5 }[sid]; return addDays(weekStart(w), off); };
  const BENCHWEEKS = { 1: 'w1', 6: 'w6', 12: 'w12' };

  /* Units */
  let unitMode = lsGet('swimplan-units', 'both');
  const fmtItem = (it) => {
    const [food, amt, u, hh] = it;
    const g = `${amt} ${u}`;
    if (unitMode === 'g') return `${g} ${food}`;
    if (unitMode === 'hh') return `${hh} ${food}`;
    return `${g} ${food} <span class="muted">(${esc(hh)})</span>`;
  };
  const fmtItems = (arr) => arr.map((it) => (unitMode === 'both' ? fmtItem([esc(it[0]), it[1], it[2], it[3]]) : esc(fmtItem(it)))).join(' · ');
  const unitToggle = () => `<div class="blockpick" role="group" aria-label="Portion units">${[['both', 'Grams + household'], ['g', 'Grams / ml'], ['hh', 'Cups + pieces']].map(([k, l]) => `<button data-units="${k}" aria-pressed="${unitMode === k}">${l}</button>`).join('')}</div>`;
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-units]'); if (b) { unitMode = b.dataset.units; lsSet('swimplan-units', unitMode); renderAll(); const ms = document.getElementById('mealsheet'); if (ms && ms.open) drawMealSheet(); } });

  /* Load suggestions */
  function lastLift(person, liftId, before) {
    const rows = store.sessions.filter((s) => s.person === person && s.date < before && s.lifts && s.lifts[liftId] && s.lifts[liftId].kg != null).sort((x, y) => (x.date < y.date ? 1 : -1));
    return rows[0] ? Object.assign({ date: rows[0].date, block: rows[0].block }, rows[0].lifts[liftId]) : null;
  }
  function suggest(person, liftId, inc, date) {
    const last = lastLift(person, liftId, date);
    if (!last) return { text: 'First time: pick a weight where the last 1–2 reps are hard but clean.', kg: null };
    const b = blockFor(date);
    const r = (x) => Math.round(x / inc) * inc;
    let kg, why;
    if (b === 'dl') { kg = r(last.kg * 0.6); why = 'deload ~60%'; }
    else if (last.block === 'dl') { kg = last.kg / 0.6 > 0 ? null : null; const prev = store.sessions.filter((s) => s.person === person && s.date < last.date && s.block !== 'dl' && s.lifts && s.lifts[liftId]).sort((x, y) => (x.date < y.date ? 1 : -1))[0]; kg = prev ? prev.lifts[liftId].kg : last.kg; why = 'back to your pre-deload load'; }
    else if (last.block && last.block !== b && ['b1', 'b2', 'b3'].indexOf(b) > ['b1', 'b2', 'b3'].indexOf(last.block)) { kg = r(last.kg * 1.05); why = 'new block, fewer reps: +5%'; }
    else if (last.hit) { kg = last.kg + inc; why = 'hit all reps last time'; }
    else { kg = last.kg; why = 'repeat until you hit all reps'; }
    return { text: `Last ${fmt(last.date, { day: 'numeric', month: 'short' })}: ${last.kg} kg ${last.hit ? '✓' : '✗'} → try <strong>${kg} kg</strong> (${why})`, kg };
  }

  /* ================= Shared renderers ================= */
  function exRows(items, b) {
    return items.map((it) => {
      const id = Array.isArray(it) ? it[0] : it; const rx = Array.isArray(it) ? it[1][b] : ''; const ex = P.EX[id];
      return `<button class="exrow" data-ex="${id}">${fig(id)}<span><span class="nm">${esc(ex.n)}</span><br><span class="alt">${esc((ex.pri || []).map((m) => P.MUSCLES[m]).join(', '))}</span><span class="altrow-in">${altList(ex, 3)}</span></span><span class="rx">${esc(rx)}</span></button>`;
    }).join('');
  }
  function sessionCard(s, b, opts) {
    opts = opts || {};
    const w = P.WARMUPS[s.warm];
    return `<div class="card">
      <div class="row between"><div><h4>${s.day} · ${esc(opts.time || s.time)}</h4><h3>${esc(s.short)}</h3><span class="small muted">${esc(s.name)}</span></div>${blockChip(b, opts.date)}</div>
      <div class="row">${s.focus.map((f) => `<span class="chip">${esc(f)}</span>`).join('')}<button class="btn sm" data-sess="${s.id}" ${opts.date ? `data-sdate="${opts.date}"` : ''}>Purpose + targets</button>${s.id === 'A' ? '<a class="btn sm" href="#timer">Open interval timer</a>' : ''}</div>
      <p class="note"><strong>Warm-up:</strong> ${esc(w.name)}. <a href="#fuel">See drills</a></p>
      ${s.parts.map((x) => `<div class="part"><div class="part-h"><h3>${esc(x.title)}</h3>${x.rx ? `<span class="small num"><strong>${esc(x.rx[b])}</strong></span>` : ''}</div>${x.note ? `<p class="note">${esc(x.note)}</p>` : ''}${exRows(x.items, b)}</div>`).join('')}
      <p class="note"><strong>Training together:</strong> ${esc(s.partner)}</p>
      ${opts.compact ? '' : `<p class="note"><strong>Cool-down:</strong> ${esc(P.COOLDOWN.join(' · '))}</p>`}
    </div>`;
  }
  function pickMeal(cat, seed, slotKey, forced) {
    const list = Object.keys(P.MEALS).filter((k) => P.MEALS[k].cat === cat), rot = list.filter((k) => !P.MEALS[k].altOnly);
    let idx = forced ? rot.indexOf(forced) : seed % rot.length; if (idx < 0) idx = 0;
    if (state.swaps[slotKey] != null) idx = (idx + state.swaps[slotKey]) % rot.length;
    return { id: rot[idx], list };
  }
  function mealBlock(mId, list, slotKey) {
    const m = P.MEALS[mId], n = names();
    const others = list.filter((x) => x !== mId).map((x) => P.MEALS[x].n);
    return `<div><span class="label">${esc(m.n)}</span> <span class="ar" lang="ar" dir="rtl">${esc(m.ar)}</span></div>
      <div class="portion"><span class="who a">${esc(n.a)}</span><span>${fmtItems(m.a)}</span><span class="k num">~${m.ak[0]} kcal · ${m.ak[1]} g P</span>
      <span class="who b">${esc(n.b)}</span><span>${fmtItems(m.b)}</span><span class="k num">~${m.bk[0]} kcal · ${m.bk[1]} g P</span></div>
      ${(P.MEAL_RECIPES[mId] || []).length ? `<div class="swapline">Recipe: ${P.MEAL_RECIPES[mId].map((r) => `<button data-recipe="${r}">${esc(P.RECIPES.find((x) => x.id === r).n)}</button>`).join(' · ')}</div>` : ''}
      ${others.length && slotKey ? `<div class="swapline"><button data-swap="${slotKey}">Swap meal</button> · or: ${esc(others.join(', '))}</div>` : ''}`;
  }
  const statusEl = () => `<span class="status ${statusCls}" data-status>${esc(statusMsg)}</span>`;
  const ro = () => (mode === 'readonly' ? 'disabled' : '');

  /* ================= Day view ================= */
  const state = { date: null, swaps: {}, block: null, exFilter: 'all', swimEdit: {}, recipe: null, edit: {}, effort: null, healthP: null };
  function sessionLogPanel(sid, s) {
    const n = names(), lifts = P.KEYLIFTS[sid] || [];
    const col = (p) => {
      const id = p + '_' + s, doc = findDoc('sessions', id) || {};
      return `<form class="slog" data-slog="${p}"><div class="row between"><strong style="color:var(--${p === 'a' ? 'him' : 'her'})">${esc(n[p])}</strong>${doc.done ? '<span class="chip good">Done ✓</span>' : '<span class="chip">Not logged</span>'}</div>
        ${lifts.map(([lid, inc]) => { const sg = suggest(p, lid, inc, s); const L = (doc.lifts || {})[lid] || {}; return `<div class="liftrow"><label for="sl-${p}-${lid}">${esc(P.EX[lid].n)}${lid === 'pullup' ? ' (added kg, 0 = bodyweight)' : lid === 'kbswing' ? ' (bell kg)' : ' (top set kg)'}</label>
          <div class="row"><input type="number" step="0.5" min="0" inputmode="decimal" id="sl-${p}-${lid}" value="${L.kg != null ? L.kg : ''}" placeholder="${sg.kg != null ? sg.kg : 'kg'}"><label class="check" for="sl-${p}-${lid}-hit"><input type="checkbox" id="sl-${p}-${lid}-hit" ${L.hit ? 'checked' : ''}><span>Hit all reps</span></label></div>
          <span class="small muted">${sg.text}</span></div>`; }).join('')}
        <div class="row"><label class="small muted" for="sl-${p}-rpe">Session effort (RPE 1–10)</label><select id="sl-${p}-rpe">${['', 5, 6, 7, 8, 9, 10].map((v) => `<option ${doc.rpe == v && v !== '' ? 'selected' : ''} value="${v}">${v || '–'}</option>`).join('')}</select></div>
        <input type="text" id="sl-${p}-note" maxlength="140" placeholder="Note (optional)" value="${esc(doc.note || '')}">
        <button class="btn primary sm" type="submit" ${ro()}>${doc.done ? 'Update log' : 'Save + mark done'}</button></form>`;
    };
    return `<div class="card"><div class="row between"><h3>Log ${esc(P.SESSIONS[sid].short)}</h3>${statusEl()}</div><p class="small muted">Record your top set on each key lift. The suggestion updates from your last log: +load when you hit every rep, same load when you didn't, ~60% in deload weeks.</p><div class="grid2 tight">${col('a')}${col('b')}</div></div>`;
  }
  const SW = P.SWIM;
  const segTotal = (segs) => segs.reduce((t, x) => t + (+x.reps || 0) * (+x.dist || 0), 0);
  function parsePractice(txt) {
    const out = []; let part = 'Main set';
    txt.split(/\n|;/).forEach((line) => {
      const l = line.trim(); if (!l) return; const low = l.toLowerCase();
      const pk = [['warm', 'Warm-up'], ['drill', 'Drill'], ['kick', 'Kick'], ['pull', 'Pull'], ['pre', 'Pre-set'], ['main', 'Main set'], ['sprint', 'Sprint'], ['cool', 'Cool-down'], ['swim down', 'Cool-down']].find(([k]) => low.includes(k));
      if (pk) part = pk[1];
      const m = low.match(/(\d+)\s*[x×]\s*(\d+)/) || low.match(/()(\d{2,4})\s*m?\b/);
      if (!m) return;
      const reps = m[1] ? +m[1] : 1, dist = +m[2];
      const st = [['im', 'IM'], ['fly', 'Fly'], ['breast', 'Breast'], ['back', 'Back'], ['kick', 'Kick'], ['pull', 'Pull'], ['drill', 'Drill'], ['free', 'Free'], ['choice', 'Choice']].find(([k]) => new RegExp('\\b' + k).test(low));
      const iv = (l.match(/@\s*([\d:]+)/) || [])[1] || (l.match(/(\d+\s*s(ec)?\s*rest|:\d\d\s*rest)/i) || [])[1] || '';
      out.push({ part, reps, dist, stroke: st ? st[1] : (part === 'Kick' ? 'Kick' : part === 'Pull' ? 'Pull' : 'Free'), iv: iv ? (iv.includes(':') || iv.includes('s') ? iv : '@' + iv) : '', note: '' });
    });
    return out;
  }
  function swimEditFor(s) {
    if (!state.swimEdit[s]) {
      const ex = findDoc('swims', 'a_' + s) || findDoc('swims', 'b_' + s);
      state.swimEdit[s] = ex && ex.segments ? ex.segments.map((x) => Object.assign({}, x)) : [];
    }
    return state.swimEdit[s];
  }
  function swimLogPanel(s) {
    const n = names(), segs = swimEditFor(s), total = segTotal(segs);
    const byPart = {}, byStroke = {}; segs.forEach((x) => { const m = (+x.reps || 0) * (+x.dist || 0); byPart[x.part] = (byPart[x.part] || 0) + m; byStroke[x.stroke] = (byStroke[x.stroke] || 0) + m; });
    const who = (p) => { const d = findDoc('swims', p + '_' + s) || {}; return `<div class="swwho"><label class="check" for="sw-${p}-on"><input type="checkbox" id="sw-${p}-on" ${d.dist || !findDoc('swims', (p === 'a' ? 'b' : 'a') + '_' + s) || state.swimBoth ? 'checked' : ''}><span><strong style="color:var(--${p === 'a' ? 'him' : 'her'})">${esc(n[p])}</strong> swam this ${d.dist ? `<span class="chip swim">${d.dist} m saved</span>` : ''}</span></label>
      <div class="row"><label class="small muted" for="sw-${p}-done">Metres actually done</label><input type="number" id="sw-${p}-done" step="25" min="0" inputmode="numeric" value="${d.dist && d.dist !== total ? d.dist : ''}" placeholder="${total || ''}" style="max-width:100px">
      <label class="small muted" for="sw-${p}-min">Minutes</label><input type="number" id="sw-${p}-min" step="5" min="0" value="${d.min || ''}" style="max-width:80px">
      <label class="small muted" for="sw-${p}-rpe">RPE</label><select id="sw-${p}-rpe">${['', 4, 5, 6, 7, 8, 9, 10].map((v) => `<option ${d.rpe == v && v !== '' ? 'selected' : ''} value="${v}">${v || '–'}</option>`).join('')}</select></div>
      <input type="text" id="sw-${p}-note" maxlength="140" placeholder="How it felt, best times…" value="${esc(d.note || '')}"></div>`; };
    return `<div class="card" id="swimcard"><div class="row between"><h3>Swim practice log</h3>${statusEl()}</div>
      <p class="small muted">Enter the practice once, set by set, and it saves to whoever swam it. Paste the coach's practice to fill it in, or start from the template.</p>
      <div class="segs">${segs.length ? `<div class="seg head small muted"><span>Part</span><span>Reps</span><span>× m</span><span>Stroke</span><span>Interval / rest</span><span>Total</span><span></span></div>` : ''}
      ${segs.map((x, i) => `<div class="seg" data-i="${i}"><select data-f="part" aria-label="Part">${SW.parts.map((p) => `<option ${x.part === p ? 'selected' : ''}>${p}</option>`).join('')}</select><input data-f="reps" type="number" min="1" value="${x.reps}" aria-label="Reps"><input data-f="dist" type="number" min="25" step="25" value="${x.dist}" aria-label="Distance per rep"><select data-f="stroke" aria-label="Stroke">${SW.strokes.map((p) => `<option ${x.stroke === p ? 'selected' : ''}>${p}</option>`).join('')}</select><input data-f="iv" type="text" value="${esc(x.iv || '')}" placeholder="@ or rest" aria-label="Interval"><span class="num small segt">${(+x.reps || 0) * (+x.dist || 0)} m</span><button class="btn sm" data-segdel="${i}" type="button" aria-label="Remove set">×</button></div>`).join('')}</div>
      <div class="row"><button class="btn sm" id="seg-add" type="button">Add set</button><button class="btn sm" id="seg-tpl" type="button">Use template</button><button class="btn sm" id="seg-paste" type="button">Paste practice</button>${segs.length ? '<button class="btn sm" id="seg-clear" type="button">Clear</button>' : ''}</div>
      <div id="pastebox" hidden><textarea id="seg-text" rows="5" placeholder="Warm-up 400 choice&#10;8x50 kick @1:10&#10;Main 10x100 free @1:40&#10;4x50 fly sprint&#10;Cool-down 200"></textarea><button class="btn sm primary" id="seg-parse" type="button">Fill in the sets</button></div>
      <div class="swtot"><span class="big num" id="swtotal">${total.toLocaleString('en')} m</span><span class="small muted">${Object.entries(byPart).map(([k, v]) => `${esc(k)} ${v}`).join(' · ')}</span><span class="small muted">${Object.entries(byStroke).map(([k, v]) => `${esc(k)} ${v}`).join(' · ')}</span></div>
      <div class="grid2 tight">${who('a')}${who('b')}</div>
      <button class="btn primary" id="sw-save" ${ro()}>Save practice</button></div>`;
  }
  function bindSwim(s, w) {
    const card = $('#swimcard'); if (!card) return;
    const segs = swimEditFor(s);
    const redraw = () => { const y = window.scrollY; card.outerHTML = swimLogPanel(s); bindSwim(s, w); restoreDirty(); window.scrollTo(0, y); };
    $$('.seg[data-i]', card).forEach((row) => $$('[data-f]', row).forEach((inp) => (inp.oninput = inp.onchange = () => { const x = segs[+row.dataset.i]; const f = inp.dataset.f; x[f] = f === 'reps' || f === 'dist' ? +inp.value || 0 : inp.value; $('.segt', row).textContent = (x.reps || 0) * (x.dist || 0) + ' m'; $('#swtotal').textContent = segTotal(segs).toLocaleString('en') + ' m'; })));
    $$('[data-segdel]', card).forEach((b) => (b.onclick = () => { segs.splice(+b.dataset.segdel, 1); redraw(); }));
    $('#seg-add').onclick = () => { const last = segs[segs.length - 1]; segs.push({ part: last ? last.part : 'Warm-up', reps: 1, dist: 100, stroke: 'Free', iv: '', note: '' }); redraw(); };
    $('#seg-tpl').onclick = () => { segs.splice(0, segs.length, ...SW.template.map(([part, reps, dist, stroke, iv, note]) => ({ part, reps, dist, stroke, iv, note }))); redraw(); };
    const cl = $('#seg-clear'); if (cl) cl.onclick = () => { segs.splice(0, segs.length); redraw(); };
    $('#seg-paste').onclick = () => { $('#pastebox').hidden = !$('#pastebox').hidden; };
    $('#seg-parse').onclick = () => { const add = parsePractice($('#seg-text').value); if (!add.length) return setStatus('Couldn\'t read any sets. Try lines like "8x100 free @1:45".', 'warn'); segs.push(...add); redraw(); };
    $('#sw-save').onclick = async () => {
      const total = segTotal(segs); let saved = 0;
      const recs = ['a', 'b'].filter((p) => $(`#sw-${p}-on`).checked).map((p) => {
        const done = num($(`#sw-${p}-done`).value);
        const rec = { person: p, date: s, week: w, dist: done != null ? done : total, planned: total, segments: segs.map((x) => Object.assign({}, x)) };
        const mn = num($(`#sw-${p}-min`).value), rpe = num($(`#sw-${p}-rpe`).value), note = $(`#sw-${p}-note`).value.trim();
        if (mn != null) rec.min = mn; if (rpe != null) rec.rpe = rpe; if (note) rec.note = note;
        return rec;
      }).filter((r) => r.dist);
      for (const rec of recs) { if (await put('swims', rec.person + '_' + s, rec)) saved++; }
      if (!saved) setStatus('Add at least one set (or metres done) and tick who swam.', 'warn'); else clearDirty(card);
    };
  }
  function dailyPanel(s) {
    const n = names();
    const col = (p) => {
      const doc = findDoc('daily', p + '_' + s) || {}, taken = doc.supps || {};
      const stack = (cfg.supps[p] || []).filter((x) => !x.optional || taken[x.name] != null || true);
      return `<form class="dlog" data-dlog="${p}"><strong style="color:var(--${p === 'a' ? 'him' : 'her'})">${esc(n[p])}</strong>
        ${stack.length ? `<div>${stack.map((x, i) => `<label class="check ${taken[x.name] ? 'done' : ''}" for="sp-${p}-${i}"><input type="checkbox" id="sp-${p}-${i}" data-supp="${esc(x.name)}" data-person="${p}" ${taken[x.name] ? 'checked' : ''} ${ro()}><span>${esc(x.name)} <span class="muted small">· ${esc(P.WHEN[x.when] || '')}</span></span></label>`).join('')}</div>` : `<p class="small muted">No supplements set. <a href="#supplements">Add a stack</a></p>`}
        <div class="row"><label class="small muted" for="dl-${p}-steps">Steps</label><input type="number" id="dl-${p}-steps" step="500" min="0" inputmode="numeric" value="${doc.steps || ''}" style="max-width:100px">
        <label class="small muted" for="dl-${p}-sleep">Sleep h</label><input type="number" id="dl-${p}-sleep" step="0.25" min="0" max="14" inputmode="decimal" value="${doc.sleep || ''}" style="max-width:80px"></div>
        <div class="row"><label class="small muted" for="dl-${p}-water">Water L</label><input type="number" id="dl-${p}-water" step="0.25" min="0" max="8" inputmode="decimal" value="${doc.water || ''}" style="max-width:80px">
        <label class="small muted" for="dl-${p}-energy">Energy</label><select id="dl-${p}-energy">${['', 1, 2, 3, 4, 5].map((v) => `<option ${doc.energy == v && v !== '' ? 'selected' : ''} value="${v}">${v ? v + ' / 5' : '–'}</option>`).join('')}</select>
        <button class="btn sm" type="submit" ${ro()}>Save</button></div></form>`;
    };
    return `<div class="card"><div class="row between"><h3>Daily check-in</h3>${statusEl()}</div><p class="small muted">Supplement ticks save straight away. Weigh-ins go on the <a href="#body">Body</a> tab.</p><div class="grid2 tight">${col('a')}${col('b')}</div></div>`;
  }
  function renderDay() {
    const v = $('#v-today');
    const today = todayCairo();
    if (!state.date) state.date = today < P.START ? P.START : today > END ? END : today;
    const s = state.date, w = weekOf(s), b = blockFor(s), D = dayPlan(s), ph = P.TARGETS[phaseOf(w)], n = names();
    const seed = Math.max(0, diffDays(P.START, s));
    let html = '';
    if (today < P.START) html += `<div class="banner"><span><strong>${diffDays(today, P.START)} days to go.</strong> Week 1 starts Saturday 28 November. Baseline InBody: Friday 27 November.</span><a class="btn sm" href="#groceries">Shopping list</a></div>`;
    if (inRamadan(s)) html += `<div class="banner ${ramadanOn() ? '' : 'alt'}"><span><strong>Ramadan (expected from ${fmt(R.start, { day: 'numeric', month: 'long' })}).</strong> ${ramadanOn() ? 'Showing the fasting plan: training after iftar, suhoor around 3:45 am, deload volume.' : 'If you\'re fasting, switch to the Ramadan plan.'}</span><button class="btn sm" id="ramtoggle" ${ro()}>${ramadanOn() ? 'Use the normal plan' : 'Switch to Ramadan plan'}</button></div>`;
    const tags = [];
    if (w && BENCHWEEKS[w] && ['4', '6', '0', '3'].includes(String(dow(s)))) tags.push(`<a class="chip dl" href="#training">Test week: log benchmarks</a>`);
    const ib = P.WEIGH.inbody.find((x) => x.date === s); if (ib) tags.push(`<a class="chip dl" href="#body">InBody today: ${esc(ib.label)}</a>`);
    if (dow(s) === 5) tags.push('<a class="chip" href="#body">Official Friday weigh-in</a>');
    html += `<div class="dayhead"><div class="when"><span class="muted small">${w ? `Week ${w} of ${P.WEEKS} · ${blockChip(b, s)}` : 'Outside the 12 weeks'}</span><span class="date">${fmt(s, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>${tags.length ? `<div class="row">${tags.join('')}</div>` : ''}</div>
      <div class="row"><button class="btn sm" data-nav="-1">‹ Prev</button><button class="btn sm" data-nav="0">Today</button><button class="btn sm" data-nav="1">Next ›</button>
      <label class="small muted" for="daypick">Go to</label><input type="date" id="daypick" value="${s}" min="${P.START}" max="${END}" class="btn sm"></div></div>`;
    const tl = D.items.map((it, i) => {
      const [time, kind, a, label, forced] = it;
      if (kind === 'swim') return `<div class="tl swim"><span class="t">${time}</span><span class="rail"></span><div class="body"><span class="label">${esc(a)}</span></div></div>`;
      if (kind === 'gym') { const S = P.SESSIONS[a]; return `<div class="tl gym"><span class="t">${time}</span><span class="rail"></span><div class="body"><span class="label">Gym · ${esc(S.name)}</span><span class="small muted">${esc(P.WARMUPS[S.warm].name)} first.</span></div></div>`; }
      if (kind === 'rest') return `<div class="tl"><span class="t">${time}</span><span class="rail"></span><div class="body"><span class="label">${esc(a)}</span></div></div>`;
      const slotKey = s + ':' + i; const { id, list } = pickMeal(a, seed + i, slotKey, forced);
      return `<div class="tl"><span class="t">${time}</span><span class="rail"></span><div class="body"><span class="small muted">${esc(label || P.CATS[a])}</span>${mealBlock(id, list, slotKey)}</div></div>`;
    }).join('');
    const isRest = D.type === 'rest';
    const macro = (k, cls) => { const t = ph[k]; return `<div class="m ${cls}"><span class="small" style="font-weight:600">${esc(n[k])}</span><span class="big num">${(isRest ? t.rest : t.train).toLocaleString('en')} kcal</span><span class="small num">${t.p} g protein · ${t.f} g fat · ${isRest ? t.cR : t.cT} g carbs</span></div>`; };
    const right = [];
    const gymTime = D.items.find((x) => x[1] === 'gym');
    if (D.gym) { right.push(sessionCard(P.SESSIONS[D.gym], b, { compact: true, date: s, time: gymTime ? gymTime[0] : null })); right.push(sessionLogPanel(D.gym, s)); }
    else right.push(`<div class="card"><h4>Dry-land</h4><h3>${isRest ? 'Full rest day' : 'No gym today: swim day'}</h3><p class="muted">${isRest ? 'No swim, no gym. Aim for 8–10k steps and 10 minutes of easy stretching.' : `Swim at ${esc(D.swim)}. Eat the pre-swim snack about 90 minutes before and the next meal within 45 minutes after.`}</p></div>`);
    if (D.swim) right.push(swimLogPanel(s));
    right.push(`<div class="card"><div class="row between"><h3>Today's targets</h3><span class="chip">${isRest ? 'Rest day' : 'Training day'} · ${ph.label}</span></div><div class="macro">${macro('a', 'a')}${macro('b', 'b')}</div></div>`);
    right.push(dailyPanel(s));
    html += `<div class="grid2"><div class="card"><div class="row between"><h3>${esc(D.name)} timeline</h3>${unitToggle()}</div><div class="timeline">${tl}</div><p class="small muted">Portions are approximate. Weigh food for the first 2 weeks, then use the household measures. <a href="#nutrition">Conversions</a></p></div><div class="stack">${right.join('')}</div></div>`;
    v.innerHTML = html;
    hydrate(v);
    $$('[data-nav]', v).forEach((btn) => (btn.onclick = () => { const k = +btn.dataset.nav; let d = k === 0 ? todayCairo() : addDays(state.date, k); if (d < P.START) d = P.START; if (d > END) d = END; state.date = d; clearDirty(); renderDay(); }));
    $('#daypick').onchange = (e) => { if (e.target.value) { state.date = e.target.value; clearDirty(); renderDay(); } };
    $$('[data-swap]', v).forEach((btn) => (btn.onclick = () => { const k = btn.dataset.swap; state.swaps[k] = (state.swaps[k] || 0) + 1; renderDay(); }));
    const rt = $('#ramtoggle'); if (rt) rt.onclick = () => putCfg('settings', Object.assign({}, cfg.settings, { ramadan: !ramadanOn() }));
    $$('form[data-slog]', v).forEach((f) => (f.onsubmit = async (e) => {
      e.preventDefault(); const p = f.dataset.slog, lifts = {};
      (P.KEYLIFTS[D.gym] || []).forEach(([lid]) => { const kg = num($(`#sl-${p}-${lid}`).value); if (kg != null) lifts[lid] = { kg, hit: $(`#sl-${p}-${lid}-hit`).checked }; });
      const rec = { person: p, date: s, week: w, session: D.gym, block: b, done: true, lifts };
      const rpe = num($(`#sl-${p}-rpe`).value); if (rpe != null) rec.rpe = rpe;
      const note = $(`#sl-${p}-note`).value.trim(); if (note) rec.note = note;
      if (await put('sessions', p + '_' + s, rec)) clearDirty(f);
    }));
    bindSwim(s, w);
    $$('form[data-dlog]', v).forEach((f) => (f.onsubmit = async (e) => {
      e.preventDefault(); const p = f.dataset.dlog, cur = findDoc('daily', p + '_' + s) || {};
      const rec = { person: p, date: s, supps: cur.supps || {} };
      ['steps', 'sleep', 'water', 'energy'].forEach((k) => { const x = num($(`#dl-${p}-${k}`).value); if (x != null) rec[k] = x; });
      if (await put('daily', p + '_' + s, rec)) clearDirty(f);
    }));
    $$('input[data-supp]', v).forEach((cb) => (cb.onchange = () => {
      const p = cb.dataset.person, cur = findDoc('daily', p + '_' + s) || {};
      const supps = Object.assign({}, cur.supps || {}); if (cb.checked) supps[cb.dataset.supp] = true; else delete supps[cb.dataset.supp];
      const rec = Object.assign({}, cur, { person: p, date: s, supps }); delete rec._id;
      cb.closest('.check').classList.toggle('done', cb.checked);
      put('daily', p + '_' + s, rec);
    }));
  }

  /* ================= Schedule ================= */
  function renderSchedule() {
    const today = todayCairo(), order = [6, 0, 1, 2, 3, 4, 5];
    const rows = [];
    for (let w = 1; w <= P.WEEKS; w++) {
      const ws = weekStart(w), b = baseBlock(w), cur = today >= ws && today <= addDays(ws, 6);
      const cells = order.map((dw, i) => {
        const d = addDays(ws, i), D = dayPlan(d), chips = [];
        if (D.swim) chips.push(`<span class="chip swim">Swim ${esc(D.swim.split(' (')[0])}</span>`);
        if (D.gym) chips.push(`<span class="chip gym">${esc(P.SESSIONS[D.gym].short)}</span>`);
        if (D.type === 'rest') chips.push('<span class="chip rest">Rest</span>');
        if (BENCHWEEKS[w] && [6, 4].includes(dw)) chips.push('<span class="chip dl">Tests</span>');
        if (BENCHWEEKS[w] && dw === 3) chips.push('<span class="chip dl">Swim tests</span>');
        if (P.WEIGH.inbody.some((x) => x.date === d)) chips.push('<span class="chip dl">InBody</span>');
        if (dw === 5 && [3, 6, 9, 12].includes(w)) chips.push('<span class="chip dl">Check-in</span>');
        if (inRamadan(d)) chips.push('<span class="chip ram">Ramadan</span>');
        if (isFree(d)) chips.push('<span class="chip free">Free day</span>');
        const done = store.sessions.filter((x) => x.date === d && x.done).length;
        if (done) chips.push(`<span class="chip good">${done === 2 ? 'Both done ✓' : '1 of 2 done'}</span>`);
        return `<td class="cell" data-go="${d}" tabindex="0"><span class="d num">${fmt(d, { day: 'numeric', month: 'short' })}</span><div class="s">${chips.join('')}</div></td>`;
      }).join('');
      rows.push(`<tr class="${cur ? 'current' : ''} ${b === 'dl' ? 'dl' : ''}"><td><span class="wk num">W${w}</span><br>${blockChip(b)}</td>${cells}</tr>`);
    }
    $('#v-schedule').innerHTML = `
      <div class="card"><div class="row between"><h2>12-week schedule</h2><span class="muted small">Click a day to open its full plan</span></div>
      <div class="sched"><table><thead><tr><th>Week</th>${order.map((d) => `<th>${P.DAYS[d].name.slice(0, 3)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>
      <p class="small muted">Baseline InBody is Friday 27 November, the day before week 1.</p></div>
      <div class="grid3">${['b1', 'b2', 'b3', 'dl'].map((k) => `<div class="card"><div class="row between"><h3>${BLOCKS[k].name}</h3><span class="chip ${k === 'dl' ? 'dl' : ''}">${BLOCKS[k].weeks}</span></div><p class="muted">${BLOCKS[k].desc}</p></div>`).join('')}</div>
      ${ramadanCard()}
      <div class="card"><h3>Before a meet</h3><p>In race week, drop Thursday's session and make Saturday explosive work only (slams, throws, plyo push-ups).</p></div>`;
    $$('[data-go]', $('#v-schedule')).forEach((td) => { const go = () => { state.date = td.dataset.go; location.hash = '#today'; }; td.onclick = go; td.onkeydown = (e) => { if (e.key === 'Enter') go(); }; });
    bindRamadan($('#v-schedule'));
  }
  function ramadanCard() {
    return `<div class="card"><div class="row between"><h3>Ramadan: weeks 11–12</h3><button class="btn sm" data-ramtoggle ${ro()}>${ramadanOn() ? 'Ramadan plan is on · turn off' : 'We\'re fasting · turn on Ramadan plan'}</button></div>
      <p class="muted">Ramadan is expected to start on ${fmt(R.start, { weekday: 'long', day: 'numeric', month: 'long' })} (confirmed by moon sighting), covering the last 12 days of the program. In Cairo, fajr is ${R.fajr} and maghrib ${R.maghrib} in mid-February; check the exact times.</p>
      <ul class="clean">${R.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>`;
  }
  function bindRamadan(root) { $$('[data-ramtoggle]', root).forEach((b) => (b.onclick = () => putCfg('settings', Object.assign({}, cfg.settings, { ramadan: !ramadanOn() })))); }

  /* ================= Sessions ================= */
  function renderSessions() {
    const w = weekOf(todayCairo());
    if (!state.block) state.block = w ? baseBlock(w) : 'b1';
    const b = state.block;
    $('#v-sessions').innerHTML = `
      <div class="card"><div class="row between"><h2>The four dry-land sessions</h2>
      <div class="blockpick" role="group" aria-label="Training block">${['b1', 'dl', 'b2', 'b3'].map((k) => `<button data-block="${k}" aria-pressed="${k === b}">${BLOCKS[k].name} · ${BLOCKS[k].weeks}</button>`).join('')}</div></div>
      <p class="muted">${esc(BLOCKS[b].desc)} Tap any exercise for the animated diagram, cues, alternatives and demo videos. Log your loads from the Day plan.</p></div>
      <div class="grid2 wide">${['D', 'A', 'B', 'C'].map((k) => sessionCard(P.SESSIONS[k], b)).join('')}</div>
      <div class="grid2"><div class="card"><h3>Missed, sick or travelling</h3><ul class="clean">${P.MISSED.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>
      <div class="card"><h3>Home / hotel versions</h3><p class="small muted">25 minutes, no equipment, same purpose as the gym session.</p><div class="row">${['D', 'A', 'B', 'C'].map((k) => `<button class="btn sm" data-home="${k}">${esc(P.SESSIONS[k].short)}</button>`).join('')}</div></div></div>`;
    hydrate($('#v-sessions'));
    $$('[data-home]', $('#v-sessions')).forEach((b) => (b.onclick = () => openHome(b.dataset.home, todayCairo() < P.START ? P.START : todayCairo(), me)));
    $$('[data-block]', $('#v-sessions')).forEach((x) => (x.onclick = () => { state.block = x.dataset.block; renderSessions(); }));
  }

  /* ================= Exercises ================= */
  function renderExercises() {
    const f = state.exFilter, inS = {};
    Object.values(P.SESSIONS).forEach((s) => s.parts.forEach((x) => x.items.forEach((it) => { const id = Array.isArray(it) ? it[0] : it; (inS[id] = inS[id] || []).push(s.id); })));
    const ids = Object.keys(P.EX).filter((id) => (f === 'all' ? true : f === 'warm' ? !inS[id] : (inS[id] || []).includes(f)));
    const tabs = [['all', 'All']].concat(['D', 'A', 'B', 'C'].map((k) => [k, P.SESSIONS[k].short]), [['warm', 'Warm-up drills']]);
    $('#v-exercises').innerHTML = `
      <div class="card"><div class="row between"><h2>Exercise library</h2><span class="muted small">${ids.length} exercises</span></div>
      <div class="filters blockpick">${tabs.map(([k, l]) => `<button data-exf="${k}" aria-pressed="${k === f}">${l}</button>`).join('')}</div>
      <p class="small muted">Highlighted limbs show the main working muscles. Open any exercise for start and finish positions, slow motion, a muscle map, and alternatives tagged easier, harder, machine or no-equipment.</p></div>
      <div class="excards">${ids.map((id) => { const ex = P.EX[id]; return `<button class="excard" data-ex="${id}">${fig(id)}<span class="row between"><strong>${esc(ex.n)}</strong><span class="row" style="gap:4px">${[...new Set(inS[id] || [])].map((s) => `<span class="chip gym">${esc(P.SESSIONS[s].short)}</span>`).join('')}</span></span><span class="small"><strong>Works:</strong> ${esc((ex.pri || []).map((m) => P.MUSCLES[m]).join(', '))}</span><span class="small muted">${esc(ex.aim || ex.cues[0])}</span><span class="small"><strong>Alt:</strong> ${esc(ex.alt.slice(0, 3).join(' · '))}</span></button>`; }).join('')}</div>`;
    hydrate($('#v-exercises'));
    $$('[data-exf]', $('#v-exercises')).forEach((x) => (x.onclick = () => { state.exFilter = x.dataset.exf; renderExercises(); }));
  }

  /* ================= Interval timer ================= */
  const TPRESETS = {
    circuit: { name: 'Monday circuit', stations: P.SESSIONS.A.parts[0].items, by: { b1: [40, 20, 4, 90], b2: [45, 15, 4, 90], b3: [45, 15, 5, 90], dl: [30, 30, 3, 90] } },
    core: { name: 'Core engine', stations: P.SESSIONS.A.parts[1].items, by: { b1: [30, 10, 3, 60], b2: [40, 10, 3, 60], b3: [40, 10, 4, 60], dl: [30, 15, 2, 60] } },
    vo2: { name: 'VO2 finisher (bike)', stations: ['bikeint'], by: { b1: [30, 30, 6, 0], b2: [30, 30, 8, 0], b3: [30, 30, 10, 0], dl: [30, 30, 4, 0] } }
  };
  const T = { preset: 'circuit', partner: true, work: 40, rest: 20, rounds: 4, rr: 90, phases: [], i: 0, left: 0, running: false, tick: null, ctx: null, lock: null };
  function loadPreset(k) {
    const b = blockFor(todayCairo() < P.START ? P.START : todayCairo());
    const p = TPRESETS[k]; const [w, r, n, rr] = p.by[b]; Object.assign(T, { preset: k, work: w, rest: r, rounds: n, rr });
  }
  function buildPhases() {
    const st = TPRESETS[T.preset].stations, n = names(), ph = [{ kind: 'prep', dur: 10, label: 'Get ready', ex: st[0], who: null }];
    for (let r = 1; r <= T.rounds; r++) {
      st.forEach((ex, i) => {
        if (T.partner) {
          ph.push({ kind: 'work', dur: T.work, label: P.EX[ex].n, ex, who: 'a', round: r });
          ph.push({ kind: 'work', dur: T.work, label: P.EX[ex].n, ex, who: 'b', round: r });
          if (T.preset === 'vo2') ph.push({ kind: 'rest', dur: Math.max(5, T.rest - T.work), label: 'Easy spin', ex, round: r });
          else if (i < st.length - 1) ph.push({ kind: 'rest', dur: 5, label: 'Switch station', ex: st[i + 1], round: r });
        } else {
          ph.push({ kind: 'work', dur: T.work, label: P.EX[ex].n, ex, who: null, round: r });
          if (T.rest && (i < st.length - 1 || T.preset === 'vo2')) ph.push({ kind: 'rest', dur: T.rest, label: T.preset === 'vo2' ? 'Easy spin' : 'Rest', ex: st[i + 1] || ex, round: r });
        }
      });
      if (r < T.rounds && T.rr) ph.push({ kind: 'rr', dur: T.rr, label: 'Round rest', ex: st[0], round: r });
    }
    T.phases = ph.filter((x) => x.dur > 0); T.i = 0; T.left = T.phases[0].dur;
  }
  function beep(f, d) { try { if (!T.ctx) return; const o = T.ctx.createOscillator(), g = T.ctx.createGain(); o.frequency.value = f; o.connect(g); g.connect(T.ctx.destination); g.gain.setValueAtTime(.25, T.ctx.currentTime); g.gain.exponentialRampToValueAtTime(.001, T.ctx.currentTime + d); o.start(); o.stop(T.ctx.currentTime + d); } catch (e) { /* ignore */ } }
  function tStep() {
    T.left -= 1;
    if (T.left > 0 && T.left <= 3) beep(660, .12);
    if (T.left <= 0) {
      T.i += 1;
      if (T.i >= T.phases.length) { tStop(); beep(990, .6); T.i = T.phases.length - 1; T.left = 0; T.finished = true; drawTimer(); return; }
      T.left = T.phases[T.i].dur; beep(T.phases[T.i].kind === 'work' ? 990 : 440, .35);
    }
    drawTimer();
  }
  function tStart() {
    if (!T.phases.length || T.finished) { buildPhases(); T.finished = false; }
    try { T.ctx = T.ctx || new (window.AudioContext || window.webkitAudioContext)(); T.ctx.resume(); } catch (e) { /* no audio */ }
    try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then((l) => (T.lock = l)).catch(() => {}); } catch (e) { /* ignore */ }
    T.running = true; clearInterval(T.tick); T.tick = setInterval(tStep, 1000); drawTimer();
  }
  function tStop() { T.running = false; clearInterval(T.tick); try { if (T.lock) T.lock.release(); } catch (e) { /* ignore */ } T.lock = null; drawTimer(); }
  function drawTimer() {
    const box = $('#timerbox'); if (!box) return;
    const n = names(), ph = T.phases[T.i];
    if (!ph) { box.innerHTML = '<p class="muted">Press start.</p>'; return; }
    const next = T.phases[T.i + 1];
    const remain = T.phases.slice(T.i + 1).reduce((s, x) => s + x.dur, 0) + T.left;
    const whoName = ph.who ? n[ph.who] : '';
    box.className = 'timerbox ' + (T.finished ? 'done' : ph.kind) + (ph.who ? ' who-' + ph.who : '');
    box.innerHTML = `<div class="tphase">${T.finished ? 'Done. Nice work.' : ph.kind === 'work' ? (whoName ? esc(whoName) + ' works' : 'Work') : esc(ph.label)}</div>
      <div class="tclock num">${fmtTime(T.left)}</div>
      <div class="tex">${ph.kind === 'work' ? esc(ph.label) : 'Next: ' + esc(P.EX[ph.ex] ? P.EX[ph.ex].n : '')}</div>
      ${T.partner && ph.kind === 'work' ? `<div class="small">${esc(ph.who === 'a' ? n.b : n.a)} rests and counts reps</div>` : ''}
      <div class="tmeta num">Round ${ph.round || 1} of ${T.rounds} · ${fmtTime(remain)} left${next && !T.finished ? ' · then ' + esc(next.kind === 'work' ? (next.who ? n[next.who] + ': ' : '') + next.label : next.label) : ''}</div>`;
    const sb = $('#tstart'); if (sb) sb.textContent = T.running ? 'Pause' : T.finished ? 'Restart' : (T.i || T.left !== (T.phases[0] || {}).dur) ? 'Resume' : 'Start';
  }
  function renderTimer() {
    if (!T.phases.length) { loadPreset(T.preset); buildPhases(); }
    const n = names(), st = TPRESETS[T.preset].stations;
    $('#v-timer').innerHTML = `
      <div class="card"><div class="row between"><h2>Interval timer</h2><div class="blockpick">${Object.keys(TPRESETS).map((k) => `<button data-tp="${k}" aria-pressed="${k === T.preset}">${TPRESETS[k].name}</button>`).join('')}</div></div>
      <div class="row">
        <label class="small muted" for="t-work">Work s</label><input id="t-work" type="number" min="5" step="5" value="${T.work}" class="tin">
        <label class="small muted" for="t-rest">Rest s</label><input id="t-rest" type="number" min="0" step="5" value="${T.rest}" class="tin">
        <label class="small muted" for="t-rounds">Rounds</label><input id="t-rounds" type="number" min="1" step="1" value="${T.rounds}" class="tin">
        <label class="small muted" for="t-rr">Between rounds s</label><input id="t-rr" type="number" min="0" step="15" value="${T.rr}" class="tin">
        <label class="check" for="t-partner"><input type="checkbox" id="t-partner" ${T.partner ? 'checked' : ''}><span>"I go, you go" (${esc(n.a)} then ${esc(n.b)} at each station)</span></label>
      </div>
      <p class="small muted">Presets follow the current block. In partner mode your partner's work interval is your rest, so the rest setting is only used between stations (5 s to switch) and between rounds.</p></div>
      <div class="timerwrap"><div id="timerbox" class="timerbox"></div>
      <div class="row" style="justify-content:center"><button class="btn primary big" id="tstart">Start</button><button class="btn" id="tskip">Skip</button><button class="btn" id="treset">Reset</button></div></div>
      <div class="card"><h3>Stations</h3><div class="grid3">${st.map((id) => `<button class="exrow" data-ex="${id}">${fig(id)}<span class="nm">${esc(P.EX[id].n)}</span><span></span></button>`).join('')}</div></div>`;
    hydrate($('#v-timer'));
    drawTimer();
    const rebuild = () => { tStop(); T.work = +$('#t-work').value || 30; T.rest = +$('#t-rest').value || 0; T.rounds = +$('#t-rounds').value || 1; T.rr = +$('#t-rr').value || 0; T.partner = $('#t-partner').checked; T.finished = false; buildPhases(); drawTimer(); };
    ['t-work', 't-rest', 't-rounds', 't-rr', 't-partner'].forEach((id) => ($('#' + id).onchange = rebuild));
    $$('[data-tp]', $('#v-timer')).forEach((b) => (b.onclick = () => { tStop(); loadPreset(b.dataset.tp); T.finished = false; buildPhases(); renderTimer(); }));
    $('#tstart').onclick = () => (T.running ? tStop() : tStart());
    $('#tskip').onclick = () => { T.left = 1; tStep(); };
    $('#treset').onclick = () => { tStop(); T.finished = false; buildPhases(); drawTimer(); };
  }

  /* ================= Nutrition ================= */
  function renderNutrition() {
    const Tg = P.TARGETS, n = names();
    const trow = (ph, k) => { const t = Tg[ph][k]; return `<tr><td>${esc(n[k])}</td><td class="num">${t.train.toLocaleString('en')}</td><td class="num">${t.rest.toLocaleString('en')}</td><td class="num">${t.p} g</td><td class="num">${t.f} g</td><td class="num">${t.cT} / ${t.cR} g</td></tr>`; };
    const order = [6, 0, 1, 2, 3, 4, 5];
    const timing = (map) => order.map((d) => { const D = map[d]; return `<tr><td><strong>${esc(D.name)}</strong></td><td>${D.items.filter((x) => x[0] !== '—').map((x) => `<span class="num"><strong>${x[0]}</strong></span> ${x[1] === 'meal' ? esc(x[3] || P.CATS[x[2]]) : x[1] === 'swim' ? '<span class="chip swim">Swim</span>' : `<span class="chip gym">${esc(P.SESSIONS[x[2]].short)}</span>`}`).join(' · ')}</td></tr>`; }).join('');
    const cats = ['breakfast', 'lunch', 'dinner', 'pre', 'protein', 'early', 'iftar', 'treat'];
    const lib = cats.map((c) => `<div class="card"><h3>${esc(P.CATS[c])}</h3>${Object.keys(P.MEALS).filter((k) => P.MEALS[k].cat === c).map((k) => `<div class="meal">${mealBlock(k, [k], null)}</div>`).join('')}</div>`).join('');
    const U = P.UNITS;
    $('#v-nutrition').innerHTML = `
      <div class="card"><h2>Daily targets</h2>
      <p class="muted">${esc(n.a)}: 32, 180 cm, 96 kg → under 90 kg. ${esc(n.b)}: 29, 170 cm, 71 kg → 67 kg. Expected loss: ~0.5 and ~0.4 kg/week.</p>
      ${['early', 'late'].map((ph) => `<div class="logtable"><h4 style="margin:6px 0">${Tg[ph].label}</h4>${Tg[ph].note ? `<p class="small muted">${esc(Tg[ph].note)}</p>` : ''}<table><thead><tr><th></th><th>Training day kcal</th><th>Friday kcal</th><th>Protein</th><th>Fat</th><th>Carbs (train / rest)</th></tr></thead><tbody>${trow(ph, 'a')}${trow(ph, 'b')}</tbody></table></div>`).join('')}</div>
      <div class="card"><h3>Check-ins</h3><dl class="kv">
        <dt>Week 3</dt><dd>Losing more than 0.8 kg/week (${esc(n.a)}) or 0.6 (${esc(n.b)})? Add ~150 kcal on training days. Nothing moving? Cut ~150 kcal or add 2k steps a day, not both.</dd>
        <dt>Week 6</dt><dd>Same check, plus InBody. Switch to the weeks 7–12 numbers if loss has slowed.</dd>
        <dt>Week 9</dt><dd>Same check. ${esc(n.a)} around 92 kg usually needs another −100–150 kcal.</dd>
        <dt>Week 12</dt><dd>Re-test, then choose another fat-loss block or 2–4 weeks at maintenance.</dd>
        <dt>Performance rule</dt><dd>If swim times or gym loads drop for more than a week, eat more on training days, mostly carbs before sessions.</dd></dl>
        <p class="small muted">The Analytics tab runs these checks for you from your logs.</p></div>
      <div class="card"><div class="row between"><h3>Meal times by day</h3>${ramadanOn() ? '<span class="chip ram">Ramadan plan on</span>' : ''}</div><div class="logtable"><table><tbody>${timing(P.DAYS)}</tbody></table></div></div>
      <div class="grid2"><div class="card"><h3>Flex meal · once a week</h3><ul class="clean">${P.FLEX.flexRules.map((r) => `<li>${esc(fillFlex(r))}</li>`).join('')}</ul><p class="small muted">Use it from Today: tap a meal, then "Make this my flex meal".</p></div>
      <div class="card"><h3>Free day · every other Saturday</h3><ul class="clean">${P.FLEX.freeRules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
      <p><strong>Planned for both of you:</strong> ${freeDays().map((d) => fmt(d, { weekday: 'short', day: 'numeric', month: 'short' })).join(' · ')}</p>
      <p class="small muted">Free-day budget: up to ${P.FLEX.freeKcal.a.toLocaleString('en')} kcal for ${esc(names().a)} and ${P.FLEX.freeKcal.b.toLocaleString('en')} for ${esc(names().b)}. The other days that week drop by about ${Math.round((P.FLEX.freeKcal.a - P.TARGETS.early.a.train) / 60) * 10} and ${Math.round((P.FLEX.freeKcal.b - P.TARGETS.early.b.train) / 60) * 10} kcal to balance it. Move or skip one from Today.</p></div></div>
      <div class="row between"><h2>Meal library</h2>${unitToggle()}</div>
      <p class="muted" style="margin-top:-12px">Every portion in grams or ml with the household measure beside it. Calories and protein are approximate. Any meal can replace another in the same category.</p>
      <div class="grid2">${lib}</div>
      <h2>Measuring without a scale</h2>
      <div class="grid2">
        <div class="card"><h3>Hand portions</h3><dl class="kv">${U.hand.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl></div>
        <div class="card"><h3>Cups, spoons + pieces</h3><dl class="kv">${U.measures.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl></div>
        <div class="card"><h3>Raw → cooked</h3><dl class="kv">${U.cooked.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl></div>
        ${Object.values(P.SWAPS).map((s) => `<div class="card"><h3>${esc(s.title)}</h3><ul class="clean">${s.rows.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>`).join('')}
      </div>
      <div class="card"><h3>Per 100 g (cooked unless noted)</h3><div class="logtable"><table><thead><tr><th>Food</th><th>kcal</th><th>Protein</th><th>Carbs</th><th>Fat</th></tr></thead><tbody>${U.per100.map((r) => `<tr><td>${esc(r[0])}</td>${r.slice(1).map((x, i) => `<td class="num">${x}${i ? ' g' : ''}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
      ${ramadanCard()}
      <div class="card"><h3>Ramadan meal times</h3><div class="logtable"><table><tbody>${timing(P.RDAYS)}</tbody></table></div><p class="small muted">Suhoor uses the breakfast meals; the iftar main meal uses the lunch meals.</p></div>`;
    bindRamadan($('#v-nutrition'));
  }

  /* ================= Recipes ================= */
  function renderRecipes() {
    const mealName = (m) => (P.MEALS[m] ? P.MEALS[m].n : m);
    $('#v-recipes').innerHTML = `
      <div class="card"><h2>Recipes</h2><p class="muted">Lighter versions of the plan's Egyptian meals, written as batches for both of you, with how to split each portion. Calories are approximate; the oil and ghee are measured, which is where most of the savings come from.</p>
      <div class="row">${P.RECIPES.map((r) => `<a class="chip" href="#recipes" data-jump="${r.id}">${esc(r.n)}</a>`).join('')}</div></div>
      <div class="grid2">${P.RECIPES.map((r) => `<article class="card recipe" id="rc-${r.id}">
        <div><h3>${esc(r.n)}</h3><span class="ar" lang="ar" dir="rtl">${esc(r.ar)}</span></div>
        <div class="row"><span class="chip">${esc(r.time)}</span><span class="chip gym">${esc(r.yields)}</span></div>
        <p class="small"><strong>Portions:</strong> ${esc(r.split)}</p>
        <div><h4>Ingredients</h4><table class="ing"><tbody>${r.ing.map(([a, b]) => `<tr><td>${esc(a)}</td><td class="num">${esc(b)}</td></tr>`).join('')}</tbody></table></div>
        <div><h4>Method</h4><ol>${r.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>
        <p class="small"><strong>Macros:</strong> ${esc(r.macros)}</p>
        <p class="note">${esc(r.tip)}</p>
        <p class="small muted">Used in: ${esc(r.meals.map(mealName).join(', '))}</p></article>`).join('')}</div>`;
    $$('[data-jump]', $('#v-recipes')).forEach((a) => (a.onclick = (e) => { e.preventDefault(); const t = $('#rc-' + a.dataset.jump); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
    if (state.recipe) { const t = $('#rc-' + state.recipe); state.recipe = null; if (t) setTimeout(() => { t.scrollIntoView({ block: 'start' }); t.classList.add('flash'); }, 30); }
  }

  /* ================= Supplements ================= */
  function renderSupps() {
    const n = names(), today = todayCairo();
    const order = ['breakfast', 'lunch', 'postgym', 'dinner', 'bed', 'any'];
    const adherence = (p) => {
      const stack = (cfg.supps[p] || []).filter((x) => !x.optional); if (!stack.length) return null;
      const days = [...Array(7)].map((_, i) => addDays(today, -i));
      const tot = days.reduce((s, d) => { const doc = findDoc('daily', p + '_' + d); return s + (doc && doc.suppsDone ? 1 : 0); }, 0);
      return Math.round((tot / 7) * 100);
    };
    const col = (p) => {
      const stack = cfg.supps[p] || [], ad = adherence(p);
      return `<div class="card"><div class="row between"><h3 style="color:var(--${p === 'a' ? 'him' : 'her'})">${esc(n[p])}'s stack</h3>${ad != null ? `<span class="chip ${ad >= 80 ? 'good' : 'dl'}">${ad}% taken, last 7 days</span>` : ''}</div>
        ${stack.length ? order.filter((w) => stack.some((x) => x.when === w)).map((w) => `<div class="part"><div class="part-h"><h4>${esc(P.WHEN[w])}</h4></div>${stack.filter((x) => x.when === w).map((x) => `<div class="supp"><div class="row between"><strong>${esc(x.name)}</strong><span class="small num">${esc(x.dose)}</span></div>${x.note ? `<p class="small muted">${esc(x.note)}</p>` : ''}</div>`).join('')}</div>`).join('') : '<p class="muted">No stack yet. Add what she takes below and it will appear in her daily check-in.</p>'}
        <details><summary>Edit ${esc(n[p])}'s stack</summary>
          <div class="sedit" data-sedit="${p}">${stack.map((x, i) => suppRow(p, i, x)).join('')}</div>
          <div class="row"><button class="btn sm" data-sadd="${p}" ${ro()}>Add a supplement</button><button class="btn primary sm" data-ssave="${p}" ${ro()}>Save stack</button></div>
        </details></div>`;
    };
    $('#v-supplements').innerHTML = `
      <div class="card"><div class="row between"><h2>Supplements</h2>${statusEl()}</div><p class="muted">Daily timing for each stack. Tick them off with one tap on Today. In Ramadan, "with breakfast" means suhoor and "with lunch" means the iftar meal.</p></div>
      <div class="grid2">${col('a')}${col('b')}</div>
      <div class="grid2">
        <div class="card"><h3>About L-carnitine</h3><p>Taken alone it does little for fat loss in most studies. L-carnitine L-tartrate (1–2 g a day) has some evidence for less muscle soreness and faster recovery, but it only builds up in muscle when taken with carbs every day for about 12 weeks. If you add it, take it with the post-gym shake and a banana, and judge it at the end of the block. Your current basics (creatine, omega-3, D + K, magnesium) matter more.</p></div>
        <div class="card"><h3>Ground rules</h3><ul class="clean"><li>Creatine is worth considering for ${esc(n.b)} too: 3–5 g a day helps strength and power for women as well.</li><li>Check for doubled-up doses: a multivitamin plus separate zinc, D or B-complex can push you over safe limits.</li><li>Vitamin D and iron are best dosed from a blood test.</li><li>Caffeine (1–3 mg/kg) before Thursday plyos or Saturday's session helps; avoid it after ~2 pm on evening-swim days.</li></ul>
        <p class="small muted">General information, not medical advice. Check with a doctor or pharmacist before starting anything new, especially with a health condition or medication.</p></div>
      </div>`;
    $$('[data-sadd]').forEach((b) => (b.onclick = () => { const p = b.dataset.sadd, box = $(`[data-sedit="${p}"]`); box.insertAdjacentHTML('beforeend', suppRow(p, box.children.length, { name: '', dose: '', when: 'breakfast', note: '' })); bindSuppRows(); }));
    $$('[data-ssave]').forEach((b) => (b.onclick = () => {
      const p = b.dataset.ssave;
      const rows = $$(`[data-sedit="${p}"] .srow`).map((r) => ({ name: $('.s-name', r).value.trim(), dose: $('.s-dose', r).value.trim(), when: $('.s-when', r).value, note: $('.s-note', r).value.trim(), optional: $('.s-opt', r).checked })).filter((x) => x.name);
      putCfg('supps', Object.assign({}, cfg.supps, { [p]: rows }));
    }));
    bindSuppRows();
  }
  const suppRow = (p, i, x) => `<div class="srow"><input class="s-name" placeholder="Name" value="${esc(x.name)}" aria-label="Name"><input class="s-dose" placeholder="Dose" value="${esc(x.dose)}" aria-label="Dose"><select class="s-when" aria-label="When">${Object.keys(P.WHEN).map((w) => `<option value="${w}" ${x.when === w ? 'selected' : ''}>${esc(P.WHEN[w])}</option>`).join('')}</select><input class="s-note" placeholder="Note" value="${esc(x.note || '')}" aria-label="Note"><label class="check small"><input type="checkbox" class="s-opt" ${x.optional ? 'checked' : ''}><span>Optional</span></label><button class="btn sm s-del" type="button">Remove</button></div>`;
  const bindSuppRows = () => $$('.s-del').forEach((b) => (b.onclick = () => b.closest('.srow').remove()));

  /* ================= Groceries ================= */
  const GRKEY = 'swimplan-groceries';
  // [match, group, label, kind, per]  kind: g | ml | count (per = grams per unit) | tahina
  const GMAP = [
    [/egg white/, 'Protein', 'Egg whites', 'count', 33], [/egg/, 'Protein', 'Eggs', 'count', 50],
    [/chicken/, 'Protein', 'Chicken breast (cooked weight; buy ~⅓ more raw)', 'g'], [/liver/, 'Protein', 'Beef liver', 'g'], [/kofta|beef/, 'Protein', 'Lean beef / kofta mince (cooked weight)', 'g'],
    [/fish|bolti|sea bass/, 'Protein', 'White fish fillet', 'g'], [/tuna/, 'Protein', 'Tuna in water (cans)', 'count', 120],
    [/greek yogurt/, 'Protein', 'Greek yogurt', 'g'], [/zabadi/, 'Protein', 'Plain zabadi (cups)', 'count', 170], [/milk/, 'Protein', 'Low-fat milk', 'ml'], [/areesh/, 'Protein', 'Areesh cheese', 'g'], [/white cheese/, 'Protein', 'Light white cheese', 'g'], [/termis|lupini/, 'Protein', 'Termis (lupini)', 'g'], [/whey/, 'Protein', 'Whey (optional)', 'g'],
    [/rice/, 'Carbs', 'Rice (cooked weight; dry ≈ ÷ 2.8)', 'g'], [/baladi/, 'Carbs', 'Baladi bread (loaves)', 'count', 100], [/toast/, 'Carbs', 'Toast (slices)', 'count', 25], [/oats/, 'Carbs', 'Oats', 'g'], [/ful/, 'Carbs', 'Ful medames (cooked; 1 can ≈ 400 g)', 'g'],
    [/lentil/, 'Carbs', 'Red lentils, dry (for the soup)', 'lentil'], [/potato/, 'Carbs', 'Potatoes', 'g'],
    [/molokhia/, 'Vegetables', 'Frozen molokhia (packs)', 'molo'], [/bamya|fasolia|stew/, 'Vegetables', 'Bamya or green beans', 'g'], [/tahina salad/, 'Other', 'Tahina', 'tahina'],
    [/salad|cucumber|tomato|rocca|leaves|veg sticks|carrot|pickles/, 'Vegetables', 'Salad veg (tomato, cucumber, leaves, carrots)', 'g'], [/veg|pepper|onion/, 'Vegetables', 'Cooking veg (peppers, onions, courgette)', 'g'],
    [/banana/, 'Fruit', 'Bananas', 'count', 120], [/orange/, 'Fruit', 'Oranges', 'count', 150], [/guava/, 'Fruit', 'Guavas', 'count', 100], [/date/, 'Fruit', 'Dates', 'g'],
    [/tahina/, 'Other', 'Tahina', 'tahina'], [/nuts/, 'Other', 'Nuts', 'g'], [/oil|honey|ghee|water/, null]
  ];
  function shoppingFor(ws) {
    const tot = {};
    for (let i = 0; i < 7; i++) {
      const d = addDays(ws, i); if (d < P.START || d > END) continue;
      const D = dayPlan(d);
      ['a', 'b'].forEach((p) => { const dd = dailyOf(p, d); if (isFree(d)) return; D.items.forEach((it, idx) => { if (it[1] !== 'meal' || dd.flex === idx) return; const m = P.MEALS[mealFor(p, d, idx)]; if (!m) return; m[p].forEach(([food, amt]) => {
        const f = food.toLowerCase(), rule = GMAP.find(([re]) => re.test(f)); if (!rule || !rule[1]) return;
        let v = amt; if (rule[3] === 'tahina') v = /salad/.test(f) ? amt * 0.12 : amt; if (rule[3] === 'lentil') v = amt * 0.15; if (rule[3] === 'molo') v = amt / 3;
        const k = rule[2]; tot[k] = tot[k] || { rule, v: 0 }; tot[k].v += v; }); }); });
    }
    const groups = {};
    Object.entries(tot).forEach(([label, { rule, v }]) => {
      const kind = rule[3]; let qty;
      if (kind === 'count') qty = String(Math.ceil(v / rule[4]));
      else if (kind === 'molo') qty = String(Math.max(1, Math.ceil(v / 400)));
      else if (kind === 'ml') qty = v >= 1000 ? (v / 1000).toFixed(1) + ' L' : Math.round(v / 50) * 50 + ' ml';
      else qty = v >= 1000 ? (v / 1000).toFixed(1) + ' kg' : Math.max(10, Math.round(v / 10) * 10) + ' g';
      (groups[rule[1]] = groups[rule[1]] || []).push({ label, qty, v });
    });
    Object.values(groups).forEach((a) => a.sort((x, y) => y.v - x.v));
    return groups;
  }
  function renderGroceries() {
    const today = todayCairo();
    if (!state.gweek) state.gweek = addDays(today < P.START ? P.START : today, -((dow(today < P.START ? P.START : today) + 1) % 7));
    const ws = state.gweek, key = 'swimplan-gr-' + ws, ticks = lsGet(key, {}), groups = shoppingFor(ws);
    const pantry = P.GROCERIES.find((g) => g.group.startsWith('Fats'));
    const order = ['Protein', 'Carbs', 'Vegetables', 'Fruit', 'Other'];
    $('#v-groceries').innerHTML = `
      <div class="card"><div class="row between"><h2>Shopping list for two</h2><div class="row"><button class="btn sm" data-gw="-7" aria-label="Previous week">‹</button><strong class="vlabel">${fmt(ws, { day: 'numeric', month: 'short' })} – ${fmt(addDays(ws, 6), { day: 'numeric', month: 'short' })}</strong><button class="btn sm" data-gw="7" aria-label="Next week">›</button></div></div>
      <p class="muted">Built from both of your meals for this week, including any swaps you've made, flex meals and free days. Quantities are cooked or as-eaten weights (raw meat is about a third more). Ticks are saved on this device.</p>
      <div class="row"><button class="btn sm" id="gr-copy">Copy list</button><button class="btn sm" id="gr-reset">Clear ticks</button></div></div>
      <div class="grid3">${order.filter((g) => groups[g]).map((g) => `<div class="card"><h3>${g}</h3><div>${groups[g].map((it) => { const k = it.label; return `<label class="check ${ticks[k] ? 'done' : ''}"><input type="checkbox" data-k="${esc(k)}" ${ticks[k] ? 'checked' : ''}><span><strong class="num">${esc(it.qty)}</strong> ${esc(it.label)}</span></label>`; }).join('')}</div></div>`).join('')}
      <div class="card"><h3>Pantry (check you have)</h3><div>${pantry.items.map((it) => `<label class="check ${ticks[it] ? 'done' : ''}"><input type="checkbox" data-k="${esc(it)}" ${ticks[it] ? 'checked' : ''}><span>${esc(it)}</span></label>`).join('')}</div></div></div>
      <h2>Meal-prep plan</h2>
      <div class="grid3">${P.PREP.map((p) => `<div class="card"><h3>${esc(p.day)}</h3><ul class="clean">${p.tasks.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>`).join('')}</div>`;
    $$('input[data-k]', $('#v-groceries')).forEach((cb) => (cb.onchange = () => { const t = lsGet(key, {}); t[cb.dataset.k] = cb.checked; lsSet(key, t); cb.closest('.check').classList.toggle('done', cb.checked); }));
    $('#gr-reset').onclick = () => { lsSet(key, {}); renderGroceries(); };
    $$('[data-gw]', $('#v-groceries')).forEach((b) => (b.onclick = () => { state.gweek = addDays(state.gweek, +b.dataset.gw); renderGroceries(); }));
    $('#gr-copy').onclick = async () => { const txt = order.filter((g) => groups[g]).map((g) => g + ':\n' + groups[g].map((it) => '- ' + it.qty + ' ' + it.label).join('\n')).join('\n\n'); try { await navigator.clipboard.writeText(txt); $('#gr-copy').textContent = 'Copied'; } catch (e) { $('#gr-copy').textContent = 'Copy failed'; } };
  }

  /* ================= Fuel ================= */
  function renderFuel() {
    const n = names();
    const wu = Object.values(P.WARMUPS).map((w) => `<div class="card"><h3>${esc(w.name)}</h3>${w.items.map(([id, rx]) => `<button class="exrow" data-ex="${id}">${fig(id)}<span class="nm">${esc(P.EX[id].n)}</span><span class="rx">${esc(rx)}</span></button>`).join('')}</div>`).join('');
    const kv = (rows) => `<dl class="kv">${rows.map(([a, b]) => `<dt>${esc(a === 'Him' ? n.a : a === 'Her' ? n.b : a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl>`;
    $('#v-fuel').innerHTML = `
      <div class="card"><h2>Warm-ups and cool-down</h2><p class="muted">Circuit + Core (Monday) uses the general warm-up, Lower Power (Thursday) the longer plyo one, and Glutes + Mobility (Tuesday) and Upper Strength (Saturday) the short post-swim version.</p></div>
      <div class="grid3">${wu}<div class="card"><h3>Cool-down · 5 min</h3><ul class="clean">${P.COOLDOWN.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div></div>
      <div class="grid2"><div class="card"><h3>Swim fueling</h3>${kv(P.FUEL.swim)}</div>
      <div class="stack"><div class="card"><h3>Hydration</h3>${kv(P.FUEL.hydration)}</div>
      <div class="card"><h3>Sleep + recovery</h3><ul class="clean">${P.FUEL.sleep.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
      <div class="card"><h3>Supplements</h3><p>Stacks, timing and daily tracking are on the <a href="#supplements">Supplements</a> tab.</p></div></div></div>`;
    hydrate($('#v-fuel'));
  }

  /* ================= Charts ================= */
  function lineChart(opts) {
    const W = opts.w || 640, H = opts.h || 220, L = 44, Rr = 12, Tp = 14, B = 26;
    const all = opts.series.flatMap((s) => s.pts.map((p) => p[1])).concat(opts.refs ? opts.refs.map((r) => r.v) : []);
    if (!opts.series.some((s) => s.pts.length)) return `<div class="empty">${esc(opts.empty || 'No data yet.')}</div>`;
    let lo = Math.min(...all), hi = Math.max(...all); if (lo === hi) { lo -= 1; hi += 1; }
    const pad = (hi - lo) * 0.1; lo -= pad; hi += pad;
    const x0 = opts.x0 || P.START, x1 = opts.x1 || END, span = Math.max(1, diffDays(x0, x1));
    const xs = (d) => L + (diffDays(x0, d) / span) * (W - L - Rr), ys = (v) => Tp + (1 - (v - lo) / (hi - lo)) * (H - Tp - B);
    let g = '';
    const ticks = 4; for (let i = 0; i <= ticks; i++) { const v = lo + ((hi - lo) * i) / ticks; g += `<line x1="${L}" x2="${W - Rr}" y1="${ys(v)}" y2="${ys(v)}" stroke="var(--line)"/><text x="${L - 6}" y="${ys(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${(opts.fy || ((x) => x.toFixed(hi - lo < 6 ? 1 : 0)))(v)}</text>`; }
    for (let w = 1; w <= P.WEEKS; w += 2) { const d = weekStart(w); if (d < x0 || d > x1) continue; g += `<text x="${xs(d)}" y="${H - 7}" font-size="11" fill="var(--muted)" text-anchor="middle">W${w}</text>`; }
    (opts.refs || []).forEach((r) => (g += `<line x1="${L}" x2="${W - Rr}" y1="${ys(r.v)}" y2="${ys(r.v)}" stroke="${r.c}" stroke-dasharray="6 5" stroke-width="1.5"/><text x="${W - Rr}" y="${ys(r.v) - 5}" text-anchor="end" font-size="11" fill="${r.c}">${esc(r.label)}</text>`));
    opts.series.forEach((s) => {
      const pts = s.pts.filter((p) => p[0] >= x0 && p[0] <= x1).sort((a, b) => (a[0] < b[0] ? -1 : 1)); if (!pts.length) return;
      const d = pts.map(([dt, v], i) => `${i ? 'L' : 'M'}${xs(dt).toFixed(1)},${ys(v).toFixed(1)}`).join(' ');
      if (s.area && pts.length > 1) g += `<path d="${d} L${xs(pts[pts.length - 1][0]).toFixed(1)},${H - B} L${xs(pts[0][0]).toFixed(1)},${H - B} Z" fill="${s.c}" fill-opacity=".08"/>`;
      if (!s.dots || pts.length > 1) g += `<path d="${d}" fill="none" stroke="${s.c}" stroke-width="${s.dots ? 0 : 2.5}" stroke-linejoin="round" ${s.dash ? 'stroke-dasharray="4 4"' : ''}/>`;
      if (s.dots) g += pts.map(([dt, v]) => `<circle cx="${xs(dt)}" cy="${ys(v)}" r="2.5" fill="${s.c}" fill-opacity=".45"/>`).join('');
      if (!s.dots) { const [dt, v] = pts[pts.length - 1]; g += `<circle cx="${xs(dt)}" cy="${ys(v)}" r="4.5" fill="${s.c}" stroke="var(--surface)" stroke-width="2"/>`; }
    });
    const legend = opts.series.filter((s) => s.name).map((s) => `<span class="lg"><i style="background:${s.c}"></i>${esc(s.name)}</span>`).join('');
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || 'chart')}">${g}</svg>${legend ? `<div class="legend">${legend}</div>` : ''}</div>`;
  }
  function weekBars(opts) {
    const W = opts.w || 640, H = opts.h || 190, L = 36, Rr = 8, Tp = 12, B = 24, n = P.WEEKS;
    const max = opts.max || Math.max(1, ...opts.series.flatMap((s) => s.vals));
    const gw = (W - L - Rr) / n, bw = Math.min(16, (gw - 6) / opts.series.length);
    const ys = (v) => Tp + (1 - v / max) * (H - Tp - B);
    let g = '';
    for (let i = 0; i <= 4; i++) { const v = (max * i) / 4; g += `<line x1="${L}" x2="${W - Rr}" y1="${ys(v)}" y2="${ys(v)}" stroke="var(--line)"/><text x="${L - 5}" y="${ys(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${(opts.fy || ((x) => Math.round(x)))(v)}</text>`; }
    for (let w = 0; w < n; w++) {
      const cx = L + gw * w + gw / 2; g += `<text x="${cx}" y="${H - 7}" font-size="11" fill="var(--muted)" text-anchor="middle">W${w + 1}</text>`;
      opts.series.forEach((s, si) => { const v = s.vals[w] || 0; if (!v) return; const x = cx - (bw * opts.series.length) / 2 + si * bw; g += `<rect x="${x + 1}" y="${ys(v)}" width="${bw - 2}" height="${ys(0) - ys(v)}" rx="2" fill="${s.c}"/>`; });
    }
    const legend = opts.series.map((s) => `<span class="lg"><i style="background:${s.c}"></i>${esc(s.name)}</span>`).join('');
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label)}">${g}</svg><div class="legend">${legend}</div></div>`;
  }
  const PC = { a: 'var(--him)', b: 'var(--her)' };

  /* ================= Body ================= */
  function weightStats(k) {
    const es = store.log.filter((e) => e.person === k && typeof e.weight === 'number').sort((x, y) => (x.date < y.date ? -1 : 1));
    if (!es.length) return { es, last: null };
    const last = es[es.length - 1];
    const win = (from, to) => avg(es.filter((e) => e.date > addDays(last.date, -to) && e.date <= addDays(last.date, -from)).map((e) => e.weight));
    const a7 = win(0, 7), p7 = win(7, 14);
    return { es, last, a7, p7, rate: a7 != null && p7 != null ? p7 - a7 : null };
  }
  const rolling = (es) => es.map((e) => [e.date, avg(es.filter((x) => x.date > addDays(e.date, -7) && x.date <= e.date).map((x) => x.weight))]);
  function renderBody() {
    const n = names(), today = todayCairo(), W = P.WEIGH;
    const sorted = store.log.slice().sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : x.person < y.person ? -1 : 1));
    const ibSorted = store.inbody.slice().sort((x, y) => (x.date < y.date ? -1 : 1));
    const ibTable = (p) => { const rows = ibSorted.filter((x) => x.person === p); if (!rows.length) return '<p class="small muted">No InBody results yet.</p>'; const f = rows[0]; const d = (k, v) => (f[k] != null && v != null && rows.length > 1 ? `<span class="small ${((k === 'smm') ? v - f[k] >= 0 : v - f[k] <= 0) ? 'pos' : 'neg'}">${v - f[k] >= 0 ? '+' : ''}${(v - f[k]).toFixed(1)}</span>` : ''); return `<div class="logtable"><table><thead><tr><th>Date</th><th>Weight</th><th>Muscle (SMM)</th><th>Fat mass</th><th>Body fat</th><th>Visceral</th><th></th></tr></thead><tbody>${rows.map((r) => `<tr><td class="num">${fmt(r.date)}</td><td class="num">${r.weight ?? ''} ${r !== f ? d('weight', r.weight) : ''}</td><td class="num">${r.smm ?? ''} ${r !== f ? d('smm', r.smm) : ''}</td><td class="num">${r.fat ?? ''} ${r !== f ? d('fat', r.fat) : ''}</td><td class="num">${r.pbf != null ? r.pbf + '%' : ''}</td><td class="num">${r.vfl ?? ''}</td><td><button class="btn sm" data-delc="inbody" data-id="${esc(r._id)}" ${ro()}>Delete</button></td></tr>`).join('')}</tbody></table></div>`; };
    const pCard = (k) => {
      const st = weightStats(k), cfgp = PEOPLE[k], f1 = (x) => (x == null ? '–' : x.toFixed(1));
      const waist = store.log.filter((e) => e.person === k && e.waist).map((e) => [e.date, e.waist]);
      return `<div class="card"><div class="row between"><h3 style="color:${PC[k]}">${esc(n[k])}</h3><span class="chip">Start ${cfgp.start} kg → ${cfgp.tLabel}</span></div>
        <div class="pstats"><div class="stat"><span class="v">${f1(st.a7)}</span><span class="l">7-day average (kg)</span></div>
        <div class="stat"><span class="v">${st.a7 == null ? '–' : (cfgp.start - st.a7 >= 0 ? '−' : '+') + Math.abs(cfgp.start - st.a7).toFixed(1)}</span><span class="l">Since start (kg)</span></div>
        <div class="stat"><span class="v">${st.rate == null ? '–' : st.rate.toFixed(2)}</span><span class="l">kg lost / week</span></div></div>
        ${lineChart({ label: n[k] + ' weight', series: [{ pts: st.es.map((e) => [e.date, e.weight]), c: PC[k], dots: true }, { pts: rolling(st.es), c: PC[k], area: true, name: '7-day average' }], refs: [{ v: cfgp.target, c: 'var(--good)', label: 'Target ' + cfgp.tLabel }], empty: 'No weigh-ins yet. Log the first one on Friday 27 November or day 1.' })}
        ${waist.length ? `<h4>Waist (cm)</h4>${lineChart({ label: 'waist', h: 150, series: [{ pts: waist, c: PC[k] }] })}` : ''}
        <h4>InBody</h4>${ibTable(k)}</div>`;
    };
    $('#v-body').innerHTML = `
      <div class="grid2">
        <div class="card"><h2>Weigh-in schedule</h2><h4>Daily</h4><ul class="clean">${W.daily.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><h4>Weekly</h4><ul class="clean">${W.weekly.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="card"><h3>InBody scans</h3><div class="logtable"><table><tbody>${W.inbody.map((x) => `<tr class="${x.date === today ? 'current' : ''}"><td class="num"><strong>${fmt(x.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</strong></td><td>${esc(x.label)}<br><span class="small muted">${esc(x.note)}</span></td></tr>`).join('')}</tbody></table></div>
        <h4>Getting a comparable reading</h4><ul class="clean">${W.inbodyRules.map((x) => `<li>${esc(x.replace('Yousr', n.b))}</li>`).join('')}</ul></div>
      </div>
      <div class="card"><div class="row between"><h3>Log a weigh-in</h3>${statusEl()}</div>
      <form class="log" id="wform">
        <label for="lg-person">Who<select id="lg-person"><option value="a">${esc(n.a)}</option><option value="b">${esc(n.b)}</option></select></label>
        <label for="lg-date">Date<input type="date" id="lg-date" value="${today}"></label>
        <label for="lg-weight">Morning weight (kg)<input type="number" id="lg-weight" step="0.1" min="30" max="200" inputmode="decimal"></label>
        <label for="lg-waist">Waist (cm)<input type="number" id="lg-waist" step="0.5" min="40" max="160" inputmode="decimal"></label>
        <label for="lg-note">Note<input type="text" id="lg-note" maxlength="140" placeholder="Salty dinner, poor sleep…"></label>
        <div class="row"><button class="btn primary" type="submit" ${ro()}>Save weigh-in</button></div>
      </form></div>
      <div class="card"><div class="row between"><h3>Log an InBody scan</h3></div>
      <form class="log" id="ibform">
        <label for="ib-person">Who<select id="ib-person"><option value="a">${esc(n.a)}</option><option value="b">${esc(n.b)}</option></select></label>
        <label for="ib-date">Date<input type="date" id="ib-date" value="${today}"></label>
        <label for="ib-weight">Weight (kg)<input type="number" id="ib-weight" step="0.1" inputmode="decimal"></label>
        <label for="ib-smm">Skeletal muscle mass (kg)<input type="number" id="ib-smm" step="0.1" inputmode="decimal"></label>
        <label for="ib-fat">Body fat mass (kg)<input type="number" id="ib-fat" step="0.1" inputmode="decimal"></label>
        <label for="ib-pbf">Body fat (%)<input type="number" id="ib-pbf" step="0.1" inputmode="decimal"></label>
        <label for="ib-vfl">Visceral fat level<input type="number" id="ib-vfl" step="1" inputmode="numeric"></label>
        <label for="ib-bmr">BMR (kcal)<input type="number" id="ib-bmr" step="1" inputmode="numeric"></label>
        <div class="row"><button class="btn primary" type="submit" ${ro()}>Save scan</button></div>
      </form></div>
      <div class="grid2">${pCard('a')}${pCard('b')}</div>
      <div class="card"><div class="row between"><h3>Weigh-ins</h3><span class="small muted">${store.log.length} saved</span></div>
      <div class="logtable"><table><thead><tr><th>Date</th><th>Who</th><th>Weight</th><th>Waist</th><th>Note</th><th></th></tr></thead><tbody>
      ${sorted.slice(0, 40).map((e) => `<tr><td class="num">${fmt(e.date)}</td><td>${esc(n[e.person] || e.person)}</td><td class="num">${e.weight != null ? e.weight.toFixed(1) : ''}</td><td class="num">${e.waist || ''}</td><td class="small">${esc(e.note || '')}</td><td><button class="btn sm" data-delc="log" data-id="${esc(e._id)}" ${ro()}>Delete</button></td></tr>`).join('') || '<tr><td colspan="6" class="muted">No entries yet.</td></tr>'}
      </tbody></table></div></div>
      <div class="card"><h3>Names</h3><div class="row names"><label class="small muted" for="nm-a">Him</label><input id="nm-a" value="${esc(n.a)}" maxlength="24" style="max-width:180px"><label class="small muted" for="nm-b">Her</label><input id="nm-b" value="${esc(n.b)}" maxlength="24" style="max-width:180px"><button class="btn sm" id="nm-save" ${ro()}>Save names</button></div>
      <p class="small muted">For ${esc(n.b)} to log her own entries, share this page with her as a Contributor from the Share menu.</p></div>`;
    $('#wform').onsubmit = async (e) => {
      e.preventDefault();
      const p = $('#lg-person').value, date = $('#lg-date').value, wt = num($('#lg-weight').value);
      if (!date || wt == null) return setStatus('Enter a date and a weight to save.', 'warn');
      const id = p + '_' + date, cur = findDoc('log', id) || {};
      const rec = Object.assign({}, cur, { person: p, date, weight: wt }); delete rec._id;
      ['waist'].forEach((k) => { const x = num($('#lg-' + k).value); if (x != null) rec[k] = x; });
      const note = $('#lg-note').value.trim(); if (note) rec.note = note;
      if (await put('log', id, rec)) { clearDirty($('#wform')); ['lg-weight', 'lg-waist', 'lg-note'].forEach((x) => { const i = $('#' + x); if (i) i.value = ''; }); }
    };
    $('#ibform').onsubmit = async (e) => {
      e.preventDefault();
      const p = $('#ib-person').value, date = $('#ib-date').value; if (!date) return;
      const rec = { person: p, date }; ['weight', 'smm', 'fat', 'pbf', 'vfl', 'bmr'].forEach((k) => { const x = num($('#ib-' + k).value); if (x != null) rec[k] = x; });
      if (Object.keys(rec).length < 3) return setStatus('Enter at least one InBody value.', 'warn');
      if (await put('inbody', p + '_' + date, rec)) clearDirty($('#ibform'));
    };
    bindDeletes($('#v-body'));
    $('#nm-save').onclick = () => putCfg('names', { a: $('#nm-a').value.trim() || 'Ahmed', b: $('#nm-b').value.trim() || 'Yousr' });
  }
  const bindDeletes = (root) => $$('[data-delc]', root).forEach((b) => (b.onclick = () => del(b.dataset.delc, b.dataset.id)));

  /* ================= Training log ================= */
  function renderTraining() {
    const n = names(), B = P.BENCH;
    const benchVal = (p, r, t) => { const d = findDoc('bench', p + '_' + r); return d ? d[t] : null; };
    const show = (t, v) => (v == null || v === '' ? '–' : t.unit === 'time' ? fmtTime(parseTime(v)) : v + ' ' + t.unit);
    const delta = (t, a, b) => { if (a == null || b == null) return ''; const x = t.unit === 'time' ? parseTime(b) - parseTime(a) : b - a; if (isNaN(x)) return ''; const good = t.better === 'up' ? x > 0 : x < 0; return `<span class="small ${good ? 'pos' : x === 0 ? '' : 'neg'}">${x > 0 ? '+' : ''}${t.unit === 'time' ? x.toFixed(1) + ' s' : Math.round(x * 10) / 10}</span>`; };
    const css = (p, r) => { const a = parseTime(benchVal(p, r, 't400')), b = parseTime(benchVal(p, r, 't200')); return a && b ? (a - b) / 2 : null; };
    const btable = (p) => `<div class="logtable"><table><thead><tr><th>Test</th>${B.rounds.map((r) => `<th>${r.label}</th>`).join('')}<th>Change</th></tr></thead><tbody>
      ${B.tests.map((t) => { const vals = B.rounds.map((r) => benchVal(p, r.id, t.id)); const first = vals.find((v) => v != null && v !== ''), last = [...vals].reverse().find((v) => v != null && v !== ''); return `<tr><td>${esc(t.n)}</td>${vals.map((v) => `<td class="num">${show(t, v)}</td>`).join('')}<td class="num">${first !== last ? delta(t, first, last) : ''}</td></tr>`; }).join('')}</tbody></table></div>`;
    const sess = store.sessions.slice().sort((x, y) => (x.date < y.date ? 1 : -1));
    const swims = store.swims.slice().sort((x, y) => (x.date < y.date ? 1 : -1));
    $('#v-training').innerHTML = `
      <div class="card"><div class="row between"><h2>Benchmark tests</h2>${statusEl()}</div>
      <p class="muted">Test in weeks 1, 6 and 12 so you can see what improved beyond the scale. ${esc(B.ramadanNote)}</p>
      <dl class="kv">${B.tests.map((t) => `<dt>${esc(t.n)}</dt><dd>${esc(t.when)}. ${esc(t.how)}</dd>`).join('')}</dl></div>
      <div class="card"><h3>Log test results</h3>
      <form class="log" id="bform">
        <label for="bt-person">Who<select id="bt-person"><option value="a">${esc(n.a)}</option><option value="b">${esc(n.b)}</option></select></label>
        <label for="bt-round">Round<select id="bt-round">${B.rounds.map((r) => `<option value="${r.id}">${r.label} · ${esc(r.when)}</option>`).join('')}</select></label>
        ${B.tests.map((t) => `<label for="bt-${t.id}">${esc(t.n)} (${t.unit === 'time' ? 'm:ss' : t.unit})<input id="bt-${t.id}" ${t.unit === 'time' ? 'type="text" placeholder="1:32.5"' : 'type="number" step="1" inputmode="numeric"'}></label>`).join('')}
        <div class="row"><button class="btn primary" type="submit" ${ro()}>Save results</button><span class="small muted">Blank fields keep earlier values for that round.</span></div>
      </form></div>
      <div class="grid2"><div class="card"><h3 style="color:var(--him)">${esc(n.a)}</h3>${btable('a')}</div><div class="card"><h3 style="color:var(--her)">${esc(n.b)}</h3>${btable('b')}</div></div>
      <div class="card"><h3>Session log</h3><div class="logtable"><table><thead><tr><th>Date</th><th>Who</th><th>Session</th><th>RPE</th><th>Key lifts</th><th>Note</th><th></th></tr></thead><tbody>
        ${sess.slice(0, 60).map((x) => `<tr><td class="num">${fmt(x.date)}</td><td>${esc(n[x.person])}</td><td>${esc(P.SESSIONS[x.session] ? P.SESSIONS[x.session].short : x.session)} <span class="small muted">${esc(BLOCKS[x.block] ? BLOCKS[x.block].name : '')}</span></td><td class="num">${x.rpe || ''}</td><td class="small">${Object.entries(x.lifts || {}).map(([k, v]) => `${esc(P.EX[k] ? P.EX[k].n : k)} ${v.kg} kg ${v.hit ? '✓' : '✗'}`).join(' · ')}</td><td class="small">${esc(x.note || '')}</td><td><button class="btn sm" data-delc="sessions" data-id="${esc(x._id)}" ${ro()}>Delete</button></td></tr>`).join('') || '<tr><td colspan="7" class="muted">Log sessions from the Day plan.</td></tr>'}
      </tbody></table></div></div>
      <div class="card"><h3>Swim log</h3><div class="logtable"><table><thead><tr><th>Date</th><th>Who</th><th>Distance</th><th>Time</th><th>RPE</th><th>Effort</th><th>Session</th><th></th></tr></thead><tbody>
        ${swims.slice(0, 60).map((x) => `<tr><td class="num">${fmt(x.date)}</td><td>${esc(n[x.person])}</td><td class="num">${x.dist || ''} m</td><td class="num">${x.min ? x.min + ' min' : ''}</td><td class="num">${x.rpe || ''}</td><td>${esc(x.effort || x.type || (x.segments ? [...new Set(x.segments.filter((g) => g.part === 'Main set').map((g) => g.stroke))].join(', ') : ''))}</td><td class="small">${x.text ? `<details><summary>Session</summary><pre class="pre">${esc(x.text)}</pre></details>` : esc(x.segments ? x.segments.map((g) => (g.reps > 1 ? g.reps + '×' : '') + g.dist + ' ' + g.stroke).join(', ') : (x.set || ''))}${x.note ? ' · ' + esc(x.note) : ''}</td><td><button class="btn sm" data-delc="swims" data-id="${esc(x._id)}" ${ro()}>Delete</button></td></tr>`).join('') || '<tr><td colspan="8" class="muted">Log swims from the Day plan.</td></tr>'}
      </tbody></table></div></div>`;
    $('#bform').onsubmit = async (e) => {
      e.preventDefault();
      const p = $('#bt-person').value, r = $('#bt-round').value, id = p + '_' + r, cur = Object.assign({}, findDoc('bench', id) || {}); delete cur._id;
      const rec = Object.assign(cur, { person: p, round: r });
      B.tests.forEach((t) => { const v = $('#bt-' + t.id).value.trim(); if (v !== '') rec[t.id] = t.unit === 'time' ? v : num(v); });
      if (await put('bench', id, rec)) { clearDirty($('#bform')); B.tests.forEach((t) => ($('#bt-' + t.id).value = '')); }
    };
    bindDeletes($('#v-training'));
  }

  /* ================= Analytics ================= */
  function renderAnalytics() {
    const n = names(), today = todayCairo();
    const wk = (d) => weekOf(d);
    const perWeek = (rows, p, fn) => { const v = Array(P.WEEKS).fill(0); rows.filter((r) => r.person === p).forEach((r) => { const w = wk(r.date); if (w) v[w - 1] += fn(r); }); return v; };
    const gymW = { a: perWeek(store.sessions.filter((x) => x.done), 'a', () => 1), b: perWeek(store.sessions.filter((x) => x.done), 'b', () => 1) };
    const swimW = { a: perWeek(store.swims, 'a', () => 1), b: perWeek(store.swims, 'b', () => 1) };
    const volW = { a: perWeek(store.swims, 'a', (r) => (r.dist || 0) / 1000), b: perWeek(store.swims, 'b', (r) => (r.dist || 0) / 1000) };
    const curW = Math.max(1, Math.min(P.WEEKS, wk(today) || (today < P.START ? 1 : P.WEEKS)));
    const last4 = (arr) => { const from = Math.max(0, curW - 4), sl = arr.slice(from, curW); return sl.reduce((s, x) => s + x, 0) / (sl.length * 4 || 1); };
    const tile = (p) => {
      const st = weightStats(p), c = PEOPLE[p];
      let proj = '–'; if (st.rate && st.rate > 0.05 && st.a7 != null) { const weeks = (st.a7 - c.target) / st.rate; proj = weeks <= 0 ? 'Reached' : fmt(addDays(st.last.date, Math.round(weeks * 7)), { day: 'numeric', month: 'short' }); }
      const dd = [...Array(7)].map((_, i) => findDoc('daily', p + '_' + addDays(today, -i))).filter(Boolean);
      const sleep = avg(dd.map((x) => x.sleep).filter((x) => x != null)), steps = avg(dd.map((x) => x.steps).filter((x) => x != null));
      let adv = 'Log morning weights for two weeks to see your real rate.', cls = '';
      if (st.rate != null) { if (st.rate > c.max) { adv = `Losing ${st.rate.toFixed(2)} kg/week, faster than planned. Add ~150 kcal on training days.`; cls = 'warn'; } else if (st.rate < c.min) { adv = `Losing ${st.rate.toFixed(2)} kg/week. If this holds 2 weeks, cut ~150 kcal or add 2k steps a day.`; cls = 'warn'; } else { adv = `Losing ${st.rate.toFixed(2)} kg/week: on plan. Change nothing.`; cls = 'good'; } }
      const rpes = store.sessions.filter((x) => x.person === p && x.rpe).sort((x, y) => (x.date < y.date ? 1 : -1)).slice(0, 4).map((x) => x.rpe);
      if (avg(rpes) >= 9) { adv += ' Your last sessions felt very hard (RPE 9+): check sleep and pre-workout food.'; cls = 'warn'; }
      return `<div class="card"><h3 style="color:${PC[p]}">${esc(n[p])}</h3><div class="pstats">
        <div class="stat"><span class="v">${st.a7 == null ? '–' : st.a7.toFixed(1)}</span><span class="l">7-day avg kg</span></div>
        <div class="stat"><span class="v">${st.rate == null ? '–' : st.rate.toFixed(2)}</span><span class="l">kg / week</span></div>
        <div class="stat"><span class="v">${proj}</span><span class="l">Projected target date</span></div>
        <div class="stat"><span class="v">${Math.round(last4(gymW[p]) * 100)}%</span><span class="l">Gym sessions, last 4 wks</span></div>
        <div class="stat"><span class="v">${Math.round(last4(swimW[p]) * 100)}%</span><span class="l">Swims logged, last 4 wks</span></div></div>
        <div class="advice ${cls}">${esc(adv)}</div></div>`;
    };
    const liftCharts = (p) => Object.values(P.KEYLIFTS).flat().map(([lid]) => {
      const pts = store.sessions.filter((x) => x.person === p && x.lifts && x.lifts[lid]).map((x) => [x.date, x.lifts[lid].kg]);
      return pts.length ? `<div><h4>${esc(P.EX[lid].n)}</h4>${lineChart({ w: 340, h: 170, label: P.EX[lid].n, series: [{ pts, c: PC[p] }], fy: (x) => Math.round(x) })}</div>` : '';
    }).join('') || '<p class="muted small">Log sessions on the Day plan to see strength trends.</p>';
    const ib = (p) => { const rows = store.inbody.filter((x) => x.person === p); return rows.length ? lineChart({ h: 170, label: 'InBody', series: [{ pts: rows.filter((r) => r.smm != null).map((r) => [r.date, r.smm]), c: 'var(--good)', name: 'Muscle (SMM) kg' }, { pts: rows.filter((r) => r.fat != null).map((r) => [r.date, r.fat]), c: PC[p], name: 'Fat mass kg' }], x0: '2026-11-27' }) : '<p class="muted small">Add InBody scans on the Body tab.</p>'; };
    const energy = (p) => { const pts = store.daily.filter((x) => x.person === p && x.energy).map((x) => [x.date, x.energy]); const sl = store.daily.filter((x) => x.person === p && x.sleep).map((x) => [x.date, x.sleep]); return pts.length || sl.length ? lineChart({ h: 150, label: 'energy and sleep', series: [{ pts: sl, c: 'var(--swim)', name: 'Sleep h' }, { pts, c: PC[p], name: 'Energy /5' }] }) : '<p class="muted small">Fill the daily check-in to see energy and sleep.</p>'; };
    const mix = (p, key) => { const from = addDays(today, -27), t = {}; store.swims.filter((x) => x.person === p && x.date >= from && (x.segments || x.text)).forEach((x) => (x.segments || parsePractice(x.text)).forEach((g) => { t[g[key]] = (t[g[key]] || 0) + (g.reps || 0) * (g.dist || 0); })); const tot = Object.values(t).reduce((a, b) => a + b, 0); return tot ? Object.entries(t).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="hbar"><span>${esc(k)}</span><span class="bar"><i style="width:${(v / tot) * 100}%;background:${PC[p]}"></i></span><span class="num small">${(v / 1000).toFixed(1)} km</span></div>`).join('') : '<p class="small muted">Paste the full session when you log a swim to see your stroke and set mix here.</p>'; };
    $('#v-analytics').innerHTML = `
      <div class="card"><h2>Analytics</h2><p class="muted">Everything here is calculated from your logs. Adherence counts logged sessions and swims against 4 each per week.</p></div>
      ${reviewCard(true)}
      <div class="grid2">${tile('a')}${tile('b')}</div>
      ${badgesHTML()}
      ${backupCard()}
      <div class="grid2 wide">
        <div class="card"><h3>Weight trend (7-day average)</h3>${lineChart({ label: 'weight both', series: ['a', 'b'].map((p) => ({ pts: rolling(weightStats(p).es).map(([d, v]) => [d, ((PEOPLE[p].start - v) / (PEOPLE[p].start - PEOPLE[p].target)) * 100]), c: PC[p], name: n[p] })), refs: [{ v: 100, c: 'var(--good)', label: 'Target reached' }], fy: (x) => Math.round(x) + '%', empty: 'No weigh-ins yet.' })}<p class="small muted">Shown as % of the way to each target, so you can compare on one chart.</p></div>
        <div class="card"><h3>Gym sessions per week</h3>${weekBars({ label: 'gym per week', max: 4, series: [{ name: n.a, c: PC.a, vals: gymW.a }, { name: n.b, c: PC.b, vals: gymW.b }] })}</div>
        <div class="card"><h3>Swim volume per week (km)</h3>${weekBars({ label: 'swim km', series: [{ name: n.a, c: PC.a, vals: volW.a }, { name: n.b, c: PC.b, vals: volW.b }], fy: (x) => x.toFixed(1) })}</div>
      </div>
      <div class="grid2"><div class="card"><h3>${esc(n.a)}: strength</h3><div class="grid2 tight">${liftCharts('a')}</div></div><div class="card"><h3>${esc(n.b)}: strength</h3><div class="grid2 tight">${liftCharts('b')}</div></div></div>
      <div class="grid2"><div class="card"><h3>${esc(n.a)}: InBody</h3>${ib('a')}</div><div class="card"><h3>${esc(n.b)}: InBody</h3>${ib('b')}</div></div>`;
  }

  /* ================= Me, streaks, scores, badges ================= */
  let me = lsGet('swimplan-me', null) || 'a';
  const other = (p) => (p === 'a' ? 'b' : 'a');
  const pcol = (p) => (p === 'a' ? 'var(--him)' : 'var(--her)');
  const dailyOf = (p, d) => findDoc('daily', p + '_' + d) || {};
  const activeDay = (p, d) => { const dd = findDoc('daily', p + '_' + d); return !!(findDoc('log', p + '_' + d) || (dd && (dd.status || dd.suppsDone || dd.steps != null || dd.sleep != null || dd.food)) || (findDoc('sessions', p + '_' + d) || {}).done || findDoc('swims', p + '_' + d)); };
  function streak(p) {
    let d = todayCairo(); if (!activeDay(p, d)) d = addDays(d, -1);
    let n = 0; while (activeDay(p, d) && n < 400) { n++; d = addDays(d, -1); }
    return n;
  }
  function tasksFor(p, s) {
    const D = dayPlan(s), dd = dailyOf(p, s), stack = (cfg.supps[p] || []).filter((x) => !x.optional);
    const t = [{ id: 'weigh', done: !!findDoc('log', p + '_' + s) }];
    if (stack.length) t.push({ id: 'supps', done: !!dd.suppsDone });
    const sd = findDoc('sessions', p + '_' + s) || {};
    if (dd.status === 'sick') { t.push({ id: 'status', done: true }); }
    else {
      if (D.swim) t.push({ id: 'swim', done: !!findDoc('swims', p + '_' + s) });
      if (D.gym || sd.done) t.push({ id: 'gym', done: !!sd.done });
    }
    t.push({ id: 'food', done: !!dd.food });
    return t;
  }
  function weekScore(p, w) {
    const ws = weekStart(w), days = [...Array(7)].map((_, i) => addDays(ws, i)).filter((d) => d <= todayCairo());
    if (!days.length) return null;
    let got = 0, tot = 0; days.forEach((d) => tasksFor(p, d).forEach((t) => { tot++; if (t.done) got++; }));
    return Math.round((got / tot) * 100);
  }
  function prList(p) {
    const out = [], best = {};
    store.sessions.filter((x) => x.person === p && x.lifts).sort((x, y) => (x.date < y.date ? -1 : 1)).forEach((x) => Object.entries(x.lifts).forEach(([k, v]) => { if (v.kg == null) return; if (best[k] != null && v.kg > best[k]) out.push({ date: x.date, lift: k, kg: v.kg }); if (best[k] == null || v.kg > best[k]) best[k] = v.kg; }));
    return out;
  }
  function badges(p) {
    const e = new Set(), st = weightStats(p), c = PEOPLE[p];
    if (st.es.length) e.add('first-weigh');
    const s = streak(p); if (s >= 7) e.add('streak7'); if (s >= 21) e.add('streak21');
    for (let w = 1; w <= P.WEEKS; w++) { const ws = weekStart(w), we = addDays(ws, 6); const g = store.sessions.filter((x) => x.person === p && x.done && x.date >= ws && x.date <= we).length, sw = store.swims.filter((x) => x.person === p && x.date >= ws && x.date <= we).length; if (g >= 4 && sw >= 4) e.add('perfect'); }
    if (st.a7 != null) { const lost = c.start - st.a7; if (lost >= 1) e.add('kg1'); if (lost >= 3) e.add('kg3'); if (lost >= (c.start - c.target) / 2) e.add('halfway'); if (st.a7 <= c.target) e.add('target'); }
    const km = store.swims.filter((x) => x.person === p).reduce((a, x) => a + (x.dist || 0), 0) / 1000; if (km >= 10) e.add('km10'); if (km >= 50) e.add('km50');
    const prs = prList(p).length; if (prs >= 1) e.add('pr1'); if (prs >= 10) e.add('pr10');
    if (store.bench.some((x) => x.person === p && ['broad', 'pullups', 't100'].every((k) => x[k] != null && x[k] !== ''))) e.add('tests');
    if (store.health.some((x) => x.person === p && x.round === 'base' && Object.keys(x.values || {}).length >= 3)) e.add('blood');
    return e;
  }
  function confetti() {
    if (reduce) return;
    const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c);
    const W = (c.width = innerWidth), H = (c.height = innerHeight), x = c.getContext('2d');
    const cols = ['#0a7f99', '#d2573d', '#e39a10', '#2f8a4c', '#2563c9'];
    const ps = [...Array(110)].map(() => ({ x: W / 2, y: H / 3, vx: (Math.random() - .5) * 14, vy: Math.random() * -12 - 4, r: Math.random() * 6 + 3, c: cols[Math.floor(Math.random() * 5)], a: Math.random() * 6 }));
    let f = 0; (function tick() { x.clearRect(0, 0, W, H); ps.forEach((p) => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.a += .2; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .6); x.restore(); }); if (++f < 90) requestAnimationFrame(tick); else c.remove(); })();
  }
  function ring(done, total, color) {
    const r = 34, C = 2 * Math.PI * r, f = total ? done / total : 0;
    return `<svg class="ring" viewBox="0 0 84 84" role="img" aria-label="${done} of ${total} done"><circle cx="42" cy="42" r="${r}" fill="none" stroke="var(--line)" stroke-width="8"/><circle cx="42" cy="42" r="${r}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${C * f} ${C}" transform="rotate(-90 42 42)"/><text x="42" y="47" text-anchor="middle" font-size="18" font-weight="700" fill="var(--ink)">${done}/${total}</text></svg>`;
  }

  function missedThisWeek(p, s) {
    const ws = addDays(s, -((dow(s) + 1) % 7));
    for (let d = ws; d < s; d = addDays(d, 1)) {
      const D = dayPlan(d); if (!D.gym || d < P.START) continue;
      const dd = dailyOf(p, d); if (dd.status) continue;
      if (!(findDoc('sessions', p + '_' + d) || {}).done) {
        const madeUp = store.sessions.some((x) => x.person === p && x.done && x.session === D.gym && x.date > d && x.date <= addDays(ws, 6));
        if (!madeUp) return { sid: D.gym, date: d };
      }
    }
    return null;
  }
  function openHome(sid, s, p) {
    const H = P.HOME[sid], S = P.SESSIONS[sid];
    $('#sessdlg-body').innerHTML = `<div class="sheet-grab" aria-hidden="true"></div>
      <div class="sheet-head"><div><span class="small muted">No equipment · about 25 min</span><h2 id="sessdlg-title">${esc(S.short)}: home version</h2><span class="muted">${esc(H.rx)}</span></div><button class="btn sm" id="sd-close">Close</button></div>
      <p class="muted">Same purpose as the gym session, done with your bodyweight in a living room or hotel room. Warm up for 3–4 minutes first (marching, arm circles, bodyweight squats).</p>
      <div class="spart-ex">${H.items.map(([nm, rx, ref]) => `<div class="sx"><button class="sx-fig" data-ex="${ref}" aria-label="Similar movement">${fig(ref)}</button><div class="sx-body"><div class="row between"><strong>${esc(nm)}</strong><strong class="num sx-rx">${esc(rx)}</strong></div><span class="small muted">${esc((P.EX[ref].pri || []).map((m) => P.MUSCLES[m]).join(', '))}</span></div></div>`).join('')}</div>
      <button class="btn primary big" id="home-done" ${ro()}>Mark done</button>`;
    hydrate($('#sessdlg-body'));
    const d = $('#sessdlg'); $('#sd-close').onclick = () => d.close();
    $('#home-done').onclick = async () => { if (await put('sessions', p + '_' + s, { person: p, date: s, week: weekOf(s), session: sid, block: blockFor(s), done: true, home: true, lifts: {} })) { d.close(); confetti(); } };
    if (!d.open) d.showModal();
  }
  const weekRange = (s) => { const ws = addDays(s, -((dow(s) + 1) % 7)); return [ws, addDays(ws, 6)]; };
  function flexUsed(p, s) { const [a, b] = weekRange(s); return store.daily.filter((x) => x.person === p && x.date >= a && x.date <= b && x.flex != null && x.date !== s).length; }
  // Free days: planned every other Saturday (weeks 2, 4, 6, 8, 10), movable within each 2-week block, shared by both
  const FREE_DEFAULT = [2, 4, 6, 8, 10].map((w) => weekStart(w));
  const freeDays = () => (Array.isArray(cfg.settings.freeDays) ? cfg.settings.freeDays : FREE_DEFAULT);
  const isFree = (d) => freeDays().includes(d);
  const pairOf = (d) => Math.ceil((weekOf(d) || 0) / 2);
  const freeInPair = (d) => freeDays().find((x) => pairOf(x) === pairOf(d)) || null;
  function setFreeFor(d, newDate) { const list = freeDays().filter((x) => pairOf(x) !== pairOf(d)); if (newDate) list.push(newDate); list.sort(); return putCfg('settings', Object.assign({}, cfg.settings, { freeDays: list })); }
  function freeExtra(p, s) { const ph = P.TARGETS[phaseOf(weekOf(s))][p], D = dayPlan(s); return P.FLEX.freeKcal[p] - (D.type === 'rest' ? ph.rest : ph.train); }
  // Balance: when this week has a free day, every other day gives back an equal share
  function balanceFor(p, s) {
    const [a, b] = weekRange(s), fd = freeDays().find((x) => x >= a && x <= b && x >= P.START && x <= END);
    if (!fd || fd === s || s < P.START || s > END) return 0;
    const days = []; for (let d = a; d <= b; d = addDays(d, 1)) if (d !== fd && d >= P.START && d <= END) days.push(d);
    return Math.round(freeExtra(p, fd) / Math.max(1, days.length) / 10) * 10;
  }
  const fillFlex = (t) => t.replace('{a}', P.FLEX.flexKcal.a).replace('{b}', P.FLEX.flexKcal.b).replace('{A}', names().a).replace('{B}', names().b);

  /* ================= Today ================= */
  const EFFORT = [['Easy', 5], ['Steady', 6], ['Hard', 8], ['All-out', 9]];
  const timeOfDay = () => { const h = +new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', hour12: false }).format(new Date()); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
  const check = (done) => `<span class="tick ${done ? 'on' : ''}" aria-hidden="true">${done ? '<svg viewBox="0 0 20 20"><path d="M5 10.5l3.2 3.2L15 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}</span>`;
  function sessionMinutes(sid) { return { A: 50, B: 60, C: 65, D: 65 }[sid]; }
  function renderToday() {
    const v = $('#v-today'), today = todayCairo();
    if (!state.date) state.date = today < P.START ? P.START : today > END ? END : today;
    const n = names();
    if (state.view !== 'day' || state.who === 'both') return renderOverview(v);
    const s = state.date, p = me, w = weekOf(s), b = blockFor(s), D = dayPlan(s), ph = P.TARGETS[phaseOf(w)];
    const tasks = tasksFor(p, s), done = tasks.filter((t) => t.done).length;
    const ptasks = tasksFor(other(p), s), pdone = ptasks.filter((t) => t.done).length;
    const stk = streak(p), ws = w ? weekScore(p, w) : null;
    const isToday = s === today;
    const tObj = (id) => tasks.find((t) => t.id === id);
    const cards = [];
    const ddS = dailyOf(p, s);
    // Weigh-in
    {
      const lg = findDoc('log', p + '_' + s), st = weightStats(p);
      cards.push(`<div class="task ${tObj('weigh').done ? 'done' : ''}">${check(tObj('weigh').done)}<div class="tbody"><div class="tt">Morning weigh-in${dow(s) === 5 ? ' <span class="chip">Official Friday reading</span>' : ''}</div>
        ${lg && !state.edit.weigh ? `<div class="tsub"><strong class="num">${lg.weight.toFixed(1)} kg</strong>${st.a7 != null ? ` · 7-day average ${st.a7.toFixed(1)} kg` : ''} <button class="link" data-edit="weigh">Edit</button></div>` :
        `<div class="tsub muted">After the bathroom, before food or water.</div><form class="inline" id="q-weigh"><input type="number" id="q-weight" step="0.1" min="30" max="200" inputmode="decimal" placeholder="kg" value="${lg ? lg.weight : ''}" aria-label="Weight in kg"><button class="btn primary" type="submit" ${ro()}>Save</button></form>`}</div></div>`);
    }
    // Supplements
    if (tObj('supps')) {
      const stack = cfg.supps[p] || [], ok = tObj('supps').done;
      cards.push(`<div class="task ${ok ? 'done' : ''}">${check(ok)}<div class="tbody"><div class="tt">Supplements</div>
        <div class="tsub muted">${['breakfast', 'lunch', 'postgym', 'dinner', 'bed', 'any'].filter((w) => stack.some((x) => x.when === w)).map((w) => `<strong>${esc(P.WHEN[w])}:</strong> ${esc(stack.filter((x) => x.when === w).map((x) => x.name.replace(/\s*\(.*\)$/, '')).join(', '))}`).join('<br>')}</div>
        <button class="btn ${ok ? '' : 'primary'}" id="q-supps" ${ro()}>${ok ? 'Took my supplements ✓ (undo)' : 'Took my supplements'}</button></div></div>`);
    }
    // Swim
    if (D.swim && ddS.status !== 'sick') {
      const sw = findDoc('swims', p + '_' + s), editing = state.edit.swim || !sw;
      cards.push(`<div class="task ${tObj('swim').done ? 'done' : ''}">${check(tObj('swim').done)}<div class="tbody"><div class="tt">Swim · ${esc(D.swim)}</div>
        ${!editing ? `<div class="tsub"><strong class="num">${(sw.dist || 0).toLocaleString('en')} m</strong>${sw.effort ? ' · ' + esc(sw.effort) : ''}${sw.text ? ' · session saved' : ''} <button class="link" data-edit="swim">Edit</button></div>${sw.text ? `<details class="pasted"><summary>Session</summary><pre>${esc(sw.text)}</pre></details>` : ''}` :
        `<form class="swq" id="q-swim"><div class="row"><label class="sr" for="q-dist">Metres swum</label><input type="number" id="q-dist" step="50" min="0" inputmode="numeric" placeholder="Total metres" value="${sw ? sw.dist : ''}" class="bigin">
          <label class="check" for="q-both"><input type="checkbox" id="q-both" ${findDoc('swims', other(p) + '_' + s) ? '' : 'checked'}><span>${esc(n[other(p)])} swam the same</span></label></div>
          <div class="pills" role="group" aria-label="How hard">${EFFORT.map(([l]) => `<button type="button" class="pill ${(state.effort || (sw && sw.effort)) === l ? 'on' : ''}" data-effort="${l}">${l}</button>`).join('')}</div>
          <details ${sw && sw.text ? 'open' : ''}><summary>Add the full session (optional)</summary><textarea id="q-text" rows="6" placeholder="Paste the practice here, e.g.&#10;400 warm-up&#10;8x50 kick @1:10&#10;10x100 free @1:40&#10;200 cool-down">${esc(sw && sw.text || '')}</textarea><span class="small muted" id="q-detect"></span></details>
          <button class="btn primary" type="submit" ${ro()}>Save swim</button></form>`}</div></div>`);
    }
    // Sick day
    if (ddS.status === 'sick') cards.unshift(`<div class="task done">${check(true)}<div class="tbody"><div class="tt">Sick day: rest</div><div class="tsub">No training today. Eat at maintenance, drink plenty, sleep. Your streak is safe. Come back with a lighter session.</div><button class="link" id="q-unsick">I'm fine, undo</button></div></div>`);
    // Missed session this week
    const missed = missedThisWeek(p, s);
    if (missed && !ddS.status) { const MS = P.SESSIONS[missed.sid], canToday = !D.gym && !(findDoc('sessions', p + '_' + s) || {}).done && dow(s) === 5;
      cards.push(`<div class="nextup card warnline"><div><span class="small muted">Missed on ${fmt(missed.date, { weekday: 'long' })}</span><div class="tt">${esc(MS.short)}</div><span class="small muted">${canToday ? 'Friday is free: do it today if you feel fresh, or skip it.' : 'Skip it, or do it on Friday if that\'s still free. Never two sessions in one day.'}</span></div>${canToday ? `<button class="btn primary" data-makeup="${missed.sid}">Do it today</button>` : `<button class="btn" data-sess="${missed.sid}">About it</button>`}</div>`); }
    // Gym (planned or a make-up already started today)
    const madeUp = !D.gym && (findDoc('sessions', p + '_' + s) || {}).session;
    if ((D.gym || madeUp) && ddS.status !== 'sick') {
      const gid = D.gym || madeUp;
      const S = P.SESSIONS[gid], sd = findDoc('sessions', p + '_' + s), gt = D.items.find((x) => x[1] === 'gym');
      const prsToday = prList(p).filter((x) => x.date === s);
      const nEx = S.parts.reduce((a, x) => a + x.items.length, 0), D_gym = gid;
      cards.push(`<div class="task ${tObj('gym').done ? 'done' : ''}">${check(tObj('gym').done)}<div class="tbody"><div class="tt">${esc(S.short)}</div><div class="tsub">${esc(S.name)}</div>
        <div class="tsub muted">${gt ? gt[0] + ' · ' : madeUp ? 'Make-up session · ' : ''}${nEx} exercises · about ${sessionMinutes(D_gym)} min · ${blockChip(b, s)}</div>
        ${sd && sd.done ? `<div class="tsub">Done${sd.home ? ' (home version)' : ''}${sd.rpe ? ' · effort ' + sd.rpe + '/10' : ''}${prsToday.length ? ` · <strong>${prsToday.length} new best${prsToday.length > 1 ? 's' : ''}</strong>` : ''}</div>` : ''}
        <div class="row"><button class="btn primary" id="startwo">${sd && sd.done ? 'Open workout again' : resumeAvailable(p, s) ? 'Resume workout' : 'Start workout'}</button><button class="link" data-sess="${D_gym}" data-sdate="${s}">About this session</button></div>
        ${sd && sd.done ? '' : `<div class="row cant"><span class="small muted">Can't train as planned?</span><button class="link" data-home="${D_gym}">Home / hotel version (25 min)</button><button class="link" id="q-sick">I'm sick today</button></div>`}</div></div>`);
    }
    // Food
    {
      const items = D.items.filter((x) => x[1] === 'meal'), t = ph[p], isRest = D.type === 'rest', free = isFree(s), bal = balanceFor(p, s);
      const kcal = free ? P.FLEX.freeKcal[p] : (isRest ? t.rest : t.train) - bal;
      const fip = freeInPair(s);
      cards.push(`<div class="task ${tObj('food').done ? 'done' : ''}">${check(tObj('food').done)}<div class="tbody"><div class="tt">${free ? 'Free day' : 'Eat to plan'}</div><div class="tsub muted"><strong class="num">${free ? 'up to ' : ''}${kcal.toLocaleString('en')} kcal</strong> · <strong class="num">${t.p} g protein</strong> today${free ? '' : ' · tap a meal for portions, swaps and the recipe'}</div>
        ${bal ? `<div class="balance"><strong>Balance day: −${bal} kcal</strong> for this week's free day (${fmt(freeDays().find((x) => x >= weekRange(s)[0] && x <= weekRange(s)[1]), { weekday: 'long' })}). Easiest way: halve the bread or rice at dinner${bal > 150 ? ' and skip the dates in your snack' : ''}.</div>` : ''}
        ${free ? `<div class="freeday"><p>Eat what you enjoy today. The other days this week are set ${balanceFor(p, s === weekRange(s)[0] ? addDays(s, 1) : weekRange(s)[0])} kcal lower each to pay for it, so your weekly deficit stays on track.</p><ul class="clean">${P.FLEX.freeRules.slice(1).map((r) => `<li>${esc(r)}</li>`).join('')}</ul><div class="row"><button class="link" id="q-free-skip">Skip this free day</button></div></div>` : `
        <div class="meals">${items.map((it) => { const i = D.items.indexOf(it), dd = dailyOf(p, s); if (dd.flex === i) return `<button class="mealrow flex" data-meal-slot="${i}" type="button"><span class="num mt">${it[0]}</span><span class="mr-main"><strong>Flex meal</strong> <span class="chip dl">Your choice</span><br><span class="small muted">${esc(it[3] || P.CATS[it[2]])} · up to ~${P.FLEX.flexKcal[p].toLocaleString('en')} kcal · start with protein</span></span><span class="chev" aria-hidden="true">›</span></button>`; const m = P.MEALS[mealFor(p, s, i)], chosen = (dd.meals || {})[i]; return `<button class="mealrow" data-meal-slot="${i}" type="button"><span class="num mt">${it[0]}</span><span class="mr-main"><strong>${esc(m.n)}</strong>${chosen ? ' <span class="chip">Swapped</span>' : ''}<br><span class="small muted">${esc(it[3] || P.CATS[it[2]])} · ~${m[p + 'k'][0]} kcal · ${m[p + 'k'][1]} g protein</span></span><span class="chev" aria-hidden="true">›</span></button>`; }).join('')}</div>
        <div class="small muted flexline">${flexUsed(p, s) || ddS.flex != null ? 'Flex meal used this week.' : 'Flex meal: 1 left this week (tap a meal to use it).'} ${fip ? `Free day: ${fmt(fip, { weekday: 'short', day: 'numeric', month: 'short' })}.` : 'No free day in this 2-week block.'} ${weekOf(s) && weekOf(s) <= 10 && !(ramadanOn() && inRamadan(s)) ? `<button class="link" id="q-free-move">${fip ? 'Move it to today' : 'Make today the free day'}</button>` : ''}</div>`}
        <div class="row">${unitToggle()}</div>
        <button class="btn ${tObj('food').done ? '' : 'primary'}" id="q-food" ${ro()}>${tObj('food').done ? 'Ate to plan ✓ (undo)' : 'I ate to plan and hit my protein'}</button></div></div>`);
    }
    // Next gym session
    if (!D.gym) {
      let nd = null; for (let d = addDays(s, 1); d <= END; d = addDays(d, 1)) if (dayPlan(d).gym) { nd = d; break; }
      if (nd) { const ND = dayPlan(nd), NS = P.SESSIONS[ND.gym], nt = ND.items.find((x) => x[1] === 'gym'), dd = diffDays(s, nd);
        cards.push(`<div class="nextup card"><div><span class="small muted">Next gym session · ${dd === 1 ? 'tomorrow' : fmt(nd, { weekday: 'long' })}${nt ? ' at ' + nt[0] : ''}</span><div class="tt">${esc(NS.short)}</div><span class="small muted">${esc(NS.name)} · about ${sessionMinutes(ND.gym)} min</span></div><button class="btn" data-sess="${ND.gym}" data-sdate="${nd}">About it</button></div>`); }
    }
    // Banners
    const banners = [];
    if (today < P.START) banners.push(`<div class="banner"><span><strong>${diffDays(today, P.START)} days to go.</strong> Baseline bloodwork and InBody on 26–27 Nov, then week 1 starts Saturday 28 November.</span><a class="btn sm" href="#health">What to test</a></div>`);
    if (inRamadan(s)) banners.push(`<div class="banner alt"><span><strong>Ramadan (expected).</strong> ${ramadanOn() ? 'Showing the fasting plan.' : 'Fasting? Switch to the Ramadan plan.'}</span><button class="btn sm" id="ramtoggle" ${ro()}>${ramadanOn() ? 'Use the normal plan' : 'Switch to Ramadan plan'}</button></div>`);
    if (w && BENCHWEEKS[w] && [4, 6, 0, 3].includes(dow(s))) banners.push(`<div class="banner"><span><strong>Test week.</strong> Do this week's benchmark tests and log them.</span><a class="btn sm" href="#training">Log tests</a></div>`);
    const ib = P.WEIGH.inbody.find((x) => x.date === s); if (ib) banners.push(`<div class="banner"><span><strong>InBody today:</strong> ${esc(ib.label)}. Fasted, before anything else.</span><a class="btn sm" href="#body">Log scan</a></div>`);
    // Next milestone
    const earned = badges(p), next = P.BADGES.find((x) => !earned.has(x.id));
    v.innerHTML = `
      ${viewBar()}
      <div class="hero card"><div class="hero-l"><span class="muted small">${esc(timeOfDay())},</span><h2 style="color:${pcol(p)}">${esc(n[p])}</h2>
        <div class="row small"><span>${fmt(s, { weekday: 'long', day: 'numeric', month: 'long' })}</span>${w ? `<span class="chip">Week ${w} of 12</span>` : ''}</div>
        <div class="row hero-stats"><span class="stat-in"><strong class="num">${stk}</strong> day streak</span>${ws != null ? `<span class="stat-in"><strong class="num">${ws}%</strong> this week</span>` : ''}<span class="stat-in"><strong class="num">${earned.size}</strong> of ${P.BADGES.length} badges</span></div></div>
        <div class="hero-r">${ring(done, tasks.length, pcol(p))}<span class="small muted">${done === tasks.length ? 'All done today' : 'done ' + (isToday ? 'today' : 'this day')}</span></div></div>
      ${banners.join('')}
      ${reviewCard(false)}
      <div class="tasks">${cards.join('')}</div>
      <div class="partner card"><span class="dot" style="background:${pcol(other(p))}"></span><span><strong>${esc(n[other(p)])}</strong> has done ${pdone} of ${ptasks.length} ${isToday ? 'today' : 'that day'}${pdone === ptasks.length ? '. Day complete.' : '.'}</span>${streak(other(p)) ? `<span class="small muted">${streak(other(p))}-day streak</span>` : ''}</div>
      ${next ? `<div class="milestone"><span class="badge-ic locked" aria-hidden="true"></span><span><strong>Next badge: ${esc(next.n)}.</strong> ${esc(next.d)}.</span><a class="link" href="#analytics">All badges</a></div>` : ''}
      ${statusEl()}`;
    hydrate(v);
    bindToday(s, p, w, b, D, tasks);
  }
  function fullDayHTML(s) {
    const D = dayPlan(s), seed = Math.max(0, diffDays(P.START, s));
    return `<div class="timeline">${D.items.map((it, i) => {
      const [time, kind, a, label, forced] = it;
      if (kind === 'swim') return `<div class="tl swim"><span class="t">${time}</span><span class="rail"></span><div class="body"><span class="label">${esc(a)}</span></div></div>`;
      if (kind === 'gym') return `<div class="tl gym"><span class="t">${time}</span><span class="rail"></span><div class="body"><span class="label">Gym · ${esc(P.SESSIONS[a].name)}</span></div></div>`;
      if (kind === 'rest') return `<div class="tl"><span class="t">${time}</span><span class="rail"></span><div class="body"><span class="label">${esc(a)}</span></div></div>`;
      const slotKey = s + ':' + i, pm = pickMeal(a, seed + i, slotKey, forced);
      return `<div class="tl"><span class="t">${time}</span><span class="rail"></span><div class="body"><span class="small muted">${esc(label || P.CATS[a])}</span>${mealBlock(pm.id, pm.list, slotKey)}</div></div>`;
    }).join('')}</div>`;
  }
  async function saveDaily(p, s, patch) {
    const cur = Object.assign({}, findDoc('daily', p + '_' + s) || {}); delete cur._id;
    return put('daily', p + '_' + s, Object.assign(cur, { person: p, date: s }, patch));
  }
  function celebrateIfComplete(p, s, before) {
    setTimeout(() => { const t = tasksFor(p, s); if (before < t.length && t.every((x) => x.done)) { confetti(); setStatus('Day complete. Nice work.', 'good'); } }, 400);
  }
  function bindToday(s, p, w, b, D, tasks) {
    const v = $('#v-today'), before = tasks.filter((t) => t.done).length;
    bindViewBar(v);
    $$('[data-edit]', v).forEach((x) => (x.onclick = () => { state.edit[x.dataset.edit] = true; renderToday(); }));
    $$('[data-swap]', v).forEach((btn) => (btn.onclick = (e) => { e.preventDefault(); const k = btn.dataset.swap; state.swaps[k] = (state.swaps[k] || 0) + 1; renderToday(); }));
    const rt = $('#ramtoggle'); if (rt) rt.onclick = () => putCfg('settings', Object.assign({}, cfg.settings, { ramadan: !ramadanOn() }));
    const fw = $('#q-weigh'); if (fw) fw.onsubmit = async (e) => { e.preventDefault(); const wt = num($('#q-weight').value); if (wt == null) return; const cur = Object.assign({}, findDoc('log', p + '_' + s) || {}); delete cur._id; state.edit.weigh = false; if (await put('log', p + '_' + s, Object.assign(cur, { person: p, date: s, weight: wt }))) { clearDirty(fw); celebrateIfComplete(p, s, before); } };
    const qs = $('#q-supps'); if (qs) qs.onclick = () => saveDaily(p, s, { suppsDone: !dailyOf(p, s).suppsDone }).then(() => celebrateIfComplete(p, s, before));
    const fs = $('#q-swim');
    if (fs) {
      $$('[data-effort]', fs).forEach((x) => (x.onclick = () => { state.effort = x.dataset.effort; $$('[data-effort]', fs).forEach((y) => y.classList.toggle('on', y === x)); }));
      const ta = $('#q-text'), det = $('#q-detect');
      const detect = () => { const m = segTotal(parsePractice(ta.value)); det.textContent = m ? `Counted about ${m.toLocaleString('en')} m in the session.` : ''; if (m && !$('#q-dist').value) $('#q-dist').placeholder = m + ' (from session)'; };
      ta.oninput = detect; detect();
      fs.onsubmit = async (e) => {
        e.preventDefault();
        const text = ta.value.trim(), counted = segTotal(parsePractice(text));
        const dist = num($('#q-dist').value) != null ? num($('#q-dist').value) : counted || null;
        if (!dist) return setStatus('Enter the total metres you swam.', 'warn');
        const sw = findDoc('swims', p + '_' + s) || {};
        const effort = state.effort || sw.effort || null;
        const mk = (pp) => { const r = { person: pp, date: s, week: w, dist }; if (text) r.text = text; if (effort) { r.effort = effort; r.rpe = EFFORT.find((x) => x[0] === effort)[1]; } return r; };
        const both = $('#q-both') && $('#q-both').checked;
        state.edit.swim = false; state.effort = null;
        const ok = await put('swims', p + '_' + s, mk(p)); if (both) await put('swims', other(p) + '_' + s, mk(other(p)));
        if (ok) { clearDirty(fs); celebrateIfComplete(p, s, before); }
      };
    }
    const sw = $('#startwo'); if (sw) sw.onclick = () => openWorkout(D.gym || (findDoc('sessions', p + '_' + s) || {}).session, s, p);
    $$('[data-makeup]', v).forEach((b) => (b.onclick = () => openWorkout(b.dataset.makeup, s, p)));
    $$('[data-home]', v).forEach((b) => (b.onclick = () => openHome(b.dataset.home, s, p)));
    const sk = $('#q-sick'); if (sk) sk.onclick = () => saveDaily(p, s, { status: 'sick' });
    const us = $('#q-unsick'); if (us) us.onclick = () => saveDaily(p, s, { status: null });

    $$('[data-meal-slot]', v).forEach((b) => (b.onclick = () => openMealSheet(p, s, +b.dataset.mealSlot)));
    const qfm = $('#q-free-move'); if (qfm) qfm.onclick = () => setFreeFor(s, s);
    const qfs = $('#q-free-skip'); if (qfs) qfs.onclick = () => setFreeFor(s, null);
    const ff = $('#q-food'); if (ff) ff.onclick = () => { const dd = dailyOf(p, s); saveDaily(p, s, { food: !dd.food }).then(() => celebrateIfComplete(p, s, before)); };
    const fh = null; if (fh) fh.onsubmit = (e) => { e.preventDefault(); const patch = {}; ['steps', 'sleep'].forEach((k) => { const x = num($('#q-' + k).value); if (x != null) patch[k] = x; }); saveDaily(p, s, patch).then(() => { clearDirty(fh); celebrateIfComplete(p, s, before); }); };
    $$('[data-energy]', v).forEach((x) => (x.onclick = () => saveDaily(p, s, { energy: +x.dataset.energy })));
  }

  /* ================= Session card ================= */
  function openSession(sid, date) {
    const S = P.SESSIONS[sid], b = date ? blockFor(date) : (state.block || 'b1'), n = names();
    const ids = S.parts.flatMap((x) => x.items.map((it) => (Array.isArray(it) ? it[0] : it)));
    const cnt = {}; ids.forEach((id) => (P.EX[id].pri || []).forEach((m) => (cnt[m] = (cnt[m] || 0) + 1)));
    const sec = new Set(); ids.forEach((id) => (P.EX[id].sec || []).forEach((m) => sec.add(m)));
    const pri = Object.keys(cnt).sort((x, y) => cnt[y] - cnt[x]);
    const D = date ? dayPlan(date) : null, gt = D ? D.items.find((x) => x[1] === 'gym') : null;
    $('#sessdlg-body').innerHTML = `
      <div class="sheet-grab" aria-hidden="true"></div>
      <div class="sheet-head"><div><span class="small muted">${date ? fmt(date, { weekday: 'long', day: 'numeric', month: 'short' }) + (gt ? ' · ' + gt[0] : '') : S.day} · about ${sessionMinutes(sid)} min</span><h2 id="sessdlg-title">${esc(S.short)}</h2><span class="muted">${esc(S.name)}</span></div><button class="btn sm" id="sd-close">Close</button></div>
      <div class="row">${S.focus.map((f) => `<span class="chip">${esc(f)}</span>`).join('')}${blockChip(b, date)}</div>
      <div><h4>Purpose</h4><p>${esc(S.purpose)}</p></div>
      <div><h4>Aim for</h4><ul class="clean">${S.aims.map((a) => `<li>${esc(a)}</li>`).join('')}<li>${esc(BLOCKS[b].name)} block: ${esc(BLOCKS[b].desc)}</li></ul></div>
      <div class="targets">${muscleMap(pri.slice(0, 6), [...sec].filter((m) => !pri.slice(0, 6).includes(m)))}<div><h4>Muscles it targets</h4><p><strong>Main:</strong> ${esc(pri.slice(0, 6).map((m) => P.MUSCLES[m]).join(', '))}</p>${pri.length > 6 || sec.size ? `<p><strong>Also:</strong> ${esc([...new Set(pri.slice(6).concat([...sec]))].filter((m) => !pri.slice(0, 6).includes(m)).map((m) => P.MUSCLES[m]).join(', '))}</p>` : ''}</div></div>
      <div><h4>What you'll do</h4><div class="sessparts">
        <div class="spart"><strong>Warm-up</strong><span class="small muted">${esc(P.WARMUPS[S.warm].name)}</span></div>
        ${S.parts.map((x) => `<div class="spart"><div class="row between"><strong>${esc(x.title)}</strong>${x.rx ? `<span class="small num">${esc(x.rx[b])}</span>` : ''}</div><div class="spart-ex">${x.items.map((it) => { const id = Array.isArray(it) ? it[0] : it, ex = P.EX[id]; return `<div class="sx"><button class="sx-fig" data-ex="${id}" aria-label="How to do ${esc(ex.n)}">${fig(id)}</button><div class="sx-body"><div class="row between"><button class="link sx-name" data-ex="${id}">${esc(ex.n)}</button>${Array.isArray(it) ? `<strong class="num sx-rx">${esc(it[1][b])}</strong>` : ''}</div><span class="small muted">${esc((ex.pri || []).map((m) => P.MUSCLES[m]).join(', '))}${ex.aim ? ' · ' + esc(ex.aim) : ''}</span><div class="altrow-in"><span class="small"><strong>Alternatives:</strong></span>${altList(ex)}</div></div></div>`; }).join('')}</div></div>`).join('')}
      </div></div>
      <p class="note"><strong>Training together:</strong> ${esc(S.partner)}</p>
      ${date && date === state.date ? `<button class="btn primary big" id="sd-start">${(findDoc('sessions', me + '_' + date) || {}).done ? 'Open workout again' : 'Start workout'}</button>` : ''}`;
    hydrate($('#sessdlg-body'));
    const d = $('#sessdlg'); $('#sd-close').onclick = () => d.close();
    const st = $('#sd-start'); if (st) st.onclick = () => { d.close(); openWorkout(sid, date, me); };
    if (!d.open) d.showModal();
  }
  $('#sessdlg').addEventListener('click', (e) => { if (e.target.id === 'sessdlg') e.target.close(); });
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-sess]'); if (b) { e.preventDefault(); openSession(b.dataset.sess, b.dataset.sdate || null); } });

  /* ================= Meal sheet ================= */
  function mealFor(p, s, i) {
    const D = dayPlan(s), it = D.items[i], chosen = (dailyOf(p, s).meals || {})[i];
    if (chosen && P.MEALS[chosen]) return chosen;
    return pickMeal(it[2], Math.max(0, diffDays(P.START, s)) + i, s + ':' + i, it[4]).id;
  }
  function openMealSheet(p, s, i) { state.sheet = { p, s, i }; drawMealSheet(); const d = $('#mealsheet'); if (!d.open) d.showModal(); }
  function drawMealSheet() {
    const { p, s, i } = state.sheet, n = names(), q = other(p), D = dayPlan(s), it = D.items[i], cur = mealFor(p, s, i), m = P.MEALS[cur];
    const isFlex = dailyOf(p, s).flex === i, canFlex = !isFlex && !flexUsed(p, s) && dailyOf(p, s).flex == null;
    const flexBlock = `<div class="flexbox"><h4>Flex meal</h4>${isFlex ? `<ul class="clean">${P.FLEX.flexRules.map((r) => `<li>${esc(fillFlex(r))}</li>`).join('')}</ul><button class="btn" id="ms-unflex" ${ro()}>Back to the planned meal</button>` : canFlex ? `<p class="small muted">One meal a week can be anything you like, up to ~${P.FLEX.flexKcal[p].toLocaleString('en')} kcal.</p><button class="btn" id="ms-flex" ${ro()}>Make this my flex meal</button>` : '<p class="small muted">Flex meal already used this week.</p>'}</div>`;
    if (isFlex) {
      $('#mealsheet-body').innerHTML = `<div class="sheet-grab" aria-hidden="true"></div><div class="sheet-head"><div><span class="small muted">${it[0]} · ${esc(it[3] || P.CATS[it[2]])}</span><h2 id="mealsheet-title">Flex meal</h2></div><button class="btn sm" id="ms-close">Close</button></div>${flexBlock}`;
      $('#ms-close').onclick = () => $('#mealsheet').close();
      $('#ms-unflex').onclick = async () => { await saveDaily(p, s, { flex: null }); $('#mealsheet').close(); rerender(); };
      return;
    }
    const alts = Object.keys(P.MEALS).filter((k) => P.MEALS[k].cat === P.MEALS[cur].cat && k !== cur);
    const planPick = pickMeal(it[2], Math.max(0, diffDays(P.START, s)) + i, s + ':' + i, it[4]).id;
    const recipes = (P.MEAL_RECIPES[cur] || []).map((r) => P.RECIPES.find((x) => x.id === r));
    $('#mealsheet-body').innerHTML = `
      <div class="sheet-grab" aria-hidden="true"></div>
      <div class="sheet-head"><div><span class="small muted">${it[0]} · ${esc(it[3] || P.CATS[it[2]])}</span><h2 id="mealsheet-title">${esc(m.n)}</h2><span class="ar" lang="ar" dir="rtl">${esc(m.ar)}</span></div><button class="btn sm" id="ms-close">Close</button></div>
      <div class="row">${unitToggle()}</div>
      <div class="portion-card" style="border-color:${pcol(p)}"><div class="row between"><strong style="color:${pcol(p)}">${esc(n[p])}'s portion</strong><span class="num small"><strong>~${m[p + 'k'][0]} kcal</strong> · <strong>${m[p + 'k'][1]} g protein</strong></span></div><ul class="clean">${m[p].map((x) => `<li>${unitMode === 'both' ? fmtItem([esc(x[0]), x[1], x[2], x[3]]) : esc(fmtItem(x))}</li>`).join('')}</ul></div>
      <details><summary>${esc(n[q])}'s portion</summary><p class="small">${fmtItems(m[q])} <span class="muted">· ~${m[q + 'k'][0]} kcal · ${m[q + 'k'][1]} g protein</span></p></details>
      ${recipes.length ? `<div class="row">${recipes.map((r) => `<button class="btn" data-recipe="${r.id}">Recipe: ${esc(r.n)}</button>`).join('')}</div>` : ''}
      ${alts.length ? `<div><h4>Alternatives</h4><label class="check small" for="ms-both"><input type="checkbox" id="ms-both" ${state.sheetBoth !== false ? 'checked' : ''}><span>Swap it for ${esc(n[q])} too</span></label>
      <div class="altmeals">${alts.map((k) => { const a = P.MEALS[k], dk = a[p + 'k'][0] - m[p + 'k'][0]; return `<div class="altmeal"><div><strong>${esc(a.n)}</strong> <span class="ar" lang="ar" dir="rtl">${esc(a.ar)}</span><br><span class="small muted num">~${a[p + 'k'][0]} kcal (${dk >= 0 ? '+' : '−'}${Math.abs(dk)}) · ${a[p + 'k'][1]} g protein</span><br><span class="small">${esc(a[p].slice(0, 3).map((x) => x[3] + ' ' + x[0].replace(/\s*\(.*\)/, '')).join(' · '))}</span></div><button class="btn sm primary" data-choose="${k}" ${ro()}>Choose</button></div>`; }).join('')}</div></div>` : ''}
      ${flexBlock}
      ${cur !== planPick ? `<button class="link" id="ms-reset">Back to the plan's pick (${esc(P.MEALS[planPick].n)})</button>` : ''}`;
    $('#ms-close').onclick = () => $('#mealsheet').close();
    const both = $('#ms-both'); if (both) both.onchange = () => { state.sheetBoth = both.checked; };
    const setMeal = async (k) => {
      const who = [p].concat($('#ms-both') && $('#ms-both').checked ? [q] : []);
      for (const x of who) { const meals = Object.assign({}, dailyOf(x, s).meals || {}); if (k) meals[i] = k; else delete meals[i]; await saveDaily(x, s, { meals }); }
      $('#mealsheet').close(); rerender();
    };
    $$('[data-choose]', $('#mealsheet-body')).forEach((b) => (b.onclick = () => setMeal(b.dataset.choose)));
    const rs = $('#ms-reset'); if (rs) rs.onclick = () => setMeal(null);
    const fx = $('#ms-flex'); if (fx) fx.onclick = async () => { await saveDaily(p, s, { flex: i }); $('#mealsheet').close(); rerender(); };
    $$('[data-recipe]', $('#mealsheet-body')).forEach((b) => b.addEventListener('click', () => $('#mealsheet').close()));
  }
  $('#mealsheet').addEventListener('click', (e) => { if (e.target.id === 'mealsheet') e.target.close(); });

  /* ================= Views: day / week / month × Ahmed / Yousr / both ================= */
  state.view = lsGet('swimplan-view', 'day'); state.who = lsGet('swimplan-who', me);
  const clampD = (d) => (d < P.START ? P.START : d > END ? END : d);
  const weekStartOf = (d) => addDays(d, -((dow(d) + 1) % 7)); // Saturday
  function viewBar() {
    const n = names(), s = state.date, w = weekOf(s);
    const label = state.view === 'day' ? fmt(s, { weekday: 'short', day: 'numeric', month: 'short' }) : state.view === 'week' ? `Week ${w || '–'} · ${fmt(weekStartOf(s), { day: 'numeric', month: 'short' })} – ${fmt(addDays(weekStartOf(s), 6), { day: 'numeric', month: 'short' })}` : fmt(s, { month: 'long', year: 'numeric' });
    const whoBtn = (k, l, c) => `<button data-who="${k}" aria-pressed="${state.who === k}" style="${state.who === k ? `background:${c};border-color:${c};color:var(--surface)` : ''}">${esc(l)}</button>`;
    return `<div class="viewbar card"><div class="row between"><div class="seg-ctl" role="group" aria-label="View">${[['day', 'Day'], ['week', 'Week'], ['month', 'Month']].map(([k, l]) => `<button data-view="${k}" aria-pressed="${state.view === k}">${l}</button>`).join('')}</div>
      <div class="seg-ctl" role="group" aria-label="Who">${whoBtn('a', n.a, 'var(--him)')}${whoBtn('b', n.b, 'var(--her)')}${whoBtn('both', 'Both', 'var(--ink)')}</div></div>
      <div class="row between"><div class="row"><button class="btn sm" data-step="-1" aria-label="Previous">‹</button><strong class="vlabel">${esc(label)}</strong><button class="btn sm" data-step="1" aria-label="Next">›</button></div><div class="row"><button class="btn sm" data-step="0">Today</button><input type="date" id="daypick" value="${s}" min="${P.START}" max="${END}" class="btn sm" aria-label="Pick a date"></div></div></div>`;
  }
  function bindViewBar(v) {
    $$('[data-view]', v).forEach((b) => (b.onclick = () => { state.view = b.dataset.view; lsSet('swimplan-view', state.view); renderToday(); }));
    $$('[data-who]', v).forEach((b) => (b.onclick = () => { state.who = b.dataset.who; lsSet('swimplan-who', state.who); if (state.who !== 'both') { me = state.who; lsSet('swimplan-me', me); } state.edit = {}; clearDirty(); renderToday(); }));
    $$('[data-step]', v).forEach((b) => (b.onclick = () => {
      const k = +b.dataset.step; let d = state.date;
      if (k === 0) d = todayCairo();
      else if (state.view === 'day') d = addDays(d, k);
      else if (state.view === 'week') d = addDays(d, 7 * k);
      else { const x = toD(d); x.setUTCMonth(x.getUTCMonth() + k, 1); d = toS(x); if (k > 0 && d < P.START) d = P.START; }
      state.date = clampD(d); state.edit = {}; state.effort = null; clearDirty(); renderToday();
    }));
    const dp = $('#daypick', v); if (dp) dp.onchange = (e) => { if (e.target.value) { state.date = clampD(e.target.value); state.edit = {}; clearDirty(); renderToday(); } };
    $$('[data-goday]', v).forEach((x) => (x.onclick = () => { state.date = x.dataset.goday; state.view = 'day'; lsSet('swimplan-view', 'day'); if (x.dataset.gowho) { state.who = x.dataset.gowho; me = state.who; lsSet('swimplan-who', me); lsSet('swimplan-me', me); } renderToday(); window.scrollTo(0, 0); }));
  }
  const TLABEL = { weigh: 'Weigh-in', supps: 'Supplements', swim: 'Swim', gym: 'Gym session', food: 'Ate to plan' };
  function taskDetail(p, s, id) {
    if (id === 'weigh') { const l = findDoc('log', p + '_' + s); return l ? l.weight.toFixed(1) + ' kg' : ''; }
    if (id === 'swim') { const x = findDoc('swims', p + '_' + s); return x ? (x.dist || 0).toLocaleString('en') + ' m' + (x.effort ? ' · ' + x.effort : '') : ''; }
    if (id === 'gym') { const x = findDoc('sessions', p + '_' + s); return x && x.done ? 'Done' + (x.rpe ? ' · ' + x.rpe + '/10' : '') : ''; }
    return '';
  }
  const pct = (p, d) => { const t = tasksFor(p, d); return t.length ? t.filter((x) => x.done).length / t.length : 0; };
  function periodStats(p, from, to) {
    const days = []; for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
    const past = days.filter((d) => d <= todayCairo() && d >= P.START && d <= END);
    const gymPlan = days.filter((d) => d >= P.START && d <= END && dayPlan(d).gym).length, swimPlan = days.filter((d) => d >= P.START && d <= END && dayPlan(d).swim).length;
    const gym = store.sessions.filter((x) => x.person === p && x.done && x.date >= from && x.date <= to).length;
    const sw = store.swims.filter((x) => x.person === p && x.date >= from && x.date <= to);
    const ws = store.log.filter((x) => x.person === p && x.date >= from && x.date <= to).sort((x, y) => (x.date < y.date ? -1 : 1));
    let got = 0, tot = 0; past.forEach((d) => tasksFor(p, d).forEach((t) => { tot++; if (t.done) got++; }));
    return { gym, gymPlan, swims: sw.length, swimPlan, km: sw.reduce((a, x) => a + (x.dist || 0), 0) / 1000, wAvg: avg(ws.map((x) => x.weight)), wFirst: ws[0], wLast: ws[ws.length - 1], score: tot ? Math.round((got / tot) * 100) : null, prs: prList(p).filter((x) => x.date >= from && x.date <= to).length };
  }
  function statCard(p, st, title) {
    const n = names(), ch = st.wFirst && st.wLast && st.wFirst !== st.wLast ? st.wLast.weight - st.wFirst.weight : null;
    return `<div class="card"><div class="row between"><h3 style="color:${pcol(p)}">${esc(n[p])}</h3><span class="chip">${esc(title)}</span></div><div class="pstats">
      <div class="stat"><span class="v">${st.score == null ? '–' : st.score + '%'}</span><span class="l">Checklist done</span></div>
      <div class="stat"><span class="v">${st.gym}/${st.gymPlan}</span><span class="l">Gym sessions</span></div>
      <div class="stat"><span class="v">${st.swims}/${st.swimPlan}</span><span class="l">Swims · ${st.km.toFixed(1)} km</span></div>
      <div class="stat"><span class="v">${st.wAvg == null ? '–' : st.wAvg.toFixed(1)}</span><span class="l">Avg weight${ch != null ? ` (${ch <= 0 ? '−' : '+'}${Math.abs(ch).toFixed(1)})` : ''}</span></div>
      ${st.prs ? `<div class="stat"><span class="v">${st.prs}</span><span class="l">New bests</span></div>` : ''}</div></div>`;
  }
  function renderOverview(v) {
    const n = names(), s = state.date, whos = state.who === 'both' ? ['a', 'b'] : [state.who], today = todayCairo();
    let body = '';
    if (state.view === 'day') {
      const D = dayPlan(s), ids = ['weigh', 'supps', 'swim', 'gym', 'food'].filter((id) => ['a', 'b'].some((p) => tasksFor(p, s).some((t) => t.id === id)));
      body = `<div class="grid2">${['a', 'b'].map((p) => { const t = tasksFor(p, s), d = t.filter((x) => x.done).length; return `<div class="card both-head"><div>${ring(d, t.length, pcol(p))}</div><div><h3 style="color:${pcol(p)}">${esc(n[p])}</h3><span class="small muted">${d === t.length ? 'Day complete' : `${t.length - d} left`} · ${streak(p)}-day streak</span><br><button class="btn sm" data-goday="${s}" data-gowho="${p}">Open ${esc(n[p])}'s checklist</button></div></div>`; }).join('')}</div>
        <div class="card"><div class="row between"><h3>${esc(D.name)}</h3><div class="row">${D.swim ? `<span class="chip swim">Swim ${esc(D.swim)}</span>` : ''}${D.gym ? `<span class="chip gym">${esc(P.SESSIONS[D.gym].short)}</span>` : ''}${D.type === 'rest' ? '<span class="chip rest">Rest day</span>' : ''}</div></div>
        <div class="logtable"><table class="cmp"><thead><tr><th></th><th style="color:var(--him)">${esc(n.a)}</th><th style="color:var(--her)">${esc(n.b)}</th></tr></thead><tbody>
        ${ids.map((id) => `<tr><td><strong>${TLABEL[id]}</strong></td>${['a', 'b'].map((p) => { const t = tasksFor(p, s).find((x) => x.id === id); return `<td>${t ? `<span class="cell-in">${check(t.done)}<span class="small">${esc(taskDetail(p, s, id))}</span></span>` : '<span class="muted small">–</span>'}</td>`; }).join('')}</tr>`).join('')}
        </tbody></table></div></div>`;
    } else if (state.view === 'week') {
      const ws = weekStartOf(s), we = addDays(ws, 6), days = [...Array(7)].map((_, i) => addDays(ws, i));
      body = `<div class="grid2">${whos.map((p) => statCard(p, periodStats(p, ws, we), 'This week')).join('')}</div>
        <div class="card"><div class="weekgrid">${days.map((d) => { const D = dayPlan(d), inP = d >= P.START && d <= END; return `<button class="wday ${d === today ? 'is-today' : ''}" data-goday="${d}" ${!inP ? 'disabled' : ''}>
          <span class="wd-h"><strong>${fmt(d, { weekday: 'short' })}</strong> <span class="muted small">${fmt(d, { day: 'numeric', month: 'short' })}</span></span>
          <span class="wd-plan">${D.swim ? `<span class="chip swim">Swim</span>` : ''}${D.gym ? `<span class="chip gym">${esc(P.SESSIONS[D.gym].short)}</span>` : ''}${D.type === 'rest' ? '<span class="chip rest">Rest</span>' : ''}${isFree(d) ? '<span class="chip free">Free day</span>' : ''}</span>
          ${whos.map((p) => { const t = tasksFor(p, d), dn = t.filter((x) => x.done).length; return `<span class="wd-p"><span class="minibar"><i style="width:${(dn / t.length) * 100}%;background:${pcol(p)}"></i></span><span class="small num">${whos.length > 1 ? esc(n[p][0]) + ' ' : ''}${dn}/${t.length}</span></span><span class="wd-icons small muted">${['weigh', 'swim', 'gym'].map((id) => { const x = t.find((y) => y.id === id); return x ? `<span class="${x.done ? 'ok' : d < today ? 'miss' : ''}">${{ weigh: 'weigh-in', swim: 'swim', gym: 'gym' }[id]}</span>` : ''; }).join('')}</span>`; }).join('')}
        </button>`; }).join('')}</div></div>`;
    } else {
      const m0 = toD(s); m0.setUTCDate(1); const first = toS(m0); const m1 = new Date(m0); m1.setUTCMonth(m1.getUTCMonth() + 1); const last = addDays(toS(m1), -1);
      const gridStart = weekStartOf(first), cells = []; for (let d = gridStart; d <= last || cells.length % 7; d = addDays(d, 1)) cells.push(d);
      body = `<div class="grid2">${whos.map((p) => statCard(p, periodStats(p, first, last), fmt(first, { month: 'long' }))).join('')}</div>
        <div class="card"><div class="monthgrid">${['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((x) => `<span class="mh">${x}</span>`).join('')}
        ${cells.map((d) => { const inM = d >= first && d <= last, inP = d >= P.START && d <= END, D = dayPlan(d); return `<button class="mday ${inM ? '' : 'out'} ${d === today ? 'is-today' : ''}" data-goday="${d}" ${!inP ? 'disabled' : ''}>
          <span class="md-n num">${toD(d).getUTCDate()}</span>${inP ? `<span class="md-plan">${D.swim ? '<i class="pd swim"></i>' : ''}${D.gym ? '<i class="pd gym"></i>' : ''}${isFree(d) ? '<i class="pd free"></i>' : ''}</span>
          <span class="md-dots">${d <= today ? whos.map((p) => `<span class="dotp" style="background:${pcol(p)};opacity:${0.15 + pct(p, d) * 0.85}" title="${esc(n[p])}: ${Math.round(pct(p, d) * 100)}%"></span>`).join('') : ''}</span>` : ''}</button>`; }).join('')}</div>
        <div class="row small muted legendrow"><span><i class="pd swim"></i> swim day</span><span><i class="pd gym"></i> gym day</span><span><i class="pd free"></i> free day</span>${whos.map((p) => `<span><span class="dotp" style="background:${pcol(p)}"></span> ${esc(n[p])}: darker = more of the checklist done</span>`).join('')}</div></div>`;
    }
    v.innerHTML = viewBar() + body + statusEl();
    bindViewBar(v);
  }

  /* ================= Workout mode ================= */
  const WOKEY = 'swimplan-workout';
  let WO = null;
  const resumeAvailable = (p, s) => { const w = lsGet(WOKEY, null); return w && w.p === p && w.s === s && w.i > 0; };
  function restFor(partTitle, isKey) { const t = partTitle.toLowerCase(); if (t.includes('plyo') || t.includes('explosive')) return 75; if (isKey) return 120; if (t.includes('shoulder') || t.includes('core') || t.includes('superset')) return 45; return 75; }
  function openWorkout(sid, s, p) {
    const S = P.SESSIONS[sid], b = blockFor(s), keys = Object.fromEntries((P.KEYLIFTS[sid] || []).map(([k, inc]) => [k, inc]));
    const saved = lsGet(WOKEY, null);
    const steps = [{ type: 'warm' }];
    S.parts.forEach((pt) => { if (pt.rx) steps.push({ type: 'block', part: pt }); else pt.items.forEach(([id, rx]) => steps.push({ type: 'ex', id, rx: rx[b], part: pt.title, key: keys[id] != null })); });
    steps.push({ type: 'finish' });
    const sd = findDoc('sessions', p + '_' + s) || {};
    WO = saved && saved.p === p && saved.s === s && saved.sid === sid ? Object.assign(saved, { steps }) : { sid, s, p, b, i: 0, steps, sets: {}, loads: {}, hits: {}, rpe: sd.rpe || null, note: sd.note || '' };
    if (!saved || saved.s !== s) Object.entries(sd.lifts || {}).forEach(([k, x]) => { WO.loads[k] = x.kg; WO.hits[k] = x.hit; });
    $('#wo').showModal(); drawWorkout();
  }
  const saveWO = () => lsSet(WOKEY, Object.assign({}, WO, { steps: undefined }));
  let restT = null, restLeft = 0;
  function startRest(sec) {
    clearInterval(restT); restLeft = sec; try { T.ctx = T.ctx || new (window.AudioContext || window.webkitAudioContext)(); T.ctx.resume(); } catch (e) { /* no audio */ }
    const tick = () => { const el = $('#restbar'); if (el) { el.hidden = restLeft <= 0; $('#restleft').textContent = fmtTime(restLeft); } if (restLeft <= 3 && restLeft > 0) beep(660, .12); if (restLeft <= 0) { clearInterval(restT); beep(990, .4); } restLeft--; };
    tick(); restT = setInterval(tick, 1000);
  }
  function drawWorkout() {
    const box = $('#wo-body'), W = WO, st = W.steps[W.i], S = P.SESSIONS[W.sid], n = names(), total = W.steps.length;
    let body = '';
    if (st.type === 'warm') {
      const wu = P.WARMUPS[S.warm];
      body = `<h4>Step 1 · Warm up</h4><h2>${esc(wu.name)}</h2><div class="wo-list">${wu.items.map(([id, rx]) => `<button class="exrow" data-ex="${id}">${fig(id)}<span class="nm">${esc(P.EX[id].n)}</span><span class="rx">${esc(rx)}</span></button>`).join('')}</div>`;
    } else if (st.type === 'block') {
      const pt = st.part;
      body = `<h4>${esc(pt.title)}</h4><h2 class="num">${esc(pt.rx[W.b])}</h2>${S.id === 'A' ? `<p class="muted">Use the interval timer: it calls out each station and whose turn it is.</p><a class="btn primary" href="#timer" id="wo-timer">Open the interval timer</a>` : ''}
        <div class="wo-list">${pt.items.map((id) => `<button class="exrow" data-ex="${id}">${fig(id)}<span><span class="nm">${esc(P.EX[id].n)}</span><br><span class="alt">${esc(P.EX[id].cues[0])}</span></span><span></span></button>`).join('')}</div>
        <label class="check bigcheck" for="wo-blockdone"><input type="checkbox" id="wo-blockdone" ${W.sets['blk' + W.i] ? 'checked' : ''}><span>Done</span></label>`;
    } else if (st.type === 'ex') {
      const ex = P.EX[st.id], nsets = +((st.rx || '').match(/^(\d+)\s*[×x]/) || [0, 3])[1] || 3, sets = W.sets[st.id] || [];
      const sg = st.key ? suggest(W.p, st.id, (P.KEYLIFTS[W.sid].find((k) => k[0] === st.id) || [0, 2.5])[1], W.s) : null;
      if (st.key && W.loads[st.id] == null && sg && sg.kg != null) W.loads[st.id] = sg.kg;
      body = `<h4>${esc(st.part)}</h4><div class="wo-ex"><div class="wo-fig" data-ex="${st.id}">${fig(st.id, 'bigfig')}</div>
        <div class="wo-info"><h2>${esc(ex.n)}</h2><div class="wo-rx num">${esc(st.rx)}</div><p class="small"><strong>Works:</strong> ${esc((ex.pri || []).map((m) => P.MUSCLES[m]).join(', '))}</p>
        <ul class="clean">${ex.cues.slice(0, 2).map((c) => `<li>${esc(c)}</li>`).join('')}</ul><button class="link" data-ex="${st.id}">More: cues, muscle map, demo videos</button></div></div>
        <div class="wo-alts"><strong class="small">No equipment free or too hard? Swap for:</strong><div class="altrow-in">${altList(ex)}</div></div>
        ${st.key ? `<div class="wo-load"><label for="wo-kg">${st.id === 'pullup' ? 'Added weight (kg, 0 = bodyweight)' : 'Weight for your working sets (kg)'}</label><div class="row"><button class="btn" data-kg="-${(P.KEYLIFTS[W.sid].find((k) => k[0] === st.id) || [0, 2.5])[1]}" type="button">−</button><input type="number" id="wo-kg" step="0.5" min="0" inputmode="decimal" value="${W.loads[st.id] != null ? W.loads[st.id] : ''}" class="bigin"><button class="btn" data-kg="${(P.KEYLIFTS[W.sid].find((k) => k[0] === st.id) || [0, 2.5])[1]}" type="button">+</button>
          <label class="check" for="wo-hit"><input type="checkbox" id="wo-hit" ${W.hits[st.id] !== false ? 'checked' : ''}><span>Got every rep</span></label></div><span class="small muted">${sg ? sg.text : ''}</span></div>` : ''}
        <div class="sets" role="group" aria-label="Sets">${[...Array(nsets)].map((_, k) => `<button class="setbtn ${sets[k] ? 'on' : ''}" data-set="${k}" type="button">${sets[k] ? '✓' : 'Set ' + (k + 1)}</button>`).join('')}</div>
        <p class="small muted">Tap a set when you finish it. The rest timer starts on its own.</p>`;
    } else {
      const lifts = Object.entries(W.loads).filter(([, kg]) => kg != null);
      body = `<h4>Finish</h4><h2>How did it feel?</h2><div class="pills big">${[['Easy', 6], ['Good', 7], ['Hard', 8], ['Very hard', 9]].map(([l, r]) => `<button class="pill ${W.rpe === r ? 'on' : ''}" data-rpe="${r}" type="button">${l}</button>`).join('')}</div>
        ${lifts.length ? `<div><h4>Your loads today</h4><ul class="clean">${lifts.map(([k, kg]) => `<li>${esc(P.EX[k].n)}: <strong class="num">${kg} kg</strong> ${W.hits[k] !== false ? '✓' : '(missed reps)'}</li>`).join('')}</ul></div>` : ''}
        <label class="small muted" for="wo-note">Note (optional)</label><input type="text" id="wo-note" maxlength="140" value="${esc(W.note || '')}" placeholder="Felt strong, shoulder tight, etc.">
        <button class="btn primary big" id="wo-save" ${ro()}>Save workout</button><div id="wo-result"></div>`;
    }
    box.innerHTML = `<div class="wo-top"><button class="btn sm" id="wo-close">Close</button><div class="wo-prog"><i style="width:${(W.i / (total - 1)) * 100}%;background:${pcol(W.p)}"></i></div><span class="small num">${W.i + 1} / ${total}</span></div>
      <div class="wo-main">${body}</div>
      <div class="restbar" id="restbar" hidden><span>Rest</span><strong class="num" id="restleft"></strong><button class="btn sm" id="restskip">Skip</button></div>
      <div class="wo-nav"><button class="btn big" id="wo-prev" ${W.i === 0 ? 'disabled' : ''}>Back</button>${st.type !== 'finish' ? `<button class="btn primary big" id="wo-next">${W.i === total - 2 ? 'Finish' : 'Next'}</button>` : ''}</div>`;
    hydrate(box);
    $('#wo-close').onclick = () => { saveWO(); clearInterval(restT); $('#wo').close(); rerender(); };
    $('#wo-prev').onclick = () => { W.i = Math.max(0, W.i - 1); saveWO(); drawWorkout(); };
    const nx = $('#wo-next'); if (nx) nx.onclick = () => { W.i = Math.min(total - 1, W.i + 1); saveWO(); drawWorkout(); $('#wo-body').scrollTop = 0; };
    $('#restskip').onclick = () => { restLeft = 0; clearInterval(restT); $('#restbar').hidden = true; };
    const bd = $('#wo-blockdone'); if (bd) bd.onchange = () => { W.sets['blk' + W.i] = bd.checked; saveWO(); };
    const tm = $('#wo-timer'); if (tm) tm.onclick = () => { saveWO(); $('#wo').close(); };
    $$('[data-set]', box).forEach((btn) => (btn.onclick = () => { const id = st.id, k = +btn.dataset.set; const arr = W.sets[id] = W.sets[id] || []; arr[k] = !arr[k]; btn.classList.toggle('on', !!arr[k]); btn.textContent = arr[k] ? '✓' : 'Set ' + (k + 1); saveWO(); if (arr[k]) startRest(restFor(st.part, st.key)); }));
    const kg = $('#wo-kg'); if (kg) { kg.oninput = () => { W.loads[st.id] = num(kg.value); saveWO(); }; $$('[data-kg]', box).forEach((x) => (x.onclick = () => { const v = (num(kg.value) || 0) + +x.dataset.kg; kg.value = Math.max(0, v); W.loads[st.id] = Math.max(0, v); saveWO(); })); }
    const hit = $('#wo-hit'); if (hit) hit.onchange = () => { W.hits[st.id] = hit.checked; saveWO(); };
    $$('[data-rpe]', box).forEach((x) => (x.onclick = () => { W.rpe = +x.dataset.rpe; $$('[data-rpe]', box).forEach((y) => y.classList.toggle('on', y === x)); saveWO(); }));
    const sv = $('#wo-save');
    if (sv) sv.onclick = async () => {
      W.note = $('#wo-note').value.trim();
      const lifts = {}; Object.entries(W.loads).forEach(([k, kg]) => { if (kg != null) lifts[k] = { kg, hit: W.hits[k] !== false }; });
      const prevBest = {}; store.sessions.filter((x) => x.person === W.p && x.date < W.s && x.lifts).forEach((x) => Object.entries(x.lifts).forEach(([k, v]) => { prevBest[k] = Math.max(prevBest[k] || 0, v.kg); }));
      const prs = Object.entries(lifts).filter(([k, v]) => prevBest[k] != null && v.kg > prevBest[k]);
      const setsDone = Object.entries(W.sets).reduce((a, [, x]) => a + (Array.isArray(x) ? x.filter(Boolean).length : x ? 1 : 0), 0);
      const rec = { person: W.p, date: W.s, week: weekOf(W.s), session: W.sid, block: W.b, done: true, lifts, setsDone };
      if (W.rpe) rec.rpe = W.rpe; if (W.note) rec.note = W.note;
      if (await put('sessions', W.p + '_' + W.s, rec)) {
        lsSet(WOKEY, null); confetti();
        $('#wo-result').innerHTML = `<div class="advice good"><strong>Workout saved.</strong> ${setsDone} sets done.${prs.length ? ' New bests: ' + prs.map(([k, v]) => `${esc(P.EX[k].n)} ${v.kg} kg`).join(', ') + '.' : ''}</div><button class="btn" id="wo-done">Back to Today</button>`;
        $('#wo-done').onclick = () => { $('#wo').close(); rerender(); };
      }
    };
  }

  /* ================= Health ================= */
  function renderHealth() {
    const H = P.HEALTH, n = names(), p = state.healthP || me || 'a';
    const tests = H.tests.filter((t) => t.who === 'both' || t.who === p);
    const doc = (r) => findDoc('health', p + '_' + r) || {};
    $('#v-health').innerHTML = `
      <div class="card"><div class="row between"><h2>Bloodwork + health checks</h2>${statusEl()}</div>
      <p class="muted">A baseline before week 1 and a re-check in week 10 show what the training and diet are doing inside, not just on the scale. ${esc(H.labs)}</p>
      <div class="row">${H.rounds.map((r) => `<span class="chip dl">${esc(r.label)}: ${esc(r.when)}</span>`).join('')}</div></div>
      <div class="grid2"><div class="card"><h3>Before the blood test</h3><ul class="clean">${H.prep.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="card"><h3>Other checks</h3><dl class="kv">${H.other.map((x) => `<dt>${esc(x.n.replace('Yousr', n.b))}</dt><dd>${esc(x.why.replace('Yousr', n.b))}</dd>`).join('')}</dl></div></div>
      <div class="card"><div class="row between"><h3>Tests to ask for</h3><div class="blockpick">${['a', 'b'].map((k) => `<button data-hp="${k}" aria-pressed="${k === p}">${esc(n[k])}</button>`).join('')}</div></div>
      <p class="small muted">Write your results in as you get them (value and unit, e.g. "45 ng/mL"). Bring the list to your doctor to read them with you.</p>
      <div class="logtable"><table class="htable"><thead><tr><th>Test</th><th>Why</th>${H.rounds.map((r) => `<th>${esc(r.label)}</th>`).join('')}</tr></thead><tbody>
      ${tests.map((t) => `<tr><td><strong>${esc(t.n)}</strong>${t.optional ? ' <span class="chip">Optional</span>' : ''}${t.key === p ? ' <span class="chip dl">Important for you</span>' : ''}</td><td class="small">${esc(t.why.replace('Yousr', n.b).replace("Ahmed's", n.a + "'s"))}</td>${H.rounds.map((r) => `<td><input type="text" class="hval" id="hv-${r.id}-${t.id}" data-r="${r.id}" data-t="${t.id}" value="${esc((doc(r.id).values || {})[t.id] || '')}" maxlength="40" aria-label="${esc(t.n)} ${esc(r.label)}"></td>`).join('')}</tr>`).join('')}
      </tbody></table></div><button class="btn primary" id="h-save" ${ro()}>Save ${esc(n[p])}'s results</button></div>
      <p class="small muted">General information to discuss with your doctor, not medical advice. A doctor should interpret the results and decide on any treatment or supplement changes.</p>`;
    $$('[data-hp]').forEach((x) => (x.onclick = () => { state.healthP = x.dataset.hp; renderHealth(); }));
    $('#h-save').onclick = async () => {
      for (const r of H.rounds) {
        const values = Object.assign({}, doc(r.id).values || {});
        $$(`.hval[data-r="${r.id}"]`).forEach((i) => { const v = i.value.trim(); if (v) values[i.dataset.t] = v; else delete values[i.dataset.t]; });
        if (Object.keys(values).length || findDoc('health', p + '_' + r.id)) await put('health', p + '_' + r.id, { person: p, round: r.id, values });
      }
      clearDirty($('#v-health'));
    };
  }

  /* ================= Weekly review + backup ================= */
  function reviewCard(full) {
    const r = store.reviews.slice().sort((x, y) => (x.date < y.date ? 1 : -1))[0];
    if (!r) return full ? `<div class="card review"><h3>Friday review</h3><p class="muted small">Each Friday Claude reads both your logs and leaves a short review here: what went well, and any calorie or training changes for next week.</p></div>` : '';
    if (!full && lsGet('swimplan-seen-review', '') === r._id) return '';
    return `<div class="card review"><div class="row between"><h3>Friday review · week ${r.week || ''}</h3><span class="small muted">${fmt(r.date)}</span></div>${String(r.text || '').split(/\n{2,}/).map((x) => `<p>${esc(x).replace(/\n/g, '<br>')}</p>`).join('')}${full ? '' : `<button class="link" data-seenrev="${esc(r._id)}">Got it, hide</button>`}</div>`;
  }
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-seenrev]'); if (b) { lsSet('swimplan-seen-review', b.dataset.seenrev); rerender(); } });
  const CSVCOLS = {
    log: ['date', 'person', 'weight', 'waist', 'note'], sessions: ['date', 'person', 'session', 'block', 'rpe', 'lifts', 'home', 'note'], swims: ['date', 'person', 'dist', 'effort', 'text'],
    daily: ['date', 'person', 'suppsDone', 'food', 'flex', 'status'], inbody: ['date', 'person', 'weight', 'smm', 'fat', 'pbf', 'vfl', 'bmr'], bench: ['round', 'person', 'broad', 'pullups', 't100', 't400'], health: ['round', 'person', 'values']
  };
  const LABELS = { log: 'Weigh-ins', sessions: 'Workouts', swims: 'Swims', daily: 'Daily check-ins', inbody: 'InBody scans', bench: 'Benchmark tests', health: 'Bloodwork' };
  function toCSV(col) {
    const cols = CSVCOLS[col], n = names();
    const cell = (v) => { if (v == null) return ''; if (typeof v === 'object') v = col === 'sessions' ? Object.entries(v).map(([k, x]) => `${P.EX[k] ? P.EX[k].n : k} ${x.kg}kg${x.hit ? '' : ' (missed reps)'}`).join('; ') : Object.entries(v).map(([k, x]) => `${k}: ${x}`).join('; '); const t = String(v); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
    const rows = store[col].slice().sort((x, y) => String(x.date || x.round).localeCompare(String(y.date || y.round)));
    return [cols.join(',')].concat(rows.map((r) => cols.map((c) => cell(c === 'person' ? n[r.person] || r.person : c === 'session' && P.SESSIONS[r[c]] ? P.SESSIONS[r[c]].short : r[c])).join(','))).join('\n');
  }
  function backupCard() {
    return `<div class="card"><div class="row between"><h3>Back up your data</h3><span class="status ${statusCls}" data-status>${esc(statusMsg)}</span></div><p class="small muted">Download any log as a spreadsheet (CSV opens in Excel, Numbers or Google Sheets), or everything in one file.</p>
      <div class="row">${Object.keys(CSVCOLS).map((c) => `<button class="btn sm" data-csv="${c}">${LABELS[c]} (${store[c].length})</button>`).join('')}<button class="btn sm primary" data-csv="all">Everything</button></div></div>`;
  }
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-csv]'); if (!b) return;
    const c = b.dataset.csv, stamp = todayCairo();
    const filename = c === 'all' ? `swim-plan-backup-${stamp}.json` : `swim-plan-${c}-${stamp}.csv`;
    const data = c === 'all' ? JSON.stringify({ exported: stamp, names: names(), data: store }, null, 2) : '\ufeff' + toCSV(c);
    let dl = null; try { dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch (err) { dl = null; }
    if (dl) { try { await dl.save({ filename, data }); setStatus('Saved ' + filename + '.', 'good'); return; } catch (err) { /* fall through to copy */ } }
    try { await navigator.clipboard.writeText(data); setStatus('Download isn\'t available here, so the data was copied instead. Paste it into a spreadsheet.', 'warn'); } catch (err) { setStatus('Couldn\'t download or copy here. Open the page on claude.ai and try again.', 'warn'); }
  });

  /* ================= Badges block for Analytics ================= */
  function badgesHTML() {
    const n = names();
    return `<div class="grid2">${['a', 'b'].map((p) => { const e = badges(p); return `<div class="card"><div class="row between"><h3 style="color:${pcol(p)}">${esc(n[p])}'s badges</h3><span class="chip">${e.size} / ${P.BADGES.length}</span></div><div class="badges">${P.BADGES.map((x) => `<div class="bdg ${e.has(x.id) ? 'got' : ''}"><span class="badge-ic ${e.has(x.id) ? '' : 'locked'}" style="${e.has(x.id) ? `background:${pcol(p)}` : ''}" aria-hidden="true"></span><span><strong>${esc(x.n)}</strong><br><span class="small muted">${esc(x.d)}</span></span></div>`).join('')}</div>
      <p class="small muted">${streak(p)}-day streak · ${prList(p).length} personal bests · ${(store.swims.filter((x) => x.person === p).reduce((a, x) => a + (x.dist || 0), 0) / 1000).toFixed(1)} km swum</p></div>`; }).join('')}</div>`;
  }

  /* ================= Dirty-field preservation ================= */
  const dirty = new Map();
  document.addEventListener('input', (e) => { const t = e.target; if (t.id && t.closest('main')) dirty.set(t.id, t.type === 'checkbox' ? t.checked : t.value); });
  document.addEventListener('change', (e) => { const t = e.target; if (t.id && t.closest('main') && !t.dataset.supp && !t.dataset.k) dirty.set(t.id, t.type === 'checkbox' ? t.checked : t.value); });
  function clearDirty(form) { if (!form) { dirty.clear(); return; } $$('[id]', form).forEach((i) => dirty.delete(i.id)); }
  function restoreDirty() { dirty.forEach((v, id) => { const i = document.getElementById(id); if (!i) return; if (i.type === 'checkbox') i.checked = v; else i.value = v; }); }

  /* ================= Router ================= */
  const VIEWS = { today: renderToday, health: renderHealth, schedule: renderSchedule, sessions: renderSessions, exercises: renderExercises, timer: renderTimer, nutrition: renderNutrition, recipes: renderRecipes, supplements: renderSupps, groceries: renderGroceries, fuel: renderFuel, body: renderBody, training: renderTraining, analytics: renderAnalytics };
  const current = () => { const h = location.hash.replace('#', ''); return VIEWS[h] ? h : 'today'; };
  const ICON = {
    today: '<path d="M4 12l5 5L20 6" />',
    train: '<path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12" />',
    food: '<path d="M3 11h18a9 9 0 0 1-18 0zM8 7c0-2 2-2 2-4M13 7c0-2 2-2 2-4" />',
    progress: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />',
    health: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />'
  };
  const GROUPS = [['today', 'Today', ['today']], ['train', 'Train', ['sessions', 'schedule', 'exercises', 'timer', 'fuel']], ['food', 'Food', ['nutrition', 'recipes', 'groceries']], ['progress', 'Progress', ['analytics', 'body', 'training']], ['health', 'Health', ['health', 'supplements']]];
  const SUBL = { sessions: 'Sessions', schedule: '12 weeks', exercises: 'Exercises', timer: 'Timer', fuel: 'Warm-ups + fueling', nutrition: 'Meal plan', recipes: 'Recipes', groceries: 'Groceries + prep', analytics: 'Overview + badges', body: 'Body', training: 'Training log', health: 'Bloodwork + checks', supplements: 'Supplements' };
  const lastIn = lsGet('swimplan-lastin', {});
  function drawNav(c) {
    const g = GROUPS.find((x) => x[2].includes(c)) || GROUPS[0];
    lastIn[g[0]] = c; lsSet('swimplan-lastin', lastIn);
    $('#mainnav').innerHTML = GROUPS.map(([id, label, views]) => `<a href="#${lastIn[id] && views.includes(lastIn[id]) ? lastIn[id] : views[0]}" ${id === g[0] ? 'aria-current="page"' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[id]}</svg><span>${label}</span></a>`).join('');
    $('#subnav').innerHTML = g[2].length > 1 ? g[2].map((v) => `<a href="#${v}" ${v === c ? 'aria-current="page"' : ''}>${SUBL[v]}</a>`).join('') : '';
    $('#subnav').parentElement.hidden = g[2].length < 2;
  }
  function show() {
    const c = current();
    $$('section.view').forEach((s) => s.classList.toggle('on', s.id === 'v-' + c));
    drawNav(c);
    VIEWS[c](); restoreDirty(); if (!(c === 'recipes' && state.recipe === null && false)) window.scrollTo(0, 0);
  }
  function rerender() {
    const c = current(); if (c === 'timer' || c === 'exercises' || c === 'fuel' || c === 'recipes') return; if (c === 'health' && document.activeElement && document.activeElement.classList.contains('hval')) return;
    const y = window.scrollY, f = document.activeElement && document.activeElement.id;
    VIEWS[c](); restoreDirty(); window.scrollTo(0, y);
    if (f) { const i = document.getElementById(f); if (i && i.focus) i.focus({ preventScroll: true }); }
  }
  function renderAll() { $('#who').textContent = names().a + ' & ' + names().b; if (current() === 'timer') { drawTimer(); return; } rerender(); }
  window.addEventListener('hashchange', show);
  $('#who').textContent = names().a + ' & ' + names().b;
  show();
  initDb();
})();
