/* Glassmorphism interactions for Hexo Fluid
 * - Initial load sequence (staggered)
 * - Scroll reveal (IntersectionObserver)
 * - Image blur -> clear on enter
 * - Parallax banner (rAF)
 * - Reading progress bar (rAF)
 * - Button ripple
 */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  function qs(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function qsa(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function markAnim(element, delayMs) {
    if (!element) return;
    element.classList.add('gh-anim');
    element.style.setProperty('--gh-delay', (delayMs || 0) + 'ms');
  }

  function initLoadSequence() {
    if (reduceMotion) {
      root.classList.add('gh-loaded');
      return;
    }

    var delay = 0;

    // Logo
    var brand = qs('#navbar .navbar-brand');
    markAnim(brand, delay);
    delay += 120;

    // Nav items
    qsa('#navbar .navbar-nav .nav-item').forEach(function (item) {
      markAnim(item, delay);
      delay += 70;
    });

    // Hero title/subtitle
    var bannerText = qs('#banner .banner-text');
    if (bannerText) {
      qsa('.h1, .h2, h1, h2, p, #subtitle', bannerText).forEach(function (el) {
        markAnim(el, delay);
        delay += 90;
      });
    }

    // First screen cards (best-effort)
    qsa('.index-card').slice(0, 6).forEach(function (card) {
      markAnim(card, delay);
      delay += 80;
    });

    // Trigger
    root.classList.add('gh-loaded');
  }

  function initScrollReveal() {
    if (reduceMotion) return;
    if (!('IntersectionObserver' in window)) return;

    var revealTargets = qsa('.index-card, .post-content, .post, .archive-post, .category-list, .tagcloud');
    revealTargets.forEach(function (el) {
      el.classList.add('gh-reveal');
    });

    var images = qsa('.post-content img, .markdown-body img, .index-excerpt img, article img');
    images.forEach(function (img) {
      img.classList.add('gh-img');
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('gh-inview');
          observer.unobserve(entry.target);
        });
      },
      {
        root: null,
        threshold: 0.12,
        rootMargin: '0px 0px -10% 0px'
      }
    );

    revealTargets.forEach(function (el) {
      observer.observe(el);
    });
    images.forEach(function (img) {
      observer.observe(img);
    });
  }

  function initReadingProgress() {
    // A thin bar pinned to top, driven by scroll position.
    var bar = document.createElement('div');
    bar.id = 'reading-progress';
    document.body.appendChild(bar);

    var ticking = false;

    function update() {
      ticking = false;
      var doc = document.documentElement;
      var scrollTop = doc.scrollTop || document.body.scrollTop || 0;
      var max = (doc.scrollHeight || 0) - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 0;
      bar.style.width = (p * 100).toFixed(2) + '%';
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  function initParallaxBanner() {
    if (reduceMotion) return;
    var banner = qs('#banner');
    if (!banner) return;

    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      // keep subtle
      banner.style.setProperty('--gh-parallax', (y * 0.08).toFixed(2) + 'px');
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initRipple() {
    if (reduceMotion) return;

    // Event delegation: apply to buttons/btn-like elements.
    document.addEventListener(
      'click',
      function (e) {
        var target = e.target;
        if (!target) return;

        var host = target.closest && target.closest('button, .btn, a.btn, .navbar-toggler');
        if (!host) return;

        // Prevent over-styling nav links
        if (host.matches('a.nav-link')) return;

        host.classList.add('gh-ripple-host');

        var rect = host.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height) * 1.6;

        var ripple = document.createElement('span');
        ripple.className = 'gh-ripple';
        ripple.style.width = size + 'px';
        ripple.style.height = size + 'px';

        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';

        host.appendChild(ripple);

        window.setTimeout(function () {
          ripple.remove();
        }, 600);
      },
      { passive: true }
    );
  }

  function boot() {
    // Scope layout-only changes to homepage.
    // Fluid does not add a stable body class by default in generated HTML,
    // so we tag home by presence of index cards.
    if (document.querySelector('.index-card')) {
      root.classList.add('gh-home');
    }

    initLoadSequence();
    initScrollReveal();
    initReadingProgress();
    initParallaxBanner();
    initRipple();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
