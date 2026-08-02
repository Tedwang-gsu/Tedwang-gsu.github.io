/* Motion choreography — opening sequence + scroll reveals.
 *
 * Only runs when <html> carries the .anim class, which the inline head script
 * adds unless the visitor asked for reduced motion. If GSAP is unavailable the
 * classes are dropped immediately and the page stays a plain static document.
 *
 * Everything animates transform / opacity / clip-path only, so the whole thing
 * stays on the compositor and off the layout path.
 */
(function () {
  var root = document.documentElement;

  if (!root.classList.contains('anim')) return;

  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.remove('anim');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  var OUT = 'expo.out';
  var INOUT = 'expo.inOut';

  /* ---------------------------------------------------------------- *
   * Word masking: wrap each word in a clipped box so it can rise out
   * of nothing. The slight vertical stretch on the way up is what
   * makes it read as "compressed, then settled" instead of a slide.
   * ---------------------------------------------------------------- */

  function splitWords(el) {
    if (!el) return [];
    var words = el.textContent.trim().split(/\s+/);
    var inners = [];
    el.textContent = '';
    words.forEach(function (word, i) {
      var outer = document.createElement('span');
      var inner = document.createElement('span');
      outer.className = 'word';
      inner.className = 'word-i';
      inner.textContent = word;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      inners.push(inner);
    });
    return inners;
  }

  var HIDDEN_WORD = { yPercent: 120, scaleY: 1.24, transformOrigin: 'bottom center' };
  var SHOWN_WORD = { yPercent: 0, scaleY: 1, duration: 1.3, ease: OUT };

  /* ---------------------------------------------------------------- *
   * Opening sequence
   * ---------------------------------------------------------------- */

  var heroWords = splitWords(document.querySelector('#hero h1'));
  var photo = document.querySelector('.hero-photo-card');
  var shot = document.querySelector('.headshot');
  var curvePath = document.querySelector('.survival-curve path');
  var curveDots = document.querySelectorAll('.survival-curve circle');
  var curveLen = curvePath ? curvePath.getTotalLength() : 0;

  gsap.set('#site-nav', { yPercent: -100 });
  gsap.set(photo, { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set(shot, { scale: 1.32 });
  gsap.set(heroWords, HIDDEN_WORD);
  gsap.set('.eyebrow, .hero-lede, .hero-buttons, .info-row, .stat, .exam-tag, .badge-label, .badge-list li, .scroll-cue', {
    y: 34,
    opacity: 0
  });
  gsap.set('.survival-curve', { opacity: 0 });
  gsap.set(curveDots, { opacity: 0, scale: 0, transformOrigin: 'center' });
  if (curvePath) gsap.set(curvePath, { strokeDasharray: curveLen, strokeDashoffset: curveLen });

  var intro = gsap.timeline({
    defaults: { ease: OUT },
    onComplete: function () {
      ScrollTrigger.refresh();
    }
  });

  intro
    .to(photo, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.15 }, 0)
    .to(shot, { scale: 1.12, duration: 1.5, ease: 'power3.out' }, 0)
    .to('#site-nav', { yPercent: 0, duration: 0.85 }, 0.15)
    .to('.eyebrow', { y: 0, opacity: 1, duration: 0.8 }, 0.2)
    .to(heroWords, Object.assign({}, SHOWN_WORD, { duration: 1, stagger: 0.07 }), 0.28)
    .to('.hero-lede', { y: 0, opacity: 1, duration: 0.85 }, 0.55)
    .to('.survival-curve', { opacity: 1, duration: 0.3 }, 0.68)
    .to(curvePath, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, 0.68)
    .to('.hero-buttons', { y: 0, opacity: 1, duration: 0.8 }, 0.72)
    .to(curveDots, { opacity: 1, scale: 1, duration: 0.45, stagger: 0.07 }, 0.95)
    /* cascade follows the visual order down the column */
    .to('.badge-label', { y: 0, opacity: 1, duration: 0.7 }, 0.82)
    .to('.badge-list li', { y: 0, opacity: 1, duration: 0.7, stagger: 0.08 }, 0.9)
    .to('.info-row', { y: 0, opacity: 1, duration: 0.8, stagger: 0.09 }, 1.05)
    .to('.stat', { y: 0, opacity: 1, duration: 0.8, stagger: 0.08 }, 1.25)
    .to('.exam-tag', { y: 0, opacity: 1, duration: 0.7 }, 1.45)
    .to('.scroll-cue', { y: 0, opacity: 1, duration: 0.8 }, 1.6);

  /* The cue has done its job the moment the page moves — fade it out */
  var cue = document.querySelector('.scroll-cue');
  if (cue) {
    ScrollTrigger.create({
      start: 60,
      end: 'max',
      onEnter: function () {
        gsap.to(cue, { opacity: 0, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
      },
      onLeaveBack: function () {
        gsap.to(cue, { opacity: 1, duration: 0.45, ease: 'power2.out', overwrite: 'auto' });
      }
    });
  }

  /* Counters tick up alongside the stats row rather than after it */
  document.querySelectorAll('.stat-num').forEach(function (el) {
    var target = parseFloat(el.textContent);
    if (isNaN(target)) return;
    var parts = el.textContent.split('.');
    var decimals = parts[1] ? parts[1].length : 0;
    var proxy = { value: 0 };
    el.textContent = (0).toFixed(decimals);
    intro.to(
      proxy,
      {
        value: target,
        duration: 1.1,
        ease: 'power2.out',
        onUpdate: function () {
          el.textContent = proxy.value.toFixed(decimals);
        }
      },
      1.3
    );
  });

  /* ---------------------------------------------------------------- *
   * Scroll: headline first, then the cards behind it
   * ---------------------------------------------------------------- */

  document.querySelectorAll('.section-head').forEach(function (head) {
    var heading = head.querySelector('h2');
    var mark = head.querySelector('.section-mark');
    var words = splitWords(heading);

    var tl = gsap.timeline({
      defaults: { ease: OUT },
      scrollTrigger: { trigger: head, start: 'top 85%', once: true }
    });

    tl.fromTo(heading, { scale: 1.16, transformOrigin: 'left bottom' }, { scale: 1, duration: 1.5 }, 0)
      .fromTo(words, HIDDEN_WORD, Object.assign({}, SHOWN_WORD, { stagger: 0.1 }), 0)
      .fromTo(mark, { opacity: 0, x: -18 }, { opacity: 1, x: 0, duration: 1.1 }, 0.25);

    var hint = head.querySelector('.section-hint');
    if (hint) tl.fromTo(hint, { opacity: 0 }, { opacity: 1, duration: 0.9 }, 0.55);
  });

  function stagger(items, trigger, delay) {
    var els = gsap.utils.toArray(items);
    if (!els.length) return;
    gsap.fromTo(
      els,
      { y: 70, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: OUT,
        stagger: 0.13,
        delay: delay || 0,
        scrollTrigger: { trigger: trigger, start: 'top 80%', once: true }
      }
    );
  }

  stagger('.plate', '#education .plate-row', 0.25);
  stagger('#experience .ledger-entry', '#experience .ledger-list', 0.25);
  stagger('#projects .ledger-entry', '#projects .ledger-list', 0.25);
  stagger('.skill-card', '.skill-grid', 0.25);

  /* Education frames wipe open from the bottom edge, like a print being pulled */
  gsap.fromTo(
    '.plate-frame',
    { clipPath: 'inset(0% 0% 100% 0%)' },
    {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 1.5,
      ease: OUT,
      stagger: 0.13,
      delay: 0.35,
      scrollTrigger: { trigger: '#education .plate-row', start: 'top 80%', once: true }
    }
  );

  /* ---------------------------------------------------------------- *
   * Parallax — scrubbed, transform-only, deliberately small
   * ---------------------------------------------------------------- */

  if (shot) {
    gsap.fromTo(
      shot,
      { yPercent: 4 },
      {
        yPercent: -6,
        ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 }
      }
    );
  }

  gsap.utils.toArray('.skill-motif').forEach(function (motif) {
    gsap.fromTo(
      motif,
      { yPercent: 14 },
      {
        yPercent: -10,
        ease: 'none',
        scrollTrigger: { trigger: motif.closest('.skill-card'), start: 'top bottom', end: 'bottom top', scrub: 1 }
      }
    );
  });

  /* ---------------------------------------------------------------- *
   * Contact panel — plays as the page slides off it
   * ---------------------------------------------------------------- */

  var contactWords = splitWords(document.querySelector('.contact-mark'));
  var contactBits = gsap.utils.toArray('.contact-eyebrow, .contact-email, .contact-links li, .contact-base span');

  gsap.set(contactWords, HIDDEN_WORD);
  gsap.set(contactBits, { y: 30, opacity: 0 });

  gsap
    .timeline({
      defaults: { ease: OUT },
      scrollTrigger: { trigger: '.contact-reveal', start: 'top 65%', once: true }
    })
    .to(contactWords, Object.assign({}, SHOWN_WORD, { stagger: 0.1 }), 0)
    .to(contactBits, { y: 0, opacity: 1, duration: 1.1, stagger: 0.09 }, 0.25);

  gsap.fromTo(
    '.contact-watermark',
    { xPercent: 6 },
    {
      xPercent: -4,
      ease: 'none',
      scrollTrigger: { trigger: '.contact-reveal', start: 'top bottom', end: 'bottom bottom', scrub: 1.2 }
    }
  );

  /* Local font finishes late enough to shift trigger positions */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      ScrollTrigger.refresh();
    });
  }
})();
