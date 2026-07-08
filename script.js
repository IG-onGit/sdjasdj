/* ==========================================================================
   Batsutsi the Forest Bird — interaction logic
   This file is only ever requested by the browser after index.html's
   access-gate script has validated the URL token. It never runs on its own.
   ========================================================================== */

(function () {
  'use strict';

  var GUIDE_SEEN_KEY = 'squishy_bird_guide_seen_v1';
  var HINT_EVERY = 3;

  var stage = document.querySelector('.stage');
  var image = document.getElementById('bird-image');
  var cheekBtn = document.getElementById('cheek-hit');
  var fxLayer = document.getElementById('fx-layer');
  var guide = document.getElementById('guide');
  var guideDismiss = document.getElementById('guide-dismiss');
  var countEl = document.getElementById('squish-count');
  var muteBtn = document.getElementById('mute-btn');
  var audioBird = document.getElementById('audio-bird');
  var audioHint = document.getElementById('audio-hint');
  
  var clickHint = document.getElementById('click-hint');
  var hintText = clickHint ? clickHint.querySelector('.hint-text') : null;

  if (!cheekBtn || !image) return; // markup not ready, bail safely

  var squishCount = 0;
  var muted = false;
  var particles = ['💗', '✨', '🌸', '💫'];

  // ---- onboarding guide -------------------------------------------------
  var alreadySeenGuide = false;
  try { alreadySeenGuide = localStorage.getItem(GUIDE_SEEN_KEY) === '1'; } catch (e) { /* ignore */ }

  if (alreadySeenGuide) {
    if (guide) guide.hidden = true;
    if (clickHint) clickHint.classList.add('hidden'); // Hide floating hint if returning
  } else if (stage) {
    stage.classList.add('is-onboarding');
  }

  function dismissGuide() {
    if (guide) guide.hidden = true;
    if (stage) stage.classList.remove('is-onboarding');
    try { localStorage.setItem(GUIDE_SEEN_KEY, '1'); } catch (e) { /* ignore */ }
  }

  if (guideDismiss) guideDismiss.addEventListener('click', dismissGuide);

  // ---- sound helpers -----------------------------------------------------
  function playSound(el) {
    if (muted || !el) return;
    try {
      var node = el.cloneNode(true);
      node.volume = el.volume;
      node.play().catch(function () { /* autoplay may be blocked until first gesture */ });
    } catch (e) { /* ignore playback errors */ }
  }

  if (muteBtn) {
    muteBtn.addEventListener('click', function () {
      muted = !muted;
      muteBtn.setAttribute('aria-pressed', String(muted));
      muteBtn.innerHTML = muted ? '🔇 <span>Sound off</span>' : '🔊 <span>Sound on</span>';
    });
  }

  // ---- particle burst ------------------------------------------------------
  function burstParticles(x, y) {
    if (!fxLayer) return;
    var count = 5;
    for (var i = 0; i < count; i++) {
      var span = document.createElement('span');
      span.className = 'fx-particle';
      span.textContent = particles[Math.floor(Math.random() * particles.length)];
      var offsetX = (Math.random() - 0.5) * 40;
      span.style.left = (x + offsetX) + 'px';
      span.style.top = y + 'px';
      span.style.animationDelay = (Math.random() * 0.08) + 's';
      fxLayer.appendChild(span);
      (function (node) {
        setTimeout(function () { node.remove(); }, 1000);
      })(span);
    }
  }

  // ---- squish handler ------------------------------------------------------
  function squish(clientPoint) {
    dismissGuide();

    image.classList.remove('squish');
    // force reflow so the animation can restart on rapid clicks
    void image.offsetWidth;
    image.classList.add('squish');

    if (clientPoint) {
      var rect = (stage || cheekBtn).getBoundingClientRect();
      burstParticles(clientPoint.x - rect.left, clientPoint.y - rect.top);
    }

    squishCount += 1;

    // Handle the animated hint text logic
    if (clickHint && !clickHint.classList.contains('hidden')) {
      if (squishCount === 1) {
        hintText.textContent = 'Again!'; // Change text after first click
      } else if (squishCount >= 6) {
        clickHint.classList.add('hidden'); // Fade out after 6 total clicks (1 initial + 5 "Again"s)
      }
    }

    if (countEl) {
      countEl.textContent = String(squishCount);
      countEl.classList.remove('bump');
      void countEl.offsetWidth;
      countEl.classList.add('bump');
    }

    playSound(audioBird);
    if (squishCount % HINT_EVERY === 0) {
      // slight stagger so the two chirps are both audible
      setTimeout(function () { playSound(audioHint); }, 120);
    }
  }

  cheekBtn.addEventListener('click', function (evt) {
    squish({ x: evt.clientX, y: evt.clientY });
  });

  cheekBtn.addEventListener('keydown', function (evt) {
    if (evt.key === 'Enter' || evt.key === ' ' || evt.key === 'Spacebar') {
      evt.preventDefault();
      var rect = cheekBtn.getBoundingClientRect();
      squish({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
  });

  image.addEventListener('animationend', function () {
    image.classList.remove('squish');
  });
})();
