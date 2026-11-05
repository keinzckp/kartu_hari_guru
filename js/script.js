(function () {
  // Daftar pesan. Tambah atau ubah bebas, tiap kartu memilih satu secara acak.
  var PESAN = [
    "Terima kasih sudah sabar mengajari kami, bahkan saat kami lupa mengerjakan PR. Ilmu yang diberikan akan kami bawa ke mana pun.",
    "Pelajaran yang paling berkesan bukan hanya yang ada di buku, tapi cara mengajar yang membuat kami berani mencoba.",
    "Dari guru, kami belajar membaca, menghitung, dan percaya pada diri sendiri. Yang terakhir itu paling berharga.",
    "Satu papan tulis, seribu cerita. Terima kasih sudah membuat kelas jadi tempat yang ingin kami datangi.",
    "Maaf kalau kami sering ribut di kelas. Terima kasih tetap mengajar dengan sepenuh hati.",
    "Setiap hal yang kami bisa hari ini dimulai dari satu pertemuan di kelas. Terima kasih sudah memulainya.",
    "Terima kasih sudah mau menjelaskan untuk kedua kalinya, ketiga kalinya, dan seterusnya tanpa wajah lelah.",
    "Semoga sehat selalu, sabar selalu, dan semoga kopi di ruang guru selalu hangat.",
    "Hari ini giliran kami bilang: kerja bagus. Terima kasih atas semua yang tidak tertulis di rapor.",
    "Kami mungkin belum jadi apa-apa, tapi semua yang kami tuju berawal dari kelas ini. Terima kasih sudah percaya.",
    "Selamat Hari Guru Nasional! Terima kasih sudah jadi alasan kami semangat berangkat sekolah."
  ];

  var $ = function (id) { return document.getElementById(id); };
  var viewForm = $('view-form'), viewCard = $('view-card'), card = $('card');
  var outTo = $('out-to'), outMsg = $('out-msg'), outDari = $('out-dari');
  var statusEl = $('status'), errEl = $('err');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var state = { to: '', from: '', tema: 'merah', last: -1, msg: '', received: false };

  function pickIndex() {
    var i;
    do { i = Math.floor(Math.random() * PESAN.length); } while (i === state.last && PESAN.length > 1);
    state.last = i;
    return i;
  }

  function render(fixed) {
    state.msg = PESAN[typeof fixed === 'number' ? (state.last = fixed) : pickIndex()];
    card.setAttribute('data-tema', state.tema);
    outTo.textContent = state.to;
    outDari.textContent = state.from ? 'Dari ' + state.from : '';
    outDari.hidden = !state.from;

    var words = state.msg.split(' ');
    var frag = document.createDocumentFragment();
    words.forEach(function (w, i) {
      var s = document.createElement('span');
      s.className = 'w';
      s.style.setProperty('--i', i);
      s.textContent = w;
      frag.appendChild(s);
      frag.appendChild(document.createTextNode(' '));
    });
    outMsg.textContent = '';
    outMsg.appendChild(frag);
    card.style.setProperty('--after', (1.5 + words.length * 0.055 + 0.25).toFixed(2) + 's');

    card.classList.remove('play');
    void card.offsetWidth;
    card.classList.add('play');
    statusEl.textContent = '';
    updateLinks();
    startFx();
  }

  function show(name) {
    viewForm.hidden = name !== 'form';
    viewCard.hidden = name !== 'card';
    window.scrollTo(0, 0);
    if (name === 'form') stopFx();
  }

  $('form').addEventListener('submit', function (e) {
    e.preventDefault();
    var guru = $('f-guru').value.trim();
    if (!guru) {
      errEl.textContent = 'Isi nama gurumu dulu ya.';
      $('f-guru').focus();
      return;
    }
    errEl.textContent = '';
    var tema = document.querySelector('input[name="tema"]:checked');
    state.to = guru;
    state.from = $('f-dari').value.trim();
    state.tema = tema ? tema.value : 'merah';
    state.received = false;
    setMode(false);
    show('card');
    render();
    if (!musicOff) setMusik(true);
  });
  $('f-guru').addEventListener('input', function () { errEl.textContent = ''; });

  $('b-acak').addEventListener('click', function () { render(); });

  // Musik latar. Ganti file di audio/musik.mp3 untuk mengubah lagunya.
  // Browser hanya mengizinkan suara setelah pengguna menekan sesuatu, jadi musik mulai saat "Buat kartu"
  // ditekan. Penerima yang membuka link harus menekan tombol musik sekali.
  var musik = $('musik'), musicOn = false, musicOff = false;
  musik.volume = 0.5;
  function musikLabel() { $('b-musik').textContent = musicOn ? 'Musik: nyala' : 'Musik: mati'; }
  function setMusik(on) {
    if (!on) { musik.pause(); musicOn = false; musikLabel(); return; }
    var p = musik.play();
    musicOn = true; musikLabel();
    if (p && p.catch) p.catch(function () {
      musicOn = false; musikLabel();
      statusEl.textContent = 'Musik belum bisa diputar. Tekan tombol musik sekali lagi.';
    });
  }
  $('b-musik').addEventListener('click', function () {
    musicOff = musicOn;
    setMusik(!musicOn);
  });
  musik.addEventListener('error', function () { $('b-musik').hidden = true; });

  // Mode penerima: kartu dibuka dari link, jadi tombol bagikan disembunyikan dan penerima diajak membuat kartu sendiri.
  function setMode(received) {
    $('b-acak').hidden = received;
    $('b-link').hidden = received;
    $('b-wa').hidden = received;
    $('note').hidden = !received;
    $('b-baru').className = received ? 'btn' : 'btn ghost';
    $('b-baru').textContent = received ? 'Buat kartu untuk orang lain' : 'Kartu baru';
  }

  // Link kartu: alamat halaman ini + nama, warna, dan nomor pesan. Tanpa server.
  function cardUrl() {
    var q = new URLSearchParams();
    q.set('g', state.to);
    if (state.from) q.set('d', state.from);
    q.set('t', state.tema);
    q.set('m', String(state.last));
    return location.href.split(/[?#]/)[0] + '?' + q.toString();
  }
  function updateLinks() {
    $('b-wa').href = 'https://wa.me/?text=' + encodeURIComponent('Kartu ucapan Hari Guru untuk ' + state.to + ': ' + cardUrl());
  }

  function copyText(text, okMsg) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      document.body.removeChild(ta);
      statusEl.textContent = ok ? okMsg : 'Belum bisa menyalin otomatis. Salin dari kolom alamat browser.';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { statusEl.textContent = okMsg; }, fallback);
    } else { fallback(); }
  }
  $('b-link').addEventListener('click', function () {
    copyText(cardUrl(), 'Link kartu tersalin. Tempel ke chat gurumu.');
  });

  $('b-baru').addEventListener('click', function () {
    state.received = false;
    setMode(false);
    try { history.replaceState(null, '', location.href.split(/[?#]/)[0]); } catch (err) { /* abaikan */ }
    show('form');
    $('f-guru').focus();
  });

  // Dibuka dari link kartu: langsung tampilkan kartunya.
  function boot() {
    var q;
    try { q = new URLSearchParams(location.search); } catch (err) { return; }
    var g = (q.get('g') || '').trim().slice(0, 40);
    if (!g) return;
    var t = q.get('t');
    state.to = g;
    state.from = (q.get('d') || '').trim().slice(0, 40);
    state.tema = Object.prototype.hasOwnProperty.call(PAL, t) ? t : 'merah';
    var m = parseInt(q.get('m'), 10);
    state.received = true;
    setMode(true);
    show('card');
    render(m >= 0 && m < PESAN.length ? m : undefined);
  }

  /* ---------- Animasi partikel di dalam kartu ---------- */
  var canvas = $('fx'), ctx = canvas.getContext('2d');
  var W = 0, H = 0, parts = [], raf = 0;
  var PAL = {
    merah: ['#D63A1F', '#1FA6A6', '#F7C948', '#F27AA5', '#3B9BE0'],
    krayon: ['#F2709C', '#5B8FD9', '#6CCFB0', '#F5B83D', '#F58E4B'],
    teal: ['#0B8A87', '#FF6B4A', '#F5B83D', '#3B9BE0', '#F27AA5'],
    matahari: ['#D9480F', '#FFFFFF', '#F28C0F', '#1FA6A6', '#F27AA5']
  };
  var COUNT = { merah: 56, krayon: 22, teal: 24, matahari: 34 };
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pickColor(t) { var p = PAL[t]; return p[Math.floor(Math.random() * p.length)]; }

  function sizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = card.offsetWidth; H = card.offsetHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(t, initial) {
    var p = { x: rnd(0, W), ph: rnd(0, 6.28), rot: 0, vr: 0, vx: 0, sa: .5, sf: .002, c: pickColor(t), f: false };
    if (t === 'merah') {
      if (Math.random() < .1) {
        p.k = 'ball'; p.s = rnd(11, 16); p.vy = -rnd(.5, 1); p.y = initial ? rnd(0, H) : H + 40; p.sa = .4; p.sf = .0015;
      } else {
        p.k = 'conf'; p.s = rnd(6, 11); p.vy = rnd(1.3, 3); p.vx = rnd(-.3, .3); p.vr = rnd(-.12, .12);
        p.rot = rnd(0, 6.28); p.y = initial ? -rnd(0, H) : -12; p.sf = .003;
      }
    } else if (t === 'krayon') {
      p.k = Math.random() < .55 ? 'heart' : 'star'; p.s = rnd(8, 16); p.vy = -rnd(.4, 1);
      p.y = initial ? rnd(0, H) : H + 24; p.rot = rnd(-.4, .4); p.vr = rnd(-.01, .01); p.sf = .0018;
    } else if (t === 'teal') {
      p.k = Math.random() < .7 ? 'note' : 'bub'; p.s = p.k === 'note' ? rnd(7, 12) : rnd(4, 10);
      p.vy = -rnd(.5, 1.2); p.y = initial ? rnd(0, H) : H + 30; p.rot = rnd(-.3, .3); p.sa = .6;
    } else {
      p.k = Math.random() < .65 ? 'star' : 'spark'; p.f = true; p.s = rnd(5, 12); p.vy = rnd(.5, 1.3);
      p.y = initial ? rnd(-H * .3, H) : -16; p.rot = rnd(0, 6.28); p.vr = rnd(-.03, .03); p.sf = .0018;
    }
    return p;
  }

  function pathHeart(s) {
    ctx.beginPath();
    ctx.moveTo(0, s * .9);
    ctx.bezierCurveTo(-s * 1.3, -s * .1, -s * .6, -s, 0, -s * .35);
    ctx.bezierCurveTo(s * .6, -s, s * 1.3, -s * .1, 0, s * .9);
    ctx.closePath();
  }
  function pathStar(s, n, inner) {
    ctx.beginPath();
    for (var i = 0; i < n * 2; i++) {
      var r = i % 2 === 0 ? s : s * inner, a = -Math.PI / 2 + i * Math.PI / n;
      var px = Math.cos(a) * r, py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  function drawNote(s, c) {
    ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(0, 0, s * .5, s * .36, -.4, 0, 6.2832); ctx.fill();
    ctx.lineWidth = Math.max(1.6, s * .16);
    ctx.beginPath(); ctx.moveTo(s * .42, -s * .1); ctx.lineTo(s * .42, -s * 1.7);
    ctx.quadraticCurveTo(s * 1.1, -s * 1.4, s * .9, -s * .9); ctx.stroke();
  }

  function frame(now) {
    if (viewCard.hidden) { raf = 0; return; }
    var t = state.tema;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      p.y += p.vy; p.rot += p.vr; p.x += p.vx + Math.sin(now * p.sf + p.ph) * p.sa;
      if (p.vy > 0 ? p.y > H + 30 : p.y < -50) { parts[i] = spawn(t, false); continue; }

      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.k !== 'ball') ctx.rotate(p.rot);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (p.k === 'conf') {
        ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .6);
      } else if (p.k === 'ball') {
        ctx.strokeStyle = 'rgba(60,30,20,.45)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(0, p.s); ctx.quadraticCurveTo(5, p.s * 1.8, 0, p.s * 2.6); ctx.stroke();
        ctx.fillStyle = p.c; ctx.beginPath(); ctx.ellipse(0, 0, p.s * .8, p.s, 0, 0, 6.2832); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, p.s); ctx.lineTo(-3, p.s + 5); ctx.lineTo(3, p.s + 5); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-p.s * .3, -p.s * .35, p.s * .15, p.s * .27, .4, 0, 6.2832); ctx.fill();
      } else if (p.k === 'heart') {
        pathHeart(p.s); ctx.globalAlpha = .28; ctx.fillStyle = p.c; ctx.fill();
        ctx.globalAlpha = 1; ctx.lineWidth = 2.6; ctx.strokeStyle = p.c; ctx.stroke();
      } else if (p.k === 'star') {
        pathStar(p.s, 5, .46);
        if (p.f) { ctx.fillStyle = p.c; ctx.fill(); }
        else { ctx.globalAlpha = .28; ctx.fillStyle = p.c; ctx.fill(); ctx.globalAlpha = 1; ctx.lineWidth = 2.6; ctx.strokeStyle = p.c; ctx.stroke(); }
      } else if (p.k === 'note') {
        drawNote(p.s, p.c);
      } else if (p.k === 'bub') {
        ctx.lineWidth = 2; ctx.strokeStyle = p.c; ctx.beginPath(); ctx.arc(0, 0, p.s, 0, 6.2832); ctx.stroke();
      } else {
        ctx.globalAlpha = .45 + .55 * Math.sin(now * .004 + p.ph); ctx.fillStyle = p.c; pathStar(p.s * 1.2, 4, .22); ctx.fill();
      }
      ctx.restore();
    }
    raf = requestAnimationFrame(frame);
  }

  function stopFx() { if (raf) cancelAnimationFrame(raf); raf = 0; ctx.clearRect(0, 0, W, H); }
  function startFx() {
    stopFx();
    if (reduce) return;
    sizeCanvas();
    parts = [];
    for (var i = 0; i < COUNT[state.tema]; i++) parts.push(spawn(state.tema, true));
    raf = requestAnimationFrame(frame);
  }
  window.addEventListener('resize', function () { if (!viewCard.hidden) sizeCanvas(); });
  boot();
})();
