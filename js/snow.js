/* Snow effect for Hexo Fluid
 * Lightweight and GPU-friendly. Respects reduced-motion preference.
 */

(function () {
  'use strict';

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}
  if (reduceMotion) return;

  var width = window.innerWidth;
  var height = window.innerHeight;

  // Softer defaults for production
  var config = {
    count: width < 768 ? 32 : 56,
    minSize: 2,
    maxSize: 7,
    minSpeed: 0.35,
    maxSpeed: 1.25,
    minOpacity: 0.35,
    maxOpacity: 0.85,
    wind: 0.05,
    color: '#ffffff',
    zIndex: 50,
    container: document.body
  };

  var flakes = [];
  var animationId = null;
  var lastTime = 0;

  function createFlake() {
    var flake = document.createElement('div');
    flake.style.position = 'fixed';
    flake.style.pointerEvents = 'none';
    flake.style.userSelect = 'none';
    flake.style.zIndex = config.zIndex;
    flake.style.willChange = 'transform, opacity';

    var size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
    var speed = Math.random() * (config.maxSpeed - config.minSpeed) + config.minSpeed;
    var opacity = Math.random() * (config.maxOpacity - config.minOpacity) + config.minOpacity;
    var x = Math.random() * width;
    var y = -size;

    flake.style.width = size + 'px';
    flake.style.height = size + 'px';
    flake.style.borderRadius = '50%';
    flake.style.backgroundColor = config.color;
    flake.style.opacity = opacity;
    flake.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

    flake._snow = {
      x: x,
      y: y,
      size: size,
      speed: speed,
      wind: (Math.random() - 0.5) * config.wind
    };

    config.container.appendChild(flake);
    flakes.push(flake);
  }

  function updateFlake(flake, delta) {
    var state = flake._snow;
    state.y += state.speed * delta;
    state.x += state.wind * delta;

    if (state.x > width + state.size) state.x = -state.size;
    if (state.x < -state.size) state.x = width + state.size;

    if (state.y > height + state.size) {
      state.y = -state.size;
      state.x = Math.random() * width;
    }

    flake.style.transform = 'translate(' + state.x + 'px, ' + state.y + 'px)';
  }

  function animate(time) {
    if (!lastTime) lastTime = time;
    var delta = Math.min(time - lastTime, 32);
    lastTime = time;

    flakes.forEach(function (flake) {
      updateFlake(flake, delta);
    });

    animationId = requestAnimationFrame(animate);
  }

  function onResize() {
    width = window.innerWidth;
    height = window.innerHeight;
  }

  function init() {
    for (var i = 0; i < config.count; i++) {
      createFlake();
    }

    animationId = requestAnimationFrame(animate);
    window.addEventListener('resize', onResize, { passive: true });
  }

  function destroy() {
    if (animationId) cancelAnimationFrame(animationId);
    flakes.forEach(function (flake) {
      if (flake.parentNode) flake.parentNode.removeChild(flake);
    });
    flakes.length = 0;
    window.removeEventListener('resize', onResize);
  }

  window.SnowEffect = { destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
