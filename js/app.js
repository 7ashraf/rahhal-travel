/* Rahhal prototype: shared UI helpers, router, marketing site, booking + payment, My Trips. */
(function () {
  const S = window.Store;
  const app = document.getElementById('app');

  // ---------- helpers ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => '$' + Math.round(n).toLocaleString('en-US');
  const img = name => `assets/img/${name}.jpg`;
  const fmt = (iso, o = { day: 'numeric', month: 'short' }) => S.parse(iso).toLocaleDateString('en-GB', o);
  const fmtLong = iso => fmt(iso, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const range = t => {
    const a = S.parse(t.start), b = S.parse(t.end);
    if (t.start === t.end) return fmt(t.start);
    return a.getMonth() === b.getMonth() ? `${a.getDate()}–${fmt(t.end)}` : `${fmt(t.start)} – ${fmt(t.end)}`;
  };
  const phoneFmt = p => { const d = S.normPhone(p); return d.length === 11 ? `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7)}` : d; };
  const initials = n => String(n || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const timeOf = isoDT => (isoDT || '').split('T')[1] || '';
  const status = t => S.tripStatus(t);
  const seatsLeft = t => Math.max(0, t.capacity - S.seatsTaken(t.id));
  const dayOf = t => S.diffDays(t.start, S.today()) + 1;
  const daysUntil = t => S.diffDays(S.today(), t.start);
  const relStart = t => {
    const st = status(t);
    if (st === 'active') return `Day ${dayOf(t)} of ${t.days}`;
    if (st === 'completed') return 'Completed';
    const n = daysUntil(t);
    return n === 0 ? 'Departs today' : n === 1 ? 'Departs tomorrow' : `Departs in ${n} days`;
  };
  const itineraryFor = (t, day) => t.itinerary.find(([label]) => {
    const n = (label.match(/\d+/g) || []).map(Number);
    return n.length && day >= n[0] && day <= (n[1] || n[0]);
  }) || t.itinerary[t.itinerary.length - 1];
  const ORIGINS = { CAI: 'Cairo', ZAM: 'Zamalek' };
  const groupOf = code => 'G' + ((code.charCodeAt(3) + code.charCodeAt(5)) % 4 + 1);

  const ICONS = {
    calendar: '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .7 3.2 2.4 3.5 5.2"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/>',
    wallet: '<path d="M4 7.5h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2h11"/><circle cx="16.5" cy="13.5" r="1.3"/>',
    tap: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M3.5 9a6 6 0 0 0 0 6M20.5 9a6 6 0 0 1 0 6"/>',
    dashboard: '<rect x="3" y="3" width="7.5" height="9" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="5.5" rx="1.5"/><rect x="13.5" y="11.5" width="7.5" height="9.5" rx="1.5"/><rect x="3" y="15" width="7.5" height="6" rx="1.5"/>',
    map: '<path d="M9 4.5L3 7v12.5l6-2.5 6 2.5 6-2.5V4.5L15 7 9 4.5zM9 4.5V17M15 7v12.5"/>',
    ticket: '<path d="M3 8.5V6a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 21 6v2.5a3.5 3.5 0 0 0 0 7V18a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18v-2.5a3.5 3.5 0 0 0 0-7z"/><path d="M14.5 5v14" stroke-dasharray="2 2.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.2 4-6.5 8-6.5s7.2 2.3 8 6.5"/>',
    scan: '<path d="M3 8V5.5A2.5 2.5 0 0 1 5.5 3H8M16 3h2.5A2.5 2.5 0 0 1 21 5.5V8M21 16v2.5a2.5 2.5 0 0 1-2.5 2.5H16M8 21H5.5A2.5 2.5 0 0 1 3 18.5V16M7 12h10"/>',
    logout: '<path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15M10 16l-4-4 4-4M6 12h10"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/>',
    shield: '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z"/><path d="M8.8 12.2l2.2 2.2 4.2-4.4"/>',
    plane: '<path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="13.5" width="4" height="6" rx="1.5"/><rect x="17" y="13.5" width="4" height="6" rx="1.5"/><path d="M19 19.5c0 1.2-1.5 2-3.5 2H13"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5L20 16M20 20v-4h-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/>',
    trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    camera: '<path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H8l1.5-2h5L16 6h2.5A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/><circle cx="12" cy="13" r="3.5"/>',
    alert: '<path d="M12 3.5L22 20H2z"/><path d="M12 10v4.5M12 17.5v.01"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    message: '<path d="M4 5.5h16v11H9l-5 4z"/>',
    money: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v5M18 9.5v5"/>',
    calendarCheck: '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M9 14.5l2 2 4-4"/>',
    route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>'
  };
  const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  const LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="var(--sea)"/><path d="M8.5 19.5a7.5 7.5 0 0 1 15 0z" fill="var(--sun)"/><path d="M6.5 22.8h19M10 26h12" stroke="var(--sea-ink)" stroke-width="2" stroke-linecap="round"/></svg>';
  const PASS_LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="#0a6c73"/><path d="M8.5 19.5a7.5 7.5 0 0 1 15 0z" fill="#e08a1e"/><path d="M6.5 22.8h19M10 26h12" stroke="#fffcf5" stroke-width="2" stroke-linecap="round"/></svg>';

  // ---------- modal / toast / sms ----------
  let modal = null;
  function openModal(html = '', opts = {}) {
    closeModal();
    const root = document.createElement('div');
    root.className = 'modal-root';
    root.innerHTML = `<div class="modal ${opts.wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
    root.addEventListener('mousedown', e => { if (e.target === root && !opts.sticky) closeModal(); });
    document.body.appendChild(root);
    document.body.style.overflow = 'hidden';
    modal = { root, onClose: opts.onClose };
    return root.firstElementChild;
  }
  function closeModal() {
    if (!modal) return;
    const m = modal; modal = null;
    m.root.remove();
    document.body.style.overflow = '';
    m.onClose && m.onClose();
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  const modalHead = title => `<div class="modal-head"><h3>${title}</h3><button class="icon-btn" data-close aria-label="Close">${ic('x')}</button></div>`;
  document.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModal(); });

  function toast(msg, kind = 'good') {
    let box = $('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.innerHTML = (kind === 'good' ? ic('check') : ic('alert')) + `<span>${msg}</span>`;
    box.appendChild(el);
    setTimeout(() => el.remove(), 3600);
  }

  let smsTimer;
  function sms(text) {
    $('.sms')?.remove();
    clearTimeout(smsTimer);
    const el = document.createElement('div');
    el.className = 'sms';
    el.setAttribute('role', 'status');
    el.innerHTML = `<div class="app">${ic('message')}</div><div><div class="meta"><b>Messages · Rahhal</b><span>now</span></div><p>${text}</p></div>`;
    el.addEventListener('click', () => el.remove());
    document.body.appendChild(el);
    smsTimer = setTimeout(() => el.remove(), 9000);
  }

  // ---------- boarding pass ----------
  function passHTML(b) {
    const t = S.trip(b.tripId) || {};
    const balance = b.total - b.paid;
    return `<div class="pass">
      ${b.checkedIn ? `<div class="stamp">Checked in ${esc(timeOf(b.checkedInAt))}</div>` : ''}
      <div class="pass-main">
        <div class="pass-top"><span class="logo">${PASS_LOGO}Rahhal</span><span class="pass-label">Trip pass</span></div>
        <div class="pass-route">
          <div><b>${esc(t.from)}</b><small>${esc(ORIGINS[t.from] || t.from)}</small></div>
          <div class="line"><svg viewBox="0 0 24 24">${ICONS.plane}</svg></div>
          <div style="text-align:right"><b>${esc(t.to)}</b><small style="margin-left:auto">${esc((t.place || '').split(',')[0])}</small></div>
        </div>
        <div class="pass-title">${esc(t.title)}</div>
        <div class="pass-grid">
          <div><span class="pass-label">Traveler</span><b>${esc(b.name)}</b></div>
          <div><span class="pass-label">Date</span><b>${t.start ? fmt(t.start) : ''}</b></div>
          <div><span class="pass-label">Meet</span><b>${esc(t.depart)}</b></div>
          <div><span class="pass-label">Guests</span><b>${b.pax}</b></div>
          <div><span class="pass-label">Group</span><b>${groupOf(b.code)}</b></div>
          <div><span class="pass-label">Payment</span><b>${b.status === 'cancelled' ? 'Cancelled' : balance > 0 ? 'Balance due' : 'Paid'}</b></div>
        </div>
        <div class="pass-barcode" data-code="${esc(b.code)}"><svg></svg></div>
      </div>
      <div class="pass-stub">
        <div class="pass-qr" data-code="${esc(b.code)}"></div>
        <div><span class="pass-label">Booking</span><div class="pass-code" style="margin-top:6px">${esc(b.code)}</div></div>
      </div>
    </div>`;
  }
  function hydratePasses(root = document) {
    $$('.pass-qr[data-code]', root).forEach(el => {
      if (el.dataset.done) return;
      el.dataset.done = '1';
      if (window.QRCode) {
        new QRCode(el, { text: el.dataset.code, width: 220, height: 220, colorDark: '#15242c', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
        el.removeAttribute('title');
      } else el.innerHTML = `<span class="pass-code">${esc(el.dataset.code)}</span>`;
    });
    $$('.pass-barcode[data-code]', root).forEach(el => {
      const svg = el.querySelector('svg');
      if (!window.JsBarcode || el.dataset.done) return;
      el.dataset.done = '1';
      try {
        JsBarcode(svg, el.dataset.code, { format: 'CODE128', displayValue: false, height: 38, margin: 0, width: 2, lineColor: '#15242c', background: 'transparent' });
        const w = parseFloat(svg.getAttribute('width')), h = parseFloat(svg.getAttribute('height'));
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.removeAttribute('width'); svg.removeAttribute('height'); svg.removeAttribute('style');
      } catch (e) { /* barcode is decorative next to the QR */ }
    });
  }
  function showPass(b) {
    const t = S.trip(b.tripId);
    const m = openModal(`${modalHead('Your trip pass')}
      <div class="modal-body">
        <div style="display:grid;justify-items:center">${passHTML(b)}</div>
        <p class="muted" style="text-align:center;font-size:.9rem">Show this at the meeting point. Your host scans the QR code to check you in.</p>
        ${t && status(t) !== 'completed' ? `<div class="host">
          <div class="avatar">${initials(t.host)}</div>
          <div class="stack" style="gap:2px;flex:1"><b>${esc(t.host)}</b><span class="muted" style="font-size:.85rem">Your trip host · ${phoneFmt(t.hostPhone)}</span></div>
          <span class="pill info plain">${ic('pin')} ${esc(t.meeting.split(',')[0])}</span></div>` : ''}
      </div>`);
    hydratePasses(m);
  }

  // ---------- layout ----------
  let mobileNav = false;
  function header(active) {
    const signed = S.session.get();
    const link = (h, l) => `<a href="#${h}" class="${active === h ? 'active' : ''}">${l}</a>`;
    return `<header class="site-header">
      <div class="wrap">
        <a class="logo" href="#home">${LOGO}Rahhal</a>
        <nav class="nav" aria-label="Main">${link('home', 'Home')}${link('trips', 'Trips')}${link('my-trips', 'My trips')}</nav>
        <div class="spacer hide-sm"></div>
        <a class="btn btn-ghost btn-sm hide-sm" href="#admin">${ic('dashboard')}Admin</a>
        <a class="btn btn-primary btn-sm hide-sm" href="#my-trips">${ic('phone')}${signed ? phoneFmt(signed) : 'Sign in with mobile'}</a>
        <button class="icon-btn menu-btn" id="menu-btn" aria-label="Menu">${ic(mobileNav ? 'x' : 'menu')}</button>
      </div>
      <div class="mobile-nav" ${mobileNav ? '' : 'hidden'}>
        <a href="#home">Home</a><a href="#trips">Trips</a><a href="#my-trips">My trips</a><a href="#admin">Admin console</a>
      </div>
    </header>`;
  }
  function footer() {
    return `<footer class="site-footer"><div class="wrap">
      <div class="cols">
        <div class="stack" style="gap:10px;max-width:34ch">
          <a class="logo" href="#home">${LOGO}Rahhal</a>
          <p>Small-group trips from Cairo since 2014. Hosted, insured, and paid in installments if you like.</p>
          <p class="mono" style="font-size:.85rem">+20 2 2736 1400 · hello@rahhal.travel</p>
        </div>
        <div><h4>Trips</h4><a href="#trips">All trips</a><a href="#trip-santorini">Santorini</a><a href="#trip-bali">Bali</a><a href="#trip-dahab">Dahab diving</a></div>
        <div><h4>Travelers</h4><a href="#my-trips">My trips</a><a href="#trips">Group discounts</a><a href="#trips">Gift a trip</a></div>
        <div><h4>Team</h4><a href="#admin">Admin console</a><a href="#admin-checkin">Check-in scanner</a><a href="#home">Careers</a></div>
      </div>
      <div class="legal"><span>© 2026 Rahhal Travel · Licensed travel agency, category A</span><span>Prototype · demo data only</span></div>
    </div></footer>`;
  }
  function site(html, active) {
    app.innerHTML = header(active) + `<main>${html}</main>` + footer();
    $('#menu-btn').onclick = () => { mobileNav = !mobileNav; route(false); };
  }

  // ---------- trip card ----------
  function tripCard(t) {
    const left = seatsLeft(t), st = status(t);
    const right = st === 'active' ? '<span class="tag">On the road now</span>'
      : left <= 0 ? '<span class="tag">Sold out</span>'
        : left <= 4 ? `<span class="tag hot">${left} seat${left > 1 ? 's' : ''} left</span>` : '';
    return `<a class="trip-card" href="#trip-${t.id}">
      <div class="media"><img src="${img(t.image)}" alt="${esc(t.title)}" loading="lazy"><div class="media-tags"><span class="tag">${esc(t.category)}</span>${right}</div></div>
      <div class="body">
        <div class="place">${esc(t.place)}</div>
        <h3>${esc(t.title)}</h3>
        <div class="trip-meta"><span>${ic('calendar')}${range(t)}</span><span>${ic('clock')}${t.days} days</span></div>
        <div class="foot"><div class="price">${money(t.price)} <small>/ person</small></div><span class="muted" style="font-size:.82rem">${relStart(t)}</span></div>
      </div></a>`;
  }

  // ---------- home ----------
  const listState = { q: '', cat: 'All', month: '', sort: 'soon' };
  function renderHome() {
    const trips = S.trips().filter(t => t.published);
    const upcoming = trips.filter(t => status(t) === 'upcoming').sort((a, b) => a.start.localeCompare(b.start)).slice(0, 6);
    const live = trips.filter(t => status(t) === 'active');
    const cats = [['Beach', 'beach', 'Islands, reefs and overwater villas'], ['Culture', 'bali', 'Temples, museums and old cities'], ['Adventure', 'mountains', 'Diving, hiking and alpine rail'], ['City', 'tokyo', 'Food walks and skyline nights']];
    const months = monthOptions();
    const demoBk = S.booking('RH-S8T2M') || S.bookings()[0];

    site(`
      <section class="hero">
        <div class="hero-bg" style="background-image:url('${img('hero-lake')}')"></div>
        <div class="wrap">
          <span class="eyebrow" style="color:#ffd08a">Small-group trips from Cairo</span>
          <h1>Go further, <em>together.</em></h1>
          <p class="hero-lead">Hosted trips for 12 to 30 people. Book in two minutes, pay in full or reserve with 30%, and carry your pass on your phone.</p>
          <form class="hero-search" id="hero-search">
            <label class="field"><span>Where to</span><input class="input" id="hs-q" placeholder="Bali, beach, Istanbul…" list="hs-places"></label>
            <label class="field"><span>When</span><select class="input" id="hs-month"><option value="">Any month</option>${months.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label>
            <label class="field"><span>Travelers</span><select class="input" id="hs-pax">${[1, 2, 3, 4, 5, 6].map(n => `<option>${n}</option>`).join('')}</select></label>
            <button class="btn btn-primary" type="submit">${ic('search')}Find trips</button>
            <datalist id="hs-places">${trips.map(t => `<option value="${esc(t.place.split(',')[0])}">`).join('')}</datalist>
          </form>
          <div class="trust">
            <span>${ic('star')}4.9 from 2,300 reviews</span><span>${ic('shield')}Fully insured trips</span><span>${ic('wallet')}Reserve with 30%</span>
          </div>
        </div>
      </section>

      ${live.length ? `<section class="band section-tight"><div class="wrap">
        <div class="section-head"><div class="stack"><span class="pill good live">Live</span><h2>On the road right now</h2></div>
          <a class="btn btn-ghost btn-sm" href="#my-trips">On one of these? See your pass ${ic('arrow')}</a></div>
        <div class="live-list">${live.map(t => {
          const pax = S.bookingsFor(t.id).filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.pax, 0);
          return `<a class="live-item" href="#trip-${t.id}"><img src="${img(t.image)}" alt=""><div class="stack">
            <b>${esc(t.title)}</b><span class="muted" style="font-size:.85rem">Day ${dayOf(t)} of ${t.days} · ${pax} travelers · ${esc(t.host)}</span>
            <div class="meter" style="margin-top:6px"><i style="width:${Math.round(dayOf(t) / t.days * 100)}%"></i></div></div></a>`;
        }).join('')}</div>
      </div></section>` : ''}

      <section class="section"><div class="wrap">
        <div class="section-head"><div class="stack"><span class="eyebrow">Departing soon</span><h2>Next departures</h2></div><a class="btn btn-ghost" href="#trips">All trips ${ic('arrow')}</a></div>
        <div class="cards">${upcoming.map(tripCard).join('')}</div>
      </div></section>

      <section class="section" style="padding-top:0"><div class="wrap">
        <div class="section-head"><div class="stack"><span class="eyebrow">Trip styles</span><h2>Pick the kind of week you want</h2></div></div>
        <div class="cats">${cats.map(([c, im, d]) => {
          const n = trips.filter(t => t.category === c && status(t) !== 'completed').length;
          return `<a class="cat" href="#trips" data-cat="${c}"><img src="${img(im)}" alt="" loading="lazy"><div><h3>${c}</h3><span>${d} · ${n} trip${n === 1 ? '' : 's'}</span></div></a>`;
        }).join('')}</div>
      </div></section>

      <section class="band section"><div class="wrap">
        <div class="section-head"><div class="stack"><span class="eyebrow">How booking works</span><h2>From browsing to boarding in four steps</h2></div></div>
        <div class="steps">
          <div class="step"><span class="step-n">01</span><h3>Pick a trip</h3><p>Every trip lists the real itinerary, host, meeting point and seats left.</p></div>
          <div class="step"><span class="step-n">02</span><h3>Pay or reserve</h3><p>Pay in full by card or wallet, or hold your seat with 30% and pay the rest 14 days before.</p></div>
          <div class="step"><span class="step-n">03</span><h3>Get your pass by SMS</h3><p>Your trip pass arrives by text. Sign in with your mobile number any time, no password.</p></div>
          <div class="step"><span class="step-n">04</span><h3>Scan in and go</h3><p>Your host scans the QR code at the meeting point. That's the whole check-in.</p></div>
        </div>
      </div></section>

      <section class="section"><div class="wrap split">
        <div class="split-img"><img src="${img('planning')}" alt="Map, notebook and camera laid out for trip planning" loading="lazy"></div>
        <div class="stack" style="gap:16px">
          <span class="eyebrow">Why Rahhal</span>
          <h2>We plan it, host it, and pick up the phone at 2 a.m.</h2>
          <p class="muted">Every departure has a named host who travels with the group, plus a 24/7 line in Cairo. You get the trip; we handle the logistics.</p>
          <div class="stats">
            <div><b class="num">12,400</b><span>travelers hosted</span></div>
            <div><b class="num">38</b><span>destinations</span></div>
            <div><b class="num">4.9</b><span>average rating</span></div>
          </div>
        </div>
      </div></section>

      <section class="section" style="padding-top:0"><div class="wrap">
        <div class="features">
          ${[['users', 'Small groups', 'Never more than 30 people, 18 on average. Big enough to be fun, small enough to know names.'],
            ['compass', 'Hosts who live there', 'Local hosts and guides on every trip, not a call centre.'],
            ['wallet', 'Flexible payments', 'Reserve with 30% and pay the balance any time up to 14 days before departure.'],
            ['phone', 'Your pass on your phone', 'Sign in with your mobile number to see your pass, today\'s plan and your host\'s number.'],
            ['headset', '24/7 on-trip support', 'A real person in Cairo answers day and night while you\'re away.'],
            ['calendarCheck', 'Free date changes', 'Move to another departure free of charge up to 21 days before you leave.']]
            .map(([i, h, p]) => `<div class="feature"><div class="ic-wrap">${ic(i)}</div><div><h4>${h}</h4><p>${p}</p></div></div>`).join('')}
        </div>
      </div></section>

      <section class="band section"><div class="wrap">
        <div class="section-head"><div class="stack"><span class="eyebrow">Travelers</span><h2>What groups say after the trip</h2></div></div>
        <div class="quotes">
          ${[['Booked Dahab with a 30% deposit, paid the rest from my phone two weeks later. At the bus the host just scanned my screen.', 'Mariam Fathy', 'Dahab Reef Diving Week'],
            ['Our host in Istanbul knew every shortcut through the bazaar. Eighteen strangers on day one, a WhatsApp group of friends by day six.', 'Karim Mostafa', 'Istanbul Bosphorus & Bazaars'],
            ['I travel alone and was nervous. The itinerary was exactly what they promised, down to the meeting time.', 'Salma Ibrahim', 'Paris in Autumn']]
            .map(([q, n, t]) => `<figure class="quote" style="margin:0"><div class="stack" style="gap:10px"><span class="stars">★★★★★</span><p>“${q}”</p></div>
              <figcaption class="who"><span class="avatar">${initials(n)}</span><span><b>${n}</b><br><span class="muted">${t}</span></span></figcaption></figure>`).join('')}
        </div>
      </div></section>

      <section class="section"><div class="wrap">
        <div class="cta">
          <div>
            <span class="eyebrow" style="color:var(--sun)">Already booked?</span>
            <h2 style="margin-top:10px">Your pass is one text message away.</h2>
            <p>Enter your mobile number, type the 4-digit code we send, and you'll see every trip you've booked, what's planned today, and the QR code your host will scan.</p>
            <div class="row" style="margin-top:22px"><a class="btn btn-sun" href="#my-trips">${ic('phone')}Sign in with mobile</a><a class="btn btn-light" href="#trips">Browse trips</a></div>
          </div>
          <div style="display:grid;justify-items:center">${demoBk ? passHTML(demoBk) : ''}</div>
        </div>
      </div></section>
    `, 'home');

    hydratePasses(app);
    $('#hero-search').onsubmit = e => {
      e.preventDefault();
      Object.assign(listState, { q: $('#hs-q').value.trim(), month: $('#hs-month').value, cat: 'All', pax: +$('#hs-pax').value });
      go('trips');
    };
    $$('.cat').forEach(a => a.addEventListener('click', () => { Object.assign(listState, { cat: a.dataset.cat, q: '', month: '' }); }));
  }

  function monthOptions() {
    const set = new Set(S.trips().filter(t => t.published && status(t) !== 'completed').map(t => t.start.slice(0, 7)));
    return [...set].sort().map(m => [m, S.parse(m + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })]);
  }

  // ---------- trips listing ----------
  function renderTrips() {
    const cats = ['All', 'Beach', 'Culture', 'Adventure', 'City'];
    site(`<div class="wrap">
      <div class="page-head"><span class="eyebrow">All departures</span><h1 style="font-size:clamp(2rem,4vw,3rem)">Find your next trip</h1>
        <p class="muted">Prices are per person and include flights or coach from Cairo unless noted.</p></div>
      <div class="filters">
        <label class="search">${ic('search')}<input class="input" id="f-q" placeholder="Search destination or trip" value="${esc(listState.q)}" aria-label="Search trips"></label>
        <div class="chips" id="f-cats">${cats.map(c => `<button class="chip ${listState.cat === c ? 'on' : ''}" data-cat="${c}">${c}</button>`).join('')}</div>
        <select class="input" id="f-month" aria-label="Month"><option value="">Any month</option>${monthOptions().map(([v, l]) => `<option value="${v}" ${listState.month === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <select class="input" id="f-sort" aria-label="Sort">
          <option value="soon" ${listState.sort === 'soon' ? 'selected' : ''}>Soonest first</option>
          <option value="low" ${listState.sort === 'low' ? 'selected' : ''}>Price: low to high</option>
          <option value="high" ${listState.sort === 'high' ? 'selected' : ''}>Price: high to low</option>
        </select>
      </div>
      <p class="muted" id="f-count" style="margin-bottom:14px;font-size:.9rem"></p>
      <div id="grid" style="padding-bottom:40px"></div>
    </div>`, 'trips');

    const draw = () => {
      const q = listState.q.toLowerCase();
      let list = S.trips().filter(t => t.published && status(t) !== 'completed')
        .filter(t => !q || (t.title + ' ' + t.place + ' ' + t.category).toLowerCase().includes(q))
        .filter(t => listState.cat === 'All' || t.category === listState.cat)
        .filter(t => !listState.month || t.start.slice(0, 7) === listState.month);
      list.sort(listState.sort === 'low' ? (a, b) => a.price - b.price : listState.sort === 'high' ? (a, b) => b.price - a.price : (a, b) => a.start.localeCompare(b.start));
      $('#f-count').textContent = `${list.length} trip${list.length === 1 ? '' : 's'}`;
      $('#grid').innerHTML = list.length ? `<div class="cards">${list.map(tripCard).join('')}</div>`
        : `<div class="empty">${ic('compass')}<b>No trips match those filters</b><span>Try another month or clear the search.</span><button class="btn btn-ghost btn-sm" id="f-clear">Clear filters</button></div>`;
      const clr = $('#f-clear');
      if (clr) clr.onclick = () => { Object.assign(listState, { q: '', cat: 'All', month: '' }); renderTrips(); };
    };
    $('#f-q').oninput = e => { listState.q = e.target.value; draw(); };
    $('#f-month').onchange = e => { listState.month = e.target.value; draw(); };
    $('#f-sort').onchange = e => { listState.sort = e.target.value; draw(); };
    $$('#f-cats .chip').forEach(b => b.onclick = () => {
      listState.cat = b.dataset.cat;
      $$('#f-cats .chip').forEach(x => x.classList.toggle('on', x === b));
      draw();
    });
    draw();
  }

  // ---------- trip detail ----------
  function renderTrip(id) {
    const t = S.trip(id);
    if (!t) {
      site(`<div class="wrap section"><div class="empty">${ic('compass')}<b>That trip isn't available</b><a class="btn btn-primary btn-sm" href="#trips">See all trips</a></div></div>`, 'trips');
      return;
    }
    const st = status(t);
    const today = st === 'active' ? dayOf(t) : 0;
    const bk = { pax: listState.pax || 1, plan: 'full' };

    site(`<div class="wrap">
      <div class="crumbs"><a href="#trips">${ic('back')}</a><a href="#trips">Trips</a><span>/</span><span>${esc(t.category)}</span></div>
      <div class="stack" style="gap:10px;margin-bottom:22px">
        <span class="eyebrow">${esc(t.place)}</span>
        <h1 style="font-size:clamp(2rem,4.4vw,3.2rem)">${esc(t.title)}</h1>
        <div class="row muted" style="font-size:.95rem"><span class="row" style="gap:6px">${ic('star')}4.9 · 128 reviews</span><span>·</span><span>${relStart(t)}</span>${st === 'active' ? '<span class="pill good live">On the road now</span>' : ''}</div>
      </div>
      <div class="gallery single"><img src="${img(t.image)}" alt="${esc(t.title)}"></div>
      <div class="detail">
        <div class="detail-main">
          <p class="lead">${esc(t.summary)}</p>
          <div class="facts">
            <div class="fact"><span>Dates</span><b>${range(t)}</b></div>
            <div class="fact"><span>Duration</span><b>${t.days} days</b></div>
            <div class="fact"><span>Group size</span><b>Max ${t.capacity}</b></div>
            <div class="fact"><span>Departs</span><b>${esc(t.from)} · ${esc(t.depart)}</b></div>
          </div>
          <div class="stack"><h3>Highlights</h3><div class="hl">${t.highlights.map(h => `<span>${esc(h)}</span>`).join('')}</div></div>
          <div class="stack" style="gap:18px"><h3>Day by day</h3>
            <div class="timeline">${t.itinerary.map(([d, h, p]) => {
              const now = today && itineraryFor(t, today)[0] === d;
              return `<div class="tl-item ${now ? 'now' : ''}"><div class="tl-day">${esc(d)}</div><div class="tl-dot"><i></i></div><div class="tl-body"><h4>${esc(h)} ${now ? '<span class="pill good plain" style="margin-left:6px">Today</span>' : ''}</h4><p>${esc(p)}</p></div></div>`;
            }).join('')}</div>
          </div>
          <div class="lists">
            <div><h3>Included</h3><ul class="ticks">${t.includes.map(x => `<li>${ic('check')}${esc(x)}</li>`).join('')}</ul></div>
            <div><h3>Not included</h3><ul class="ticks no">${t.excludes.map(x => `<li>${ic('x')}${esc(x)}</li>`).join('')}</ul></div>
          </div>
          <div class="stack"><h3>Meeting point and host</h3>
            <div class="host"><div class="avatar">${initials(t.host)}</div><div class="stack" style="gap:2px;flex:1"><b>${esc(t.host)}</b><span class="muted" style="font-size:.88rem">Trip host · travels with the group</span></div></div>
            <div class="host">${ic('pin')}<div class="stack" style="gap:2px"><b>${esc(t.meeting)}</b><span class="muted" style="font-size:.88rem">${fmtLong(t.start)} at ${esc(t.depart)}</span></div></div>
          </div>
        </div>
        <aside class="book-card" id="book-card"></aside>
      </div>
    </div>`, 'trips');

    const card = $('#book-card');
    const drawCard = () => {
      const left = seatsLeft(t);
      const pct = Math.round((t.capacity - left) / t.capacity * 100);
      const canDeposit = daysUntil(t) > 14;
      if (!canDeposit) bk.plan = 'full';
      bk.pax = Math.max(1, Math.min(bk.pax, Math.max(1, left)));
      const total = t.price * bk.pax;
      const due = bk.plan === 'deposit' ? Math.round(total * 0.3) : total;
      const closed = st !== 'upcoming' || left === 0;
      card.innerHTML = `
        <div><div class="price">${money(t.price)} <small>/ person</small></div></div>
        <div><div class="seats-line"><span>${left > 0 ? `${left} of ${t.capacity} seats left` : 'Sold out'}</span><span>${pct}% booked</span></div><div class="meter ${left <= 4 ? 'sun' : ''}"><i style="width:${pct}%"></i></div></div>
        ${closed ? `<div class="hint" style="background:var(--surface-2);color:var(--muted)">${st === 'active' ? 'This departure is under way. Booked travelers can open their pass in My Trips.' : st === 'completed' ? 'This departure has finished.' : 'This departure is full. Join the waitlist and we\'ll text you if a seat opens.'}</div>
          ${st === 'upcoming' ? `<button class="btn btn-ghost btn-block" id="waitlist">Join the waitlist</button>` : `<a class="btn btn-primary btn-block" href="#my-trips">${ic('phone')}Open My Trips</a>`}` : `
        <div class="row" style="justify-content:space-between"><span style="font-weight:600">Travelers</span>
          <div class="stepper"><button id="pax-minus" aria-label="Fewer travelers">−</button><b class="num">${bk.pax}</b><button id="pax-plus" aria-label="More travelers">+</button></div></div>
        <div class="stack" style="gap:8px">
          <label class="opt"><input type="radio" name="plan" value="full" ${bk.plan === 'full' ? 'checked' : ''}><span><b>Pay in full</b><small>Card, wallet or Apple Pay</small></span><b class="num">${money(total)}</b></label>
          <label class="opt" style="${canDeposit ? '' : 'opacity:.5;pointer-events:none'}"><input type="radio" name="plan" value="deposit" ${bk.plan === 'deposit' ? 'checked' : ''} ${canDeposit ? '' : 'disabled'}><span><b>Reserve with 30%</b><small>${canDeposit ? `Balance due by ${fmt(S.addDays(t.start, -14))}` : 'Not available within 14 days of departure'}</small></span><b class="num">${money(Math.round(total * 0.3))}</b></label>
        </div>
        <div class="sum">
          <div><span class="muted">${money(t.price)} × ${bk.pax} traveler${bk.pax > 1 ? 's' : ''}</span><span class="num">${money(total)}</span></div>
          ${bk.plan === 'deposit' ? `<div><span class="muted">Balance later</span><span class="num">${money(total - due)}</span></div>` : ''}
          <div class="total"><span>Due today</span><span class="num">${money(due)}</span></div>
        </div>
        <button class="btn btn-primary btn-block" id="book-btn" style="height:50px">Book and pay ${money(due)}</button>
        <p class="muted" style="font-size:.8rem;text-align:center">Free date change up to 21 days before departure.</p>`}`;
      const minus = $('#pax-minus'), plus = $('#pax-plus');
      if (minus) {
        minus.onclick = () => { bk.pax = Math.max(1, bk.pax - 1); drawCard(); };
        plus.onclick = () => { if (bk.pax < Math.min(6, left)) bk.pax++; else toast(`Up to ${Math.min(6, left)} travelers per booking`, 'warn'); drawCard(); };
        $$('input[name=plan]', card).forEach(r => r.onchange = () => { bk.plan = r.value; drawCard(); });
        $('#book-btn').onclick = () => openCheckout(t, bk.pax, bk.plan);
      }
      const wl = $('#waitlist');
      if (wl) wl.onclick = () => toast('You\'re on the waitlist. We\'ll text you if a seat opens.');
    };
    drawCard();
  }

  // ---------- checkout & payment ----------
  function paymentHTML(st, amount) {
    const c = st.card;
    const shown = (c.num || '').padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim();
    return `
      <div class="pay-tabs" role="tablist">
        ${[['card', 'card', 'Card'], ['wallet', 'wallet', 'Mobile wallet'], ['apple', 'tap', 'Apple Pay']].map(([k, i, l]) => `<button type="button" class="pay-tab ${st.method === k ? 'on' : ''}" data-method="${k}">${ic(i)}${l}</button>`).join('')}
      </div>
      ${st.method === 'card' ? `
        <div class="card-visual" aria-hidden="true">
          <div class="row" style="justify-content:space-between"><span>Rahhal Pay</span><span>Visa</span></div>
          <div class="num-line" id="cv-num">${shown}</div>
          <div class="row"><span id="cv-name">${esc(c.holder || 'Card holder')}</span><span id="cv-exp">${esc(c.exp || 'MM/YY')}</span></div>
        </div>
        <div class="stack">
          <label class="field"><span>Card number</span><input class="input mono" id="c-num" inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242" value="${esc((c.num || '').replace(/(.{4})/g, '$1 ').trim())}"></label>
          <div class="grid-3">
            <label class="field"><span>Expiry</span><input class="input mono" id="c-exp" placeholder="MM/YY" inputmode="numeric" autocomplete="cc-exp" value="${esc(c.exp)}"></label>
            <label class="field"><span>CVC</span><input class="input mono" id="c-cvc" placeholder="123" inputmode="numeric" autocomplete="cc-csc" value="${esc(c.cvc)}"></label>
            <label class="field"><span>Name on card</span><input class="input" id="c-holder" autocomplete="cc-name" value="${esc(c.holder)}"></label>
          </div>
          <div class="hint">Prototype: no real payment is taken. <button type="button" id="fill-card">Fill a test card</button></div>
        </div>`
      : st.method === 'wallet' ? `
        <label class="field"><span>Wallet number</span><div class="phone-input"><span>+20</span><input id="w-phone" inputmode="tel" value="${esc(phoneFmt(st.phone))}"></div></label>
        <p class="muted" style="font-size:.9rem">We'll send a payment request of <b>${money(amount)}</b> to this number. Approve it in your wallet app to confirm.</p>`
      : `<p class="muted" style="font-size:.9rem">Confirm with Face ID or Touch ID on your device. Your card details are never shared with Rahhal.</p>`}
      <button class="btn btn-primary btn-block" id="pay-btn" style="height:52px" ${st.busy ? 'disabled' : ''}>${st.busy ? '<span class="spinner"></span>Processing payment…' : `${ic('shield')}Pay ${money(amount)}`}</button>
      <p class="muted" style="font-size:.78rem;text-align:center">Secured with 3-D Secure · Receipt sent by SMS</p>`;
  }

  function bindPayment(root, st, amount, redraw, onPaid) {
    $$('.pay-tab', root).forEach(b => b.onclick = () => { st.method = b.dataset.method; redraw(); });
    const num = $('#c-num', root);
    if (num) {
      const exp = $('#c-exp', root), cvc = $('#c-cvc', root), holder = $('#c-holder', root);
      num.oninput = () => {
        const d = num.value.replace(/\D/g, '').slice(0, 16);
        st.card.num = d; num.value = d.replace(/(.{4})/g, '$1 ').trim();
        $('#cv-num', root).textContent = d.padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim();
        num.classList.remove('invalid');
      };
      exp.oninput = () => {
        let d = exp.value.replace(/\D/g, '').slice(0, 4);
        if (d.length > 2) d = d.slice(0, 2) + '/' + d.slice(2);
        st.card.exp = exp.value = d; $('#cv-exp', root).textContent = d || 'MM/YY'; exp.classList.remove('invalid');
      };
      cvc.oninput = () => { st.card.cvc = cvc.value = cvc.value.replace(/\D/g, '').slice(0, 4); cvc.classList.remove('invalid'); };
      holder.oninput = () => { st.card.holder = holder.value; $('#cv-name', root).textContent = holder.value || 'Card holder'; };
      $('#fill-card', root).onclick = () => { st.card = { num: '4242424242424242', exp: '08/29', cvc: '123', holder: st.name || 'Nour Adel' }; redraw(); };
    }
    const wp = $('#w-phone', root);
    if (wp) wp.oninput = () => wp.classList.remove('invalid');
    $('#pay-btn', root).onclick = () => {
      if (st.method === 'card') {
        const c = st.card; let ok = true;
        const mark = (id, bad) => { if (bad) { $(id, root).classList.add('invalid'); ok = false; } };
        mark('#c-num', c.num.length !== 16);
        mark('#c-exp', !/^(0[1-9]|1[0-2])\/\d{2}$/.test(c.exp));
        mark('#c-cvc', !/^\d{3,4}$/.test(c.cvc));
        if (!ok) { toast('Check the highlighted card fields', 'warn'); return; }
      }
      if (st.method === 'wallet') {
        const p = S.normPhone(wp.value);
        if (!/^01\d{9}$/.test(p)) { wp.classList.add('invalid'); toast('Enter an 11-digit Egyptian mobile number', 'warn'); return; }
      }
      st.busy = true; redraw();
      setTimeout(() => { st.busy = false; onPaid({ card: 'Card', wallet: 'Mobile wallet', apple: 'Apple Pay' }[st.method]); }, 1500);
    };
  }

  function openCheckout(trip, pax, plan) {
    const sess = S.session.get();
    const known = sess ? S.bookingsByPhone(sess)[0] : null;
    const st = {
      step: 1, name: known?.name || '', phone: sess || '', email: known?.email || '', agree: true,
      method: 'card', card: { num: '', exp: '', cvc: '', holder: '' }, busy: false, booking: null
    };
    const total = trip.price * pax;
    const due = plan === 'deposit' ? Math.round(total * 0.3) : total;
    const m = openModal('', { wide: true, sticky: true });

    const summary = () => `<aside class="summary-card">
      <img src="${img(trip.image)}" alt="">
      <div class="stack" style="gap:4px"><b>${esc(trip.title)}</b><span class="muted">${range(trip)} · ${pax} traveler${pax > 1 ? 's' : ''}</span></div>
      <div class="sum">
        <div><span class="muted">Trip total</span><span class="num">${money(total)}</span></div>
        ${plan === 'deposit' ? `<div><span class="muted">Balance by ${fmt(S.addDays(trip.start, -14))}</span><span class="num">${money(total - due)}</span></div>` : ''}
        <div class="total"><span>Due today</span><span class="num">${money(due)}</span></div>
      </div></aside>`;

    const draw = () => {
      const bar = `<div class="steps-bar">${['Traveler details', 'Payment', 'Your pass'].map((l, i) => `<div class="${st.step >= i + 1 ? 'on' : ''}">${l}</div>`).join('')}</div>`;
      if (st.step === 1) {
        m.innerHTML = `${modalHead('Book ' + esc(trip.title))}${bar}<div class="modal-body"><div class="checkout">
          <form class="stack" id="t-form" novalidate>
            <label class="field"><span>Lead traveler's full name</span><input class="input" id="t-name" autocomplete="name" value="${esc(st.name)}" placeholder="As on passport"></label>
            <label class="field"><span>Mobile number · your pass is sent here</span><div class="phone-input"><span>+20</span><input id="t-phone" inputmode="tel" autocomplete="tel" placeholder="010 1234 5678" value="${esc(phoneFmt(st.phone))}"></div></label>
            <label class="field"><span>Email for the receipt</span><input class="input" id="t-email" type="email" autocomplete="email" value="${esc(st.email)}" placeholder="name@mail.com"></label>
            <label class="check"><input type="checkbox" id="t-agree" ${st.agree ? 'checked' : ''}>I agree to the booking terms and cancellation policy.</label>
            <div class="modal-foot"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" type="submit">Continue to payment ${ic('arrow')}</button></div>
          </form>${summary()}</div></div>`;
        $('#t-form', m).onsubmit = e => {
          e.preventDefault();
          st.name = $('#t-name', m).value.trim();
          st.phone = S.normPhone($('#t-phone', m).value);
          st.email = $('#t-email', m).value.trim();
          st.agree = $('#t-agree', m).checked;
          let ok = true;
          const flag = (el, bad) => { el.classList.toggle('invalid', bad); if (bad) ok = false; };
          flag($('#t-name', m), st.name.length < 3);
          flag($('#t-phone', m).parentElement, !/^01\d{9}$/.test(st.phone));
          flag($('#t-email', m), !/^\S+@\S+\.\S+$/.test(st.email));
          if (!ok) return toast('Fill in the highlighted fields', 'warn');
          if (!st.agree) return toast('Accept the booking terms to continue', 'warn');
          st.step = 2; draw();
        };
      } else if (st.step === 2) {
        m.innerHTML = `${modalHead('Payment')}${bar}<div class="modal-body"><div class="checkout"><div class="stack" style="gap:14px">${paymentHTML(st, due)}
          <button type="button" class="btn btn-ghost btn-sm" id="back-1" style="justify-self:start">${ic('back')}Back</button></div>${summary()}</div></div>`;
        $('#back-1', m).onclick = () => { st.step = 1; draw(); };
        bindPayment(m, st, due, draw, method => {
          const b = S.addBooking({
            code: S.newCode(), tripId: trip.id, name: st.name, phone: st.phone, email: st.email, pax, total, paid: due,
            method, status: 'confirmed', checkedIn: false, checkedInAt: null, createdAt: S.today()
          });
          st.booking = b; st.step = 3;
          S.session.set(st.phone);
          draw();
          sms(`Booking <b>${b.code}</b> confirmed: ${esc(trip.title)}, ${fmt(trip.start)}. Meet ${esc(trip.depart)} at ${esc(trip.meeting.split(',')[0])}. Your pass is in My Trips.`);
        });
      } else {
        const b = st.booking;
        m.innerHTML = `${modalHead('You\'re booked')}${bar}<div class="modal-body" style="justify-items:center;text-align:center">
          <div class="success-mark">${ic('check')}</div>
          <div class="stack" style="gap:6px"><h2 style="font-size:1.7rem">See you in ${esc(trip.place.split(',')[0])}, ${esc(st.name.split(' ')[0])}.</h2>
          <p class="muted">We texted your pass to ${phoneFmt(st.phone)}. ${plan === 'deposit' ? `Pay the ${money(total - due)} balance any time before ${fmt(S.addDays(trip.start, -14))} from My Trips.` : 'Paid in full.'}</p></div>
          ${passHTML(b)}
          <div class="modal-foot" style="justify-content:center"><button class="btn btn-ghost" data-close>Done</button><a class="btn btn-primary" href="#my-trips" data-close>${ic('phone')}Open My Trips</a></div>
        </div>`;
        hydratePasses(m);
      }
    };
    draw();
    // a booking changes seat counts on the page behind the modal
    modal.onClose = () => { if (st.booking) route(false); };
  }

  function openBalance(b) {
    const t = S.trip(b.tripId);
    const amount = b.total - b.paid;
    const st = { name: b.name, phone: b.phone, method: 'card', card: { num: '', exp: '', cvc: '', holder: '' }, busy: false };
    const m = openModal('', { sticky: true });
    const draw = () => {
      m.innerHTML = `${modalHead('Pay your balance')}<div class="modal-body">
        <div class="host"><img src="${img(t.image)}" alt="" style="width:56px;height:56px;border-radius:10px;object-fit:cover"><div class="stack" style="gap:2px;flex:1"><b>${esc(t.title)}</b><span class="muted" style="font-size:.85rem">${b.code} · paid ${money(b.paid)} of ${money(b.total)}</span></div><b class="num">${money(amount)}</b></div>
        ${paymentHTML(st, amount)}</div>`;
      bindPayment(m, st, amount, draw, () => {
        S.updateBooking(b.code, { paid: b.total });
        closeModal();
        toast(`Paid ${money(amount)}. ${t.title} is fully paid.`);
        sms(`Payment of ${money(amount)} received for <b>${b.code}</b>. You're all set for ${esc(t.title)}.`);
        route(false);
      });
    };
    draw();
  }

  // ---------- My Trips (mobile number sign-in) ----------
  const auth = { stage: 'phone', phone: '', code: '', resendAt: 0 };
  let meTab = 'upcoming';
  let resendTimer;

  function renderMyTrips() {
    clearInterval(resendTimer);
    if (S.session.get()) return renderMe();
    site(`<div class="wrap auth-wrap">
      <div class="stack" style="gap:18px">
        <span class="eyebrow">My trips</span>
        <h1 style="font-size:clamp(2.1rem,4.4vw,3.3rem)">Your trips, one text message away.</h1>
        <p class="muted" style="max-width:46ch;font-size:1.08rem">No password and no app to install. Enter the mobile number you booked with and we'll text you a 4-digit code.</p>
        <ul class="ticks">
          <li>${ic('check')}Your QR pass for check-in at the meeting point</li>
          <li>${ic('check')}Today's plan and your host's number while you travel</li>
          <li>${ic('check')}Pay a remaining balance in two taps</li>
        </ul>
      </div>
      <div class="auth-card" id="auth-card"></div>
    </div>`, 'my-trips');
    drawAuth();
  }

  function drawAuth() {
    const card = $('#auth-card');
    clearInterval(resendTimer);
    if (auth.stage === 'phone') {
      card.innerHTML = `<div class="stack" style="gap:6px"><h3>Sign in with your mobile</h3><p class="muted" style="font-size:.92rem">We'll send a one-time code by SMS.</p></div>
        <form class="stack" id="phone-form" novalidate>
          <label class="field"><span>Mobile number</span><div class="phone-input"><span>+20</span><input id="a-phone" inputmode="tel" autocomplete="tel" placeholder="010 1234 5678" value="${esc(phoneFmt(auth.phone))}"></div></label>
          <button class="btn btn-primary btn-block" type="submit" style="height:50px">Send code</button>
        </form>
        <div class="hint">Demo traveler: <b class="mono">010 1234 5678</b> · <button type="button" id="use-demo">Use this number</button></div>`;
      const input = $('#a-phone');
      $('#use-demo').onclick = () => { input.value = '010 1234 5678'; input.focus(); };
      $('#phone-form').onsubmit = e => {
        e.preventDefault();
        const p = S.normPhone(input.value);
        if (!/^01\d{9}$/.test(p)) { input.parentElement.classList.add('invalid'); toast('Enter an 11-digit Egyptian mobile number, like 010 1234 5678', 'warn'); return; }
        auth.phone = p; sendCode();
      };
      input.focus();
    } else {
      card.innerHTML = `<div class="stack" style="gap:6px"><h3>Enter your code</h3><p class="muted" style="font-size:.92rem">Sent by SMS to <b>${phoneFmt(auth.phone)}</b>.</p></div>
        <div class="otp" id="otp">${[0, 1, 2, 3].map(i => `<input inputmode="numeric" maxlength="1" aria-label="Digit ${i + 1}" id="otp-${i}">`).join('')}</div>
        <p id="otp-err" class="muted" style="font-size:.88rem;color:var(--bad)" hidden>That code doesn't match. Check the latest SMS and try again.</p>
        <button class="btn btn-primary btn-block" id="verify" style="height:50px">Verify and continue</button>
        <div class="row" style="justify-content:space-between;font-size:.88rem"><button class="icon-btn" id="change" style="padding:4px 0">${ic('back')}Change number</button><button class="icon-btn" id="resend" style="padding:4px 0"></button></div>`;
      const boxes = $$('#otp input');
      const value = () => boxes.map(b => b.value).join('');
      boxes.forEach((b, i) => {
        b.oninput = () => {
          b.value = b.value.replace(/\D/g, '').slice(-1);
          $('#otp-err').hidden = true;
          if (b.value && i < 3) boxes[i + 1].focus();
          if (value().length === 4) verify();
        };
        b.onkeydown = e => { if (e.key === 'Backspace' && !b.value && i > 0) boxes[i - 1].focus(); };
        b.onpaste = e => {
          const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 4);
          if (!d) return;
          e.preventDefault();
          boxes.forEach((x, j) => x.value = d[j] || '');
          if (d.length === 4) verify();
        };
      });
      const verify = () => {
        if (value() === auth.code) {
          S.session.set(auth.phone);
          auth.stage = 'phone'; auth.code = '';
          const n = S.bookingsByPhone(auth.phone).length;
          toast(n ? `Signed in. ${n} booking${n > 1 ? 's' : ''} found.` : 'Signed in');
          $('.sms')?.remove();
          renderMe();
        } else if (value().length === 4) {
          $('#otp-err').hidden = false;
          boxes.forEach(x => x.value = '');
          boxes[0].focus();
        }
      };
      $('#verify').onclick = verify;
      $('#change').onclick = () => { auth.stage = 'phone'; drawAuth(); };
      const resend = $('#resend');
      const tick = () => {
        const s = Math.ceil((auth.resendAt - Date.now()) / 1000);
        resend.disabled = s > 0;
        resend.textContent = s > 0 ? `Resend in ${s}s` : 'Resend code';
        if (s <= 0) clearInterval(resendTimer);
      };
      resend.onclick = () => { if (!resend.disabled) sendCode(); };
      tick(); resendTimer = setInterval(tick, 1000);
      boxes[0].focus();
    }
  }

  function sendCode() {
    auth.code = String(1000 + Math.floor(Math.random() * 9000));
    auth.stage = 'code';
    auth.resendAt = Date.now() + 30000;
    drawAuth();
    setTimeout(() => sms(`Your Rahhal sign-in code is <b class="mono" style="font-size:1.05rem">${auth.code}</b>. It expires in 5 minutes.`), 600);
  }

  function renderMe() {
    const phone = S.session.get();
    const mine = S.bookingsByPhone(phone).map(b => ({ b, t: S.trip(b.tripId) })).filter(x => x.t);
    const name = mine[0]?.b.name || 'traveler';
    const isPast = x => x.b.status === 'cancelled' || status(x.t) === 'completed';
    const current = mine.filter(x => !isPast(x)).sort((a, z) => a.t.start.localeCompare(z.t.start));
    const past = mine.filter(isPast).sort((a, z) => z.t.start.localeCompare(a.t.start));
    const live = current.filter(x => status(x.t) === 'active');
    const next = current.filter(x => status(x.t) !== 'active');

    const payPill = b => b.status === 'cancelled' ? '<span class="pill bad">Cancelled</span>'
      : b.total > b.paid ? `<span class="pill warn">Balance ${money(b.total - b.paid)}</span>` : '<span class="pill good">Paid</span>';

    const nowCard = ({ b, t }) => {
      const d = dayOf(t); const [, h, p] = itineraryFor(t, d);
      return `<div class="now-card">
        <div class="media"><img src="${img(t.image)}" alt=""><span class="pill good live" style="background:var(--surface)">Happening now · Day ${d} of ${t.days}</span></div>
        <div class="info">
          <div class="stack" style="gap:6px"><span class="eyebrow">${esc(t.place)}</span><h2 style="font-size:1.8rem">${esc(t.title)}</h2></div>
          <div class="today-box"><span class="eyebrow">Today · ${fmt(S.today(), { weekday: 'long', day: 'numeric', month: 'short' })}</span><b>${esc(h)}</b><span class="muted" style="font-size:.9rem">${esc(p)}</span></div>
          <div class="trip-meta"><span>${ic('pin')}${esc(t.meeting.split(',')[0])}</span><span>${ic('clock')}Meet ${esc(t.depart)}</span><span>${ic('users')}${b.pax} traveler${b.pax > 1 ? 's' : ''}</span></div>
          <div class="host" style="padding:12px"><div class="avatar">${initials(t.host)}</div><div class="stack" style="gap:2px;flex:1"><b>${esc(t.host)}</b><span class="muted mono" style="font-size:.85rem">${phoneFmt(t.hostPhone)}</span></div>${b.checkedIn ? `<span class="pill good">Checked in ${esc(timeOf(b.checkedInAt))}</span>` : '<span class="pill warn">Not checked in</span>'}</div>
          <div class="row">${b.total > b.paid ? `<button class="btn btn-sun" data-pay="${b.code}">Pay balance ${money(b.total - b.paid)}</button>` : ''}<button class="btn btn-primary" data-pass="${b.code}">${ic('scan')}Show my pass</button><a class="btn btn-ghost" href="#trip-${t.id}">Itinerary</a></div>
        </div></div>`;
    };
    const row = ({ b, t }, past) => `<div class="bk">
      <img src="${img(t.image)}" alt="">
      <div class="stack">
        <div class="row" style="gap:8px"><b style="font-size:1.05rem">${esc(t.title)}</b>${payPill(b)}${past && b.checkedIn ? '<span class="pill info">Travelled</span>' : ''}</div>
        <div class="trip-meta"><span>${ic('calendar')}${range(t)}</span><span>${ic('users')}${b.pax}</span><span class="mono">${b.code}</span></div>
        ${!past ? `<span style="font-size:.88rem;font-weight:600;color:var(--sea)">${relStart(t)}${b.total > b.paid ? ` · balance due by ${fmt(S.addDays(t.start, -14))}` : ''}</span>` : ''}
      </div>
      <div class="actions">${!past && b.total > b.paid ? `<button class="btn btn-sun btn-sm" data-pay="${b.code}">Pay ${money(b.total - b.paid)}</button>` : ''}
        ${b.status !== 'cancelled' ? `<button class="btn ${past ? 'btn-ghost' : 'btn-primary'} btn-sm" data-pass="${b.code}">${past ? 'View pass' : 'Show pass'}</button>` : ''}
        <a class="btn btn-ghost btn-sm" href="#trip-${t.id}">Details</a></div>
    </div>`;

    const list = meTab === 'upcoming'
      ? (live.map(nowCard).join('') + (next.length ? `<div class="bk-list">${next.map(x => row(x, false)).join('')}</div>` : live.length ? '' : `<div class="empty">${ic('compass')}<b>No upcoming trips on ${phoneFmt(phone)}</b><span>Trips you book with this number appear here.</span><a class="btn btn-primary btn-sm" href="#trips">Browse trips</a></div>`))
      : (past.length ? `<div class="bk-list">${past.map(x => row(x, true)).join('')}</div>` : `<div class="empty">${ic('route')}<b>No past trips yet</b></div>`);

    site(`<div class="wrap" style="padding-bottom:40px">
      <div class="me-head">
        <div class="stack" style="gap:8px"><span class="eyebrow">My trips</span><h1 style="font-size:clamp(2rem,4vw,2.8rem)">Hi, ${esc(name.split(' ')[0])}</h1>
          <span class="muted row" style="gap:6px">${ic('phone')}${phoneFmt(phone)} · ${current.length} upcoming · ${past.length} past</span></div>
        <div class="row"><div class="tabs"><button data-tab="upcoming" class="${meTab === 'upcoming' ? 'on' : ''}">Active and upcoming</button><button data-tab="past" class="${meTab === 'past' ? 'on' : ''}">Past</button></div>
          <button class="btn btn-ghost btn-sm" id="signout">${ic('logout')}Sign out</button></div>
      </div>
      ${list}
    </div>`, 'my-trips');

    $$('[data-tab]').forEach(b => b.onclick = () => { meTab = b.dataset.tab; renderMe(); });
    $$('[data-pass]').forEach(b => b.onclick = () => showPass(S.booking(b.dataset.pass)));
    $$('[data-pay]').forEach(b => b.onclick = () => openBalance(S.booking(b.dataset.pay)));
    $('#signout').onclick = () => { S.session.clear(); auth.stage = 'phone'; auth.phone = ''; toast('Signed out'); renderMyTrips(); };
  }

  // ---------- demo guide ----------
  function mountGuide() {
    const btn = document.createElement('button');
    btn.className = 'btn btn-sun guide-btn';
    btn.innerHTML = `${ic('compass')}Demo guide`;
    document.body.appendChild(btn);
    let panel = null;
    btn.onclick = () => {
      if (panel) { panel.remove(); panel = null; return; }
      panel = document.createElement('div');
      panel.className = 'guide';
      panel.innerHTML = `<div class="row" style="justify-content:space-between"><h4>Try the prototype</h4><button class="icon-btn" id="g-close" aria-label="Close guide">${ic('x')}</button></div>
        <ol>
          <li><span><a href="#trip-santorini">Book a trip</a>: pick travelers, pay in full or 30%, use the test card. Your pass arrives by "SMS".</span></li>
          <li><span><a href="#my-trips">My Trips</a>: sign in with <code>010 1234 5678</code>. The code appears as a text message on screen.</span></li>
          <li><span><a href="#admin">Admin console</a>: dashboard, trips, bookings and travelers. Credentials are prefilled.</span></li>
          <li><span><a href="#admin-checkin">Check-in</a>: scan a pass with the camera, upload a photo of one, or type <code>RH-4N7QK</code>.</span></li>
        </ol>
        <button class="btn btn-ghost btn-sm" id="g-reset">${ic('refresh')}Reset demo data</button>`;
      document.body.appendChild(panel);
      $('#g-close', panel).onclick = () => { panel.remove(); panel = null; };
      $$('a', panel).forEach(a => a.addEventListener('click', () => { panel.remove(); panel = null; }));
      $('#g-reset', panel).onclick = () => { S.reset(); auth.stage = 'phone'; toast('Demo data reset'); panel.remove(); panel = null; route(false); };
    };
  }

  // ---------- router ----------
  function go(h) { if (location.hash === '#' + h) route(); else location.hash = h; }
  function route(scroll = true) {
    const h = decodeURIComponent(location.hash.slice(1)) || 'home';
    window.Admin?.cleanup?.();
    if (scroll) { mobileNav = false; closeModal(); }
    if (h.startsWith('admin')) window.Admin.render(h);
    else if (h.startsWith('trip-')) renderTrip(h.slice(5));
    else if (h === 'trips') renderTrips();
    else if (h === 'my-trips') renderMyTrips();
    else renderHome();
    if (scroll) window.scrollTo(0, 0);
  }

  window.UI = { $, $$, esc, money, img, fmt, fmtLong, range, phoneFmt, initials, timeOf, status, seatsLeft, dayOf, daysUntil, relStart, itineraryFor, ic, LOGO, openModal, closeModal, modalHead, toast, sms, passHTML, hydratePasses, showPass, route, go, get modal() { return modal; } };

  window.addEventListener('hashchange', () => route(true));
  window.addEventListener('DOMContentLoaded', () => { mountGuide(); route(false); });
})();
