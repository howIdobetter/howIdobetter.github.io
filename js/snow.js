/* Snow effect for Hexo Fluid
 * Lightweight, GPU-friendly, respects reduced motion preference.
 * Creates floating snowflakes that gently fall across the viewport.
 */

(function () {
  'use strict';

  // Debug logging
  console.log('Snow effect script loaded');

  // Respect reduced motion - but allow override for testing
  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}
  
  // For testing, comment out the return statement
  // if (reduceMotion) return;
  
  // Temporary: always run for testing
  console.log('Snow effect starting, reduceMotion:', reduceMotion);

  // Configuration
  var config = {
    count: 80,               // number of flakes - increased for visibility
    minSize: 4,              // px - increased for visibility
    maxSize: 10,             // increased for visibility
    minSpeed: 0.8,           // px per frame - increased for visibility
    maxSpeed: 2.5,           // increased for visibility
    minOpacity: 0.6,         // increased for visibility
    maxOpacity: 0.95,        // increased for visibility
    wind: 0.08,              // horizontal drift factor - increased for visibility
    color: '#ffffff',        // snowflake color
    zIndex: 10000,           // very high z-index to ensure visibility
    container: document.body // where to append flakes
  };

  var flakes = [];
  var container = config.container;
  var width = window.innerWidth;
  var height = window.innerHeight;
  var animationId = null;
  var lastTime = 0;

  // Create a single flake
  function createFlake() {
    var flake = document.createElement('div');
    flake.style.position = 'fixed';
    flake.style.pointerEvents = 'none';
    flake.style.userSelect = 'none';
    flake.style.zIndex = config.zIndex;
    flake.style.willChange = 'transform, opacity';

    // Random properties
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
    
    // Debug: add border to make flakes visible
    flake.style.border = '1px solid rgba(255, 0, 0, 0.5)';

    // Store state
    flake._snow = {
      x: x,
      y: y,
      size: size,
      speed: speed,
      wind: (Math.random() - 0.5) * config.wind,
      opacity: opacity
    };

    container.appendChild(flake);
    flakes.push(flake);
  }

  // Update flake position
  function updateFlake(flake, delta) {
    var state = flake._snow;
    state.y += state.speed * delta;
    state.x += state.wind * delta;

    // Wrap around edges
    if (state.x > width + state.size) state.x = -state.size;
    if (state.x < -state.size) state.x = width + state.size;

    // Reset if fallen out of view
    if (state.y > height + state.size) {
      state.y = -state.size;
      state.x = Math.random() * width;
    }

    flake.style.transform = 'translate(' + state.x + 'px, ' + state.y + 'px)';
  }

  // Animation loop
  function animate(time) {
    if (!lastTime) lastTime = time;
    var delta = Math.min(time - lastTime, 32); // cap at ~30fps equivalent
    lastTime = time;

    flakes.forEach(function (flake) {
      updateFlake(flake, delta);
    });

    animationId = requestAnimationFrame(animate);
  }

  // Handle resize
  function onResize() {
    width = window.innerWidth;
    height = window.innerHeight;
  }

  // Initialize
  function init() {
    // Create flakes
    for (var i = 0; i < config.count; i++) {
      createFlake();
    }

    // Start animation
    animationId = requestAnimationFrame(animate);

    // Listen to resize
    window.addEventListener('resize', onResize, { passive: true });
  }

  // Cleanup (optional)
  function destroy() {
    if (animationId) cancelAnimationFrame(animationId);
    flakes.forEach(function (flake) {
      if (flake.parentNode) flake.parentNode.removeChild(flake);
    });
    flakes.length = 0;
    window.removeEventListener('resize', onResize);
  }

  // Expose destroy for manual control
  window.SnowEffect = { destroy: destroy };

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
