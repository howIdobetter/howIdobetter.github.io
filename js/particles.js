/* ============================================================
   Particle Effects System for Hexo Fluid + Glassmorphism Theme
   - Layer 1: Interactive particle network (whole page)
   - Layer 2: Floating orbs (banner area)
   - Layer 3: Click burst
   - Layer 4: Cursor trail
   - Layer 5: Shooting stars
   ============================================================ */

(function () {
    'use strict';

    /* ---------- Reduced-motion guard ---------- */
    var reduceMotion = false;
    try {
        reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { }
    if (reduceMotion) return;

    /* ---------- Canvas setup ---------- */
    var canvas = document.createElement('canvas');
    canvas.id = 'gh-particles-canvas';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    var W, H, dpr;
    var isMobile = window.innerWidth < 768;

    function resize() {
        dpr = window.devicePixelRatio || 1;
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        isMobile = W < 768;
    }
    resize();
    window.addEventListener('resize', resize);

    /* ---------- Theme colors ---------- */
    var COLORS = {
        light: [
            'rgba(52, 152, 219, ',   // primary blue
            'rgba(108, 92, 231, ',   // secondary purple
            'rgba(46, 204, 113, ',   // secondary green
            'rgba(243, 156, 18, ',   // accent gold
            'rgba(255, 255, 255, '   // white
        ],
        dark: [
            'rgba(85, 183, 243, ',   // primary blue
            'rgba(138, 125, 255, ',  // secondary purple
            'rgba(72, 227, 154, ',   // secondary green
            'rgba(255, 191, 74, ',   // accent gold
            'rgba(240, 245, 255, '   // near-white
        ]
    };

    function isDark() {
        var html = document.documentElement;
        return html.getAttribute('data-user-color-scheme') === 'dark';
    }

    function palette() {
        return isDark() ? COLORS.dark : COLORS.light;
    }

    function pickColor(alpha) {
        var pal = palette();
        return pal[Math.floor(Math.random() * pal.length)] + alpha + ')';
    }

    function pickColorIdx(idx, alpha) {
        var pal = palette();
        return pal[idx % pal.length] + alpha + ')';
    }

    /* ---------- Mouse state ---------- */
    var mouse = { x: -9999, y: -9999, active: false };
    var scrollY = 0;

    document.addEventListener('mousemove', function (e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
    });
    document.addEventListener('mouseleave', function () {
        mouse.active = false;
        mouse.x = -9999;
        mouse.y = -9999;
    });
    window.addEventListener('scroll', function () {
        scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    }, { passive: true });

    /* ---------- Utility ---------- */
    function rand(min, max) { return min + Math.random() * (max - min); }
    function dist(x1, y1, x2, y2) {
        var dx = x1 - x2, dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /* ==========================================================
       LAYER 1 — Interactive Particle Network
       ========================================================== */
    var NET_COUNT = isMobile ? 35 : 70;
    var NET_LINK_DIST = isMobile ? 100 : 150;
    var NET_MOUSE_DIST = 180;
    var netParticles = [];

    function NetParticle() {
        this.x = rand(0, W);
        this.y = rand(0, H);
        this.vx = rand(-0.3, 0.3);
        this.vy = rand(-0.3, 0.3);
        this.r = rand(1.2, 3);
        this.colorIdx = Math.floor(rand(0, 5));
        this.baseAlpha = rand(0.25, 0.6);
    }

    NetParticle.prototype.update = function () {
        this.x += this.vx;
        this.y += this.vy;
        // Wrap
        if (this.x < -10) this.x = W + 10;
        if (this.x > W + 10) this.x = -10;
        if (this.y < -10) this.y = H + 10;
        if (this.y > H + 10) this.y = -10;
        // Mouse interaction
        if (mouse.active) {
            var d = dist(this.x, this.y, mouse.x, mouse.y);
            if (d < NET_MOUSE_DIST && d > 0) {
                var force = (1 - d / NET_MOUSE_DIST) * 0.025;
                this.vx += (this.x - mouse.x) / d * force;
                this.vy += (this.y - mouse.y) / d * force;
            }
        }
        // Damping
        this.vx *= 0.998;
        this.vy *= 0.998;
        // Speed limit
        var speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 1.2) {
            this.vx = (this.vx / speed) * 1.2;
            this.vy = (this.vy / speed) * 1.2;
        }
    };

    NetParticle.prototype.draw = function () {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = pickColorIdx(this.colorIdx, this.baseAlpha);
        ctx.fill();
    };

    function initNet() {
        netParticles = [];
        for (var i = 0; i < NET_COUNT; i++) {
            netParticles.push(new NetParticle());
        }
    }

    function drawNetLinks() {
        for (var i = 0; i < netParticles.length; i++) {
            for (var j = i + 1; j < netParticles.length; j++) {
                var d = dist(netParticles[i].x, netParticles[i].y,
                    netParticles[j].x, netParticles[j].y);
                if (d < NET_LINK_DIST) {
                    var alpha = (1 - d / NET_LINK_DIST) * 0.15;
                    ctx.beginPath();
                    ctx.moveTo(netParticles[i].x, netParticles[i].y);
                    ctx.lineTo(netParticles[j].x, netParticles[j].y);
                    ctx.strokeStyle = pickColorIdx(netParticles[i].colorIdx, alpha);
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
            // Link to mouse
            if (mouse.active) {
                var dm = dist(netParticles[i].x, netParticles[i].y, mouse.x, mouse.y);
                if (dm < NET_MOUSE_DIST) {
                    var am = (1 - dm / NET_MOUSE_DIST) * 0.25;
                    ctx.beginPath();
                    ctx.moveTo(netParticles[i].x, netParticles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = pickColorIdx(0, am);
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }
    }

    /* ==========================================================
       LAYER 2 — Floating Orbs (banner region, first 70vh)
       ========================================================== */
    var ORB_COUNT = isMobile ? 5 : 10;
    var orbParticles = [];
    var bannerH = 0;

    function Orb() {
        bannerH = H * 0.7;
        this.x = rand(0, W);
        this.y = rand(0, bannerH);
        this.r = rand(30, 80);
        this.vx = rand(-0.15, 0.15);
        this.vy = rand(-0.1, 0.1);
        this.colorIdx = Math.floor(rand(0, 4));
        this.alpha = rand(0.04, 0.12);
        this.phase = rand(0, Math.PI * 2);
        this.phaseSpeed = rand(0.003, 0.008);
    }

    Orb.prototype.update = function (t) {
        this.x += this.vx + Math.sin(this.phase + t * this.phaseSpeed) * 0.2;
        this.y += this.vy + Math.cos(this.phase + t * this.phaseSpeed * 0.7) * 0.15;
        if (this.x < -this.r) this.x = W + this.r;
        if (this.x > W + this.r) this.x = -this.r;
        if (this.y < -this.r) this.y = bannerH + this.r;
        if (this.y > bannerH + this.r) this.y = -this.r;
    };

    Orb.prototype.draw = function () {
        // Only draw if banner is in view
        if (scrollY > bannerH) return;
        var screenY = this.y - scrollY;
        if (screenY < -this.r || screenY > H + this.r) return;

        var grad = ctx.createRadialGradient(this.x, screenY, 0, this.x, screenY, this.r);
        grad.addColorStop(0, pickColorIdx(this.colorIdx, this.alpha * 1.8));
        grad.addColorStop(0.5, pickColorIdx(this.colorIdx, this.alpha * 0.6));
        grad.addColorStop(1, pickColorIdx(this.colorIdx, 0));
        ctx.beginPath();
        ctx.arc(this.x, screenY, this.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
    };

    function initOrbs() {
        orbParticles = [];
        for (var i = 0; i < ORB_COUNT; i++) {
            orbParticles.push(new Orb());
        }
    }

    /* ==========================================================
       LAYER 3 — Click Burst
       ========================================================== */
    var burstParticles = [];

    function BurstParticle(x, y) {
        this.x = x;
        this.y = y;
        var angle = rand(0, Math.PI * 2);
        var speed = rand(2.5, 7);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.r = rand(2, 5);
        this.life = 1.0;
        this.decay = rand(0.015, 0.035);
        this.colorIdx = Math.floor(rand(0, 5));
        this.gravity = 0.06;
    }

    BurstParticle.prototype.update = function () {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life -= this.decay;
        this.r *= 0.985;
    };

    BurstParticle.prototype.draw = function () {
        if (this.life <= 0) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.5, this.r), 0, Math.PI * 2);
        ctx.fillStyle = pickColorIdx(this.colorIdx, this.life * 0.8);
        ctx.fill();
        // Glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = pickColorIdx(this.colorIdx, this.life * 0.15);
        ctx.fill();
    };

    document.addEventListener('click', function (e) {
        var count = isMobile ? 10 : 16;
        for (var i = 0; i < count; i++) {
            burstParticles.push(new BurstParticle(e.clientX, e.clientY));
        }
    });

    /* ==========================================================
       LAYER 4 — Cursor Trail
       ========================================================== */
    var trailParticles = [];
    var lastTrailTime = 0;

    function TrailParticle(x, y) {
        this.x = x + rand(-3, 3);
        this.y = y + rand(-3, 3);
        this.r = rand(1.5, 4);
        this.life = 1.0;
        this.decay = rand(0.03, 0.06);
        this.vx = rand(-0.5, 0.5);
        this.vy = rand(-1.2, -0.3);
        this.colorIdx = Math.floor(rand(0, 5));
    }

    TrailParticle.prototype.update = function () {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.r *= 0.97;
    };

    TrailParticle.prototype.draw = function () {
        if (this.life <= 0) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.3, this.r), 0, Math.PI * 2);
        ctx.fillStyle = pickColorIdx(this.colorIdx, this.life * 0.7);
        ctx.fill();
    };

    document.addEventListener('mousemove', function (e) {
        if (isMobile) return;
        var now = Date.now();
        if (now - lastTrailTime < 33) return; // ~30fps throttle
        lastTrailTime = now;
        for (var i = 0; i < 2; i++) {
            trailParticles.push(new TrailParticle(e.clientX, e.clientY));
        }
    });

    /* ==========================================================
       LAYER 5 — Shooting Stars
       ========================================================== */
    var shootingStars = [];
    var nextStarTime = Date.now() + rand(2000, 5000);

    function ShootingStar() {
        this.x = rand(W * 0.3, W * 1.2);
        this.y = rand(-50, H * 0.15);
        var angle = rand(Math.PI * 0.6, Math.PI * 0.85); // moving left-down
        var speed = rand(6, 14);
        this.vx = -Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = rand(0.008, 0.018);
        this.tailLen = rand(60, 140);
        this.width = rand(1.5, 3);
        this.isGold = Math.random() > 0.5;
    }

    ShootingStar.prototype.update = function () {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    };

    ShootingStar.prototype.draw = function () {
        if (this.life <= 0) return;
        var alpha = this.life * 0.9;
        // Main streak
        var ex = this.x - this.vx * (this.tailLen / Math.sqrt(this.vx * this.vx + this.vy * this.vy));
        var ey = this.y - this.vy * (this.tailLen / Math.sqrt(this.vx * this.vx + this.vy * this.vy));

        var grad = ctx.createLinearGradient(this.x, this.y, ex, ey);
        if (this.isGold) {
            grad.addColorStop(0, 'rgba(255, 220, 120, ' + alpha + ')');
            grad.addColorStop(0.3, 'rgba(255, 191, 74, ' + (alpha * 0.6) + ')');
            grad.addColorStop(1, 'rgba(255, 191, 74, 0)');
        } else {
            grad.addColorStop(0, 'rgba(255, 255, 255, ' + alpha + ')');
            grad.addColorStop(0.3, 'rgba(200, 220, 255, ' + (alpha * 0.5) + ')');
            grad.addColorStop(1, 'rgba(200, 220, 255, 0)');
        }

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = grad;
        ctx.lineWidth = this.width * this.life;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Head glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width * 2.5 * this.life, 0, Math.PI * 2);
        ctx.fillStyle = this.isGold
            ? 'rgba(255, 220, 120, ' + (alpha * 0.5) + ')'
            : 'rgba(255, 255, 255, ' + (alpha * 0.5) + ')';
        ctx.fill();
    };

    /* ==========================================================
       MAIN LOOP
       ========================================================== */
    var animId = null;
    var frameCount = 0;
    var isHidden = false;

    // Pause when tab hidden
    document.addEventListener('visibilitychange', function () {
        isHidden = document.hidden;
        if (!isHidden && !animId) {
            animId = requestAnimationFrame(loop);
        }
    });

    function loop(timestamp) {
        if (isHidden) {
            animId = null;
            return;
        }
        animId = requestAnimationFrame(loop);
        frameCount++;

        ctx.clearRect(0, 0, W, H);

        // --- Layer 1: Network ---
        for (var i = 0; i < netParticles.length; i++) {
            netParticles[i].update();
        }
        drawNetLinks();
        for (var i = 0; i < netParticles.length; i++) {
            netParticles[i].draw();
        }

        // --- Layer 2: Orbs ---
        for (var i = 0; i < orbParticles.length; i++) {
            orbParticles[i].update(frameCount);
            orbParticles[i].draw();
        }

        // --- Layer 3: Burst ---
        for (var i = burstParticles.length - 1; i >= 0; i--) {
            burstParticles[i].update();
            burstParticles[i].draw();
            if (burstParticles[i].life <= 0) {
                burstParticles.splice(i, 1);
            }
        }

        // --- Layer 4: Trail ---
        for (var i = trailParticles.length - 1; i >= 0; i--) {
            trailParticles[i].update();
            trailParticles[i].draw();
            if (trailParticles[i].life <= 0) {
                trailParticles.splice(i, 1);
            }
        }

        // --- Layer 5: Shooting stars ---
        var now = Date.now();
        if (now > nextStarTime) {
            shootingStars.push(new ShootingStar());
            nextStarTime = now + rand(3000, 8000);
        }
        for (var i = shootingStars.length - 1; i >= 0; i--) {
            shootingStars[i].update();
            shootingStars[i].draw();
            if (shootingStars[i].life <= 0) {
                shootingStars.splice(i, 1);
            }
        }
    }

    /* ---------- Init ---------- */
    function boot() {
        initNet();
        initOrbs();
        animId = requestAnimationFrame(loop);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
