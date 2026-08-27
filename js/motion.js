// motion.js — "Utsav Motion" foundation. Loaded `defer` on every page.
// Modules below reveal(), each guarded by element existence so pages that
// don't have the markup simply no-op:
//   heroSlideshow()    hero cross-fade + Ken Burns      (MOTION-SPEC §3.1)
//   testimonialDrift() auto-nudging scroll-snap row     (MOTION-SPEC §3.4)
//   lightboxSwipe()    gallery lightbox touch swipe     (MOTION-SPEC §3.5)
//   balloonIntro()     one-time session balloon fly-by  (MOTION-SPEC §3.8)
// Call each from initMotion() below; keep this file the single JS asset.

document.documentElement.classList.add('js');

function reveal() {
  var els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;

  if (!('IntersectionObserver' in window)) {
    for (var i = 0; i < els.length; i++) els[i].classList.add('is-in');
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  for (var i = 0; i < els.length; i++) io.observe(els[i]);
}

// balloonIntro() — one-time balloon fly-by on the first page view of a
// session (MOTION-SPEC §3.8). Self-gates on sessionStorage + reduced
// motion; container is pointer-events:none so it can never block a tap
// or scroll, and always removes itself (animationend + 6s safety net).
function balloonIntro() {
  var SEEN_KEY = 'se-balloons-seen';
  try {
    if (sessionStorage.getItem(SEEN_KEY)) return;
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch (e) {
    return; // storage unavailable — skip rather than replay every load
  }
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var COLORS = ['#F07C1D', '#E8503A', '#E3A81C', '#D94F7E', '#2E7D5B'];
  var XPOS = [6, 19, 33, 47, 61, 75, 90];
  var COUNT = XPOS.length;

  function balloonSVG(color, big) {
    var w = big ? 46 : 34, h = big ? 82 : 60;
    return '<svg viewBox="0 0 40 76" width="' + w + '" height="' + h + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
      '<path d="M20 48 Q13 62 20 74" fill="none" stroke="' + color + '" stroke-width="1.4" opacity="0.55"/>' +
      '<polygon points="16,46 24,46 20,53" fill="' + color + '"/>' +
      '<ellipse cx="20" cy="23" rx="18" ry="23" fill="' + color + '"/>' +
      '<ellipse cx="13" cy="14" rx="6" ry="9" fill="#fff" opacity="0.32"/>' +
      '</svg>';
  }

  var container = document.createElement('div');
  container.className = 'balloon-intro';
  container.setAttribute('aria-hidden', 'true');

  var remaining = COUNT;
  function oneDone() {
    remaining--;
    if (remaining <= 0 && container.parentNode) container.parentNode.removeChild(container);
  }

  for (var i = 0; i < COUNT; i++) {
    var color = COLORS[i % COLORS.length];
    var big = i % 2 === 0;
    var dur = (3.2 + Math.random() * 1.4).toFixed(2);
    var delay = (Math.random() * 0.6).toFixed(2);
    var sway = ((big ? 22 : 30) + Math.random() * 10).toFixed(0);
    var item = document.createElement('div');
    item.className = 'balloon-intro__item';
    item.style.left = XPOS[i] + '%';
    item.style.setProperty('--sway', sway + 'px');
    item.style.animationDuration = dur + 's';
    item.style.animationDelay = delay + 's';
    item.innerHTML = balloonSVG(color, big);
    item.addEventListener('animationend', oneDone);
    container.appendChild(item);
  }

  document.body.appendChild(container);
  setTimeout(function () {
    if (container.parentNode) container.parentNode.removeChild(container);
  }, 6000);
}

// heroSlideshow() — 4-slide cross-fade + subtle Ken Burns, initialized on
// EVERY [data-slideshow] root on the page (MOTION-SPEC §3.1). Today that's
// the classic hero photo frame plus the demo-only full-width banner variant
// (see layout.mjs demoRibbon() + lib/pages/home.mjs heroBannerSection()) —
// only one is ever visible at a time, but both get a live engine so the
// ribbon toggle can flip between them with no flash of a dead slideshow.
// The classic hero's slide 1 is the LCP image (eager + preloaded in
// markup); every other slide (and, for roots with no eager slide, slide 1
// too) carries a data-src that is promoted to src here, after first paint,
// so lazy slides never compete with LCP. Auto-advances every 4s but pauses
// on hover, when the tab is hidden, and when the root scrolls out of view;
// a touch just gets an 8s breather before auto-advance resumes (it used to
// pause forever, which made the slideshow look static on phones).
// Reduced motion: no auto-advance, no Ken Burns — dots still swap slides
// instantly. With JS off nothing runs and slide 1 stays shown.
function heroSlideshow() {
  var roots = document.querySelectorAll('[data-slideshow]');
  for (var r = 0; r < roots.length; r++) initHeroSlideshow(roots[r]);
}

function initHeroSlideshow(root) {
  var slides = root.querySelectorAll('.hero__slide');
  var dots = root.querySelectorAll('.hero__dot');
  if (slides.length < 2) return;

  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Promote deferred slides now (post first paint) so LCP is never delayed.
  // Includes slide 0 — roots with no eager slide (e.g. the banner variant)
  // rely on this to ever show an image at all.
  for (var i = 0; i < slides.length; i++) {
    var im = slides[i].querySelector('img');
    if (im && im.getAttribute('data-src')) im.src = im.getAttribute('data-src');
  }

  var cur = 0, timer = null, paused = false, onScreen = true, touchResumeTimer = null;

  function go(n) {
    n = (n + slides.length) % slides.length;
    if (n === cur) return;
    slides[cur].classList.remove('is-active');
    if (dots[cur]) { dots[cur].classList.remove('is-active'); dots[cur].setAttribute('aria-selected', 'false'); }
    cur = n;
    slides[cur].classList.add('is-active');
    if (dots[cur]) { dots[cur].classList.add('is-active'); dots[cur].setAttribute('aria-selected', 'true'); }
  }
  function start() { if (RM || timer || paused || !onScreen) return; timer = setInterval(function () { go(cur + 1); }, 1500); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  for (var d = 0; d < dots.length; d++) {
    (function (idx) {
      dots[idx].addEventListener('click', function () { stop(); go(idx); start(); });
    })(d);
  }
  root.addEventListener('mouseenter', function () { paused = true; stop(); });
  root.addEventListener('mouseleave', function () { paused = false; start(); });
  // Touch shouldn't pause forever (that left the slideshow static on phones) —
  // just stop for a short breather, then resume, re-arming on repeated touches.
  root.addEventListener('touchstart', function () {
    stop();
    paused = true;
    if (touchResumeTimer) clearTimeout(touchResumeTimer);
    touchResumeTimer = setTimeout(function () {
      touchResumeTimer = null;
      paused = false;
      start();
    }, 8000);
  }, { passive: true });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { stop(); } else { start(); }
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting && !document.hidden;
      if (onScreen) start(); else stop();
    }, { threshold: 0.2 }).observe(root);
  }
  start();
}

// heroStyleToggle() — demo-only ribbon control that flips the homepage hero
// between the classic split layout and the CherishX-style full-width banner
// (see layout.mjs demoRibbon() for the markup and the body-class FOUC guard,
// and main.css for the body.hero-style-banner visibility rules). Guarded on
// .demo-toggle-btn existence, so it no-ops on every page except the home
// page demo ribbon.
function heroStyleToggle() {
  var btns = document.querySelectorAll('.demo-toggle-btn');
  if (!btns.length) return;
  var KEY = 'se-hero-style';

  function sync(style) {
    for (var i = 0; i < btns.length; i++) {
      var isActive = btns[i].getAttribute('data-hero-style') === style;
      btns[i].setAttribute('aria-pressed', isActive ? 'true' : 'false');
      btns[i].classList.toggle('is-active', isActive);
    }
  }

  for (var i = 0; i < btns.length; i++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        var style = btn.getAttribute('data-hero-style');
        document.body.classList.toggle('hero-style-banner', style === 'banner');
        try { localStorage.setItem(KEY, style); } catch (e) {}
        sync(style);
      });
    })(btns[i]);
  }

  // Body class is already set by the inline FOUC-guard script right after
  // <body> opens (layout.mjs); just mirror it into the buttons' initial state.
  sync(document.body.classList.contains('hero-style-banner') ? 'banner' : 'classic');
}

// testimonialDrift() — turns the testimonials scroll-snap row into an
// auto-drifting carousel (MOTION-SPEC §3.4): nudges to the next card every
// 6s while the section is visible, and stops FOREVER on the first real user
// interaction (pointer/wheel/touch/key, or using the arrows/dots). Arrows
// and dots keep working after that; they just no longer auto-advance.
// Reduced motion / JS off: a plain scrollable row, exactly as before.
function testimonialDrift() {
  var wrap = document.querySelector('[data-carousel]');
  if (!wrap) return;
  var track = wrap.querySelector('[data-carousel-track]');
  var cards = track ? track.children : [];
  if (cards.length < 2) return;

  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dots = wrap.querySelectorAll('.tcar-dot');
  var prev = wrap.querySelector('.tcar-arrow--prev');
  var next = wrap.querySelector('.tcar-arrow--next');
  var timer = null, stopped = false, onScreen = false;

  function step() {
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return cards[0].getBoundingClientRect().width + gap;
  }
  function index() { return Math.round(track.scrollLeft / step()); }
  function toIndex(i) {
    i = Math.max(0, Math.min(cards.length - 1, i));
    track.scrollTo({ left: i * step(), behavior: 'smooth' });
  }
  function drift() { if (stopped || RM || !onScreen) return; toIndex((index() + 1) % cards.length); }
  function start() { if (timer || stopped || RM) return; timer = setInterval(drift, 6000); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function killForever() { stopped = true; stop(); }

  track.addEventListener('pointerdown', killForever);
  track.addEventListener('wheel', killForever, { passive: true });
  track.addEventListener('touchstart', killForever, { passive: true });
  track.addEventListener('keydown', killForever);
  if (prev) prev.addEventListener('click', function () { killForever(); toIndex(index() - 1); });
  if (next) next.addEventListener('click', function () { killForever(); toIndex(index() + 1); });
  for (var d = 0; d < dots.length; d++) {
    (function (idx) { dots[idx].addEventListener('click', function () { killForever(); toIndex(idx); }); })(d);
  }
  track.addEventListener('scroll', function () {
    var i = index();
    for (var k = 0; k < dots.length; k++) dots[k].classList.toggle('is-active', k === i);
  }, { passive: true });

  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (onScreen) start(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      if (onScreen) start(); else stop();
    }, { threshold: 0.3 }).observe(wrap);
  } else { onScreen = true; start(); }
}

// lightboxSwipe() — adds horizontal swipe to the gallery lightbox
// (MOTION-SPEC §3.5). Arrow keys + prev/next buttons already exist in the
// gallery page's own inline script; this just maps a touch swipe onto those
// buttons, so there is one source of truth for navigation. The scale-in /
// cross-fade transitions themselves are CSS (see main.css §3.5).
function lightboxSwipe() {
  var box = document.getElementById('lightbox');
  if (!box) return;
  var prev = document.getElementById('lightboxPrev');
  var next = document.getElementById('lightboxNext');
  var x0 = null;
  box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    x0 = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0 && next) next.click();
    else if (dx > 0 && prev) prev.click();
  }, { passive: true });
}

function initMotion() {
  reveal();
  heroSlideshow();
  heroStyleToggle();
  testimonialDrift();
  lightboxSwipe();
  balloonIntro();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMotion);
} else {
  initMotion();
}
