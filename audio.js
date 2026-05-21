'use strict';
/**
 * audio.js — The Turrelle Sisters Big Munny
 * Hybrid: real MP3/WAV files + Web Audio API synthesis
 *
 * FILE MAP:
 *   theme_music.mp3      → base game background loop
 *   red_spin_music.mp3   → red spin bonus loop
 *   pick_music.mp3       → pick & choose AND hold & spin background loop
 *   hold_spin_trigger.wav→ hold & spin trigger (6 coins)
 *   hold_spin_end.mp3    → hold & spin end fanfare
 *   credits_addup.wav    → credit rollup tick
 *   pick_reveal.wav      → pick & choose tile reveal
 *   splash_welcome.wav   → splash screen welcome (on tap)
 *   ring1.mp3            → bell (jackpots, red spin entry, win bells)
 */

const Audio = (() => {
  let ctx = null, masterGain = null;
  let muted = false, volumeLevel = 0.70;

  // Background loop nodes
  let bgLoop = null, redLoop = null, holdLoop = null, pickLoop = null;
  let jpBellTimer = null;

  // MP3/WAV element pool
  const mp3 = {};

  // ── INIT ─────────────────────────────────────────────────────────
  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = volumeLevel;
      masterGain.connect(ctx.destination);
    } catch(e) { console.warn('[Audio] WebAudio init failed:', e); }

    // Load all audio files
    _load('ring1',          'assets/audio/ring1.mp3');
    _load('theme',          'assets/audio/theme_music.mp3',       true);  // loop
    _load('red_spin',       'assets/audio/red_spin_music.mp3',    true);  // loop
    _load('pick_bg',        'assets/audio/pick_music.mp3',        true);  // loop
    _load('hold_trigger',   'assets/audio/hold_spin_trigger.wav');
    _load('hold_end',       'assets/audio/hold_spin_end.mp3');
    _load('credits_addup',  'assets/audio/credits_addup.wav');
    _load('pick_reveal',    'assets/audio/pick_reveal.wav');
    _load('splash_welcome', 'assets/audio/splash_welcome.wav');
  }

  function _load(key, src, loop) {
    if (loop === undefined) loop = false;
    try {
      const el = document.createElement('audio');
      el.src = src;
      el.preload = 'auto';
      el.loop = loop;
      el.volume = volumeLevel;
      mp3[key] = el;
    } catch(e) { console.warn('[Audio] Load failed:', key, e); }
  }

  // Play an MP3 element — returns the playing element
  function _play(key, vol) {
    if (vol === undefined) vol = 1.0;
    const el = mp3[key];
    if (!el || muted) return null;
    try {
      // For non-looping sounds, clone so overlapping plays work
      const clone = el.loop ? el : el.cloneNode();
      clone.volume = Math.min(1, volumeLevel * vol);
      clone.play().catch(() => {});
      return clone;
    } catch(e) { return null; }
  }

  // ── VOLUME / MUTE ─────────────────────────────────────────────────
  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function setVolume(v) {
    volumeLevel = Math.max(0, Math.min(1, v));
    if (masterGain) masterGain.gain.value = muted ? 0 : volumeLevel * 0.85;
    Object.values(mp3).forEach(function(el) {
      if (!el) return;
      if (el === mp3['theme']) {
        el.volume = volumeLevel * 0.40;
      } else {
        el.volume = muted ? 0 : Math.min(1, volumeLevel * 0.40);
      }
    });
  }

  function setMuted(v) {
    muted = v;
    if (masterGain) masterGain.gain.value = v ? 0 : volumeLevel * 0.85;
    Object.values(mp3).forEach(el => { if (el) el.volume = v ? 0 : volumeLevel; });
  }

  function getMuted() { return muted; }

  function toggleMute() {
    muted = !muted;
    setMuted(muted);
    return muted;
  }

  // ── WEB AUDIO SYNTH HELPERS ───────────────────────────────────────
  function _tone(freq, type, t0, t1, vol, endVol) {
    if (vol === undefined) vol = 0.35;
    if (endVol === undefined) endVol = 0.001;
    if (!ctx || muted) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol * volumeLevel, t0);
    g.gain.exponentialRampToValueAtTime(endVol, t1);
    o.connect(g); g.connect(masterGain);
    o.start(t0); o.stop(t1);
  }

  function _noise(dur, t0, vol, freq) {
    if (vol === undefined) vol = 0.2;
    if (freq === undefined) freq = 800;
    if (!ctx || muted) return;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * volumeLevel, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(bp); bp.connect(g); g.connect(masterGain);
    src.start(t0); src.stop(t0 + dur);
  }

  // ── BELL SYSTEM ──────────────────────────────────────────────────
  // Rules (all denoms, cash value):
  //   Any bonus triggered  → 1 ring  (call playBellsForBonus)
  //   $10–$49.99 win       → 1 ring
  //   $50–$99.99 win       → 2 rings
  //   $100–$999.99 win     → 3 rings
  //   $1,000+ win          → 10 rings
  //   Bonus + big win      → higher rule only (no stacking)
  //   Rings play back-to-back with no gap
  function playBellsForWin(winAmount) {
    if (muted || winAmount <= 0) return;

    var ringCount = 0;
    if      (winAmount >= 1000) ringCount = 10;
    else if (winAmount >= 100)  ringCount = 3;
    else if (winAmount >= 50)   ringCount = 2;
    else if (winAmount >= 10)   ringCount = 1;

    if (ringCount === 0) return;

    for (var i = 0; i < ringCount; i++) {
      (function(idx) {
        setTimeout(function() { _play('ring1', 0.55); }, idx * 0);
      })(i);
    }
  }

  // Call this when any bonus is triggered (Hold & Spin, Pick & Choose, Red Spin, BONUS)
  // Only rings once; if a big win also fires, the win bells take precedence
  function playBellsForBonus() {
    if (muted) return;
    _play('ring1', 0.55);
  }

  // Rapid jackpot bells
  function startJackpotBells() {
    stopJackpotBells();
    jpBellTimer = setInterval(() => _play('ring1', 0.40), 150);
  }

  function stopJackpotBells() {
    if (jpBellTimer) { clearInterval(jpBellTimer); jpBellTimer = null; }
  }

  // ── INDIVIDUAL SOUND EVENTS ───────────────────────────────────────
  const sounds = {

    spin() {
      // Reel spin whoosh — synthesized
      if (!ctx) return;
      const t = ctx.currentTime;
      _noise(0.06, t, 0.25, 1100);
      _tone(250, 'sawtooth', t, t + 0.15, 0.08, 0.001);
    },

    reel_stop() {
      // Each reel stops — short thud
      if (!ctx) return;
      const t = ctx.currentTime;
      _tone(160, 'square', t, t + 0.04, 0.25, 0.01);
      _noise(0.04, t, 0.15, 350);
    },

    win_small() {
      // Small win — 3 note chime
      if (!ctx) return;
      const t = ctx.currentTime;
      [523, 659, 784].forEach((f, i) =>
        _tone(f, 'sine', t + i * 0.1, t + i * 0.1 + 0.2, 0.30, 0.001));
    },

    win_big() {
      // Big win — ascending fanfare + bell
      if (!ctx) return;
      const t = ctx.currentTime;
      [392, 523, 659, 784, 1047].forEach((f, i) =>
        _tone(f, 'sine', t + i * 0.09, t + i * 0.09 + 0.3, 0.38, 0.001));
      setTimeout(() => _play('ring1', 0.40), 500);
    },

    button_click() {
      if (!ctx) return;
      _tone(600, 'sine', ctx.currentTime, ctx.currentTime + 0.05, 0.18, 0.001);
    },

    // Red Spin entry — Ring1 triple clang + siren sweep
    red_spin_entry() {
      _play('ring1', 0.45);
      setTimeout(() => _play('ring1', 0.40), 270);
      setTimeout(() => _play('ring1', 0.35), 520);
      if (ctx) {
        const t = ctx.currentTime + 0.6;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(200, t);
        o.frequency.exponentialRampToValueAtTime(900, t + 0.35);
        g.gain.setValueAtTime(0.28 * volumeLevel, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        o.connect(g); g.connect(masterGain);
        o.start(t); o.stop(t + 0.35);
      }
    },

    // Each Red Spin win flash — single ring
    red_spin_win() {
      _play('ring1', 0.35);
    },

    // Red Spin end sweep
    red_spin_sweep() {
      _play('ring1', 0.38);
      if (!ctx) return;
      const t = ctx.currentTime + 0.15;
      for (let i = 0; i < 6; i++) {
        _tone(350 + i * 80, 'sine', t + i * 0.055, t + i * 0.055 + 0.1, 0.20, 0.001);
      }
    },

    // Hold & Spin trigger — use uploaded file
    hold_spin_trigger() {
      _play('hold_trigger', 0.40);
    },

    // Coin landing on board — generic thud (coin 7+)
    hold_spin_land() {
      if (!ctx) return;
      const t = ctx.currentTime;
      _tone(280, 'square', t, t + 0.04, 0.30, 0.01);
      _noise(0.08, t, 0.20, 450);
      _tone(560, 'triangle', t, t + 0.12, 0.15, 0.001);
    },

    // Coins #1–5 landing — high-pitched chime ding
    hold_spin_coin_chime() {
      if (!ctx) return;
      const t = ctx.currentTime;
      _tone(1760, 'sine',     t,        t + 0.18, 0.28, 0.001); // high A6
      _tone(2217, 'sine',     t,        t + 0.12, 0.14, 0.001); // C#7 overtone
      _noise(0.04,            t, 0.06, 2400);
    },

    // Coin #6 — heavy slam thud + electric crack
    hold_spin_coin_slam() {
      if (!ctx) return;
      const t = ctx.currentTime;
      _tone(80,  'sawtooth',  t,        t + 0.18, 0.55, 0.001);
      _tone(55,  'square',    t,        t + 0.22, 0.45, 0.001);
      _noise(0.20,            t, 0.50, 180);
      _noise(0.06,            t + 0.02, 0.35, 3200); // electric crack
      _tone(440, 'square',    t + 0.02, t + 0.06, 0.20, 0.001);
      _tone(880, 'triangle',  t + 0.08, t + 0.28, 0.18, 0.001); // shimmer
    },

    // ── H&S RESPIN ESCALATING AUDIO ─────────────────────────────────────
    // respinNum = total respin count (1, 2, 3...); counterVal = display counter (3, 2, 1)
    // Escalates from calm → tense → frantic as counter drops and respins accumulate
    holdSpinRespin(respinNum, counterVal) {
      if (!ctx) return;
      const t = ctx.currentTime;
      if (counterVal === 1) {
        // FRANTIC — last spin, maximum tension
        _tone(880,  'square',   t,        t + 0.06, 0.30, 0.001);
        _tone(1320, 'square',   t + 0.04, t + 0.10, 0.25, 0.001);
        _tone(1760, 'triangle', t + 0.08, t + 0.16, 0.22, 0.001);
        _noise(0.03,            t + 0.02, 0.18, 2800);
        _noise(0.03,            t + 0.12, 0.15, 3200);
      } else if (respinNum >= 4 || counterVal === 2) {
        // TENSE — later respins or penultimate counter
        _tone(660,  'square',   t,        t + 0.08, 0.22, 0.001);
        _tone(990,  'triangle', t + 0.05, t + 0.14, 0.18, 0.001);
        _noise(0.025,           t,        0.12, 2000);
      } else {
        // CALM — early respins
        _tone(440, 'triangle', t,        t + 0.10, 0.16, 0.001);
        _tone(660, 'sine',     t + 0.06, t + 0.16, 0.12, 0.001);
      }
    },

    // Hold & Spin end — use uploaded fanfare file
    hold_spin_end() {
      _play('hold_end', 0.40);
    },

    // Credits counting up — use uploaded file
    coin_drop() {
      _play('credits_addup', 0.35);
    },

    // Pick & Choose tile reveal — use uploaded file
    pick_reveal() {
      _play('pick_reveal', 0.38);
    },

    // Pick & Choose match — ring + chime
    pick_match() {
      _play('ring1', 0.38);
      if (!ctx) return;
      const t = ctx.currentTime + 0.1;
      [523, 659, 784].forEach((f, i) =>
        _tone(f, 'sine', t + i * 0.1, t + i * 0.1 + 0.28, 0.38, 0.001));
    },

    // Pick trigger
    pick_trigger() {
      _play('ring1', 0.38);
    },

    // BONUS letter feature trigger — ring + ascending 5-note chime (one note per letter)
    bonus_trigger() {
      _play('ring1', 0.42);
      if (!ctx) return;
      const t = ctx.currentTime + 0.15;
      [523, 659, 784, 988, 1047].forEach(function(f, i) {
        _tone(f, 'sine', t + i * 0.1, t + i * 0.1 + 0.25, 0.32, 0.001);
      });
    },

    // Jackpot sounds — escalating with Ring1 bells
    jackpot_mini() {
      _play('ring1', 0.38);
      if (!ctx) return;
      const t = ctx.currentTime;
      [523, 659, 784, 1047].forEach((f, i) =>
        _tone(f, 'sine', t + i * 0.1, t + i * 0.1 + 0.28, 0.38, 0.001));
    },

    jackpot_minor() {
      _play('ring1', 0.40);
      setTimeout(() => _play('ring1', 0.38), 300);
      if (!ctx) return;
      const t = ctx.currentTime;
      [392, 494, 587, 740, 880].forEach((f, i) =>
        _tone(f, 'sine', t + i * 0.1, t + i * 0.1 + 0.35, 0.42, 0.001));
    },

    jackpot_major() {
      _play('ring1', 0.42);
      setTimeout(() => _play('ring1', 0.40), 250);
      setTimeout(() => _play('ring1', 0.38), 500);
      if (!ctx) return;
      const t = ctx.currentTime;
      [261, 329, 392, 523, 659, 784, 1047].forEach((f, i) =>
        _tone(f, 'sine', t + i * 0.09, t + i * 0.09 + 0.40, 0.44, 0.001));
    },

    jackpot_grand() {
      // Grand jackpot — maximum drama
      _play('ring1', 0.45);
      setTimeout(() => _play('ring1', 0.43), 200);
      setTimeout(() => _play('ring1', 0.40), 400);
      setTimeout(() => startJackpotBells(), 600);
      if (!ctx) return;
      const t = ctx.currentTime;
      _noise(0.3, t, 0.35, 500);
      [130, 164, 196, 261, 329, 392, 523, 659, 784, 1047].forEach((f, i) =>
        _tone(f, 'sine', t + i * 0.07, t + i * 0.07 + 0.45, 0.46, 0.001));
    },

    // Splash welcome — handled separately (see playSplashWelcome)
    splash_welcome() {
      _play('splash_welcome', 1.0);
    },
  };

  function play(name) {
    if (muted) return;
    resume();
    try { if (sounds[name]) sounds[name](); }
    catch(e) { console.warn('[Audio] Sound error:', name, e); }
  }

  // ── SPLASH WELCOME — play and return duration promise ─────────────
  // Returns a Promise that resolves when the sound finishes
  function playSplashWelcome() {
    return new Promise(resolve => {
      const el = mp3['splash_welcome'];
      if (!el || muted) { resolve(); return; }
      resume();
      try {
        el.currentTime = 0;
        el.volume = Math.min(1, volumeLevel * 0.40);
        el.play().catch(() => { resolve(); return; });
        el.onended = () => resolve();
        // Safety timeout in case onended doesn't fire
        setTimeout(resolve, 8000);
      } catch(e) { resolve(); }
    });
  }

  // ── BACKGROUND MUSIC LOOPS ────────────────────────────────────────
  function startAmbientMusic() {
    if (bgLoop) return;
    const el = mp3['theme'];
    if (!el || muted) return;
    resume();
    try {
      el.volume = volumeLevel * 0.40; // Theme — main reference level
      el.currentTime = 0;
      el.play().catch(() => {});
      bgLoop = el;
    } catch(e) {}
  }

  function stopAmbientMusic() {
    if (!bgLoop) return;
    try { bgLoop.pause(); bgLoop.currentTime = 0; } catch(e) {}
    bgLoop = null;
  }

  function startRedSpinMusic() {
    stopAmbientMusic();
    if (redLoop) return;
    const el = mp3['red_spin'];
    if (!el || muted) return;
    try {
      el.volume = volumeLevel * 0.40;
      el.currentTime = 0;
      el.play().catch(() => {});
      redLoop = el;
    } catch(e) {}
  }

  function stopRedSpinMusic() {
    if (!redLoop) return;
    try { redLoop.pause(); redLoop.currentTime = 0; } catch(e) {}
    redLoop = null;
    startAmbientMusic();
  }

  function startHoldSpinMusic() {
    stopAmbientMusic();
    if (holdLoop) return;
    const el = mp3['pick_bg']; // Same file as pick & choose per spec
    if (!el || muted) return;
    try {
      const clone = el.cloneNode();
      clone.loop = false; // Play ONCE on bonus activation — not looped
      clone.volume = volumeLevel * 0.40;
      clone.play().catch(function() {});
      holdLoop = clone;
    } catch(e) {}
  }

  function stopHoldSpinMusic() {
    if (!holdLoop) return;
    try { holdLoop.pause(); } catch(e) {}
    holdLoop = null;
    startAmbientMusic();
  }

  function startPickMusic() {
    stopAmbientMusic();
    if (pickLoop) return;
    const el = mp3['pick_bg'];
    if (!el || muted) return;
    try {
      const clone = el.cloneNode();
      clone.loop = false; // Play ONCE on bonus activation — not looped
      clone.volume = volumeLevel * 0.40;
      clone.play().catch(function() {});
      pickLoop = clone;
    } catch(e) {}
  }

  function stopPickMusic() {
    if (!pickLoop) return;
    try { pickLoop.pause(); } catch(e) {}
    pickLoop = null;
    startAmbientMusic();
  }

  return {
    init, resume, setVolume, setMuted, getMuted, toggleMute,
    play, playBellsForWin, playBellsForBonus, playSplashWelcome,
    startJackpotBells, stopJackpotBells,
    startAmbientMusic, stopAmbientMusic,
    startRedSpinMusic, stopRedSpinMusic,
    startHoldSpinMusic, stopHoldSpinMusic,
    holdSpinRespin: function(respinNum, counterVal) {
      if (sounds.holdSpinRespin) sounds.holdSpinRespin(respinNum, counterVal);
    },
    startPickMusic, stopPickMusic,
  };
})();
