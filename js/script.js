/* ═══════════════════════════════════════════════════════════════════════
   Laura Meyer — EHCNYC Birthday Experience
   Vanilla JS. No frameworks, no build step.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ═════════════════════════════════════════════════════════════════════
     ██  CONFIGURATION  ██  — this is the only block you need to edit
     ═════════════════════════════════════════════════════════════════════ */

  /*
   * WHEN THE COUNTDOWN ENDS.
   *
   * Set to Sept 5, 12:00 AM New York time.
   *
   * The trailing "-04:00" is New York's summer offset (EDT). Keeping the
   * offset in the string pins this to ONE exact moment in time, so the
   * countdown hits zero simultaneously for every viewer no matter which
   * timezone they are in. The remaining time is then displayed using the
   * viewer's own local clock.
   *
   *   Summer / EDT (Mar–Nov) ....... -04:00
   *   Winter / EST (Nov–Mar) ....... -05:00
   *
   * Format: "YYYY-MM-DDTHH:MM:SS-04:00"
   */
  var BIRTHDAY_DATE = '2026-09-05T00:00:00-04:00';

  /*
   * THE MESSAGES FROM THE FAMILY.
   *
   * Use "\n" to break a message into separate paragraphs (a salutation line
   * followed by the body, for example). Add or remove people freely — the
   * layout adapts to however many entries are in this list.
   */
  var FAMILY_MESSAGES = [
    {
      name: 'Gennady', initial: 'G',
      message: 'Happy Birthday,\n' +
               'Wishing you a year of good health, real success, and the kind of days ' +
               'that actually feel worth celebrating. It’s a privilege to work with you ' +
               '— and an even better one to call you a friend. Enjoy your day.'
    },
    {
      name: 'Nixie', initial: 'N',
      message: 'Happy Birthday, Boss Laura!\n' +
               'Thank you so much for everything, boss. Working with you has been such a ' +
               'gift, and I will be forever grateful for it. I wish you all the best boss ' +
               'and I pray to God to bless you and your family. I pray to God to protect ' +
               'you and give you a healthy life away from sickness and lastly more ' +
               'happiness and love from God, Family and friends. I love you so much boss ' +
               'Laura! You are my Boss, Mother that has a special place in my heart and I ' +
               'promise to keep growing and doing even better alongside you. Enjoy your ' +
               'day, boss. I love you always!'
    },
    {
      name: 'Ed', initial: 'E',
      message: 'Happy Birthday, Boss!\n' +
               'I’m so grateful to work with you. We have had our misunderstandings along ' +
               'the way, but that has never changed how much I appreciate you and I will ' +
               'keep doing better and bringing a positive impact to the company. Enjoy ' +
               'your day. We love and appreciate you so much!'
    }
  ];

  /* Little messages behind the "One More Surprise" button. */
  var EXTRA_SURPRISES = [
    'You make the whole team better. ✨',
    'Thank you for everything you do. 💙',
    'Here’s to another wonderful year.',
    'The EHCNYC family is lucky to have you.',
    'Hope today is as lovely as you are. 🎂'
  ];

  /* ═════════════════════════════════════════════════════════════════════
     END OF CONFIGURATION
     ═════════════════════════════════════════════════════════════════════ */


  /* ───────────────────────── small helpers ───────────────────────── */
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var randInt = function (a, b) { return Math.floor(rand(a, b + 1)); };
  var pick = function (arr) { return arr[randInt(0, arr.length - 1)]; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  function pad2(n) { return n < 10 ? '0' + n : String(n); }


  /* motion + capability flags, read once and shared by every module */
  var reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hoverQuery   = window.matchMedia('(hover: hover) and (pointer: fine)');
  var motion = {
    reduced: reducedQuery.matches,
    hover:   hoverQuery.matches,
    mobile:  window.matchMedia('(max-width: 720px)').matches
  };
  reducedQuery.addEventListener('change', function (e) { motion.reduced = e.matches; });

  /* brand palette for canvas particles — nothing off-brand */
  var PARTICLE_COLORS = ['#FFFFFF', '#8BCBDD', '#C7E6EF', '#DDF1F6', '#4E9DB4'];

  var CELEBRATION_TARGET = new Date(BIRTHDAY_DATE).getTime();


  /* ═══════════════════════════════════════════════════════════════════
     PREVIEW HOOKS
     ?celebrate=1   jump straight to the celebration
     ?t=20          set the countdown to 20 seconds from now
     ═══════════════════════════════════════════════════════════════════ */
  var params = new URLSearchParams(window.location.search);
  var forceCelebrate = params.get('celebrate') === '1';
  var tOverride = parseInt(params.get('t'), 10);
  if (!isNaN(tOverride) && tOverride >= 0) {
    CELEBRATION_TARGET = Date.now() + tOverride * 1000;
  }
  if (isNaN(CELEBRATION_TARGET)) {
    console.warn('[birthday] BIRTHDAY_DATE could not be parsed:', BIRTHDAY_DATE);
    CELEBRATION_TARGET = Date.now() + 86400000;
  }


  /* ═══════════════════════════════════════════════════════════════════
     1. SHARED POINTER + rAF LOOP
     One loop drives parallax, the light source, and every 3D tilt.
     ═══════════════════════════════════════════════════════════════════ */
  var pointer = { tx: 0, ty: 0, x: 0, y: 0, rawX: 0, rawY: 0, lx: 0, ly: 0 };
  var parallaxLayers = [];
  var tilts = [];
  var loopRunning = false;

  function initPointer() {
    parallaxLayers = $$('[data-parallax]').map(function (el) {
      return { el: el, depth: parseFloat(el.dataset.parallax) || 10, cx: 0, cy: 0 };
    });

    if (motion.reduced) return;

    window.addEventListener('pointermove', function (e) {
      pointer.rawX = e.clientX;
      pointer.rawY = e.clientY;
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
      startLoop();
    }, { passive: true });

    startLoop();
  }

  function startLoop() {
    if (loopRunning || motion.reduced) return;
    loopRunning = true;
    requestAnimationFrame(loopFrame);
  }

  function loopFrame() {
    var i, t;
    var busy = false;   /* anything still settling? */

    var px = lerp(pointer.x, pointer.tx, 0.07);
    var py = lerp(pointer.y, pointer.ty, 0.07);
    var plx = lerp(pointer.lx, pointer.rawX, 0.09);
    var ply = lerp(pointer.ly, pointer.rawY, 0.09);

    if (Math.abs(px - pointer.x) > 0.0004 || Math.abs(py - pointer.y) > 0.0004) {
      pointer.x = px; pointer.y = py;
      busy = true;

      /* background parallax */
      for (i = 0; i < parallaxLayers.length; i++) {
        var L = parallaxLayers[i];
        L.el.style.transform =
          'translate3d(' + (-pointer.x * L.depth).toFixed(2) + 'px,' +
                           (-pointer.y * L.depth).toFixed(2) + 'px,0)';
      }
    }

    /* the light source trails the cursor */
    if (bgLight && (Math.abs(plx - pointer.lx) > 0.3 || Math.abs(ply - pointer.ly) > 0.3)) {
      pointer.lx = plx; pointer.ly = ply;
      busy = true;
      bgLight.style.transform =
        'translate3d(' + pointer.lx.toFixed(1) + 'px,' + pointer.ly.toFixed(1) + 'px,0)';
    }

    /* every registered 3D tilt */
    for (i = 0; i < tilts.length; i++) {
      t = tilts[i];
      var nx = lerp(t.cx, t.tx, 0.11);
      var ny = lerp(t.cy, t.ty, 0.11);
      if (Math.abs(nx - t.cx) < 0.0004 && Math.abs(ny - t.cy) < 0.0004) continue;
      t.cx = nx; t.cy = ny;
      t.apply(nx, ny);
      busy = true;
    }

    /* idle out completely when nothing is moving — no wasted frames */
    if (busy) requestAnimationFrame(loopFrame);
    else loopRunning = false;
  }

  /**
   * Register a spring-smoothed 3D tilt on an element.
   * @param {Element} el
   * @param {Object}  opt  { max, lift, perspective, onApply }
   */
  function registerTilt(el, opt) {
    opt = opt || {};
    if (motion.reduced || !motion.hover) return null;

    var max = opt.max != null ? opt.max : 9;
    var lift = opt.lift != null ? opt.lift : 0;
    var persp = opt.perspective != null ? opt.perspective : 900;
    var rect = null;

    var t = {
      tx: 0, ty: 0, cx: 0, cy: 0,
      apply: opt.onApply || function (x, y) {
        el.style.transform =
          'perspective(' + persp + 'px) ' +
          'rotateY(' + (x * max).toFixed(2) + 'deg) ' +
          'rotateX(' + (-y * max).toFixed(2) + 'deg) ' +
          'translate3d(0,' + (-lift * (1 - Math.abs(y) * 0.4)).toFixed(2) + 'px,0)';
      }
    };
    tilts.push(t);

    el.addEventListener('pointerenter', function () { rect = el.getBoundingClientRect(); });
    el.addEventListener('pointermove', function (e) {
      if (!rect) rect = el.getBoundingClientRect();
      t.tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      t.ty = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      startLoop();
    }, { passive: true });
    el.addEventListener('pointerleave', function () {
      t.tx = 0; t.ty = 0; rect = null; startLoop();
    });

    return t;
  }


  /* ═══════════════════════════════════════════════════════════════════
     2. LOADING VEIL
     ═══════════════════════════════════════════════════════════════════ */
  function initLoader() {
    var loader = $('#loader');
    var fill = $('#loader-fill');
    if (!loader) return;

    document.body.classList.add('is-locked');

    var progress = 0;
    var done = false;
    var start = Date.now();
    var MIN = 900, MAX = 2200;

    function setProgress(p) {
      progress = clamp(p, 0, 1);
      if (fill) fill.style.transform = 'scaleX(' + progress + ')';
    }

    var creep = setInterval(function () {
      setProgress(progress + (1 - progress) * 0.16);
    }, 130);

    function finish() {
      if (done) return;
      done = true;
      clearInterval(creep);
      setProgress(1);

      var wait = Math.max(0, MIN - (Date.now() - start));
      setTimeout(function () {
        loader.classList.add('is-done');
        document.body.classList.remove('is-locked');
        document.body.classList.add('is-ready');
        setTimeout(function () { loader.setAttribute('hidden', ''); }, 900);
        onReady();
      }, wait);
    }

    /* wait for fonts + window load, but never longer than MAX */
    var pending = 2;
    var step = function () { if (--pending <= 0) finish(); };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(step).catch(step);
    } else { step(); }

    if (document.readyState === 'complete') { step(); }
    else { window.addEventListener('load', step, { once: true }); }

    setTimeout(finish, MAX);
  }


  /* ═══════════════════════════════════════════════════════════════════
     3. FLOATING BACKGROUND SHAPES
     ═══════════════════════════════════════════════════════════════════ */
  var SHAPE_SVG = {
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.6l2.7 6.6 7.1.5-5.4 4.6 1.7 6.9L12 16.6 5.9 20.2l1.7-6.9L2.2 8.7l7.1-.5z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8.2-5-8.2-10.4A4.6 4.6 0 0 1 12 7.6a4.6 4.6 0 0 1 8.2 3C20.2 16 12 21 12 21z"/></svg>',
    gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 13h18M12 9v12M12 9c-2.5 0-4-1-4-2.5S9.5 4 12 9zM12 9c2.5 0 4-1 4-2.5S14.5 4 12 9z"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.6 7.2L21 12l-7.4 1.6L12 22l-1.6-8.4L3 12l7.4-2.8z"/></svg>',
    card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>'
  };

  function initShapes() {
    var host = $('#shapes');
    if (!host) return;

    var count = motion.reduced ? 8 : (motion.mobile ? 14 : 26);
    var kinds = ['ring', 'dot', 'sq', 'star', 'heart', 'gift', 'spark', 'card'];
    var frag = document.createDocumentFragment();

    for (var i = 0; i < count; i++) {
      var kind = pick(kinds);
      var el = document.createElement('div');
      var size = randInt(8, 30);

      el.className = 'shape shape--' + kind;
      el.style.left = rand(1, 96).toFixed(2) + '%';
      el.style.top = rand(2, 94).toFixed(2) + '%';
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.opacity = rand(0.08, 0.30).toFixed(2);
      /* every shape gets its own duration + delay so nothing syncs up */
      el.style.animationDuration = rand(16, 42).toFixed(1) + 's';
      el.style.animationDelay = (-rand(0, 30)).toFixed(1) + 's';

      if (SHAPE_SVG[kind]) el.innerHTML = SHAPE_SVG[kind];
      frag.appendChild(el);
    }
    host.appendChild(frag);
  }


  /* ═══════════════════════════════════════════════════════════════════
     4. COUNTDOWN + MECHANICAL FLIP CLOCK
     ═══════════════════════════════════════════════════════════════════ */
  var FLIP_MS = 420;   /* must match the two 0.21s leaf animations in styles.css */

  function makeFlipUnit(unitEl) {
    var topSpan   = $('.flip-face--top span', unitEl);
    var botSpan   = $('.flip-face--bottom span', unitEl);
    var frontSpan = $('.flip-leaf--front span', unitEl);
    var backSpan  = $('.flip-leaf--back span', unitEl);
    var current = null;
    var timer = null;

    function setAll(v) {
      topSpan.textContent = v;
      botSpan.textContent = v;
      frontSpan.textContent = v;
      backSpan.textContent = v;
    }

    return {
      /** Only touches the DOM when the value actually changes. */
      set: function (value) {
        var v = String(value);
        if (v === current) return;

        if (current === null || motion.reduced) {
          current = v;
          setAll(v);
          return;
        }

        /* Leaf choreography:
           front leaf = OLD digit, falls away and uncovers the new top face
           back  leaf = NEW digit, swings down over the still-old bottom face */
        frontSpan.textContent = current;
        backSpan.textContent = v;
        topSpan.textContent = v;
        /* botSpan deliberately keeps the old digit until the leaf lands */
        current = v;

        unitEl.classList.remove('is-flipping');
        void unitEl.offsetWidth;          /* restart the animation */
        unitEl.classList.add('is-flipping');

        clearTimeout(timer);
        timer = setTimeout(function () {
          /* Settle EVERY layer on the new digit. Missing the front leaf here
             leaves it resting over the top face still showing the old value,
             which reads as two different numbers stacked in one unit. */
          setAll(v);
          unitEl.classList.remove('is-flipping');
        }, FLIP_MS);
      }
    };
  }

  var countdownTimer = null;

  function initCountdown(onZero) {
    var clock = $('#clock');
    if (!clock) return;

    var units = {};
    $$('.flip-unit', clock).forEach(function (el) {
      units[el.dataset.unit] = makeFlipUnit(el);
    });

    var srOut = $('#clock-sr');
    var eyebrow = $('[data-letters]');
    var clockEl = $('#clock');
    var lastSrMinute = -1;
    var lastPhase = null;
    var lastTitle = '';
    var fired = false;
    var baseTitle = document.title;

    /*
     * The countdown should not feel the same twelve days out as it does
     * twelve seconds out. Each phase changes the copy above the clock and
     * how hard the clock itself is pushing.
     */
    var PHASES = [
      { id: 'far',      min: 172800, copy: 'Something Special Is Coming...' },  /* > 2 days */
      { id: 'soon',     min: 86400,  copy: 'Almost Here...' },                  /* > 1 day  */
      { id: 'tomorrow', min: 3600,   copy: 'Tomorrow Is The Day' },             /* > 1 hour */
      { id: 'hour',     min: 60,     copy: 'Just Moments Away' },               /* > 1 min  */
      { id: 'minute',   min: 11,     copy: 'Any Second Now' },
      { id: 'final',    min: 0,      copy: 'Here We Go' }
    ];

    function phaseFor(seconds) {
      for (var i = 0; i < PHASES.length; i++) {
        if (seconds >= PHASES[i].min) return PHASES[i];
      }
      return PHASES[PHASES.length - 1];
    }

    function applyPhase(p) {
      if (!clockEl || (lastPhase && lastPhase.id === p.id)) return;
      if (lastPhase) clockEl.classList.remove('phase-' + lastPhase.id);
      clockEl.classList.add('phase-' + p.id);

      /* re-run the per-letter entrance with the new words */
      if (eyebrow) {
        eyebrow.textContent = p.copy;
        if (lastPhase) initLetterReveal(0.02);
      }
      lastPhase = p;
    }

    function tick() {
      var diff = CELEBRATION_TARGET - Date.now();

      if (diff <= 0) {
        units.days.set('00'); units.hours.set('00');
        units.minutes.set('00'); units.seconds.set('00');
        if (!fired) {
          fired = true;
          clearInterval(countdownTimer);
          document.title = baseTitle;
          if (typeof onZero === 'function') onZero();
        }
        return;
      }

      var total = Math.floor(diff / 1000);
      var d = Math.floor(total / 86400);
      var h = Math.floor((total % 86400) / 3600);
      var m = Math.floor((total % 3600) / 60);
      var s = total % 60;

      units.days.set(pad2(d));
      units.hours.set(pad2(h));
      units.minutes.set(pad2(m));
      units.seconds.set(pad2(s));

      applyPhase(phaseFor(total));

      /* keep counting in the browser tab while she is on another one */
      var title = (d > 0 ? d + 'd ' + h + 'h' : h > 0 ? h + 'h ' + m + 'm' : m + 'm ' + s + 's') +
                  ' · Laura’s Birthday';
      if (title !== lastTitle) { document.title = title; lastTitle = title; }

      /* Screen readers get a summary once a minute, not once a second. */
      if (srOut && m !== lastSrMinute) {
        lastSrMinute = m;
        srOut.textContent =
          d + ' days, ' + h + ' hours and ' + m + ' minutes until Laura’s birthday.';
      }
    }

    tick();
    countdownTimer = setInterval(tick, 1000);
  }


  /* ═══════════════════════════════════════════════════════════════════
     5. INTERACTIVE BIRTHDAY CARD
     ═══════════════════════════════════════════════════════════════════ */
  var cardApi = { open: function () {} };

  function initBirthdayCard() {
    var card = $('#card3d');
    var btn = $('#open-card');
    if (!card || !btn) return;

    var isOpen = false;

    function setOpen(open) {
      if (open === isOpen) return;
      isOpen = open;
      card.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      $('.btn__label', btn).textContent = open ? 'Close Card' : 'Open Card';

      if (open) {
        /* light + sparkles spilling out of the opening seam */
        var r = card.getBoundingClientRect();
        fx.sparkle(r.left + r.width * 0.5, r.top + r.height * 0.45, motion.reduced ? 8 : 42, 150);
        if (!motion.reduced) {
          setTimeout(function () {
            fx.sparkle(r.left + r.width * 0.35, r.top + r.height * 0.4, 26, 120);
          }, 420);
        }
      }
    }

    var stage = $('.card3d__stage', card);

    btn.addEventListener('click', function () {
      /* hand the stage back to CSS so the open/close pose is authoritative;
         the tilt takes over again on the next hover */
      stage.style.transform = '';
      setOpen(!isOpen);
    });
    cardApi.open = function () { stage.style.transform = ''; setOpen(true); };

    registerTilt(stage, {
      max: 7, perspective: 1600,
      onApply: function (x, y) {
        var open = card.classList.contains('is-open');
        var rx = (open ? 4 : 6) - y * 7;
        var ry = (open ? 12 : -8) + x * 9;
        stage.style.transform =
          'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)' +
          (open ? ' translate3d(14%,0,0)' : '');
      }
    });
  }


  /* ═══════════════════════════════════════════════════════════════════
     6. THE MESSAGE WALL — written notes
     ═══════════════════════════════════════════════════════════════════ */
  function initFamilyNotes() {
    var grid = $('#note-grid');
    var tpl = $('#note-tpl');
    if (!grid || !tpl) return;

    FAMILY_MESSAGES.forEach(function (cfg, i) {
      var node = tpl.content.firstElementChild.cloneNode(true);

      /* one <p> per line, so a salutation can sit above the body.
         textContent throughout — never innerHTML with someone's copy. */
      var body = $('[data-message]', node);
      String(cfg.message).split('\n').forEach(function (para) {
        var text = para.trim();
        if (!text) return;
        var p = document.createElement('p');
        p.textContent = text;
        body.appendChild(p);
      });

      $('[data-name]', node).textContent = cfg.name;
      $('[data-initial]', node).textContent = cfg.initial;

      node.classList.add('reveal');
      node.style.setProperty('--d', (i * 0.09).toFixed(2) + 's');

      grid.appendChild(node);
      registerTilt(node, { max: 7, lift: 6, perspective: 1000 });
    });
  }


  /* ═══════════════════════════════════════════════════════════════════
     9. PARTICLE FIELD — confetti, fireworks, sparkles on ONE canvas
     ═══════════════════════════════════════════════════════════════════ */
  var fx = (function () {
    var canvas, ctx, dpr = 1, w = 0, h = 0;
    var parts = [];
    var running = false;
    var confettiTimer = null;
    var fireworkTimer = null;

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function start() {
      if (running || !ctx) return;
      running = true;
      requestAnimationFrame(frame);
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);

      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.life--;

        if (p.kind === 'confetti') {
          p.vy += 0.09;
          p.vx += Math.sin((p.life + p.seed) * 0.05) * 0.045;   /* flutter */
          p.x += p.vx; p.y += p.vy;
          p.rot += p.vr;
          p.tilt = Math.cos((p.life + p.seed) * 0.08);

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = clamp(p.life / 60, 0, 1);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(p.tilt));
          ctx.restore();

          if (p.y > h + 40 || p.life <= 0) parts.splice(i, 1);

        } else if (p.kind === 'spark') {
          p.vy += 0.055;
          p.vx *= 0.985; p.vy *= 0.985;
          p.x += p.vx; p.y += p.vy;

          var a = clamp(p.life / p.maxLife, 0, 1);
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * a, 0, 6.283);
          ctx.fill();

          if (p.life <= 0) parts.splice(i, 1);

        } else { /* sparkle — twinkles in place, drifts up slightly */
          p.x += p.vx; p.y += p.vy;
          p.vy *= 0.99;
          var t = p.life / p.maxLife;
          var tw = 0.45 + 0.55 * Math.abs(Math.sin(p.life * 0.28));

          ctx.globalAlpha = clamp(t, 0, 1) * tw;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 6.283);
          ctx.fill();

          /* tiny cross-flare */
          ctx.globalAlpha *= 0.5;
          ctx.fillRect(p.x - p.r * 3, p.y - 0.4, p.r * 6, 0.8);
          ctx.fillRect(p.x - 0.4, p.y - p.r * 3, 0.8, p.r * 6);

          if (p.life <= 0) parts.splice(i, 1);
        }
      }

      ctx.globalAlpha = 1;

      if (parts.length) {
        requestAnimationFrame(frame);
      } else {
        running = false;   /* fully idle — no wasted frames */
      }
    }

    var MAX_PARTS = 620;
    function push(p) { if (parts.length < MAX_PARTS) parts.push(p); }

    return {
      init: function () {
        canvas = $('#fx');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        resize();
        var rt = null;
        window.addEventListener('resize', function () {
          clearTimeout(rt);
          rt = setTimeout(resize, 160);
        });
      },

      confetti: function (count) {
        if (!ctx) return;
        count = motion.reduced ? Math.min(count, 20) : (motion.mobile ? Math.round(count * 0.55) : count);
        for (var i = 0; i < count; i++) {
          push({
            kind: 'confetti',
            x: rand(-40, w + 40), y: rand(-h * 0.4, -10),
            vx: rand(-1.2, 1.2), vy: rand(1.5, 4.4),
            w: rand(5, 11), h: rand(8, 15),
            rot: rand(0, 6.28), vr: rand(-0.14, 0.14),
            tilt: 1, seed: rand(0, 100),
            color: pick(PARTICLE_COLORS),
            life: randInt(220, 460)
          });
        }
        start();
      },

      fireworkAt: function (x, y) {
        if (!ctx || motion.reduced) return;
        var n = motion.mobile ? 34 : 56;
        var hue = pick(PARTICLE_COLORS);
        for (var i = 0; i < n; i++) {
          var ang = (i / n) * 6.283 + rand(-0.05, 0.05);
          var sp = rand(1.6, 5.2);
          push({
            kind: 'spark',
            x: x, y: y,
            vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
            r: rand(1.5, 3.2),
            color: Math.random() < 0.55 ? hue : pick(PARTICLE_COLORS),
            life: randInt(46, 82), maxLife: 82
          });
        }
        start();
      },

      sparkle: function (x, y, count, spread) {
        if (!ctx) return;
        count = motion.reduced ? Math.min(count, 6) : count;
        spread = spread || 100;
        for (var i = 0; i < count; i++) {
          push({
            kind: 'sparkle',
            x: x + rand(-spread, spread),
            y: y + rand(-spread * 0.6, spread * 0.6),
            vx: rand(-0.35, 0.35), vy: rand(-0.7, -0.15),
            r: rand(0.9, 2.2),
            color: pick(['#FFFFFF', '#DDF1F6', '#8BCBDD']),
            life: randInt(40, 95), maxLife: 95
          });
        }
        start();
      },

      /* rolling celebration effects */
      beginParty: function () {
        var self = this;
        if (motion.reduced) { this.confetti(20); return; }

        this.confetti(motion.mobile ? 90 : 170);
        confettiTimer = setInterval(function () { self.confetti(motion.mobile ? 18 : 34); }, 2400);

        fireworkTimer = setInterval(function () {
          self.fireworkAt(rand(w * 0.12, w * 0.88), rand(h * 0.12, h * 0.55));
          if (Math.random() < 0.45) {
            setTimeout(function () {
              self.fireworkAt(rand(w * 0.12, w * 0.88), rand(h * 0.12, h * 0.5));
            }, 380);
          }
        }, 1500);
      },

      endParty: function () {
        clearInterval(confettiTimer);
        clearInterval(fireworkTimer);
        confettiTimer = fireworkTimer = null;
      }
    };
  }());


  /* ═══════════════════════════════════════════════════════════════════
     10. DOM CELEBRATION OBJECTS — balloons, ribbons, hearts
     ═══════════════════════════════════════════════════════════════════ */
  var domfx = (function () {
    var host;
    var BALLOON_FILLS = [
      'radial-gradient(circle at 32% 28%, #FFFFFF, #8BCBDD 46%, #4E9DB4)',
      'radial-gradient(circle at 32% 28%, #EAF7FB, #C7E6EF 46%, #8BCBDD)',
      'radial-gradient(circle at 32% 28%, #DDF1F6, #6FB4CA 50%, #1B5568)'
    ];

    function add(el, ttl) {
      host.appendChild(el);
      el.addEventListener('animationend', function () { el.remove(); }, { once: true });
      setTimeout(function () { if (el.isConnected) el.remove(); }, ttl);
    }

    return {
      init: function () { host = $('#domfx'); },

      balloons: function (count) {
        if (!host || motion.reduced) return;
        count = motion.mobile ? Math.min(count, 8) : count;
        for (var i = 0; i < count; i++) {
          (function (i) {
            setTimeout(function () {
              var b = document.createElement('div');
              var scale = rand(0.7, 1.35);
              b.className = 'balloon';
              b.style.left = rand(2, 92) + '%';
              b.style.width = (54 * scale) + 'px';
              b.style.height = (68 * scale) + 'px';
              b.style.background = pick(BALLOON_FILLS);
              b.style.setProperty('--dx', rand(-70, 70).toFixed(0) + 'px');
              b.style.animationDuration = rand(9, 17).toFixed(1) + 's';
              add(b, 20000);
            }, i * 260);
          }(i));
        }
      },

      ribbons: function (count) {
        if (!host || motion.reduced) return;
        count = motion.mobile ? Math.min(count, 5) : count;
        for (var i = 0; i < count; i++) {
          (function (i) {
            setTimeout(function () {
              var r = document.createElement('div');
              var color = pick(['#8BCBDD', '#FFFFFF', '#C7E6EF']);
              r.className = 'ribbon';
              r.style.left = rand(2, 94) + '%';
              r.style.setProperty('--dx', rand(-140, 140).toFixed(0) + 'px');
              r.style.setProperty('--rz', rand(-320, 320).toFixed(0) + 'deg');
              r.style.animationDuration = rand(7, 13).toFixed(1) + 's';
              r.innerHTML =
                '<svg width="26" height="120" viewBox="0 0 26 120">' +
                '<path d="M13 0 C2 22, 24 40, 13 62 C2 84, 24 100, 13 120" ' +
                'stroke="' + color + '" stroke-width="5" fill="none" ' +
                'stroke-linecap="round" opacity=".85"/></svg>';
              add(r, 16000);
            }, i * 340);
          }(i));
        }
      },

      hearts: function (count) {
        if (!host || motion.reduced) return;
        for (var i = 0; i < count; i++) {
          (function (i) {
            setTimeout(function () {
              var el = document.createElement('div');
              var s = randInt(14, 26);
              el.className = 'heart';
              el.style.left = rand(4, 92) + '%';
              el.style.setProperty('--dx', rand(-60, 60).toFixed(0) + 'px');
              el.style.animationDuration = rand(8, 15).toFixed(1) + 's';
              el.innerHTML =
                '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24">' +
                '<path d="M12 21s-8.2-5-8.2-10.4A4.6 4.6 0 0 1 12 7.6a4.6 4.6 0 0 1 8.2 3C20.2 16 12 21 12 21z"/></svg>';
              add(el, 18000);
            }, i * 700);
          }(i));
        }
      }
    };
  }());


  /* ═══════════════════════════════════════════════════════════════════
     11. 3D MEDICATION VIALS  (decorative EHCNYC Easter eggs)
     Purely decorative brand objects — name only, never any dosage,
     claim, instruction or promotional text.
     ═══════════════════════════════════════════════════════════════════ */
  var vialInstances = [];

  /* 5 instances from ONE template, spread across sections and depths */
  var VIAL_PLACEMENTS = [
    /* right of the countdown card, sharp and in front of the background shapes.
       On phones the card fills the width, so it drops below the card instead
       of sitting on top of the headline. */
    { name: 'Tirzepatide', kind: 'tirzepatide', section: '#hero',         band: 'front', scale: 1.2,  css: { right: '8%',  top: '26%' }, mobileCss: { right: '15%', top: '78%' }, mobile: true },
    /* behind the greeting card, softened and dim */
    { name: 'Semaglutide', kind: 'semaglutide', section: '#card-section', band: 'back',  scale: 0.95, css: { left:  '13%', top: '34%' }, mobile: false },
    /* drifts between the middle two message cards, occluded as it passes */
    /* Desktop only: on phones the cards fill the full width, so there is no
       gutter for this one to live in without landing on the heading. */
    { name: 'Sermorelin',  kind: 'sermorelin',  section: '#messages',       band: 'mid',   scale: 1.05, css: { left:  '5%',  top: '58%' }, mobile: false },
    /* far background behind the family message */
    { name: 'Semaglutide', kind: 'semaglutide', section: '#fromall',      band: 'back',  scale: 0.82, css: { right: '11%', top: '74%' }, mobile: false },
    /* hidden until the surprise box is opened, then rides out with the confetti */
    { name: 'Tirzepatide', kind: 'tirzepatide', section: '#surprise',     band: 'mid',   scale: 0.8,  css: { right: '22%', top: '34%' }, mobile: true, hidden: true },

    /* ── additional vials, spread through the page at mixed depths ── */
    { name: 'Sermorelin',  kind: 'sermorelin',  section: '#hero',         band: 'back',  scale: 0.85, css: { left:  '10%', top: '60%' }, mobile: false },
    { name: 'Sermorelin',  kind: 'sermorelin',  section: '#card-section', band: 'front', scale: 0.9,  css: { right: '11%', top: '62%' }, mobile: false },
    /* keep vials clear of the viewport edge: the hover tooltip and the
       Easter-egg chip are centred on the vial and are wider than it */
    { name: 'Semaglutide', kind: 'semaglutide', section: '#messages',       band: 'back',  scale: 0.88, css: { right: '5%',  top: '20%' }, mobile: false },
    { name: 'Sermorelin',  kind: 'sermorelin',  section: '#fromall',      band: 'back',  scale: 0.8,  css: { left:  '6%',  top: '64%' }, mobileCss: { left: '16%', top: '8%' }, mobile: true },
    { name: 'Semaglutide', kind: 'semaglutide', section: '#surprise',     band: 'back',  scale: 0.86, css: { left:  '13%', top: '28%' }, mobile: false }
  ];

  function initVials() {
    var tpl = $('#vial-tpl');
    if (!tpl) return;

    VIAL_PLACEMENTS.forEach(function (spec, i) {
      if (motion.mobile && !spec.mobile) return;   /* 3 instances on phones */

      var host = $(spec.section);
      if (!host) return;

      var el = tpl.content.firstElementChild.cloneNode(true);
      el.classList.add('vial--' + spec.kind, 'vial--' + spec.band);
      el.setAttribute('aria-hidden', 'true');      /* decorative only */
      el.style.width = Math.round(54 * spec.scale) + 'px';

      var place = (motion.mobile && spec.mobileCss) ? spec.mobileCss : spec.css;
      Object.keys(place).forEach(function (k) { el.style[k] = place[k]; });

      $('[data-vial-label]', el).textContent = spec.name;
      $('[data-vial-tip]', el).textContent = spec.name;

      /* desynchronise: every instance starts at a different point in its loop */
      var inner = $('.vial__inner', el);
      var tilt = $('.vial__tilt', el);
      inner.style.animationDelay = (-rand(0, 18)).toFixed(1) + 's';
      $('.vial__shine', el).style.animationDelay = (-rand(0, 7)).toFixed(1) + 's';

      if (spec.hidden) el.style.display = 'none';

      host.appendChild(el);

      var inst = { el: el, inner: inner, tilt: tilt, spec: spec, spinning: false };
      vialInstances.push(inst);

      wireVial(inst);

      /* pause the animation entirely while off-screen */
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            inner.style.animationPlayState = en.isIntersecting ? 'running' : 'paused';
          });
        }, { rootMargin: '120px' }).observe(el);
      }
    });
  }

  function wireVial(inst) {
    var el = inst.el;

    /* hover — rotate toward the cursor, spring-smoothed by the shared loop */
    if (motion.hover && !motion.reduced) {
      var rect = null;
      var t = {
        tx: 0, ty: 0, cx: 0, cy: 0,
        apply: function (x, y) {
          if (inst.spinning) return;
          /* applied to the tilt layer so the idle float keeps running */
          inst.tilt.style.transform =
            'translate3d(0,0,40px) scale(1.12) ' +
            'rotateY(' + (x * 26).toFixed(1) + 'deg) ' +
            'rotateX(' + (-y * 18).toFixed(1) + 'deg)';
        }
      };
      tilts.push(t);

      el.addEventListener('pointerenter', function () {
        rect = el.getBoundingClientRect();
        el.classList.add('is-hovered');
      });
      el.addEventListener('pointermove', function (e) {
        if (!rect) rect = el.getBoundingClientRect();
        t.tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        t.ty = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        startLoop();
      }, { passive: true });
      el.addEventListener('pointerleave', function () {
        t.tx = 0; t.ty = 0; rect = null;
        el.classList.remove('is-hovered');
        startLoop();
      });
    }

    /* click Easter egg — a gentle spin and a tiny message */
    el.addEventListener('click', function () {
      if (inst.spinning) return;
      inst.spinning = true;
      /* clear the hover pose so the spin starts from rest, then the
         idle float underneath carries it straight back */
      inst.tilt.style.transform = '';
      el.classList.add('is-spinning');

      var r = el.getBoundingClientRect();
      fx.sparkle(r.left + r.width / 2, r.top + r.height / 2, motion.reduced ? 4 : 18, 40);

      setTimeout(function () {
        el.classList.remove('is-spinning');
        inst.spinning = false;   /* returns to its normal floating loop */
      }, 1800);
    });
  }

  /** During the celebration the vials rise with everything else. */
  function celebrateVials() {
    vialInstances.forEach(function (inst, i) {
      setTimeout(function () {
        if (inst.spec.hidden && inst.el.style.display === 'none') return;
        inst.el.classList.add('is-celebrating');
        setTimeout(function () { inst.el.classList.remove('is-celebrating'); }, 4400);
      }, 2000 + i * 240);
    });
  }


  /* ═══════════════════════════════════════════════════════════════════
     12. SURPRISE BOX
     ═══════════════════════════════════════════════════════════════════ */
  function initSurpriseBox() {
    var box = $('#box');
    var reveal = $('#box-reveal');
    var more = $('#more-surprise');
    var extra = $('#box-extra');
    if (!box || !reveal) return;

    var opened = false;
    var idx = 0;

    box.addEventListener('click', function () {
      if (opened) return;
      opened = true;
      box.classList.add('is-open');
      box.setAttribute('aria-expanded', 'true');
      box.setAttribute('aria-label', 'The birthday surprise box is open');
      reveal.hidden = false;

      var r = box.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height * 0.35;

      fx.sparkle(cx, cy, motion.reduced ? 8 : 60, 90);
      fx.fireworkAt(cx, cy);
      domfx.ribbons(6);
      domfx.hearts(5);
      fx.confetti(motion.mobile ? 30 : 60);

      /* a little vial rides out of the box with everything else */
      var boxVial = vialInstances.filter(function (v) { return v.spec.hidden; })[0];
      if (boxVial) {
        boxVial.el.style.display = '';
        boxVial.el.classList.add('is-celebrating');
        setTimeout(function () { boxVial.el.classList.remove('is-celebrating'); }, 4400);
      }
    });

    if (more) {
      more.addEventListener('click', function () {
        extra.textContent = EXTRA_SURPRISES[idx % EXTRA_SURPRISES.length];
        idx++;
        extra.classList.remove('pop');
        void extra.offsetWidth;
        extra.classList.add('pop');

        var r = more.getBoundingClientRect();
        fx.sparkle(r.left + r.width / 2, r.top, motion.reduced ? 5 : 24, 70);
        domfx.hearts(2);
      });
    }
  }


  /* ═══════════════════════════════════════════════════════════════════
     13. SCROLL REVEALS
     ═══════════════════════════════════════════════════════════════════ */
  /*
   * Scroll-driven rather than IntersectionObserver. Everything on this page
   * starts at opacity 0, so if the reveal mechanism ever fails to fire the
   * content is invisible for good — a deterministic geometry check is worth
   * far more here than the observer's efficiency.
   */
  function initReveals() {
    var items = $$('.reveal');
    var values = $$('.value');
    var valuesFired = false;
    var ticking = false;

    function inView(el, ratio) {
      var r = el.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.bottom <= 0 || r.top >= vh) return false;
      var visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      /* tall elements only need a slice of the viewport, not a slice of themselves */
      return visible >= Math.min(r.height * ratio, vh * 0.3);
    }

    function check() {
      ticking = false;

      for (var i = items.length - 1; i >= 0; i--) {
        if (inView(items[i], 0.16)) {
          items[i].classList.add('in');
          items.splice(i, 1);
        }
      }

      /* the four values arrive one at a time */
      if (!valuesFired && values.length && inView(values[0].parentNode, 0.3)) {
        valuesFired = true;
        values.forEach(function (v, i) {
          setTimeout(function () { v.classList.add('in'); }, i * 260);
        });
      }

      if (!items.length && (valuesFired || !values.length)) {
        window.removeEventListener('scroll', request);
        window.removeEventListener('resize', request);
      }
    }

    function request() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(check);
    }

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);

    check();
    /* re-check once layout has settled (fonts, logo, late reflow) */
    setTimeout(check, 400);
    setTimeout(check, 1400);
  }


  /* ═══════════════════════════════════════════════════════════════════
     14. THE CELEBRATION
     ═══════════════════════════════════════════════════════════════════ */
  var celebrated = false;
  var celebrationApi = { close: function () {} };

  /* Remembers that the big sequence has already played, so a reload on the
     day drops straight into party mode instead of replaying the takeover.
     Storage can throw in private mode — never let that break the page. */
  var seenCelebration = {
    KEY: 'ehcnyc-laura-celebrated',
    has: function () {
      try { return window.localStorage.getItem(this.KEY) === '1'; }
      catch (e) { return false; }
    },
    remember: function () {
      try { window.localStorage.setItem(this.KEY, '1'); } catch (e) {}
    }
  };

  /**
   * @param {boolean} full  true = the big first-time sequence.
   *                        false = "party mode" only: the page is already
   *                        celebratory but the takeover does not replay.
   */
  function runCelebration(full) {
    if (celebrated) return;
    celebrated = true;
    if (full !== false) full = true;

    var overlay = $('#celebrate');
    var clock = $('#clock');
    var party = $('#hero-party');
    var anchor = $('#clock-anchor');

    document.body.classList.add('is-party');

    /* the countdown gives way to a birthday panel */
    if (clock) clock.hidden = true;
    if (anchor) anchor.hidden = true;
    if (party) party.hidden = false;

    /* the card opens itself */
    cardApi.open();

    /* Returning visitor: skip the takeover, keep the page in party mode.
       The full sequence is always one tap away via "Replay the celebration". */
    if (!full) {
      seenCelebration.remember();
      if (!motion.reduced) {
        fx.confetti(motion.mobile ? 30 : 60);
        domfx.balloons(5);
      }
      return;
    }

    seenCelebration.remember();

    document.body.classList.add('is-celebrating');
    requestAnimationFrame(function () { document.body.classList.add('veil-on'); });

    if (overlay) {
      overlay.hidden = false;
      requestAnimationFrame(function () {
        overlay.classList.add('is-live');
        trapCelebrationFocus(overlay);
      });
    }

    /* t=0.4  the confetti cannon */
    setTimeout(function () { fx.beginParty(); }, 400);

    /* t=1.2  balloons + ribbons */
    setTimeout(function () {
      domfx.balloons(14);
      domfx.ribbons(8);
    }, 1200);

    /* t=2.0  the vials rise with the celebration, then settle back */
    setTimeout(celebrateVials, 1900);

    /* sparkles around the headline + an occasional heart */
    setTimeout(function () {
      fx.sparkle(window.innerWidth / 2, window.innerHeight * 0.42, motion.reduced ? 8 : 50, 300);
    }, 1700);

    if (!motion.reduced) {
      setInterval(function () { domfx.hearts(1); }, 5200);
    }
  }

  /* ── keyboard containment for the full-screen celebration ──
     While the overlay is up it covers the page, so the content behind it
     must not stay reachable by Tab. `inert` removes it from the tab order
     and the accessibility tree in one go. */
  var INERT_TARGETS = ['#main', '.site-header', '.site-footer'];
  var lastFocus = null;

  function setBackgroundInert(on) {
    INERT_TARGETS.forEach(function (sel) {
      var el = $(sel);
      if (!el) return;
      if (on) { el.setAttribute('inert', ''); }
      else { el.removeAttribute('inert'); }
    });
  }

  function trapCelebrationFocus(overlay) {
    lastFocus = document.activeElement;
    setBackgroundInert(true);
    /* move focus somewhere meaningful inside the overlay */
    var first = overlay.querySelector('button:not([hidden])');
    if (first) { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }
  }

  function releaseCelebrationFocus() {
    setBackgroundInert(false);
    if (lastFocus && document.contains(lastFocus)) {
      try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
    }
    lastFocus = null;
  }

  function initCelebrationControls() {
    var overlay = $('#celebrate');
    var dismiss = $('#celebrate-dismiss');
    var replayCelebration = $('#replay-celebration');

    function closeOverlay() {
      if (!overlay || overlay.hidden) return;
      overlay.classList.add('is-gone');
      document.body.classList.remove('veil-on');
      releaseCelebrationFocus();
      setTimeout(function () { overlay.hidden = true; }, 900);
    }
    celebrationApi.close = closeOverlay;

    /* Esc dismisses, like any other modal surface */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !overlay || overlay.hidden) return;
      closeOverlay();
      var target = $('#card-section');
      if (target) target.scrollIntoView({ behavior: motion.reduced ? 'auto' : 'smooth' });
    });

    if (dismiss && overlay) {
      dismiss.addEventListener('click', function () {
        overlay.classList.add('is-gone');
        document.body.classList.remove('veil-on');
        releaseCelebrationFocus();
        setTimeout(function () { overlay.hidden = true; }, 900);
        var target = $('#card-section');
        if (target) target.scrollIntoView({ behavior: motion.reduced ? 'auto' : 'smooth' });
      });
    }

    if (replayCelebration && overlay) {
      replayCelebration.addEventListener('click', function () {
        overlay.hidden = false;
        overlay.classList.remove('is-gone');
        document.body.classList.add('is-celebrating', 'veil-on');
        /* replay the entrance animations */
        overlay.classList.remove('is-live');
        void overlay.offsetWidth;
        overlay.classList.add('is-live');
        trapCelebrationFocus(overlay);

        fx.confetti(motion.mobile ? 70 : 140);
        domfx.balloons(10);
        domfx.ribbons(6);
        celebrateVials();
      });
    }
  }


  /* ═══════════════════════════════════════════════════════════════════
     15. MISC POLISH
     ═══════════════════════════════════════════════════════════════════ */
  var bgLight = null;

  /**
   * Split the hero eyebrow into letters for a staggered entrance.
   * @param {number} [delay] start offset in seconds (0 when re-running
   *                 after the countdown phase changes the wording)
   */
  function initLetterReveal(delay) {
    var el = $('[data-letters]');
    if (!el || motion.reduced) return;
    var base = delay == null ? 0.5 : delay;

    var text = el.textContent;
    el.textContent = '';
    var frag = document.createDocumentFragment();

    for (var i = 0; i < text.length; i++) {
      var span = document.createElement('span');
      span.className = 'ch';
      if (text[i] === ' ') { frag.appendChild(document.createTextNode(' ')); continue; }
      span.textContent = text[i];
      span.style.animationDelay = (base + i * 0.028).toFixed(3) + 's';
      frag.appendChild(span);
    }
    el.appendChild(frag);
  }

  /** Buttons drift slightly toward the cursor. */
  function initMagneticButtons() {
    if (!motion.hover || motion.reduced) return;

    $$('.btn--emboss, .btn--ghost').forEach(function (btn) {
      var rect = null;
      btn.addEventListener('pointerenter', function () { rect = btn.getBoundingClientRect(); });
      btn.addEventListener('pointermove', function (e) {
        if (!rect) rect = btn.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        btn.style.transform =
          'translate3d(' + (x * 12).toFixed(1) + 'px,' + (y * 8 - 3).toFixed(1) + 'px,0)';
      }, { passive: true });
      btn.addEventListener('pointerleave', function () {
        rect = null;
        btn.style.transform = '';
      });
    });
  }

  /**
   * The hero recedes as you scroll past it instead of just sliding away —
   * it hands the page over to the next section rather than leaving.
   * Applied to the stage, not the card, so it never fights the 3D tilt.
   */
  function initScrollChoreography() {
    var stage = $('.hero__stage');
    var cue = $('.scroll-cue');
    if (!stage || motion.reduced) return;

    var ticking = false;
    var lastP = -1;

    function apply() {
      ticking = false;
      var vh = window.innerHeight || 800;
      var p = clamp(window.scrollY / (vh * 0.85), 0, 1);
      if (Math.abs(p - lastP) < 0.004) return;
      lastP = p;

      /* ease-out so most of the movement happens early in the scroll */
      var e = 1 - Math.pow(1 - p, 2);
      stage.style.transform = 'translate3d(0,' + (-e * 70).toFixed(1) + 'px,0) scale(' + (1 - e * 0.06).toFixed(4) + ')';
      stage.style.opacity = (1 - e * 0.9).toFixed(3);
      if (cue) cue.style.opacity = (1 - clamp(p * 3, 0, 1)).toFixed(3);
    }

    function request() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    }

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    apply();
  }

  /** Give the hero card its tilt once the entrance animation has finished. */
  function initHeroTilt() {
    var card = $('#hero-card');
    if (!card) return;

    var enable = function () {
      card.classList.add('is-tiltable');
      registerTilt(card, { max: 6, lift: 4, perspective: 1400 });
    };

    card.addEventListener('animationend', function handler(e) {
      if (e.animationName !== 'card-in') return;
      card.removeEventListener('animationend', handler);
      enable();
    });
    /* safety net if the animation never fires (reduced motion, etc.) */
    setTimeout(function () { if (!card.classList.contains('is-tiltable')) enable(); }, 2200);
  }


  /* ═══════════════════════════════════════════════════════════════════
     BOOT
     ═══════════════════════════════════════════════════════════════════ */
  function onReady() {
    /* The loading veil locks scrolling, which swallows any hash the page was
       opened with — honour it now that the veil is gone. */
    if (window.location.hash) {
      try {
        var target = document.querySelector(window.location.hash);
        if (target) target.scrollIntoView({ behavior: 'auto', block: 'start' });
      } catch (e) { /* malformed hash — ignore */ }
    }

    /* things that should only start once the veil is gone */
    initReveals();
  }

  function init() {
    bgLight = $('#bg-light');

    fx.init();
    domfx.init();

    initLoader();
    initShapes();
    initLetterReveal();
    initPointer();
    initHeroTilt();
    initScrollChoreography();
    initMagneticButtons();

    initBirthdayCard();
    initFamilyNotes();
    initSurpriseBox();
    initVials();
    initCelebrationControls();

    if (forceCelebrate) {
      /* the preview hook always shows the full sequence */
      setTimeout(function () { runCelebration(true); }, 1200);
    } else if (Date.now() >= CELEBRATION_TARGET && seenCelebration.has()) {
      /* the day has arrived and she has already seen the takeover — open in
         party mode rather than replaying it on every reload */
      runCelebration(false);
    } else {
      initCountdown(function () { runCelebration(true); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
