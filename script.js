/* ==========================================================================
   YOURKING — script.js
   Vanilla JS + GSAP + ScrollTrigger + Three.js + Lenis
   ========================================================================== */
(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  gsap.registerPlugin(ScrollTrigger);

  /* ------------------------------------------------------------------------
     0. Utilities
     ------------------------------------------------------------------------ */
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, n) => a + (b - a) * n;

  /* ------------------------------------------------------------------------
     1. Smooth scroll (Lenis)
     ------------------------------------------------------------------------ */
  let lenis = null;
  function initLenis() {
    if (prefersReducedMotion || typeof Lenis === 'undefined') return;
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ------------------------------------------------------------------------
     2. Loader
     ------------------------------------------------------------------------ */
  function initLoader(onComplete) {
    const loader = document.getElementById('loader');
    const percentEl = document.getElementById('loaderPercent');
    const ring = document.querySelector('.loader__ring-progress');
    const circumference = 2 * Math.PI * 46;

    if (ring) {
      ring.style.strokeDasharray = `${circumference}`;
      ring.style.strokeDashoffset = `${circumference}`;
    }

    const counter = { val: 0 };
    gsap.to(counter, {
      val: 100,
      duration: prefersReducedMotion ? 0.3 : 2.2,
      ease: 'power2.inOut',
      onUpdate: () => {
        const v = Math.floor(counter.val);
        percentEl.textContent = v;
        if (ring) ring.style.strokeDashoffset = `${circumference - (circumference * v) / 100}`;
      },
      onComplete: () => {
        const tl = gsap.timeline({ onComplete });
        tl.to('.loader__crest, .loader__count, .loader__label', {
          opacity: 0, y: -16, duration: 0.5, ease: 'power2.in', stagger: 0.05,
        }).to(loader, {
          yPercent: -100, duration: 0.9, ease: 'power4.inOut',
        }, '-=0.1').set(loader, { display: 'none' });
      },
    });
  }

  /* ------------------------------------------------------------------------
     3. Custom cursor + trail particles
     ------------------------------------------------------------------------ */
  function initCursor() {
    if (isTouch) return;
    const cursor = document.getElementById('cursor');
    const canvas = document.getElementById('trailCanvas');
    const ctx = canvas.getContext('2d');
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    });

    const mouse = { x: w / 2, y: h / 2 };
    const pos = { x: w / 2, y: h / 2 };
    let particles = [];

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (Math.random() > 0.6) {
        particles.push({
          x: e.clientX, y: e.clientY,
          r: Math.random() * 2 + 0.6,
          life: 1,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
        });
      }
    });

    document.querySelectorAll('a, button, [data-magnetic], [data-tilt]').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-active'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
    });

    function raf() {
      pos.x = lerp(pos.x, mouse.x, 0.18);
      pos.y = lerp(pos.y, mouse.y, 0.18);
      cursor.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;

      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 215, 0, ${clamp(p.life, 0, 1) * 0.7})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      particles = particles.filter((p) => p.life > 0);

      requestAnimationFrame(raf);
    }
    raf();
  }

  /* ------------------------------------------------------------------------
     4. Magnetic buttons
     ------------------------------------------------------------------------ */
  function initMagnetic() {
    if (isTouch) return;
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const strength = 0.35;
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  /* ------------------------------------------------------------------------
     5. Ripple buttons
     ------------------------------------------------------------------------ */
  function initRipple() {
    document.querySelectorAll('.ripple-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height);
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 700);
      });
    });
  }

  /* ------------------------------------------------------------------------
     6. Navbar scroll state + burger menu
     ------------------------------------------------------------------------ */
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    ScrollTrigger.create({
      start: 'top -60',
      onUpdate: (self) => navbar.classList.toggle('is-scrolled', self.scroll() > 60),
    });

    const burger = document.getElementById('burgerBtn');
    const menu = document.getElementById('mobileMenu');
    burger.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(isOpen));
    });
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
      menu.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }));
  }

  /* ------------------------------------------------------------------------
     7. Scroll progress bar
     ------------------------------------------------------------------------ */
  function initScrollProgress() {
    const bar = document.getElementById('scrollProgressBar');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => { bar.style.width = `${self.progress * 100}%`; },
    });
  }

  /* ------------------------------------------------------------------------
     8. Three.js — Hero starfield + golden particles + light streaks
     ------------------------------------------------------------------------ */
  function initHeroScene() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 8;

    function resize() {
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    /* --- Starfield --- */
    const starCount = 900;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 30;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff, size: 0.035, transparent: true, opacity: 0.65, sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    /* --- Golden glowing particles --- */
    const goldCount = 160;
    const goldGeo = new THREE.BufferGeometry();
    const goldPos = new Float32Array(goldCount * 3);
    const goldSpeed = new Float32Array(goldCount);
    for (let i = 0; i < goldCount; i++) {
      goldPos[i * 3] = (Math.random() - 0.5) * 14;
      goldPos[i * 3 + 1] = (Math.random() - 0.5) * 9;
      goldPos[i * 3 + 2] = (Math.random() - 0.5) * 6;
      goldSpeed[i] = Math.random() * 0.4 + 0.15;
    }
    goldGeo.setAttribute('position', new THREE.BufferAttribute(goldPos, 3));

    const goldCanvas = document.createElement('canvas');
    goldCanvas.width = goldCanvas.height = 64;
    const gctx = goldCanvas.getContext('2d');
    const grad = gctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,235,150,1)');
    grad.addColorStop(0.4, 'rgba(255,215,0,.8)');
    grad.addColorStop(1, 'rgba(255,215,0,0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 64, 64);
    const goldTexture = new THREE.CanvasTexture(goldCanvas);

    const goldMat = new THREE.PointsMaterial({
      size: 0.22, map: goldTexture, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0.9,
    });
    const goldParticles = new THREE.Points(goldGeo, goldMat);
    scene.add(goldParticles);

    /* --- Light streaks (thin glowing planes) --- */
    const streaks = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const geo = new THREE.PlaneGeometry(0.02, Math.random() * 4 + 3);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffd700, transparent: true, opacity: Math.random() * 0.12 + 0.05,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 8, -3 - Math.random() * 3);
      mesh.rotation.z = Math.random() * Math.PI;
      streaks.add(mesh);
    }
    scene.add(streaks);

    /* --- Parallax on mouse --- */
    const targetRot = { x: 0, y: 0 };
    window.addEventListener('mousemove', (e) => {
      targetRot.x = (e.clientY / window.innerHeight - 0.5) * 0.12;
      targetRot.y = (e.clientX / window.innerWidth - 0.5) * 0.18;
    });

    const clock = new THREE.Clock();
    function animate() {
      const t = clock.getElapsedTime();

      stars.rotation.y = t * 0.01;
      goldParticles.rotation.y = t * 0.02;

      const positions = goldGeo.attributes.position.array;
      for (let i = 0; i < goldCount; i++) {
        positions[i * 3 + 1] += Math.sin(t * goldSpeed[i] + i) * 0.0025;
      }
      goldGeo.attributes.position.needsUpdate = true;

      streaks.children.forEach((s, i) => {
        s.material.opacity = 0.05 + Math.abs(Math.sin(t * 0.3 + i)) * 0.08;
      });

      camera.rotation.x = lerp(camera.rotation.x, targetRot.x, 0.04);
      camera.rotation.y = lerp(camera.rotation.y, targetRot.y, 0.04);

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    if (!prefersReducedMotion) animate();
    else renderer.render(scene, camera);
  }

  /* ------------------------------------------------------------------------
     9. Three.js — Finale ambient particles (lighter scene)
     ------------------------------------------------------------------------ */
  function initFinaleScene() {
    const canvas = document.getElementById('finaleCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 50);
    camera.position.z = 6;

    function resize() {
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    const count = 120;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffd700, size: 0.05, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    let visible = false;
    ScrollTrigger.create({
      trigger: canvas.parentElement,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => { visible = self.isActive; },
    });

    const clock = new THREE.Clock();
    function animate() {
      if (visible && !prefersReducedMotion) {
        const t = clock.getElapsedTime();
        points.rotation.y = t * 0.03;
        points.rotation.x = Math.sin(t * 0.1) * 0.05;
        renderer.render(scene, camera);
      }
      requestAnimationFrame(animate);
    }
    animate();
  }

  /* ------------------------------------------------------------------------
     10. Text splitting (letter-by-letter hero reveal + line reveals)
     ------------------------------------------------------------------------ */
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    const frag = document.createDocumentFragment();
    [...text].forEach((ch) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      frag.appendChild(span);
    });
    el.appendChild(frag);
    return el.querySelectorAll('.char');
  }

  function splitLines(el) {
    // Wrap existing <br>-separated content into line spans for staggered reveal
    const html = el.innerHTML.split('<br>');
    el.innerHTML = '';
    const lines = [];
    html.forEach((chunk, i) => {
      const wrap = document.createElement('span');
      wrap.style.display = 'block';
      wrap.style.overflow = 'hidden';
      const inner = document.createElement('span');
      inner.style.display = 'block';
      inner.innerHTML = chunk;
      wrap.appendChild(inner);
      el.appendChild(wrap);
      lines.push(inner);
    });
    return lines;
  }

  function initHeroTextReveal() {
    const titleEl = document.querySelector('.hero__title-line');
    if (!titleEl) return () => {};
    const chars = splitChars(titleEl);
    gsap.set(chars, { yPercent: 120, opacity: 0, rotateZ: 6 });

    return () => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl.to(chars, {
        yPercent: 0, opacity: 1, rotateZ: 0,
        duration: 1.1, stagger: 0.045,
      })
      .to('.hero__eyebrow, .hero__subhead, .hero__actions', {
        opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out',
      }, '-=0.6')
      .fromTo('.hero__scroll', { opacity: 0 }, { opacity: 1, duration: 0.8 }, '-=0.4');

      gsap.set('.hero__eyebrow, .hero__subhead, .hero__actions', { y: 24 });
      tl.eventCallback('onStart', () => {
        gsap.to('.hero__eyebrow, .hero__subhead, .hero__actions', { y: 0 });
      });
    };
  }

  /* ------------------------------------------------------------------------
     11. Scroll-triggered reveals
     ------------------------------------------------------------------------ */
  function initScrollReveals() {
    gsap.utils.toArray('[data-reveal]').forEach((el, i) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
        delay: (i % 4) * 0.06,
      });
    });

    gsap.utils.toArray('[data-split-lines]').forEach((el) => {
      const lines = splitLines(el);
      gsap.set(lines, { yPercent: 110 });
      gsap.to(lines, {
        yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.12,
        scrollTrigger: { trigger: el, start: 'top 80%' },
      });
    });

    // Doctrine parallax word emphasis
    gsap.utils.toArray('.pillar-card').forEach((card, i) => {
      gsap.fromTo(card, { y: 60, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: (i % 2) * 0.08,
        scrollTrigger: { trigger: card, start: 'top 88%' },
      });
    });

    // Section title/subtitle counter-fade for stats & finale headings handled by data-reveal already.

    // Marquee reveal
    gsap.fromTo('.marquee', { opacity: 0 }, {
      opacity: 1, duration: 1, scrollTrigger: { trigger: '.marquee', start: 'top 95%' },
    });
  }

  /* ------------------------------------------------------------------------
     12. Tilt effect for cards
     ------------------------------------------------------------------------ */
  function initTilt() {
    if (isTouch) return;
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      const maxTilt = 8;
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(card, {
          rotateX: -py * maxTilt, rotateY: px * maxTilt,
          transformPerspective: 700, duration: 0.4, ease: 'power2.out',
        });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power3.out' });
      });
    });
  }

  /* ------------------------------------------------------------------------
     13. Animated stat counters
     ------------------------------------------------------------------------ */
  function initCounters() {
    document.querySelectorAll('.stat__number').forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const isDecimal = el.dataset.decimal === 'true';
      const obj = { val: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: () => {
          gsap.to(obj, {
            val: target,
            duration: 2,
            ease: 'power2.out',
            onUpdate: () => {
              el.textContent = isDecimal
                ? obj.val.toFixed(1) + suffix
                : Math.floor(obj.val).toLocaleString() + suffix;
            },
          });
        },
      });
    });
  }

  /* ------------------------------------------------------------------------
     14. Infinite marquee (GSAP-driven, pauses on hover)
     ------------------------------------------------------------------------ */
  function initMarquee() {
    const track = document.querySelector('.marquee__track');
    if (!track) return;
    const distance = track.scrollWidth / 2;
    const tween = gsap.to(track, {
      x: -distance,
      duration: 22,
      ease: 'none',
      repeat: -1,
    });
    track.parentElement.addEventListener('mouseenter', () => gsap.to(tween, { timeScale: 0.15, duration: 0.6 }));
    track.parentElement.addEventListener('mouseleave', () => gsap.to(tween, { timeScale: 1, duration: 0.6 }));
  }

  /* ------------------------------------------------------------------------
     15. Misc: footer year, section fade transitions
     ------------------------------------------------------------------------ */
  function initMisc() {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Subtle cross-fade "page transition" feel between sections
    gsap.utils.toArray('section').forEach((sec) => {
      gsap.fromTo(sec, { autoAlpha: 0.001 }, {
        autoAlpha: 1, duration: 0.01, immediateRender: true,
      });
    });
  }

  /* ------------------------------------------------------------------------
     16. Boot sequence
     ------------------------------------------------------------------------ */
  function boot() {
    initLenis();
    initNavbar();
    initScrollProgress();
    initCursor();
    initMagnetic();
    initRipple();
    initTilt();
    initMarquee();
    initMisc();
    initHeroScene();
    initFinaleScene();

    const playHeroReveal = initHeroTextReveal();

    initLoader(() => {
      playHeroReveal();
      initScrollReveals();
      initCounters();
      ScrollTrigger.refresh();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
