/* Rahhal prototype: seed data + a tiny localStorage-backed store.
   Everything is client-side; "Reset demo data" in the demo guide restores the seed. */
(function () {
  const KEY = 'rahhal-db-v1';
  const SESSION_KEY = 'rahhal-session';
  const ADMIN_KEY = 'rahhal-admin';

  // ---------- date helpers (local dates as YYYY-MM-DD) ----------
  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const today = () => iso(new Date());
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);

  // ---------- seed trips (dates are offsets from today) ----------
  const TRIPS = [
    {
      id: 'giza', title: 'Giza Pyramids & Old Cairo', place: 'Cairo, Egypt', category: 'Culture',
      image: 'giza', offset: 0, days: 2, price: 149, capacity: 30, fill: 0.8,
      from: 'ZAM', to: 'GIZ', depart: '06:30', meeting: 'Rahhal office, 12 Brazil St, Zamalek',
      host: 'Dr. Hany Selim', hostPhone: '01001234567',
      summary: 'Two easy days with an Egyptologist: sunrise at the Great Pyramid, the Grand Egyptian Museum, and a farewell dinner on Al-Muizz Street.',
      highlights: ['Grand Egyptian Museum', 'Sunrise at the plateau', 'Khan el-Khalili walk', 'Egyptologist guide'],
      includes: ['Air-conditioned coach', 'Museum and site tickets', '1 night hotel near the plateau', 'Breakfast and dinner'],
      excludes: ['Inside-pyramid tickets', 'Tips'],
      itinerary: [
        ['Day 1', 'Plateau and museum', 'Meet at 06:30 in Zamalek. Sunrise at the pyramids and the Sphinx, then a guided afternoon at the Grand Egyptian Museum.'],
        ['Day 2', 'Old Cairo', 'Coptic Cairo, Ibn Tulun Mosque and Khan el-Khalili, then dinner on Al-Muizz Street. Back in Zamalek by 21:00.']
      ]
    },
    {
      id: 'dahab', title: 'Dahab Reef Diving Week', place: 'Dahab, South Sinai', category: 'Adventure',
      image: 'dahab', offset: -3, days: 7, price: 690, capacity: 16, fill: 0.94,
      from: 'CAI', to: 'DHB', depart: '22:00', meeting: 'Rahhal office, 12 Brazil St, Zamalek',
      host: 'Mona Rashed', hostPhone: '01112223344',
      summary: 'A week on the Gulf of Aqaba diving the Blue Hole, the Canyon and the Three Pools, with PADI instructors for every level.',
      highlights: ['Blue Hole and Bells', 'PADI Open Water option', 'Bedouin mountain dinner', 'Sea-view lodge'],
      includes: ['Return coach from Cairo', '6 nights lodge with breakfast', '10 guided dives with gear', 'Bedouin dinner'],
      excludes: ['PADI certification fee', 'Lunches'],
      itinerary: [
        ['Day 1', 'Arrive in Dahab', 'Overnight coach arrives at the lodge for breakfast. Gear fitting and a check-out dive at the Lighthouse.'],
        ['Days 2–3', 'Lighthouse and Eel Garden', 'Two dives a day on the house reefs. Theory sessions for Open Water students.'],
        ['Day 4', 'Blue Hole and Bells', 'The signature drift from the Bells to the Blue Hole saddle, then lunch at the reef camp.'],
        ['Day 5', 'Canyon and Three Pools', 'Swim-throughs in the Canyon and an afternoon dive at the Three Pools.'],
        ['Day 6', 'Ras Abu Galum', 'Boat day to the protected area, snorkelling and a Bedouin dinner in the mountains.'],
        ['Day 7', 'Back to Cairo', 'Free morning, then the coach back to Zamalek.']
      ]
    },
    {
      id: 'istanbul', title: 'Istanbul Bosphorus & Bazaars', place: 'Istanbul, Türkiye', category: 'City',
      image: 'istanbul', offset: -2, days: 6, price: 1090, capacity: 24, fill: 0.88,
      from: 'CAI', to: 'IST', depart: '09:40', meeting: 'Cairo Airport T3, Rahhal desk at gate 2',
      host: 'Selin Aydın', hostPhone: '01223344556',
      summary: 'Hagia Sophia at opening time, a private Bosphorus cruise, and food walks through Karaköy and Kadıköy.',
      highlights: ['Private Bosphorus cruise', 'Hagia Sophia and Topkapı', 'Kadıköy food walk', 'Boutique hotel in Galata'],
      includes: ['Return flights', '5 nights in Galata', 'Daily breakfast', 'Museum pass'],
      excludes: ['Visa fees', 'Dinners'],
      itinerary: [
        ['Day 1', 'Fly to Istanbul', 'Morning flight, check-in in Galata, evening walk to the tower.'],
        ['Day 2', 'Old City', 'Hagia Sophia, the Blue Mosque and the Basilica Cistern.'],
        ['Day 3', 'Topkapı and the Grand Bazaar', 'Palace in the morning, bazaar and spice market in the afternoon.'],
        ['Day 4', 'Bosphorus', 'Private cruise to Rumeli Fortress with lunch in Bebek.'],
        ['Day 5', 'Asian side', 'Ferry to Kadıköy for a food walk, free evening.'],
        ['Day 6', 'Fly home', 'Free morning and afternoon flight to Cairo.']
      ]
    },
    {
      id: 'dubai', title: 'Dubai City Lights', place: 'Dubai, UAE', category: 'City',
      image: 'dubai', offset: 8, days: 4, price: 820, capacity: 30, fill: 0.7,
      from: 'CAI', to: 'DXB', depart: '07:15', meeting: 'Cairo Airport T2, Rahhal desk',
      host: 'Karim Zaki', hostPhone: '01099887766',
      summary: 'Burj Khalifa at sunset, a desert safari with dinner, and an evening abra ride along the creek.',
      highlights: ['Burj Khalifa level 124', 'Desert safari and dinner', 'Old Dubai souks', 'Dubai Marina cruise'],
      includes: ['Return flights', '3 nights downtown', 'Daily breakfast', 'Airport transfers'],
      excludes: ['Visa', 'Lunches'],
      itinerary: [
        ['Day 1', 'Downtown', 'Arrive, check in, Burj Khalifa at sunset and the fountain show.'],
        ['Day 2', 'Old Dubai', 'Al Fahidi, the gold and spice souks, an abra across the creek.'],
        ['Day 3', 'Desert', 'Dune drive, camel ride and dinner at a desert camp.'],
        ['Day 4', 'Marina', 'Morning marina cruise, then the flight home.']
      ]
    },
    {
      id: 'santorini', title: 'Santorini Island Escape', place: 'Santorini, Greece', category: 'Beach',
      image: 'santorini', offset: 12, days: 6, price: 1480, capacity: 20, fill: 0.85,
      from: 'CAI', to: 'JTR', depart: '05:50', meeting: 'Cairo Airport T3, Rahhal desk at gate 2',
      host: 'Eleni Markou', hostPhone: '01155667788',
      summary: 'Cliffside suites in Firostefani, a catamaran day to the hot springs, and sunset over the caldera in Oia.',
      highlights: ['Caldera-view suites', 'Catamaran and hot springs', 'Oia sunset', 'Winery tasting'],
      includes: ['Return flights via Athens', '5 nights in Firostefani', 'Daily breakfast', 'Catamaran day with lunch'],
      excludes: ['Schengen visa', 'Dinners'],
      itinerary: [
        ['Day 1', 'Arrive in Fira', 'Transfer to Firostefani, welcome dinner on the caldera.'],
        ['Day 2', 'Catamaran day', 'Red Beach, the hot springs and lunch on board.'],
        ['Day 3', 'Akrotiri and wine', 'Bronze Age site in the morning, tasting at a family winery.'],
        ['Day 4', 'Oia', 'Free day and the walk from Fira to Oia for sunset.'],
        ['Day 5', 'Beaches', 'Kamari and Perissa black-sand beaches.'],
        ['Day 6', 'Fly home', 'Morning flight via Athens.']
      ]
    },
    {
      id: 'bali', title: 'Bali Temples & Rice Terraces', place: 'Ubud & Uluwatu, Indonesia', category: 'Culture',
      image: 'bali', offset: 26, days: 9, price: 1890, capacity: 18, fill: 0.6,
      from: 'CAI', to: 'DPS', depart: '01:20', meeting: 'Cairo Airport T2, Rahhal desk',
      host: 'Made Wirawan', hostPhone: '01266778899',
      summary: 'Water temples, the Tegallalang terraces at dawn, a cooking class in Ubud, and cliff-top sunsets in Uluwatu.',
      highlights: ['Ulun Danu Beratan temple', 'Tegallalang at dawn', 'Ubud cooking class', 'Uluwatu Kecak dance'],
      includes: ['Return flights', '8 nights in villas', 'Daily breakfast', 'Private driver-guides'],
      excludes: ['Visa on arrival', 'Some dinners'],
      itinerary: [
        ['Days 1–2', 'Arrive in Ubud', 'Long-haul flight, villa check-in and a slow first day.'],
        ['Day 3', 'Rice terraces', 'Tegallalang at dawn and the Tirta Empul water temple.'],
        ['Day 4', 'Lake temples', 'Ulun Danu Beratan and the Jatiluwih terraces.'],
        ['Day 5', 'Cooking class', 'Market visit and a Balinese cooking class.'],
        ['Days 6–8', 'Uluwatu', 'Beach days, cliff temple and the Kecak fire dance.'],
        ['Day 9', 'Fly home', 'Evening flight to Cairo.']
      ]
    },
    {
      id: 'phuket', title: 'Phuket Island Hopping', place: 'Phuket, Thailand', category: 'Beach',
      image: 'phuket', offset: 33, days: 7, price: 1190, capacity: 24, fill: 0.5,
      from: 'CAI', to: 'HKT', depart: '23:30', meeting: 'Cairo Airport T2, Rahhal desk',
      host: 'Niran Chai', hostPhone: '01033445566',
      summary: 'Speedboat days to Phi Phi and James Bond Island, a pool villa in Kata, and night markets in Old Town.',
      highlights: ['Phi Phi speedboat day', 'Phang Nga Bay kayaking', 'Kata pool villa', 'Old Town night market'],
      includes: ['Return flights', '6 nights in Kata', 'Daily breakfast', 'Two island tours'],
      excludes: ['Visa', 'Dinners'],
      itinerary: [
        ['Day 1', 'Arrive in Kata', 'Villa check-in and beach afternoon.'],
        ['Day 2', 'Phi Phi', 'Speedboat to Maya Bay and snorkelling stops.'],
        ['Day 3', 'Phang Nga Bay', 'Sea-cave kayaking and James Bond Island.'],
        ['Days 4–6', 'Free days', 'Old Town, the Big Buddha and the Sunday night market.'],
        ['Day 7', 'Fly home', 'Morning transfer to the airport.']
      ]
    },
    {
      id: 'maldives', title: 'Maldives Overwater Retreat', place: 'South Malé Atoll, Maldives', category: 'Beach',
      image: 'maldives', offset: 40, days: 5, price: 2650, capacity: 12, fill: 0.92,
      from: 'CAI', to: 'MLE', depart: '03:05', meeting: 'Cairo Airport T3, Rahhal desk at gate 2',
      host: 'Aisha Naseer', hostPhone: '01244556677',
      summary: 'Four nights in overwater villas, a sandbank picnic, and snorkelling with turtles on the house reef.',
      highlights: ['Overwater villa', 'Sandbank picnic', 'Turtle snorkelling', 'Sunset dolphin cruise'],
      includes: ['Return flights', 'Speedboat transfers', '4 nights half board', 'Two excursions'],
      excludes: ['Spa treatments', 'Drinks'],
      itinerary: [
        ['Day 1', 'Arrive in Malé', 'Speedboat to the resort and a sunset welcome.'],
        ['Day 2', 'House reef', 'Guided snorkel with turtles and reef sharks.'],
        ['Day 3', 'Sandbank', 'Private sandbank picnic and a dolphin cruise.'],
        ['Day 4', 'Free day', 'Spa, kayaks or nothing at all.'],
        ['Day 5', 'Fly home', 'Speedboat back to Malé for the flight.']
      ]
    },
    {
      id: 'alps', title: 'Swiss Alps & Lakes', place: 'Lucerne & Zermatt, Switzerland', category: 'Adventure',
      image: 'alps', offset: 55, days: 7, price: 2190, capacity: 16, fill: 0.4,
      from: 'CAI', to: 'ZRH', depart: '08:10', meeting: 'Cairo Airport T3, Rahhal desk at gate 2',
      host: 'Lukas Meier', hostPhone: '01177889900',
      summary: 'Lake Lucerne by boat, the Glacier Express, and a sunrise view of the Matterhorn from Gornergrat.',
      highlights: ['Glacier Express', 'Gornergrat sunrise', 'Lake Lucerne cruise', 'Mount Pilatus'],
      includes: ['Return flights', 'Swiss Travel Pass', '6 nights hotels', 'Daily breakfast'],
      excludes: ['Schengen visa', 'Lunches and dinners'],
      itinerary: [
        ['Day 1', 'Lucerne', 'Arrive in Zurich and train to Lucerne.'],
        ['Day 2', 'Lake and Pilatus', 'Lake cruise and the cogwheel railway up Mount Pilatus.'],
        ['Day 3', 'Glacier Express', 'The panoramic train to Zermatt.'],
        ['Days 4–5', 'Zermatt', 'Gornergrat at sunrise and the Five Lakes walk.'],
        ['Day 6', 'Geneva', 'Train to Geneva and a lakeside evening.'],
        ['Day 7', 'Fly home', 'Morning flight from Geneva.']
      ]
    },
    {
      id: 'tokyo', title: 'Tokyo Neon & Tradition', place: 'Tokyo & Kyoto, Japan', category: 'City',
      image: 'tokyo', offset: 70, days: 8, price: 2390, capacity: 20, fill: 0.35,
      from: 'CAI', to: 'HND', depart: '16:40', meeting: 'Cairo Airport T3, Rahhal desk at gate 2',
      host: 'Yuki Tanaka', hostPhone: '01288990011',
      summary: 'Shibuya and Shinjuku after dark, the bullet train to Kyoto, and early-morning temples before the crowds.',
      highlights: ['Shinkansen to Kyoto', 'Fushimi Inari at dawn', 'Tsukiji food tour', 'Ryokan night'],
      includes: ['Return flights', '7 nights hotels and a ryokan', 'JR rail segments', 'Daily breakfast'],
      excludes: ['Visa', 'Most dinners'],
      itinerary: [
        ['Days 1–2', 'Tokyo', 'Arrive, Shibuya crossing and an evening in Shinjuku.'],
        ['Day 3', 'Old Tokyo', 'Asakusa, Tsukiji outer market and teamLab.'],
        ['Day 4', 'Hakone', 'Ryokan night with views of Mount Fuji.'],
        ['Days 5–7', 'Kyoto', 'Fushimi Inari, Arashiyama and a tea ceremony.'],
        ['Day 8', 'Fly home', 'Bullet train back and the evening flight.']
      ]
    },
    {
      id: 'paris', title: 'Paris in Autumn', place: 'Paris, France', category: 'City',
      image: 'paris', offset: -34, days: 5, price: 1250, capacity: 22, fill: 1,
      from: 'CAI', to: 'CDG', depart: '10:30', meeting: 'Cairo Airport T3, Rahhal desk at gate 2',
      host: 'Claire Dubois', hostPhone: '01122334455',
      summary: 'The Louvre before opening, a Seine dinner cruise, and a day trip to Versailles.',
      highlights: ['Early Louvre entry', 'Seine dinner cruise', 'Versailles day trip', 'Montmartre walk'],
      includes: ['Return flights', '4 nights in Le Marais', 'Daily breakfast', 'Museum pass'],
      excludes: ['Schengen visa', 'Lunches'],
      itinerary: [
        ['Day 1', 'Le Marais', 'Arrive and a walk through the Marais.'],
        ['Day 2', 'Louvre and Seine', 'Early Louvre entry and a dinner cruise.'],
        ['Day 3', 'Versailles', 'The palace and gardens.'],
        ['Day 4', 'Montmartre', 'Sacré-Cœur and a farewell dinner.'],
        ['Day 5', 'Fly home', 'Morning flight to Cairo.']
      ]
    }
  ];

  const NAMES = ['Mariam Fathy', 'Youssef Kamal', 'Salma Ibrahim', 'Karim Mostafa', 'Laila Mansour', 'Ahmed Samir',
    'Hana Ezzat', 'Omar Farouk', 'Farida Nabil', 'Tarek Hamdy', 'Dina Sherif', 'Mostafa Gamal', 'Yara Helmy',
    'Hassan Fouad', 'Nada Raafat', 'Ali Saeed', 'Rana Lotfy', 'Khaled Badr', 'Jana Wael', 'Seif Hany',
    'Malak Tamer', 'Ziad Ashraf', 'Habiba Magdy', 'Adam Nasser', 'Sara El-Masry', 'Amr Shawky', 'Noha Zaki',
    'Mahmoud Adel', 'Reem Khalil', 'Hossam Nour', 'Lina Fahmy', 'Sherif Ramzy'];

  const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function makeCode(rand) {
    let s = 'RH-';
    for (let i = 0; i < 5; i++) s += CODE_CHARS[Math.floor(rand() * CODE_CHARS.length)];
    return s;
  }

  function seed() {
    const rand = rng(7);
    const t0 = today();
    const people = NAMES.map((name, i) => ({
      name,
      phone: ['010', '011', '012', '015'][i % 4] + String(10000000 + Math.floor(rand() * 89999999)),
      email: name.toLowerCase().replace(/[^a-z ]/g, '').replace(' ', '.') + '@mail.com'
    }));

    const trips = TRIPS.map(t => {
      const start = addDays(t0, t.offset);
      const { offset, fill, ...rest } = t;
      return { ...rest, start, end: addDays(start, t.days - 1), published: true };
    });

    const bookings = [];
    const used = new Set();
    const uniqueCode = () => { let c; do { c = makeCode(rand); } while (used.has(c)); used.add(c); return c; };

    // Demo traveler: one trip today (scan-ready), one with a balance due, one finished.
    const demo = { name: 'Nour Adel', phone: '01012345678', email: 'nour.adel@mail.com' };
    const demoTrips = [
      { code: 'RH-4N7QK', tripId: 'giza', pax: 2, deposit: false, checked: false },
      { code: 'RH-S8T2M', tripId: 'santorini', pax: 2, deposit: true, checked: false },
      { code: 'RH-P3X9D', tripId: 'paris', pax: 1, deposit: false, checked: true }
    ];
    demoTrips.forEach(d => {
      const trip = trips.find(t => t.id === d.tripId);
      const total = trip.price * d.pax;
      used.add(d.code);
      bookings.push({
        code: d.code, tripId: trip.id, ...demo, pax: d.pax, total,
        paid: d.deposit ? Math.round(total * 0.3) : total, method: 'Card', status: 'confirmed',
        checkedIn: d.checked, checkedInAt: d.checked ? trip.start + 'T' + trip.depart : null,
        createdAt: addDays(trip.start, -38)
      });
    });

    TRIPS.forEach((src, ti) => {
      const trip = trips[ti];
      const status = tripStatus(trip);
      const target = Math.round(trip.capacity * src.fill);
      let seats = bookings.filter(b => b.tripId === trip.id).reduce((s, b) => s + b.pax, 0);
      while (seats < target) {
        const p = people[Math.floor(rand() * people.length)];
        const pax = Math.min(target - seats, rand() < 0.5 ? 1 : rand() < 0.75 ? 2 : 3);
        const total = trip.price * pax;
        const daysOut = diffDays(t0, trip.start);
        const deposit = status === 'upcoming' && daysOut > 14 && rand() < 0.35;
        const leadDays = 5 + Math.floor(rand() * 90);
        let created = addDays(trip.start, -leadDays);
        if (created > t0) created = addDays(t0, -Math.floor(rand() * 10));
        const checked = status === 'completed' || (status === 'active' && trip.start < t0) || (status === 'active' && rand() < 0.45);
        const hh = 5 + Math.floor(rand() * 2), mm = Math.floor(rand() * 60);
        bookings.push({
          code: uniqueCode(), tripId: trip.id, name: p.name, phone: p.phone, email: p.email, pax, total,
          paid: deposit ? Math.round(total * 0.3) : total,
          method: ['Card', 'Card', 'Mobile wallet', 'Apple Pay'][Math.floor(rand() * 4)],
          status: rand() < 0.04 && status === 'upcoming' ? 'cancelled' : 'confirmed',
          checkedIn: checked,
          checkedInAt: checked ? trip.start + 'T' + pad(hh) + ':' + pad(mm) : null,
          createdAt: created
        });
        seats += pax;
      }
    });

    bookings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { trips, bookings, seededOn: t0 };
  }

  function tripStatus(t) {
    const d = today();
    if (!t.published) return 'draft';
    if (t.end < d) return 'completed';
    if (t.start <= d) return 'active';
    return 'upcoming';
  }

  // ---------- persistence ----------
  let db;
  function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function write(key, val) { try { val == null ? localStorage.removeItem(key) : localStorage.setItem(key, val); } catch (e) { /* storage blocked: keep in memory */ } }

  function load() {
    try { db = JSON.parse(read(KEY)); } catch (e) { db = null; }
    if (!db || !db.trips || db.seededOn !== today()) { db = seed(); save(); }
  }
  function save() { write(KEY, JSON.stringify(db)); }

  const normPhone = p => {
    let d = String(p || '').replace(/\D/g, '');
    if (d.startsWith('20') && d.length === 12) d = '0' + d.slice(2);
    if (d.length === 10 && d[0] === '1') d = '0' + d;
    return d;
  };

  load();

  window.Store = {
    today, addDays, diffDays, parse, tripStatus, normPhone,
    images: ['giza', 'dahab', 'istanbul', 'dubai', 'santorini', 'bali', 'phuket', 'maldives', 'alps', 'tokyo', 'paris', 'london', 'beach', 'mountains'],
    trips: () => db.trips,
    trip: id => db.trips.find(t => t.id === id),
    upsertTrip(t) {
      t.end = addDays(t.start, t.days - 1);
      const i = db.trips.findIndex(x => x.id === t.id);
      if (i >= 0) db.trips[i] = { ...db.trips[i], ...t }; else db.trips.push(t);
      save();
    },
    deleteTrip(id) { db.trips = db.trips.filter(t => t.id !== id); save(); },
    bookings: () => db.bookings,
    booking: code => db.bookings.find(b => b.code === String(code || '').trim().toUpperCase()),
    bookingsFor: tripId => db.bookings.filter(b => b.tripId === tripId),
    bookingsByPhone: phone => db.bookings.filter(b => b.phone === normPhone(phone)),
    seatsTaken: tripId => db.bookings.filter(b => b.tripId === tripId && b.status !== 'cancelled').reduce((s, b) => s + b.pax, 0),
    newCode() {
      const rand = Math.random; let c;
      do { c = makeCode(rand); } while (db.bookings.some(b => b.code === c));
      return c;
    },
    addBooking(b) { db.bookings.unshift(b); save(); return b; },
    updateBooking(code, patch) { const b = this.booking(code); if (b) { Object.assign(b, patch); save(); } return b; },
    reset() { db = seed(); save(); write(SESSION_KEY, null); write(ADMIN_KEY, null); },
    session: {
      get: () => read(SESSION_KEY),
      set: phone => write(SESSION_KEY, phone),
      clear: () => write(SESSION_KEY, null)
    },
    admin: {
      get: () => read(ADMIN_KEY) === '1',
      set: v => write(ADMIN_KEY, v ? '1' : null)
    }
  };
})();
