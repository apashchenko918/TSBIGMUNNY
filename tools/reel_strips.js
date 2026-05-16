'use strict';
/**
 * tools/reel_strips.js — Turrelle Sisters Big Munny
 * ─────────────────────────────────────────────────
 * Standalone reel strip configuration.
 * Edit this file to adjust symbol distribution, then copy
 * REEL_FREQUENCIES back into paytable.js (or require this file there).
 *
 * Run a quick sanity check:
 *   node tools/reel_strips.js
 *
 * Symbol ID Reference:
 *   0  = Sisters   (top jackpot)
 *   1  = Josie     (wild ×4)
 *   2  = Sasha     (wild ×2)
 *   3  = Seven
 *   4  = Triple Bar
 *   5  = Double Bar
 *   6  = Single Bar
 *   7  = Cherry    (any-row special pay)
 *   8  = Lipstick  (Pick & Choose trigger on 5-oak payline)
 *   9  = Gold Coin (Hold & Spin trigger at 6+ anywhere)
 *   10 = Letter B  (BONUS reel 1 only)
 *   11 = Letter O  (BONUS reel 2 only)
 *   12 = Letter N  (BONUS reel 3 only)
 *   13 = Letter U  (BONUS reel 4 only)
 *   14 = Letter S  (BONUS reel 5 only)
 *   15 = Diamond
 *   16 = DJ Maxine
 *   17 = StrayPup
 *
 * Design rules:
 *   • Each reel must sum to REEL_SIZE (80)
 *   • BONUS letters (10-14) are reel-specific — one letter per reel only
 *   • All other paying symbols should be equal across reels (simplifies math)
 *   • Wilds (Josie=1, Sasha=2): keep identical counts across all reels
 */

const REEL_SIZE = 80;

// ─────────────────────────────────────────────────────────────────────────────
// REEL FREQUENCY TABLE
// Every paying symbol is evenly distributed across all 5 reels.
// BONUS letters are reel-specific (structural — they spell B-O-N-U-S).
//
// Symbol counts (same for all reels except the BONUS letter slot):
//   Sisters    (0):  1  — top jackpot, rare
//   Josie      (1):  2  — wild ×4
//   Sasha      (2):  2  — wild ×2
//   StrayPup  (17):  2
//   DJ Maxine (16):  2
//   Seven      (3):  6
//   Triple Bar (4):  6
//   Double Bar (5):  8
//   Single Bar (6):  6
//   Diamond   (15):  3
//   Cherry     (7):  4
//   Lipstick   (8): 14  — payline symbol; 5-oak triggers Pick & Choose
//   Gold Coin  (9): 14  — Hold & Spin trigger (6+ in grid)
//   BONUS ltr    : 10  — unique per reel (B/O/N/U/S)
//                  ──
//              Σ = 80  ✓
// ─────────────────────────────────────────────────────────────────────────────

const REEL_FREQUENCIES = [
  // Reel 1 — BONUS-B (id:10) | Σ=80
  { 0:1, 1:2, 2:2, 17:2, 16:2, 3:6, 4:6, 5:8, 6:6, 15:3, 7:4, 8:14, 9:14, 10:10 },

  // Reel 2 — BONUS-O (id:11) | Σ=80
  { 0:1, 1:2, 2:2, 17:2, 16:2, 3:6, 4:6, 5:8, 6:6, 15:3, 7:4, 8:14, 9:14, 11:10 },

  // Reel 3 — BONUS-N (id:12) | Σ=80
  { 0:1, 1:2, 2:2, 17:2, 16:2, 3:6, 4:6, 5:8, 6:6, 15:3, 7:4, 8:14, 9:14, 12:10 },

  // Reel 4 — BONUS-U (id:13) | Σ=80
  { 0:1, 1:2, 2:2, 17:2, 16:2, 3:6, 4:6, 5:8, 6:6, 15:3, 7:4, 8:14, 9:14, 13:10 },

  // Reel 5 — BONUS-S (id:14) | Σ=80
  { 0:1, 1:2, 2:2, 17:2, 16:2, 3:6, 4:6, 5:8, 6:6, 15:3, 7:4, 8:14, 9:14, 14:10 },
];

// ─────────────────────────────────────────────────────────────────────────────
// BUILD REEL STRIPS (Fisher-Yates shuffle, deterministic seed per reel)
// ─────────────────────────────────────────────────────────────────────────────
function buildReelStrips(frequencies) {
  return frequencies.map((freq, reelIdx) => {
    const strip = [];
    Object.entries(freq).forEach(([id, count]) => {
      for (let i = 0; i < count; i++) strip.push(parseInt(id));
    });
    if (strip.length !== REEL_SIZE) {
      throw new Error(`Reel ${reelIdx + 1} sums to ${strip.length}, expected ${REEL_SIZE}`);
    }
    // Deterministic LCG shuffle — same strips every load (game fairness)
    let seed = 0xBEEF1234 + reelIdx * 0x9E3779B9;
    const lcg = () => {
      seed = Math.imul(seed, 1664525) + 1013904223;
      return (seed >>> 0) / 0x100000000;
    };
    for (let i = strip.length - 1; i > 0; i--) {
      const j = Math.floor(lcg() * (i + 1));
      [strip[i], strip[j]] = [strip[j], strip[i]];
    }
    return strip;
  });
}

const REEL_STRIPS = buildReelStrips(REEL_FREQUENCIES);

// ─────────────────────────────────────────────────────────────────────────────
// SANITY CHECK — run with: node tools/reel_strips.js
// ─────────────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const SYMBOL_NAMES = {
    0:'Sisters', 1:'Josie', 2:'Sasha', 3:'Seven', 4:'TripleBar',
    5:'DoubleBar', 6:'SingleBar', 7:'Cherry', 8:'Lipstick', 9:'GoldCoin',
    10:'Ltr-B', 11:'Ltr-O', 12:'Ltr-N', 13:'Ltr-U', 14:'Ltr-S',
    15:'Diamond', 16:'DJMaxine', 17:'StrayPup',
  };

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log(  '║          REEL STRIP SANITY CHECK                    ║');
  console.log(  '╚══════════════════════════════════════════════════════╝\n');

  // Verify totals
  let allOk = true;
  REEL_FREQUENCIES.forEach((freq, i) => {
    const total = Object.values(freq).reduce((a, b) => a + b, 0);
    const ok = total === REEL_SIZE;
    if (!ok) allOk = false;
    console.log(`Reel ${i + 1}: ${ok ? '✓' : '✗ FAIL'} (${total}/${REEL_SIZE})`);
  });

  // Symbol distribution table
  console.log('\n── Symbol Distribution Across Reels ──────────────────');
  console.log(`${'Symbol'.padEnd(12)} ${'R1'.padStart(4)} ${'R2'.padStart(4)} ${'R3'.padStart(4)} ${'R4'.padStart(4)} ${'R5'.padStart(4)}  ${'Equal?'.padStart(6)}`);
  console.log('─'.repeat(55));

  const allIds = [...new Set(REEL_FREQUENCIES.flatMap(f => Object.keys(f).map(Number)))].sort((a,b)=>a-b);
  allIds.forEach(id => {
    const counts = REEL_FREQUENCIES.map(f => f[id] || 0);
    const equal = counts.every(c => c === counts[0]) ? '✓' : '≠';
    const name = (SYMBOL_NAMES[id] || `id:${id}`).padEnd(12);
    console.log(`${name} ${counts.map(c => String(c).padStart(4)).join(' ')}  ${equal.padStart(6)}`);
  });

  console.log('\n── Odds (per reel, single stop) ───────────────────────');
  [8, 9].forEach(id => {
    const name = SYMBOL_NAMES[id];
    const pcts = REEL_FREQUENCIES.map(f => ((f[id] || 0) / REEL_SIZE * 100).toFixed(1) + '%');
    console.log(`${name.padEnd(12)}: ${pcts.join(' | ')}`);
  });
  const lipstick5oak = Math.pow(14/80, 5);
  const goldCoin6in15 = 1 - [...Array(6)].reduce((sum, _, k) => {
    // P(exactly k coins in 15 cells) using binomial
    const p = 14/80;
    let binom = 1;
    for (let i = 0; i < k; i++) binom = binom * (15 - i) / (i + 1);
    return sum + binom * Math.pow(p, k) * Math.pow(1 - p, 15 - k);
  }, 0);
  console.log(`\nLipstick 5-oak (any payline): ~1 in ${Math.round(1/lipstick5oak).toLocaleString()}`);
  console.log(`Gold Coin 6-in-15 (Hold&Spin): ~1 in ${Math.round(1/goldCoin6in15).toLocaleString()}`);
  console.log(`BONUS 5-ltr same row: ~1 in ${Math.round(1/Math.pow(10/80,5)).toLocaleString()}`);

  console.log(`\n${allOk ? '✓ All reels valid.' : '✗ ERRORS FOUND — fix before deploying!'}\n`);
}

module.exports = { REEL_FREQUENCIES, REEL_STRIPS, REEL_SIZE, buildReelStrips };
