(function () {
  var bar = document.querySelector('.s-bar'), burger = document.querySelector('.s-bar__burger');
  if (bar && burger) {
    burger.addEventListener('click', function () { var o = bar.classList.toggle('is-open'); burger.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    bar.querySelectorAll('.s-bar__nav a').forEach(function (a) { a.addEventListener('click', function () { bar.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }); });
  }
  var links = [].slice.call(document.querySelectorAll('.s-bar__nav a'));
  var map = links.map(function (a) { return { a: a, el: document.querySelector(a.getAttribute('href')) }; }).filter(function (m) { return m.el; });
  var tick = false;
  function frame() {
    tick = false;
    var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.setProperty('--sp', h > 0 ? Math.min(y / h, 1).toFixed(4) : 0);
    var probe = y + innerHeight * 0.4, cur = null;
    map.forEach(function (m) { if (m.el.getBoundingClientRect().top + y <= probe) cur = m; });
    map.forEach(function (m) { m.a.classList.toggle('is-on', m === cur); });
  }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', frame); frame();

  /* волна на кнопках */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.s-btn'); if (!b) return;
    var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), x = document.createElement('span');
    x.className = 'x-ripple'; x.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px';
    b.appendChild(x); setTimeout(function () { x.remove(); }, 650);
  });
})();

/* «чек визита»: услуги -> цена и время, комбо «стрижка + борода» дешевле */
(function () {
  var root = document.querySelector('[data-x-build]'); if (!root) return;
  var S = [{ n: 'Стрижка', p: 1800, t: 45 }, { n: 'Борода', p: 1200, t: 30 }, { n: 'Королевское бритьё', p: 1500, t: 40 }, { n: 'Укладка', p: 600, t: 15 }, { n: 'Камуфляж седины', p: 1500, t: 30 }, { n: 'Уход за лицом', p: 700, t: 15 }];
  var COMBO = { name: 'Комбо стрижка + борода', off: 400 };
  var on = { 0: true, 1: true }, chips = root.querySelector('.x-build__chips'), lines = root.querySelector('.x-receipt__lines'), totalEl = root.querySelector('[data-total]'), timeEl = root.querySelector('[data-time]');
  var shown = { p: 0, t: 0 }, raf = null;
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function tween(toP, toT) {
    if (raf) cancelAnimationFrame(raf);
    var fp = shown.p, ft = shown.t, t0 = null, d = 450, still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still) { shown.p = toP; shown.t = toT; totalEl.textContent = fmt(toP) + ' ₽'; timeEl.textContent = toT + ' мин'; return; }
    function step(ts) { if (!t0) t0 = ts; var k = Math.min((ts - t0) / d, 1), e = 1 - Math.pow(1 - k, 3); shown.p = fp + (toP - fp) * e; shown.t = ft + (toT - ft) * e; totalEl.textContent = fmt(shown.p) + ' ₽'; timeEl.textContent = Math.round(shown.t) + ' мин'; if (k < 1) raf = requestAnimationFrame(step); }
    raf = requestAnimationFrame(step);
    clearTimeout(tween._f); tween._f = setTimeout(function () { shown.p = toP; shown.t = toT; totalEl.textContent = fmt(toP) + '\u00a0₽'; timeEl.textContent = toT + '\u00a0мин'; }, d + 120);
  }
  function render() {
    var p = 0, t = 0, html = '';
    S.forEach(function (s, i) { if (on[i]) { p += s.p; t += s.t; html += '<li><span>' + s.n + '</span><span>' + fmt(s.p) + ' ₽</span></li>'; } });
    if (on[0] && on[1]) { p -= COMBO.off; html += '<li class="is-combo"><span>' + COMBO.name + '</span><span>−' + fmt(COMBO.off) + ' ₽</span></li>'; }
    if (!html) html = '<li class="is-empty">отметьте услуги слева</li>';
    lines.innerHTML = html; tween(p, t);
  }
  S.forEach(function (s, i) {
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-pressed', on[i] ? 'true' : 'false');
    b.innerHTML = '<span class="tick" aria-hidden="true"></span>' + s.n + ' <small>' + s.t + ' мин</small>';
    b.addEventListener('click', function () { on[i] = !on[i]; b.setAttribute('aria-pressed', on[i] ? 'true' : 'false'); render(); });
    chips.appendChild(b);
  });
  render();
})();

/* 3D-карусель: автопрокрутка, стрелки, точки, перетаскивание, клавиатура */
(function () {
  var cube = document.querySelector('[data-x-cube]'); if (!cube) return;
  var ring = cube.querySelector('.x-cube__ring'), faces = [].slice.call(cube.querySelectorAll('.x-cube__face'));
  var dots = [].slice.call(document.querySelectorAll('.x-cube__dot')), n = faces.length, step = 360 / n;
  var tEl = document.querySelector('[data-cube-title]'), sEl = document.querySelector('[data-cube-sub]');
  var subs = ['Стрижка и борода', 'Укладка и борода', 'Бритьё и контур', 'Мужская стрижка', 'Стрижка и контур', 'Уход за бородой', 'Классическая стрижка', 'Работа ножницами'];
  var rot = 0, cur = 0, timer = null, drag = false, sx = 0, sr = 0, visible = false, hover = false;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  cube.setAttribute('tabindex', '0'); cube.setAttribute('role', 'region'); cube.setAttribute('aria-label', 'Карусель работ, стрелки влево и вправо листают');
  function paint() {
    cur = ((Math.round(-rot / step) % n) + n) % n;
    ring.style.setProperty('--rot', rot + 'deg');
    faces.forEach(function (f, i) { f.classList.toggle('is-front', i === cur); });
    dots.forEach(function (d, i) { d.classList.toggle('is-on', i === cur); });
    var cap = faces[cur].querySelector('figcaption'); if (tEl && cap) tEl.textContent = cap.textContent; if (sEl) sEl.textContent = subs[cur] || '';
  }
  function go(delta) { rot -= delta * step; paint(); }
  function to(i) { var d = i - cur; if (d > n / 2) d -= n; if (d < -n / 2) d += n; go(d); }
  cube.querySelector('.x-cube__nav--next').addEventListener('click', function () { go(1); restart(); });
  cube.querySelector('.x-cube__nav--prev').addEventListener('click', function () { go(-1); restart(); });
  dots.forEach(function (d, i) { d.addEventListener('click', function () { to(i); restart(); }); });
  cube.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { go(1); restart(); e.preventDefault(); } if (e.key === 'ArrowLeft') { go(-1); restart(); e.preventDefault(); } });
  cube.addEventListener('pointerdown', function (e) { if (e.target.closest('.x-cube__nav')) return; drag = true; sx = e.clientX; sr = rot; ring.classList.add('is-drag'); stop(); try { cube.setPointerCapture(e.pointerId); } catch (x) {} });
  cube.addEventListener('pointermove', function (e) { if (!drag) return; rot = sr + (e.clientX - sx) * 0.32; ring.style.setProperty('--rot', rot + 'deg'); });
  function end() { if (!drag) return; drag = false; ring.classList.remove('is-drag'); rot = -Math.round(-rot / step) * step; paint(); restart(); }
  cube.addEventListener('pointerup', end); cube.addEventListener('pointercancel', end);
  cube.addEventListener('mouseenter', function () { hover = true; stop(); }); cube.addEventListener('mouseleave', function () { hover = false; restart(); });
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function restart() { stop(); if (still || hover || !visible) return; timer = setInterval(function () { go(1); }, 3600); }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; restart(); }, { threshold: .3 }).observe(cube); else visible = true;
  paint();
})();
