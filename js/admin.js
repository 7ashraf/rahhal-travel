/* Rahhal prototype: admin console (dashboard, trips, bookings, travelers, check-in scanner). */
(function () {
  const S = window.Store;
  const U = window.UI;
  const { $, $$, esc, money, img, fmt, ic } = U;
  const app = document.getElementById('app');
  const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
  const live = b => b.status !== 'cancelled';
  const nowTime = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

  const state = { tq: '', tStatus: 'all', bq: '', bTrip: '', bPay: '', bCheck: '', bLimit: 40, pq: '', ciTrip: null, mq: '' };
  let scanner = null;
  let lastScan = { code: '', at: 0 };

  const statusPill = t => ({
    active: '<span class="pill good live">Active</span>',
    upcoming: '<span class="pill info">Upcoming</span>',
    completed: '<span class="pill">Completed</span>',
    draft: '<span class="pill warn">Draft</span>'
  })[U.status(t)];
  const payPill = b => b.status === 'cancelled' ? '<span class="pill bad">Cancelled</span>'
    : b.total > b.paid ? `<span class="pill warn">Balance ${money(b.total - b.paid)}</span>` : '<span class="pill good">Paid</span>';
  const checkPill = b => b.checkedIn ? `<span class="pill good">In · ${esc(U.timeOf(b.checkedInAt))}</span>` : '<span class="pill">Not yet</span>';

  // ---------- shell ----------
  function render(h) {
    if (!S.admin.get()) return login(h);
    const page = h.replace(/^admin-?/, '') || 'dashboard';
    ({ dashboard, trips, bookings, travelers, checkin }[page] || dashboard)();
  }

  function shell(active, title, sub, actions, body) {
    const activeCount = S.trips().filter(t => U.status(t) === 'active').length;
    const nav = [['dashboard', 'dashboard', 'Dashboard'], ['trips', 'map', 'Trips'], ['bookings', 'ticket', 'Bookings'], ['travelers', 'users', 'Travelers'], ['checkin', 'scan', 'Check-in']];
    app.innerHTML = `<div class="admin">
      <aside class="side">
        <a class="logo" href="#admin">${U.LOGO}<span class="lbl-long">Rahhal</span><span class="badge">ADMIN</span></a>
        <nav aria-label="Admin">${nav.map(([k, i, l]) => `<a href="#admin${k === 'dashboard' ? '' : '-' + k}" class="${active === k ? 'active' : ''}">${ic(i)}<span>${l}</span>${k === 'checkin' && activeCount ? `<span class="count" title="Trips on the road">${activeCount}</span>` : ''}</a>`).join('')}</nav>
        <div class="bottom"><a href="#home">${ic('globe')}<span>View website</span></a><a href="#admin" id="admin-out">${ic('logout')}<span>Sign out</span></a></div>
      </aside>
      <main class="admin-main">
        <div class="admin-top"><div class="stack" style="gap:4px"><h1>${title}</h1><span class="muted">${sub}</span></div><div class="row">${actions || ''}</div></div>
        ${body}
      </main></div>`;
    $('#admin-out').onclick = e => { e.preventDefault(); S.admin.set(false); U.toast('Signed out of the admin console'); render('admin'); };
  }

  function login(target) {
    app.innerHTML = `<div class="login">
      <div class="login-art" style="background-image:url('${img('alps')}')"><div>
        <span class="eyebrow" style="color:#ffd08a">Rahhal operations</span>
        <h2>Run every departure from one screen.</h2>
        <p style="opacity:.88">Trips, payments, travelers and check-in at the meeting point.</p></div></div>
      <div class="login-form"><form id="login" novalidate>
        <a class="logo" href="#home">${U.LOGO}Rahhal</a>
        <div class="stack" style="gap:6px"><h2 style="font-size:1.8rem">Sign in to the console</h2><p class="muted">For Rahhal staff and trip hosts.</p></div>
        <label class="field"><span>Work email</span><input class="input" id="l-email" type="email" value="amira@rahhal.travel" autocomplete="username"></label>
        <label class="field"><span>Password</span><input class="input" id="l-pass" type="password" value="demo-password" autocomplete="current-password"></label>
        <button class="btn btn-primary btn-block" style="height:50px" type="submit">Sign in</button>
        <div class="hint">Prototype: the demo credentials are already filled in.</div>
        <a href="#home" class="row" style="gap:6px;font-size:.9rem">${ic('back')}Back to the website</a>
      </form></div></div>`;
    $('#login').onsubmit = e => {
      e.preventDefault();
      S.admin.set(true);
      U.toast('Welcome back, Amira');
      render(target);
    };
  }

  // ---------- dashboard ----------
  function dashboard() {
    const t0 = S.today();
    const bks = S.bookings().filter(live);
    const trips = S.trips();
    const age = b => S.diffDays(b.createdAt, t0);
    const rev30 = sum(bks.filter(b => age(b) < 30), b => b.paid);
    const revPrev = sum(bks.filter(b => age(b) >= 30 && age(b) < 60), b => b.paid);
    const delta = revPrev ? Math.round((rev30 - revPrev) / revPrev * 100) : 0;
    const active = trips.filter(t => U.status(t) === 'active');
    const onRoad = sum(bks.filter(b => active.some(t => t.id === b.tripId)), b => b.pax);
    const soon = trips.filter(t => U.status(t) === 'upcoming' && U.daysUntil(t) <= 30);
    const owing = bks.filter(b => b.total > b.paid && U.status(S.trip(b.tripId) || {}) !== 'completed');
    const upcomingList = trips.filter(t => U.status(t) === 'upcoming').sort((a, b) => a.start.localeCompare(b.start)).slice(0, 5);

    shell('dashboard', 'Good morning, Amira', `${fmt(t0, { weekday: 'long', day: 'numeric', month: 'long' })} · ${active.length} trips on the road`,
      `<a class="btn btn-ghost" href="#admin-checkin">${ic('scan')}Open check-in</a><button class="btn btn-primary" id="new-trip">${ic('plus')}New trip</button>`,
      `<div class="kpis">
        <div class="kpi"><span>${ic('money')}Collected, last 30 days</span><b>${money(rev30)}</b><small>${delta >= 0 ? `<span class="up">▲ ${delta}%</span>` : `<span style="color:var(--bad);font-weight:700">▼ ${-delta}%</span>`} vs previous 30 days</small></div>
        <div class="kpi"><span>${ic('users')}Travelers on the road</span><b>${onRoad}</b><small>across ${active.length} active trip${active.length === 1 ? '' : 's'}</small></div>
        <div class="kpi"><span>${ic('calendar')}Departing in 30 days</span><b>${soon.length}</b><small>${sum(soon, t => S.seatsTaken(t.id))} seats sold</small></div>
        <div class="kpi"><span>${ic('wallet')}Balances outstanding</span><b>${money(sum(owing, b => b.total - b.paid))}</b><small>${owing.length} bookings on a 30% deposit</small></div>
      </div>
      <div class="dash">
        <div class="panel"><div class="panel-head"><div class="stack" style="gap:2px"><h3>Payments collected</h3><span class="muted" style="font-size:.85rem">By booking month, last 6 months</span></div></div>
          <div class="chart" id="chart"></div></div>
        <div class="panel"><div class="panel-head"><h3>On the road now</h3><a href="#admin-checkin" class="btn btn-ghost btn-sm">Check-in ${ic('arrow')}</a></div>
          <div class="mini-list">${active.length ? active.map(t => {
            const tb = S.bookingsFor(t.id).filter(live);
            const pax = sum(tb, b => b.pax), inPax = sum(tb.filter(b => b.checkedIn), b => b.pax);
            return `<a class="mini" href="#admin-checkin" data-ci="${t.id}" style="color:inherit;text-decoration:none"><img src="${img(t.image)}" alt="">
              <div class="stack"><span class="t">${esc(t.title)}</span><span class="s">Day ${U.dayOf(t)} of ${t.days} · ${esc(t.host)}</span><div class="meter"><i style="width:${pax ? inPax / pax * 100 : 0}%;background:var(--good)"></i></div></div>
              <span class="s num" style="text-align:right">${inPax}/${pax}<br>checked in</span></a>`;
          }).join('') : '<p class="muted">No trips on the road today.</p>'}</div></div>
      </div>
      <div class="dash">
        <div class="panel"><div class="panel-head"><h3>Latest bookings</h3><a href="#admin-bookings" class="btn btn-ghost btn-sm">All bookings ${ic('arrow')}</a></div>
          <div class="table-wrap" style="border:0"><table><thead><tr><th>Booking</th><th>Traveler</th><th>Trip</th><th>Amount</th><th>Payment</th></tr></thead><tbody>
          ${S.bookings().slice(0, 6).map(b => `<tr class="click" data-code="${b.code}"><td class="mono">${b.code}</td><td>${esc(b.name)}</td><td>${esc(S.trip(b.tripId)?.title || '—')}</td><td class="num">${money(b.total)}</td><td>${payPill(b)}</td></tr>`).join('')}
          </tbody></table></div></div>
        <div class="panel"><div class="panel-head"><h3>Departing next</h3><a href="#admin-trips" class="btn btn-ghost btn-sm">All trips ${ic('arrow')}</a></div>
          <div class="mini-list">${upcomingList.map(t => {
            const sold = S.seatsTaken(t.id);
            return `<div class="mini"><img src="${img(t.image)}" alt=""><div class="stack"><span class="t">${esc(t.title)}</span><span class="s">${U.range(t)} · ${U.relStart(t).replace('Departs ', '')}</span><div class="meter ${t.capacity - sold <= 4 ? 'sun' : ''}"><i style="width:${sold / t.capacity * 100}%"></i></div></div><span class="s num" style="text-align:right">${sold}/${t.capacity}<br>seats</span></div>`;
          }).join('')}</div></div>
      </div>`);

    drawChart($('#chart'));
    $('#new-trip').onclick = () => tripForm();
    $$('[data-ci]').forEach(a => a.addEventListener('click', () => { state.ciTrip = a.dataset.ci; }));
    $$('tr[data-code]').forEach(r => r.onclick = () => bookingModal(r.dataset.code));
  }

  function drawChart(el) {
    const t0 = S.parse(S.today());
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(t0.getFullYear(), t0.getMonth() - i, 1);
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      months.push({ key, label: d.toLocaleDateString('en-GB', { month: 'short' }), full: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }), value: 0, count: 0 });
    }
    S.bookings().filter(live).forEach(b => {
      const m = months.find(x => x.key === b.createdAt.slice(0, 7));
      if (m) { m.value += b.paid; m.count++; }
    });
    const W = Math.max(280, el.clientWidth), H = 240, L = 48, R = 8, T = 16, B = 26;
    const max = Math.max(...months.map(m => m.value), 1);
    const rough = max / 4, mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const step = [1, 2, 2.5, 5, 10].find(k => k * mag >= rough) * mag;
    const top = Math.ceil(max / step) * step;
    const y = v => T + (H - T - B) * (1 - v / top);
    const band = (W - L - R) / months.length, bw = Math.min(46, band * 0.56);
    const short = v => v >= 1000 ? '$' + (v / 1000).toFixed(v % 1000 ? 1 : 0).replace('.0', '') + 'k' : '$' + v;
    let grid = '';
    for (let v = 0; v <= top + 1e-9; v += step) grid += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${short(v)}</text>`;
    const bars = months.map((m, i) => {
      const x = L + band * i + (band - bw) / 2, yy = y(m.value), h = H - B - yy, r = Math.min(4, h);
      const d = h > 0 ? `M${x},${H - B} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + bw - r} Q${x + bw},${yy} ${x + bw},${yy + r} V${H - B} Z` : '';
      return `<g data-i="${i}"><path class="bar" d="${d}"/><rect class="hit" x="${L + band * i}" y="${T}" width="${band}" height="${H - T - B}"/>
        <text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${m.label}${i === 5 ? ' (to date)' : ''}</text></g>`;
    }).join('');
    const last = months[5];
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Payments collected per month"><g class="grid">${grid}</g><g class="bars">${bars}</g>
      <text x="${L + band * 5 + band / 2}" y="${y(last.value) - 8}" text-anchor="middle" style="fill:var(--ink);font-weight:700">${short(Math.round(last.value))}</text></svg><div class="tip" hidden></div>`;
    const tip = $('.tip', el), g = $('.bars', el);
    $$('g[data-i]', el).forEach(node => {
      const i = +node.dataset.i, m = months[i];
      node.addEventListener('mouseenter', () => {
        g.parentElement.classList.add('dim'); node.querySelector('.bar').classList.add('hover');
        tip.innerHTML = `${m.full}<b>${money(m.value)}</b>${m.count} bookings`;
        tip.style.left = (L + band * i + band / 2) + 'px';
        tip.style.top = y(m.value) + 'px';
        tip.hidden = false;
      });
      node.addEventListener('mouseleave', () => { g.parentElement.classList.remove('dim'); node.querySelector('.bar').classList.remove('hover'); tip.hidden = true; });
    });
  }

  // ---------- trips ----------
  function trips() {
    shell('trips', 'Trips', `${S.trips().length} trips · ${S.trips().filter(t => U.status(t) === 'upcoming').length} open for booking`,
      `<button class="btn btn-primary" id="new-trip">${ic('plus')}New trip</button>`,
      `<div class="toolbar">
        <label class="search">${ic('search')}<input class="input" id="t-q" placeholder="Search trips" value="${esc(state.tq)}" aria-label="Search trips"></label>
        <select class="input" id="t-status" aria-label="Status">${[['all', 'All statuses'], ['active', 'Active'], ['upcoming', 'Upcoming'], ['completed', 'Completed'], ['draft', 'Draft']].map(([v, l]) => `<option value="${v}" ${state.tStatus === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Trip</th><th>Dates</th><th>Status</th><th>Seats</th><th>Price</th><th>Collected</th><th></th></tr></thead><tbody id="t-body"></tbody></table></div>`);

    const draw = () => {
      const q = state.tq.toLowerCase();
      const list = S.trips().filter(t => (!q || (t.title + t.place).toLowerCase().includes(q)) && (state.tStatus === 'all' || U.status(t) === state.tStatus))
        .sort((a, b) => a.start.localeCompare(b.start));
      $('#t-body').innerHTML = list.map(t => {
        const sold = S.seatsTaken(t.id), tb = S.bookingsFor(t.id).filter(live);
        return `<tr>
          <td><div class="cell-trip"><img src="${img(t.image)}" alt=""><div><b>${esc(t.title)}</b><small>${esc(t.place)}</small></div></div></td>
          <td style="white-space:nowrap">${U.range(t)}<br><small class="muted">${t.days} days</small></td>
          <td>${statusPill(t)}</td>
          <td><div class="seat-cell"><span class="num">${sold} / ${t.capacity}</span><div class="meter ${t.capacity - sold <= 4 ? 'sun' : ''}"><i style="width:${Math.min(100, sold / t.capacity * 100)}%"></i></div></div></td>
          <td class="num">${money(t.price)}</td>
          <td class="num">${money(sum(tb, b => b.paid))}</td>
          <td style="white-space:nowrap;text-align:right">
            <button class="icon-btn" data-edit="${t.id}" title="Edit trip" aria-label="Edit ${esc(t.title)}">${ic('edit')}</button>
            <button class="icon-btn" data-bk="${t.id}" title="View bookings" aria-label="Bookings for ${esc(t.title)}">${ic('ticket')}</button>
            <a class="icon-btn" href="#trip-${t.id}" title="Open public page" aria-label="Public page">${ic('globe')}</a>
          </td></tr>`;
      }).join('') || `<tr><td colspan="7" class="muted" style="text-align:center;padding:40px">No trips match.</td></tr>`;
      $$('[data-edit]').forEach(b => b.onclick = () => tripForm(S.trip(b.dataset.edit)));
      $$('[data-bk]').forEach(b => b.onclick = () => { Object.assign(state, { bTrip: b.dataset.bk, bq: '', bPay: '', bCheck: '' }); location.hash = 'admin-bookings'; });
    };
    $('#t-q').oninput = e => { state.tq = e.target.value; draw(); };
    $('#t-status').onchange = e => { state.tStatus = e.target.value; draw(); };
    $('#new-trip').onclick = () => tripForm();
    draw();
  }

  function tripForm(t) {
    const isNew = !t;
    const d = t ? { ...t } : {
      id: '', title: '', place: '', category: 'Beach', image: 'beach', start: S.addDays(S.today(), 30), days: 5, price: 990, capacity: 20,
      from: 'CAI', to: '', depart: '08:00', meeting: 'Cairo Airport T3, Rahhal desk at gate 2', host: '', hostPhone: '', summary: '',
      highlights: [], includes: ['Hosted by a Rahhal trip leader', 'Daily breakfast'], excludes: ['Personal expenses'], itinerary: [], published: true
    };
    let pickImg = d.image;
    const sold = t ? S.seatsTaken(t.id) : 0;
    const m = U.openModal(`${U.modalHead(isNew ? 'New trip' : 'Edit trip')}
      <form class="modal-body" id="trip-form" novalidate>
        <div class="grid-2">
          <label class="field" style="grid-column:1/-1"><span>Trip name</span><input class="input" id="f-title" value="${esc(d.title)}" placeholder="e.g. Siwa Oasis Weekend"></label>
          <label class="field"><span>Destination</span><input class="input" id="f-place" value="${esc(d.place)}" placeholder="City, Country"></label>
          <label class="field"><span>Style</span><select class="input" id="f-cat">${['Beach', 'Culture', 'Adventure', 'City'].map(c => `<option ${d.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        </div>
        <div class="grid-3">
          <label class="field"><span>Start date</span><input class="input" type="date" id="f-start" value="${d.start}"></label>
          <label class="field"><span>Days</span><input class="input" type="number" min="1" max="30" id="f-days" value="${d.days}"></label>
          <label class="field"><span>Meet time</span><input class="input" type="time" id="f-depart" value="${esc(d.depart)}"></label>
          <label class="field"><span>Price per person ($)</span><input class="input" type="number" min="1" id="f-price" value="${d.price}"></label>
          <label class="field"><span>Seats${sold ? ` (${sold} sold)` : ''}</span><input class="input" type="number" min="1" id="f-cap" value="${d.capacity}"></label>
          <label class="field"><span>Route codes</span><div class="row" style="flex-wrap:nowrap;gap:6px"><input class="input mono" id="f-from" maxlength="3" value="${esc(d.from)}" aria-label="From code"><input class="input mono" id="f-to" maxlength="3" value="${esc(d.to)}" placeholder="SEA" aria-label="To code"></div></label>
        </div>
        <div class="grid-2">
          <label class="field"><span>Meeting point</span><input class="input" id="f-meeting" value="${esc(d.meeting)}"></label>
          <label class="field"><span>Trip host</span><input class="input" id="f-host" value="${esc(d.host)}" placeholder="Host name"></label>
        </div>
        <label class="field"><span>Summary</span><textarea class="input" id="f-summary" placeholder="One or two sentences travelers see first">${esc(d.summary)}</textarea></label>
        <label class="field"><span>Highlights, separated by commas</span><input class="input" id="f-hl" value="${esc(d.highlights.join(', '))}"></label>
        <div class="field"><span>Cover photo</span><div class="img-pick" id="f-img">${S.images.map(n => `<button type="button" data-img="${n}" class="${n === pickImg ? 'on' : ''}" aria-label="${n}"><img src="${img(n)}" alt=""></button>`).join('')}</div></div>
        <label class="switch"><input type="checkbox" id="f-pub" ${d.published ? 'checked' : ''}>Published on the website</label>
        <div id="del-zone"></div>
        <div class="modal-foot">
          ${isNew ? '' : `<button type="button" class="btn btn-ghost" id="f-del" style="margin-right:auto;color:var(--bad)">${ic('trash')}Delete</button>`}
          <button type="button" class="btn btn-ghost" data-close>Cancel</button>
          <button class="btn btn-primary" type="submit">${isNew ? 'Create trip' : 'Save changes'}</button>
        </div>
      </form>`, { wide: true });

    $$('#f-img button', m).forEach(b => b.onclick = () => { pickImg = b.dataset.img; $$('#f-img button', m).forEach(x => x.classList.toggle('on', x === b)); });
    const del = $('#f-del', m);
    if (del) del.onclick = () => {
      const n = S.bookingsFor(t.id).length;
      $('#del-zone', m).innerHTML = n
        ? `<div class="confirm-bar">${t.title} has ${n} bookings, so it can't be deleted. Turn off "Published" to hide it instead.</div>`
        : `<div class="confirm-bar"><span>Delete ${esc(t.title)} permanently?</span><button type="button" class="btn btn-danger btn-sm" id="f-del-yes">Delete trip</button></div>`;
      const yes = $('#f-del-yes', m);
      if (yes) yes.onclick = () => { S.deleteTrip(t.id); U.closeModal(); U.toast('Trip deleted'); U.route(false); };
    };
    $('#trip-form', m).onsubmit = e => {
      e.preventDefault();
      const v = id => $(id, m).value.trim();
      const out = {
        ...d, title: v('#f-title'), place: v('#f-place'), category: v('#f-cat'), start: v('#f-start'), days: parseInt(v('#f-days'), 10),
        depart: v('#f-depart') || '08:00', price: parseInt(v('#f-price'), 10), capacity: parseInt(v('#f-cap'), 10),
        from: v('#f-from').toUpperCase() || 'CAI', to: (v('#f-to') || v('#f-place').slice(0, 3)).toUpperCase(), meeting: v('#f-meeting'),
        host: v('#f-host') || 'Rahhal host', summary: v('#f-summary'), image: pickImg, published: $('#f-pub', m).checked,
        highlights: v('#f-hl').split(',').map(s => s.trim()).filter(Boolean)
      };
      let ok = true;
      const flag = (id, bad) => { $(id, m).classList.toggle('invalid', bad); if (bad) ok = false; };
      flag('#f-title', out.title.length < 3);
      flag('#f-place', out.place.length < 2);
      flag('#f-start', !/^\d{4}-\d{2}-\d{2}$/.test(out.start));
      flag('#f-days', !(out.days >= 1 && out.days <= 30));
      flag('#f-price', !(out.price > 0));
      flag('#f-cap', !(out.capacity >= Math.max(1, sold)));
      if (!ok) return U.toast(out.capacity < sold ? `Seats can't go below the ${sold} already sold` : 'Fix the highlighted fields', 'warn');
      if (isNew) {
        out.id = out.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) + '-' + Math.random().toString(36).slice(2, 5);
        out.hostPhone = '01000000000';
        out.summary = out.summary || `${out.days} days in ${out.place} with a Rahhal host.`;
        out.itinerary = [['Day 1', 'Departure', `Meet at ${out.meeting} at ${out.depart}.`]];
        if (out.days > 2) out.itinerary.push([`Days 2–${out.days - 1}`, 'On the ground', 'Full itinerary to be published soon.']);
        if (out.days > 1) out.itinerary.push([`Day ${out.days}`, 'Return', 'Return to Cairo.']);
      }
      S.upsertTrip(out);
      U.closeModal();
      U.toast(isNew ? `${out.title} created` : 'Changes saved');
      U.route(false);
    };
  }

  // ---------- bookings ----------
  function bookings() {
    const tripOpts = S.trips().slice().sort((a, b) => a.start.localeCompare(b.start));
    shell('bookings', 'Bookings', 'Every booking, payment and check-in', '',
      `<div class="toolbar">
        <label class="search">${ic('search')}<input class="input" id="b-q" placeholder="Name, mobile or booking code" value="${esc(state.bq)}" aria-label="Search bookings"></label>
        <select class="input" id="b-trip" aria-label="Trip"><option value="">All trips</option>${tripOpts.map(t => `<option value="${t.id}" ${state.bTrip === t.id ? 'selected' : ''}>${esc(t.title)}</option>`).join('')}</select>
        <select class="input" id="b-pay" aria-label="Payment">${[['', 'Any payment'], ['paid', 'Paid in full'], ['balance', 'Balance due'], ['cancelled', 'Cancelled']].map(([v, l]) => `<option value="${v}" ${state.bPay === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <select class="input" id="b-check" aria-label="Check-in">${[['', 'Any check-in'], ['in', 'Checked in'], ['out', 'Not checked in']].map(([v, l]) => `<option value="${v}" ${state.bCheck === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      </div>
      <p class="muted" id="b-sum" style="font-size:.9rem"></p>
      <div class="table-wrap"><table><thead><tr><th>Booking</th><th>Traveler</th><th>Trip</th><th>Guests</th><th>Total</th><th>Payment</th><th>Check-in</th><th>Booked</th></tr></thead><tbody id="b-body"></tbody></table></div>
      <div id="b-more" style="text-align:center"></div>`);

    const draw = () => {
      const q = state.bq.toLowerCase().replace(/\s/g, '');
      const list = S.bookings().filter(b =>
        (!q || (b.name + b.phone + b.code).toLowerCase().replace(/\s/g, '').includes(q)) &&
        (!state.bTrip || b.tripId === state.bTrip) &&
        (!state.bPay || (state.bPay === 'cancelled' ? b.status === 'cancelled' : live(b) && (state.bPay === 'paid' ? b.paid >= b.total : b.paid < b.total))) &&
        (!state.bCheck || (state.bCheck === 'in' ? b.checkedIn : !b.checkedIn && live(b))));
      const ok = list.filter(live);
      $('#b-sum').textContent = `${list.length} bookings · ${sum(ok, b => b.pax)} travelers · ${money(sum(ok, b => b.paid))} collected · ${money(sum(ok, b => b.total - b.paid))} outstanding`;
      $('#b-body').innerHTML = list.slice(0, state.bLimit).map(b => {
        const t = S.trip(b.tripId);
        return `<tr class="click" data-code="${b.code}"><td class="mono">${b.code}</td>
          <td><b style="font-weight:600">${esc(b.name)}</b><br><small class="muted mono">${U.phoneFmt(b.phone)}</small></td>
          <td>${esc(t?.title || '—')}<br><small class="muted">${t ? U.range(t) : ''}</small></td>
          <td class="num">${b.pax}</td><td class="num">${money(b.total)}</td><td>${payPill(b)}</td><td>${live(b) ? checkPill(b) : ''}</td>
          <td class="muted" style="white-space:nowrap">${fmt(b.createdAt)}</td></tr>`;
      }).join('') || `<tr><td colspan="8" class="muted" style="text-align:center;padding:40px">No bookings match these filters.</td></tr>`;
      $('#b-more').innerHTML = list.length > state.bLimit ? `<button class="btn btn-ghost btn-sm" id="b-more-btn">Show ${Math.min(40, list.length - state.bLimit)} more of ${list.length - state.bLimit}</button>` : '';
      const more = $('#b-more-btn');
      if (more) more.onclick = () => { state.bLimit += 40; draw(); };
      $$('#b-body tr[data-code]').forEach(r => r.onclick = () => bookingModal(r.dataset.code, draw));
    };
    $('#b-q').oninput = e => { state.bq = e.target.value; state.bLimit = 40; draw(); };
    $('#b-trip').onchange = e => { state.bTrip = e.target.value; draw(); };
    $('#b-pay').onchange = e => { state.bPay = e.target.value; draw(); };
    $('#b-check').onchange = e => { state.bCheck = e.target.value; draw(); };
    draw();
  }

  function bookingModal(code, after) {
    const b = S.booking(code);
    if (!b) return;
    const t = S.trip(b.tripId);
    const refresh = () => { after ? after() : U.route(false); bookingModal(code, after); };
    const m = U.openModal(`${U.modalHead('Booking ' + b.code)}
      <div class="modal-body">
        <div style="display:grid;justify-items:center">${U.passHTML(b)}</div>
        <dl class="dl" style="margin:0">
          <dt>Traveler</dt><dd>${esc(b.name)} · ${b.pax} guest${b.pax > 1 ? 's' : ''}</dd>
          <dt>Mobile</dt><dd class="mono">${U.phoneFmt(b.phone)}</dd>
          <dt>Email</dt><dd>${esc(b.email)}</dd>
          <dt>Trip</dt><dd>${esc(t?.title || '—')} · ${t ? U.range(t) : ''}</dd>
          <dt>Payment</dt><dd>${money(b.paid)} of ${money(b.total)} by ${esc(b.method)} ${payPill(b)}</dd>
          <dt>Check-in</dt><dd>${live(b) ? checkPill(b) : '—'}</dd>
          <dt>Booked on</dt><dd>${U.fmtLong(b.createdAt)}</dd>
        </dl>
        <div id="cancel-zone"></div>
        <div class="modal-foot" style="justify-content:flex-start">
          ${live(b) && b.total > b.paid ? `<button class="btn btn-sun btn-sm" id="m-paid">${ic('money')}Record ${money(b.total - b.paid)} payment</button>` : ''}
          ${live(b) && !b.checkedIn ? `<button class="btn btn-primary btn-sm" id="m-in">${ic('check')}Check in</button>` : ''}
          ${b.checkedIn ? `<button class="btn btn-ghost btn-sm" id="m-undo">Undo check-in</button>` : ''}
          ${live(b) ? `<button class="btn btn-ghost btn-sm" id="m-sms">${ic('message')}Resend pass SMS</button>` : ''}
          ${live(b) && !b.checkedIn ? `<button class="btn btn-ghost btn-sm" id="m-cancel" style="color:var(--bad);margin-left:auto">Cancel booking</button>` : ''}
        </div>
      </div>`);
    U.hydratePasses(m);
    const on = (id, fn) => { const el = $(id, m); if (el) el.onclick = fn; };
    on('#m-paid', () => { S.updateBooking(code, { paid: b.total }); U.toast(`Recorded ${money(b.total - b.paid)} for ${b.code}`); refresh(); });
    on('#m-in', () => { S.updateBooking(code, { checkedIn: true, checkedInAt: S.today() + 'T' + nowTime() }); U.toast(`${b.name} checked in`); refresh(); });
    on('#m-undo', () => { S.updateBooking(code, { checkedIn: false, checkedInAt: null }); U.toast('Check-in undone', 'warn'); refresh(); });
    on('#m-sms', () => U.toast(`Pass sent by SMS to ${U.phoneFmt(b.phone)}`));
    on('#m-cancel', () => {
      $('#cancel-zone', m).innerHTML = `<div class="confirm-bar"><span>Cancel ${b.code} and release ${b.pax} seat${b.pax > 1 ? 's' : ''}?</span><button class="btn btn-danger btn-sm" id="m-cancel-yes">Cancel booking</button></div>`;
      $('#m-cancel-yes', m).onclick = () => { S.updateBooking(code, { status: 'cancelled' }); U.toast(`${b.code} cancelled, refund queued`, 'warn'); refresh(); };
    });
  }

  // ---------- travelers ----------
  function travelers() {
    const map = new Map();
    S.bookings().forEach(b => {
      const p = map.get(b.phone) || { name: b.name, phone: b.phone, email: b.email, list: [] };
      p.list.push(b); map.set(b.phone, p);
    });
    const people = [...map.values()].map(p => {
      const ok = p.list.filter(live);
      const trips = ok.map(b => S.trip(b.tripId)).filter(Boolean).sort((a, b) => b.start.localeCompare(a.start));
      return { ...p, trips: ok.length, spent: sum(ok, b => b.paid), last: trips[0], onTrip: trips.some(t => U.status(t) === 'active') };
    }).sort((a, b) => b.spent - a.spent);

    shell('travelers', 'Travelers', `${people.length} people have booked with Rahhal`, '',
      `<div class="toolbar"><label class="search">${ic('search')}<input class="input" id="p-q" placeholder="Name, mobile or email" value="${esc(state.pq)}" aria-label="Search travelers"></label></div>
      <div class="table-wrap"><table><thead><tr><th>Traveler</th><th>Mobile</th><th>Bookings</th><th>Paid to date</th><th>Latest trip</th><th></th></tr></thead><tbody id="p-body"></tbody></table></div>`);

    const draw = () => {
      const q = state.pq.toLowerCase().replace(/\s/g, '');
      $('#p-body').innerHTML = people.filter(p => !q || (p.name + p.phone + p.email).toLowerCase().replace(/\s/g, '').includes(q)).map(p => `
        <tr class="click" data-phone="${p.phone}">
          <td><div class="row" style="flex-wrap:nowrap;gap:12px;min-width:200px"><span class="avatar">${U.initials(p.name)}</span><div><b style="font-weight:600">${esc(p.name)}</b><br><small class="muted">${esc(p.email)}</small></div></div></td>
          <td class="mono" style="white-space:nowrap">${U.phoneFmt(p.phone)}</td>
          <td class="num">${p.trips}</td>
          <td class="num">${money(p.spent)}</td>
          <td>${p.last ? esc(p.last.title) : '—'}</td>
          <td>${p.onTrip ? '<span class="pill good live">On a trip</span>' : p.trips > 1 ? '<span class="pill info">Repeat traveler</span>' : ''}</td>
        </tr>`).join('') || `<tr><td colspan="6" class="muted" style="text-align:center;padding:40px">No travelers match.</td></tr>`;
      $$('#p-body tr').forEach(r => r.onclick = () => {
        const p = people.find(x => x.phone === r.dataset.phone);
        if (!p) return;
        const m = U.openModal(`${U.modalHead(esc(p.name))}<div class="modal-body">
          <div class="row"><span class="avatar">${U.initials(p.name)}</span><div class="stack" style="gap:2px"><span class="mono">${U.phoneFmt(p.phone)}</span><span class="muted">${esc(p.email)}</span></div><span class="spacer"></span><div style="text-align:right"><b class="num" style="font-size:1.3rem">${money(p.spent)}</b><br><small class="muted">paid across ${p.trips} booking${p.trips === 1 ? '' : 's'}</small></div></div>
          <div class="mini-list">${p.list.map(b => {
            const t = S.trip(b.tripId);
            return t ? `<button class="mini" data-code="${b.code}" style="border:0;background:none;text-align:left;cursor:pointer;width:100%"><img src="${img(t.image)}" alt=""><div class="stack"><span class="t">${esc(t.title)}</span><span class="s">${U.range(t)} · <span class="mono">${b.code}</span> · ${b.pax} guest${b.pax > 1 ? 's' : ''}</span></div>${payPill(b)}</button>` : '';
          }).join('')}</div></div>`);
        $$('[data-code]', m).forEach(x => x.onclick = () => bookingModal(x.dataset.code));
      });
    };
    $('#p-q').oninput = e => { state.pq = e.target.value; draw(); };
    draw();
  }

  // ---------- check-in ----------
  function pickDefaultTrip() {
    const t0 = S.today();
    const active = S.trips().filter(t => U.status(t) === 'active');
    return (active.find(t => t.start === t0) || active[0] || S.trips().filter(t => U.status(t) === 'upcoming').sort((a, b) => a.start.localeCompare(b.start))[0] || S.trips()[0])?.id;
  }

  function checkin() {
    if (!state.ciTrip || !S.trip(state.ciTrip)) state.ciTrip = pickDefaultTrip();
    const t = S.trip(state.ciTrip);
    const options = S.trips().filter(x => U.status(x) !== 'completed').sort((a, b) => a.start.localeCompare(b.start));
    shell('checkin', 'Check-in', `Scan trip passes at the meeting point · ${esc(t.meeting)}`,
      `<select class="input" id="ci-trip" aria-label="Trip to check in" style="width:auto;min-width:240px">${options.map(x => `<option value="${x.id}" ${x.id === t.id ? 'selected' : ''}>${esc(x.title)} · ${fmt(x.start)}</option>`).join('')}</select>`,
      `<div class="kpis" id="ci-stats"></div>
      <div class="checkin">
        <div class="panel">
          <div class="panel-head"><h3>Scan a pass</h3><span class="muted" style="font-size:.85rem">QR code or barcode</span></div>
          <div class="scan-box">
            <div id="reader"></div>
            <div class="scan-idle" id="scan-idle">${ic('scan')}<b style="color:#e9f1f2">Camera is off</b><span>Start the camera and hold the traveler's pass inside the frame.</span></div>
            <div class="scan-frame" id="scan-frame" hidden></div><div class="scan-line" id="scan-line" hidden></div>
          </div>
          <div id="reader-file" hidden></div>
          <div class="row">
            <button class="btn btn-primary" id="cam-btn">${ic('camera')}Start camera</button>
            <label class="btn btn-ghost" for="scan-file">${ic('image')}Scan a photo</label>
            <input type="file" id="scan-file" accept="image/*" hidden>
            <button class="btn btn-ghost" id="sample-btn" title="Simulates scanning a traveler's pass">${ic('ticket')}Try a sample pass</button>
          </div>
          <form class="row" id="manual" style="flex-wrap:nowrap" novalidate>
            <input class="input mono" id="manual-code" placeholder="Type a booking code, e.g. RH-4N7QK" aria-label="Booking code" autocomplete="off" style="text-transform:uppercase">
            <button class="btn btn-ghost" type="submit">Check in</button>
          </form>
          <div id="ci-result"></div>
        </div>
        <div class="panel">
          <div class="panel-head"><div class="stack" style="gap:2px"><h3>Manifest</h3><span class="muted" style="font-size:.85rem">${esc(t.title)} · ${U.range(t)} · host ${esc(t.host)}</span></div></div>
          <div class="toolbar"><label class="search">${ic('search')}<input class="input" id="m-q" placeholder="Find a traveler" value="${esc(state.mq)}" aria-label="Find a traveler"></label></div>
          <div class="manifest" id="manifest"></div>
        </div>
      </div>`);

    $('#ci-trip').onchange = e => { state.ciTrip = e.target.value; state.mq = ''; U.route(false); };
    $('#cam-btn').onclick = () => scanner ? stopCamera() : startCamera();
    $('#scan-file').onchange = scanFile;
    $('#sample-btn').onclick = () => {
      const list = S.bookingsFor(state.ciTrip).filter(live);
      const pick = list.find(b => !b.checkedIn && b.paid >= b.total) || list.find(b => !b.checkedIn) || list[0];
      if (!pick) return U.toast('No bookings on this trip yet', 'warn');
      U.toast(`Simulated scan of ${pick.code}`);
      handleCode(pick.code);
    };
    $('#manual').onsubmit = e => {
      e.preventDefault();
      const v = $('#manual-code').value.trim();
      if (!v) return;
      handleCode(v);
      $('#manual-code').value = '';
    };
    $('#m-q').oninput = e => { state.mq = e.target.value; drawManifest(); };
    drawStats(); drawManifest();
  }

  function drawStats() {
    const list = S.bookingsFor(state.ciTrip).filter(live);
    const pax = sum(list, b => b.pax), inPax = sum(list.filter(b => b.checkedIn), b => b.pax);
    const pct = pax ? inPax / pax : 0, C = 2 * Math.PI * 30;
    const owing = list.filter(b => !b.checkedIn && b.total > b.paid);
    $('#ci-stats').innerHTML = `
      <div class="kpi" style="grid-column:span 2"><div class="progress-ring"><svg viewBox="0 0 72 72" aria-hidden="true"><circle class="track" cx="36" cy="36" r="30"/><circle class="val" cx="36" cy="36" r="30" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/></svg>
        <div class="stack" style="gap:4px"><span class="muted" style="font-size:.82rem;font-weight:600">Travelers checked in</span><b>${inPax} <span class="muted" style="font-size:1.1rem">/ ${pax}</span></b><small class="muted">${Math.round(pct * 100)}% of the group</small></div></div></div>
      <div class="kpi"><span>${ic('ticket')}Passes still to scan</span><b>${list.filter(b => !b.checkedIn).length}</b><small>of ${list.length} bookings</small></div>
      <div class="kpi"><span>${ic('wallet')}To collect at the door</span><b>${money(sum(owing, b => b.total - b.paid))}</b><small>${owing.length} booking${owing.length === 1 ? '' : 's'} with a balance</small></div>`;
  }

  function drawManifest(flashCode) {
    const q = state.mq.toLowerCase().replace(/\s/g, '');
    const list = S.bookingsFor(state.ciTrip).filter(live)
      .filter(b => !q || (b.name + b.code + b.phone).toLowerCase().replace(/\s/g, '').includes(q))
      .sort((a, b) => (a.checkedIn - b.checkedIn) || a.name.localeCompare(b.name));
    const el = $('#manifest');
    if (!el) return;
    el.innerHTML = list.map(b => `<div class="mrow ${b.checkedIn ? 'done' : ''} ${b.code === flashCode ? 'flash' : ''}">
      <span class="avatar">${b.checkedIn ? ic('check') : U.initials(b.name)}</span>
      <div class="stack"><span class="t">${esc(b.name)}</span><span class="s"><span class="mono">${b.code}</span> · ${b.pax} guest${b.pax > 1 ? 's' : ''}${b.total > b.paid ? ` · <b style="color:var(--warn)">owes ${money(b.total - b.paid)}</b>` : ''}</span></div>
      ${b.checkedIn ? `<span class="pill good">In · ${esc(U.timeOf(b.checkedInAt))}</span>` : `<button class="btn btn-ghost btn-sm" data-ci-code="${b.code}">Check in</button>`}
    </div>`).join('') || `<p class="muted" style="padding:20px 4px">No travelers match.</p>`;
    $$('[data-ci-code]', el).forEach(btn => btn.onclick = () => handleCode(btn.dataset.ciCode));
  }

  function showResult(kind, title, text, actions = '') {
    const box = $('#ci-result');
    if (!box) return;
    const icon = { good: 'check', warn: 'alert', bad: 'x' }[kind];
    box.innerHTML = `<div class="result ${kind}" role="status"><div class="r-ic">${ic(icon)}</div><div class="stack"><h3>${title}</h3><p>${text}</p>${actions ? `<div class="row" style="margin-top:6px">${actions}</div>` : ''}</div></div>`;
  }

  function beep(ok) {
    try {
      const ctx = beep.ctx || (beep.ctx = new (window.AudioContext || window.webkitAudioContext)());
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = ok ? 880 : 220; g.gain.value = 0.06;
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + (ok ? 0.12 : 0.3));
    } catch (e) { /* sound is optional */ }
  }

  function doCheckIn(b) {
    S.updateBooking(b.code, { checkedIn: true, checkedInAt: S.today() + 'T' + nowTime() });
    beep(true);
    showResult('good', `Checked in · ${esc(b.name)}`, `<span class="mono">${b.code}</span> · ${b.pax} guest${b.pax > 1 ? 's' : ''} · group ${'G' + ((b.code.charCodeAt(3) + b.code.charCodeAt(5)) % 4 + 1)}`);
    drawStats(); drawManifest(b.code);
  }

  function handleCode(raw) {
    const code = String(raw || '').trim().toUpperCase();
    const b = S.booking(code);
    const t = S.trip(state.ciTrip);
    if (!b) { beep(false); return showResult('bad', 'Pass not recognised', `No booking matches <span class="mono">${esc(code)}</span>. Ask for the SMS confirmation or search the manifest by name.`); }
    if (b.status === 'cancelled') { beep(false); return showResult('bad', 'Booking cancelled', `${esc(b.name)}'s booking <span class="mono">${b.code}</span> was cancelled and refunded.`); }
    if (b.tripId !== t.id) {
      const other = S.trip(b.tripId);
      beep(false);
      showResult('warn', 'Pass is for a different trip', `${esc(b.name)} is booked on <b>${esc(other?.title || '?')}</b>, ${other ? U.range(other) : ''}.`, `<button class="btn btn-ghost btn-sm" id="switch-trip">Switch to that trip</button>`);
      const sw = $('#switch-trip');
      if (sw) sw.onclick = () => { state.ciTrip = b.tripId; U.route(false); setTimeout(() => handleCode(code), 0); };
      return;
    }
    if (b.checkedIn) { beep(false); return showResult('warn', 'Already checked in', `${esc(b.name)} checked in at ${esc(U.timeOf(b.checkedInAt))} today. Pass <span class="mono">${b.code}</span> can't be used twice.`); }
    if (b.total > b.paid) {
      const due = b.total - b.paid;
      beep(false);
      showResult('warn', `Balance due · ${money(due)}`, `${esc(b.name)} (${b.pax} guest${b.pax > 1 ? 's' : ''}) reserved with a deposit. Collect the balance before boarding.`,
        `<button class="btn btn-sun btn-sm" id="collect">Collected ${money(due)}, check in</button>`);
      $('#collect').onclick = () => { S.updateBooking(b.code, { paid: b.total }); doCheckIn(b); U.toast(`Recorded ${money(due)} from ${b.name}`); };
      return;
    }
    doCheckIn(b);
  }

  async function startCamera() {
    if (!window.Html5Qrcode) return showResult('bad', 'Scanner unavailable', 'The scanning library did not load. Type the booking code instead.');
    const btn = $('#cam-btn');
    btn.disabled = true;
    try {
      const formats = window.Html5QrcodeSupportedFormats ? [Html5QrcodeSupportedFormats.QR_CODE, Html5QrcodeSupportedFormats.CODE_128] : undefined;
      scanner = new Html5Qrcode('reader', { formatsToSupport: formats, verbose: false });
      await scanner.start({ facingMode: 'environment' }, { fps: 10 }, text => {
        const now = Date.now();
        if (text === lastScan.code && now - lastScan.at < 3500) return;
        lastScan = { code: text, at: now };
        handleCode(text);
      }, () => {});
      $('#scan-idle').hidden = true; $('#scan-frame').hidden = false; $('#scan-line').hidden = false;
      btn.innerHTML = `${ic('x')}Stop camera`;
    } catch (e) {
      scanner = null;
      showResult('warn', 'Camera not available', 'This browser or page did not allow camera access. Scan a photo of the pass or type the booking code instead.');
    }
    btn.disabled = false;
  }

  async function stopCamera() {
    const s = scanner;
    scanner = null;
    if (s) { try { await s.stop(); s.clear(); } catch (e) { /* already stopped */ } }
    const idle = $('#scan-idle');
    if (idle) {
      idle.hidden = false; $('#scan-frame').hidden = true; $('#scan-line').hidden = true;
      $('#cam-btn').innerHTML = `${ic('camera')}Start camera`;
    }
  }

  async function scanFile(e) {
    const input = e.target, f = input.files[0];
    if (!f) return;
    await stopCamera();
    if (!window.Html5Qrcode) return showResult('bad', 'Scanner unavailable', 'The scanning library did not load. Type the booking code instead.');
    try {
      const fs = new Html5Qrcode('reader-file', { verbose: false });
      const text = await fs.scanFile(f, false);
      handleCode(text);
    } catch (err) {
      showResult('bad', 'No code found in that photo', 'Use a sharp photo with the whole QR code in frame, or type the booking code.');
    }
    input.value = '';
  }

  window.Admin = { render, cleanup: () => { if (scanner) stopCamera(); } };
})();
