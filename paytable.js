'use strict';
/**
 * paytable.js — The Turrelle Sisters Big Munny v10
 * Classic casino-style math: higher volatility, more realistic RTP.
 * Red Spin more frequent; Lipstick (Pick&Choose) less frequent.
 */

// ═══════════════════════════════════════════════════════════════════════
// SYMBOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════
const SYMBOLS = {
  SISTERS:    { id:0,  name:'Sisters',   type:'png', file:'assets/sisters.png',              isWild:false, isScatter:false, isBonus:false },
  JOSIE:      { id:1,  name:'Josie',     type:'png', file:'assets/josie.png',                isWild:true,  isScatter:false, isBonus:false },
  SASHA:      { id:2,  name:'Sasha',     type:'png', file:'assets/sasha.png',                isWild:true,  isScatter:false, isBonus:false },
  SEVEN:      { id:3,  name:'Seven',     type:'svg', file:'assets/symbols/seven.svg',        isWild:false, isScatter:false, isBonus:false },
  TRIPLE_BAR: { id:4,  name:'3 Bar',     type:'svg', file:'assets/symbols/triple_bar.svg',   isWild:false, isScatter:false, isBonus:false },
  DOUBLE_BAR: { id:5,  name:'2 Bar',     type:'svg', file:'assets/symbols/double_bar.svg',   isWild:false, isScatter:false, isBonus:false },
  SINGLE_BAR: { id:6,  name:'1 Bar',     type:'svg', file:'assets/symbols/single_bar.svg',   isWild:false, isScatter:false, isBonus:false },
  LIPSTICK:   { id:8,  name:'Lipstick',  type:'svg', file:'assets/symbols/lipstick.svg',     isWild:false, isScatter:false, isBonus:true  }, // P&C trigger — 5-oak on center payline (Line 1, middle row)
  GOLD_COIN:  { id:9,  name:'GoldCoin',  type:'svg', file:'assets/symbols/gold_coin.svg',    isWild:false, isScatter:false, isBonus:true  },
  // BONUS letters — each only appears on its designated reel (reel index = 0-4)
  LETTER_B:   { id:10, name:'LetterB',   type:'svg', file:'assets/symbols/letter_b.svg',     isWild:false, isScatter:false, isBonus:false, isLetter:true, letter:'B', letterReel:0 },
  LETTER_O:   { id:11, name:'LetterO',   type:'svg', file:'assets/symbols/letter_o.svg',     isWild:false, isScatter:false, isBonus:false, isLetter:true, letter:'O', letterReel:1 },
  LETTER_N:   { id:12, name:'LetterN',   type:'svg', file:'assets/symbols/letter_n.svg',     isWild:false, isScatter:false, isBonus:false, isLetter:true, letter:'N', letterReel:2 },
  LETTER_U:   { id:13, name:'LetterU',   type:'svg', file:'assets/symbols/letter_u.svg',     isWild:false, isScatter:false, isBonus:false, isLetter:true, letter:'U', letterReel:3 },
  LETTER_S:   { id:14, name:'LetterS',   type:'svg', file:'assets/symbols/letter_s.svg',     isWild:false, isScatter:false, isBonus:false, isLetter:true, letter:'S', letterReel:4 },
  // NEW symbols — v6
  DIAMOND:    { id:15, name:'Diamond',   type:'svg', file:'assets/symbols/diamond.svg',      isWild:false, isScatter:false, isBonus:false },
  DJ_MAXINE:  { id:16, name:'DJ Maxine', type:'png', file:'assets/maxine.png',               isWild:false, isScatter:false, isBonus:false },
  STRAYPUP:   { id:17, name:'StrayPup',  type:'png', file:'assets/scott.png',                isWild:false, isScatter:false, isBonus:false },
};

const SYMBOL_BY_ID = Object.values(SYMBOLS).reduce((a,s) => { a[s.id]=s; return a; }, {});
const WILD_IDS     = [SYMBOLS.JOSIE.id, SYMBOLS.SASHA.id];
const SCATTER_ID   = null; // No scatter symbol — Lipstick is a bonus trigger, not a scatter
const BONUS_PC_ID  = SYMBOLS.LIPSTICK.id; // P&C trigger — 5-oak on center payline (Line 1, middle row)
const BONUS_ID     = SYMBOLS.GOLD_COIN.id;
const LETTER_IDS   = [10, 11, 12, 13, 14]; // B O N U S — one per reel
const LETTER_ORDER = ['B','O','N','U','S'];

// Partial pays × bet per line (left-to-right consecutive, same row)
// Full BONUS (all 5) triggers bonus feature — no credit pay
// BONUS letter pays — index = consecutive count from reel 1 (0=none, 1=B, 2=B-O, 3=B-O-N, 4=B-O-N-U)
// 5 letters on bottom row = BONUS trigger (no cash). 5 on any other row impossible by reel design (S bottom-row only).
const BONUS_LETTER_PAYS = [0, 20, 30, 40, 100]; // owner-confirmed 2026-05-19 // × betPerLine

// ═══════════════════════════════════════════════════════════════════════
// PAYTABLE — Classic casino style
// Format: [5-of-a-kind, 4-of-a-kind, 3-of-a-kind, 2-of-a-kind]
//
// Classic mapping for display:
//  5 Sisters  = GRAND JACKPOT
//  5 Josie/Sasha = MAJOR JACKPOT  
//  5 Seven    = 500× 
//  3 Bar      = 250×
//  2 Bar      = 100×
//  1 Bar      = 50×
//  Lipstick   = scatter / Pick & Choose trigger
//  Gold Coin  = Hold & Spin trigger
// ═══════════════════════════════════════════════════════════════════════
// ── PAY TABLE — Option G, MC-verified at 68.04% base game RTP ────────
// Total RTP target: ~94% (base ~68% + Hold&Spin ~11% + RedSpin ~5.5% + P&C ~9%)
// Wild multiplier system — points-based (owner-confirmed 2026-05-19):
// Josie = 2 points, Sasha = 1 point per wild in combo.
// 0pt = ×1 | 1pt = ×2 | 2pt = ×3 | 3pt+ = ×4
// These listed PAY_TABLE values are BASE pays; wild-boosted effective max = value × 4.
// Format: [5-oak, 4-oak, 3-oak, 2-oak] × bet/line
const PAY_TABLE = {
  // ── CHARACTER SYMBOLS (Jackpot triggers) ─────────────────────────
  SISTERS:    [   0,   0,    0,  0],  // GRAND jackpot symbol ONLY — payline hits = miss (no pay)
  JOSIE:      [ 400, 250,  100,  0],  // Wild — MINOR jackpot trigger (3+ consecutive from reel 1) — owner-confirmed 2026-05-19
  SASHA:      [ 400, 250,  100,  0],  // Wild — MINI jackpot trigger (3+ consecutive from reel 1) — owner-confirmed 2026-05-19
  // Josie + Sasha mix on any active payline = MAJOR jackpot trigger (handled in evaluateSpin)
  // ── SUPPORTING CHARACTERS ────────────────────────────────────────
  STRAYPUP:   [ 300, 250,  200,  0],  // owner-confirmed 2026-05-19
  DJ_MAXINE:  [ 200, 150,  100,  0],  // owner-confirmed 2026-05-19
  // ── MID-TIER SYMBOLS ─────────────────────────────────────────────
  SEVEN:      [  70,  60,   50,  0],  // owner-confirmed 2026-05-19
  DIAMOND:    [  50,  40,   30,  0],  // owner-confirmed 2026-05-19: below Single Bar in hierarchy
  // ── BAR SYMBOLS (min 3-oak on payline) ───────────────────────────
  TRIPLE_BAR: [  30,  25,   20,  0],  // owner-confirmed 2026-05-19
  DOUBLE_BAR: [  20,  16,   12,  0],  // owner-confirmed 2026-05-19
  SINGLE_BAR: [  12,   8,    4,  0],  // owner-confirmed 2026-05-18 (unchanged)
  // ── LIPSTICK (P&C bonus trigger — 5-oak on center payline only, no credit pay) ──
  LIPSTICK:   [   0,   0,    0,  0],  // owner-confirmed 2026-05-18: 5-oak center payline triggers Pick & Choose
};

// ═══════════════════════════════════════════════════════════════════════
// PAY_TABLE_BY_DENOM — per-denomination payline pay tables
// ═══════════════════════════════════════════════════════════════════════
// Each denom can override individual symbol pay values for RTP tuning.
// Format: { 'denom_as_2dp_string': { SYMBOL_KEY: [5oak,4oak,3oak,2oak] } }
//
// HOW TO USE (future phases):
//   Call getPayTableForDenom(denom) instead of PAY_TABLE wherever you need
//   denom-specific pays. Returns PAY_TABLE merged with any denom overrides.
//   Only list symbols that DIFFER from PAY_TABLE — others inherit automatically.
//
// CURRENT STATUS: scaffold only — all denoms return PAY_TABLE (no overrides yet)
// Log MC results here when overrides are added:
//   v6l92 — scaffold added, no overrides active
// ═══════════════════════════════════════════════════════════════════════

var PAY_TABLE_BY_DENOM = {
  // Example — not active yet. Uncomment and adjust per denom to tune RTP:
  // '0.01': {
  //   SEVEN:    [120, 55, 35, 0],  // tighter at 1¢
  //   STRAYPUP: [280, 180, 80, 0],
  // },
  // '1.00': {
  //   SEVEN:    [220, 90, 60, 0],  // looser at $1
  // },
};

// Returns the pay table for a given denomination.
// Merges denom-specific overrides onto PAY_TABLE symbol-by-symbol.
// denom: number (e.g. 0.05) or string (e.g. '0.05')
function getPayTableForDenom(denom) {
  var key = parseFloat(denom).toFixed(2);
  var overrides = PAY_TABLE_BY_DENOM[key];
  if (!overrides) return PAY_TABLE; // fast path — no overrides defined
  var merged = {};
  var symKeys = Object.keys(PAY_TABLE);
  for (var i = 0; i < symKeys.length; i++) {
    var sk = symKeys[i];
    merged[sk] = overrides[sk] ? overrides[sk].slice() : PAY_TABLE[sk].slice();
  }
  return merged;
}

// Mixed Bar: ANY mix of Single/Double/Triple Bar on any payline (3-5 consecutive from reel 1)
// v6k3 RTP tuning: reduced from 5/15/35 → 3/10/25
const MIXED_BAR_PAY = { 3: 5, 4: 10, 5: 15 }; // owner-confirmed 2026-05-18 (v6l57) — fixed × bet/line regardless of combination
const BAR_IDS = [SYMBOLS.TRIPLE_BAR.id, SYMBOLS.DOUBLE_BAR.id, SYMBOLS.SINGLE_BAR.id];

// Wild multiplier
const WILD_MULTIPLIERS = { 1: 2, 2: 3, 3: 4 }; // Points-based: Josie=2pts Sasha=1pt — 1pt=×2 2pt=×3 3pt+=×4 (owner-confirmed 2026-05-19)

// BONUS_PC_ID = Lipstick. 5-oak on center payline (Line 1, middle row) = Pick & Choose trigger.
// Lipstick pays [0,0,0,0] on all paylines — bonus trigger only (owner-confirmed 2026-05-18).

// ═══════════════════════════════════════════════════════════════════════
// REEL STRIPS — Casino-style distribution, 80 stops per reel
// ═══════════════════════════════════════════════════════════════════════
const REEL_SIZE = 80; // 80 stops per reel — all 5 reels must equal this

// Symbol ID key:
//   0=Sisters  1=Josie   2=Sasha    3=Seven   4=TripleBar
//   5=DoubleBar 6=SingleBar         8=Lipstick 9=GoldCoin
//   10=B  11=O  12=N  13=U  14=S   15=Diamond  16=DJMaxine  17=StrayPup
//
// CURRENT symbol counts per reel (base symbols identical; BONUS letter count varies per reel):
//   Sisters(0):1   Josie(1):2   Sasha(2):2   StrayPup(17):2
//   GoldCoin(9):10  Lipstick(8):12  Diamond(15):8
//   R1: DJMaxine(16):4  Seven(3):8  TripleBar(4):10  DoubleBar(5):11  SingleBar(6):8  B(10):2   Σ=80
//   R2: DJMaxine(16):4  Seven(3):8  TripleBar(4):10  DoubleBar(5):9   SingleBar(6):8  O(11):4   Σ=80
//   R3: DJMaxine(16):4  Seven(3):7  TripleBar(4):9   DoubleBar(5):10  SingleBar(6):7  N(12):6   Σ=80
//   R4: DJMaxine(16):4  Seven(3):7  TripleBar(4):9   DoubleBar(5):10  SingleBar(6):7  U(13):6   Σ=80
//   R5: DJMaxine(16):4  Seven(3):8  TripleBar(4):10  DoubleBar(5):9   SingleBar(6):8  S(14):4   Σ=80
//
// Non-paying stops (trigger-only): GoldCoin(10)+Lipstick(12) = 22/80 = 27.5% (+ letter varies 2–6)
// Paying symbol counts increased to compensate for reduced trigger symbols.
const REEL_FREQUENCIES = [
  // Reel 1 — BONUS-B (id:10) × 2 | Σ=80
  // v6l99: Lipstick(8) 12→32 (+20) for P&C trigger ~1-in-98 (half of H&S).
  // Reductions: Diamond(15) 3→0(-3), Josie(1) 2→1(-1), Straypup(17) 2→1(-1),
  //   DJ_Maxine(16) 4→2(-2), Seven(3) 8→5(-3), TripleBar(4) 10→7(-3),
  //   DoubleBar(5) 11→7(-4), SingleBar(6) 8→5(-3). Total removed: 20. Σ=80 ✅
  { 0:1, 1:1, 2:2, 17:1, 16:2, 3:5, 4:7, 5:7, 6:5, 15:0, 8:32, 9:15, 10:2 },

  // Reel 2 — BONUS-O (id:11) × 4 | Σ=80
  { 0:1, 1:1, 2:2, 17:1, 16:2, 3:5, 4:7, 5:5, 6:5, 15:0, 8:32, 9:15, 11:4 },

  // Reel 3 — BONUS-N (id:12) × 6 | Σ=80
  { 0:1, 1:1, 2:2, 17:1, 16:2, 3:4, 4:6, 5:6, 6:4, 15:0, 8:32, 9:15, 12:6 },

  // Reel 4 — BONUS-U (id:13) × 6 | Σ=80
  { 0:1, 1:1, 2:2, 17:1, 16:2, 3:4, 4:6, 5:6, 6:4, 15:0, 8:32, 9:15, 13:6 },

  // Reel 5 — BONUS-S (id:14) × 4 | Σ=80
  // S trigger enforcement is via bottom-row check in game.js (M4).
  { 0:1, 1:1, 2:2, 17:1, 16:2, 3:5, 4:7, 5:5, 6:5, 15:0, 8:32, 9:15, 14:4 },
];

function buildReelStrips(frequencies) {
  return frequencies.map(function(freq, reelIdx) {
    var strip = [];
    Object.entries(freq).forEach(function(_e) {
      var id = parseInt(_e[0]), count = _e[1];
      for (var i = 0; i < count; i++) strip.push(id);
    });
    if (strip.length !== REEL_SIZE) {
      console.error('Reel ' + (reelIdx+1) + ' frequency total is ' + strip.length + ', expected ' + REEL_SIZE);
    }
    var seed = 0xBEEF1234 + reelIdx * 0x9E3779B9;
    var lcg = function() {
      seed = Math.imul(seed, 1664525) + 1013904223;
      return (seed >>> 0) / 0x100000000;
    };
    for (var i = strip.length - 1; i > 0; i--) {
      var j = Math.floor(lcg() * (i + 1));
      var tmp = strip[i]; strip[i] = strip[j]; strip[j] = tmp;
    }

    // ── Minimum spacing enforcement ────────────────────────────────────
    // Prevents the same low-frequency symbol (≤12 per reel) from appearing
    // in adjacent stops — which causes two of the same symbol to show in the
    // 3-row visible window at once (e.g. two B's in column 1).
    // MIN_GAP=3 for most symbols. EXCEPTION: BONUS_ID (Gold Coin) uses MIN_GAP=1
    // so that multiple coins can appear in the 3-row window simultaneously,
    // making the 6-coin H&S trigger achievable. (v6l90 — MC verified ~1-in-40)
    var DEFAULT_GAP = 3;
    var len = strip.length;
    for (var pass = 0; pass < 8; pass++) {
      var moved = false;
      for (var si = 0; si < len; si++) {
        var sym = strip[si];
        var symCount = 0;
        for (var sc = 0; sc < len; sc++) { if (strip[sc] === sym) symCount++; }
        // Gold coins use gap=1 so multiple can appear in a 3-row window (H&S trigger fix)
        var MIN_GAP = (sym === BONUS_ID) ? 1 : DEFAULT_GAP;
        if (sym !== BONUS_ID && symCount > 12) continue; // only enforce on low-freq non-bonus symbols
        var tooClose = false;
        for (var g = 1; g <= MIN_GAP; g++) {
          if (strip[(si + g) % len] === sym || strip[(si - g + len) % len] === sym) {
            tooClose = true; break;
          }
        }
        if (!tooClose) continue;
        // Find a safe swap target
        for (var ti = 0; ti < len; ti++) {
          if (ti === si) continue;
          var ok = true;
          for (var g2 = 1; g2 <= MIN_GAP; g2++) {
            var fwd = (ti + g2) % len, bwd = (ti - g2 + len) % len;
            if ((strip[fwd] === sym && fwd !== si) || (strip[bwd] === sym && bwd !== si)) { ok = false; break; }
          }
          if (!ok) continue;
          var displaced = strip[ti];
          if (displaced === sym) continue;
          strip[ti] = sym; strip[si] = displaced;
          moved = true; break;
        }
      }
      if (!moved) break;
    }

    // ── REEL 5: S bottom-row enforcement is handled by game.js M4 check ─
    if (reelIdx === 4) { /* no-op — code trigger is authoritative */ }

    return strip;
  });
}

const REEL_STRIPS = buildReelStrips(REEL_FREQUENCIES);

// ═══════════════════════════════════════════════════════════════════════
// PAYLINES
// ═══════════════════════════════════════════════════════════════════════
// PAYLINES — VGT Neptune's Gold exact 20-line pattern set (matched 2026-05-16)
// Row index: 0=Top, 1=Middle, 2=Bottom. All lines pay Left-to-Right.
// 7 lines replaced from prior set to match Neptune's Gold exactly (Lines 10,11,14,15,18,19,20).
const PAYLINES = [
  [1,1,1,1,1], // Line  1 — Middle Row (straight)
  [0,0,0,0,0], // Line  2 — Top Row (straight)
  [2,2,2,2,2], // Line  3 — Bottom Row (straight)
  [0,1,2,1,0], // Line  4 — V-Shape (Top Corners → Bottom Center)
  [2,1,0,1,2], // Line  5 — Inverted V (Bottom Corners → Top Center)
  [1,0,1,0,1], // Line  6 — High Chevron (Wavy Mountain)
  [0,1,0,1,0], // Line  7 — Low Chevron (Wavy Valley)
  [0,1,1,1,0], // Line  8 — Top-to-Middle Drop
  [2,1,1,1,2], // Line  9 — Bottom-to-Middle Rise
  [1,2,0,2,1], // Line 10 — M-Shape ★ NEW (Neptune's Gold)
  [1,0,2,0,1], // Line 11 — W-Shape ★ NEW (Neptune's Gold)
  [0,0,1,0,0], // Line 12 — Top / Middle Wave
  [2,2,1,2,2], // Line 13 — Bottom / Middle Wave
  [1,1,0,0,0], // Line 14 — Zig-Zag Step Up ★ NEW (Neptune's Gold)
  [0,0,1,1,1], // Line 15 — Zig-Zag Step Down ★ NEW (Neptune's Gold)
  [1,0,0,0,1], // Line 16 — Mountain Top Flat
  [1,2,2,2,1], // Line 17 — Valley Floor Flat
  [2,1,1,0,0], // Line 18 — Snake Up ★ NEW (Neptune's Gold)
  [0,1,1,2,2], // Line 19 — Snake Down ★ NEW (Neptune's Gold)
  [1,0,1,2,1], // Line 20 — Center Bridge ★ NEW (Neptune's Gold)
];

const LINE_PRESETS = [1, 5, 10, 15, 20];

// Human-readable payline pattern names — matches PAYLINES order (index 0 = Line 1)
const PAYLINE_NAMES = [
  'Middle Row',        // Line  1
  'Top Row',           // Line  2
  'Bottom Row',        // Line  3
  'V-Shape',           // Line  4
  'Inverted V',        // Line  5
  'High Chevron',      // Line  6
  'Low Chevron',       // Line  7
  'Top Drop',          // Line  8
  'Bottom Rise',       // Line  9
  'M-Shape',           // Line 10
  'W-Shape',           // Line 11
  'Top Wave',          // Line 12
  'Bottom Wave',       // Line 13
  'Step Up',           // Line 14
  'Step Down',         // Line 15
  'Mountain Top',      // Line 16
  'Valley Floor',      // Line 17
  'Snake Up',          // Line 18
  'Snake Down',        // Line 19
  'Center Bridge',     // Line 20
];

// ═══════════════════════════════════════════════════════════════════════
// BET CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════
// MLMC BET STRUCTURE — Aristocrat VGT style (Hunt for Neptune's Gold)
// Total Bet = Denomination × Credits Per Line × Lines Active
// Win Cash  = Credits Won × Credits Per Line × Denomination
// ═══════════════════════════════════════════════════════════════════════

// Denominations in dollars
const DENOMINATIONS   = [0.01, 0.02, 0.05, 0.10, 0.25, 0.50, 1.00, 2.00, 3.00, 5.00]; // $10/$20 removed v6l94
const DENOM_LABELS    = ['1¢', '2¢', '5¢', '10¢', '25¢', '50¢', '$1', '$2', '$3', '$5']; // $10/$20 removed v6l94
const DEFAULT_DENOM   = 0.05; // 5¢ default

// Credits per line options (Aristocrat style — skips 4, skips 6-9)
const CREDITS_PER_LINE_OPTIONS = [1, 2, 3, 5]; // J3: max credits/line = 5 (max bet = denom × 5 × 20)
const DEFAULT_CREDITS_PER_LINE = 1;

// Lines (unchanged)
const DEFAULT_LINES   = 5;  // owner-confirmed 2026-05-18: minimum 5 lines, default start 5
const DEFAULT_BALANCE = 500.00;

// Legacy — kept for compatibility with existing code that references BET_INCREMENTS
// In MLMC mode, actual bet = denom × creditsPerLine × lines
const BET_INCREMENTS  = [0.01, 0.02, 0.05, 0.10, 0.25, 0.50, 1.00];
const DEFAULT_BET     = DEFAULT_DENOM;

// Helper: calculate total bet from MLMC parameters
function calcTotalBet(denom, creditsPerLine, lines) {
  return Math.round(denom * creditsPerLine * lines * 100) / 100;
}

// Helper: calculate cash win from credits won
// Win Cash = Credits Won × Credits Per Line × Denomination
function calcWinCash(creditsWon, creditsPerLine, denom) {
  return Math.round(creditsWon * creditsPerLine * denom * 100) / 100;
}

// Min/max total bets
const MIN_TOTAL_BET = calcTotalBet(0.01, 1,  1);   // $0.01
const MAX_TOTAL_BET = calcTotalBet(5.00, 5, 20);  // $500.00 — $10/$20 denoms removed v6l94

// ═══════════════════════════════════════════════════════════════════════
// PROGRESSIVE JACKPOT
// ═══════════════════════════════════════════════════════════════════════
const JACKPOT_CONFIG = {
  MINI:  { seed: 50.00,    label: 'MINI',  color: '#a8d8ea' },
  MINOR: { seed: 150.00,   label: 'MINOR', color: '#c9f0a0' },
  MAJOR: { seed: 500.00,   label: 'MAJOR', color: '#f5d878' },
  GRAND: { seed: 5000.00,  label: 'GRAND', color: '#ff6b35' },
};

// Jackpot seeds scale with denomination — higher denom = bigger jackpots
// Baseline: 10¢ = $50 / $150 / $500 / $5,000
// J2 owner-approved seed table (2026-05-15):
// 1¢–$1: flat floor — jackpots feel meaningful at any denom (max bet $1c×5×20=$1.00 to $1×5×20=$100)
// $2+:   scale up from $1 tier — GRAND = denom × 2000
// Jackpot seeds — owner-confirmed custom table 2026-05-18
// Seeds update dynamically on every denom change (applyScaledJackpotSeeds called in index.html)
// Jackpot seeds — proportional to max bet at each denomination
// Formula: MINI=20× MINOR=60× MAJOR=200× GRAND=2000× (max bet = denom × 5cr × 20L)
// Owner confirmed 2026-05-18
const JACKPOT_SEEDS_BY_DENOM = {
  0.01: { MINI:     20, MINOR:      60, MAJOR:     200, GRAND:      2000 },  // max bet  $1.00
  0.02: { MINI:     40, MINOR:     120, MAJOR:     400, GRAND:      4000 },  // max bet  $2.00
  0.05: { MINI:    100, MINOR:     300, MAJOR:    1000, GRAND:     10000 },  // max bet  $5.00
  0.10: { MINI:    200, MINOR:     600, MAJOR:    2000, GRAND:     20000 },  // max bet $10.00
  0.25: { MINI:    500, MINOR:    1500, MAJOR:    5000, GRAND:     50000 },  // max bet $25.00
  0.50: { MINI:   1000, MINOR:    3000, MAJOR:   10000, GRAND:    100000 },  // max bet $50.00
  1.00: { MINI:   2000, MINOR:    6000, MAJOR:   20000, GRAND:    200000 },  // max bet $100.00
  2.00: { MINI:   4000, MINOR:   12000, MAJOR:   40000, GRAND:    400000 },  // max bet $200.00
  3.00: { MINI:   6000, MINOR:   18000, MAJOR:   60000, GRAND:    600000 },  // max bet $300.00
  5.00: { MINI:  10000, MINOR:   30000, MAJOR:  100000, GRAND:   1000000 },  // max bet $500.00
 // $10 and $20 denominations permanently removed v6l94 — do not re-add
};

// Returns seeds for the current denomination
function getJackpotSeedsForDenom(denom) {
  var key = parseFloat(denom).toFixed(2);
  return JACKPOT_SEEDS_BY_DENOM[parseFloat(key)] || JACKPOT_SEEDS_BY_DENOM[0.10];
}

// Tighter jackpot odds — harder to win, casino authentic
// ── LEGACY per-spin odds (still used by checkJackpot in processJackpotCheck for forced-JP operator tool)
// DO NOT use these for normal gameplay — use JACKPOT_UNIFIED_PROBS below.
const JACKPOT_ODDS = {
  MINI:  1 / 1500,
  MINOR: 1 / 15000,
  MAJOR: 1 / 150000,
  GRAND: 1 / 1500000,
};

// ── UNIFIED JACKPOT SYSTEM — v6l96 ───────────────────────────────────
// Single roll fires at the moment each bonus (H&S, P&C, RS) triggers.
// Equal chance for all bonus types. BONUS orb never directly awards —
// it routes to H&S/P&C/RS which each do their own entry check.
// Probabilities calculated at combined bonus trigger rate ~1-in-13 spins.
// Owner confirmed 2026-05-20: Option A (equal per bonus entry) + Option C (single roll at entry).
// PERMANENT RULE: Only H&S, P&C, RS may award jackpots. Never BONUS orb directly.
// PERMANENT RULE: One jackpot check per bonus trigger — no per-spin or per-tile checks.
const JACKPOT_UNIFIED_PROBS = {
  MINI:  0.0628, // ~6.28% per bonus entry → ~1-in-200 spins  (most frequent)
  MINOR: 0.0157, // ~1.57% per bonus entry → ~1-in-800 spins
  MAJOR: 0.0031, // ~0.31% per bonus entry → ~1-in-4,000 spins
  GRAND: 0.0006, // ~0.06% per bonus entry → ~1-in-20,000 spins (rarest)
};

// Must-Hit-By cap multipliers — cap = seed × multiplier per denom.
// When progressive reaches cap the next bonus entry FORCES a jackpot award.
// 2% grace: if meter passes cap (e.g. contribution ticked it over), force fires
// within seed × multiplier × 1.02 regardless of random roll.
// Owner confirmed 2026-05-20. Adjust multipliers in future calibration sessions.
const JACKPOT_MHB_MULTIPLIERS = {
  MINI:  3,   // MINI cap = seed × 3  (frequent, tight cap)
  MINOR: 4,   // MINOR cap = seed × 4
  MAJOR: 5,   // MAJOR cap = seed × 5
  GRAND: 6,   // GRAND cap = seed × 6 (rarest, widest range)
};

const JACKPOT_CONTRIBUTION_RATE_DEFAULT = 0.025; // 2.5%
const JACKPOT_SPLIT = { MINI: 0.30, MINOR: 0.25, MAJOR: 0.25, GRAND: 0.20 };

// ═══════════════════════════════════════════════════════════════════════
// RTP & BONUS FREQUENCY
// ═══════════════════════════════════════════════════════════════════════
const TARGET_RTP_DEFAULT = 94.0; // 94% — standard casino

// Red Spin: more frequent (was 1/125, now 1/60)
// BONUS Feature frequency — RNG check fires on EVERY spin (not gated by win).
// Acts as a redirect lottery: player gets an orb pick leading to H&S, P&C, or RS.
// Fires independently of the natural bottom-row B-O-N-U-S letter trigger.
// Target: ~1-in-150 spins — meaningful but rarer than H&S/P&C since it adds
// another chance at ALL three bonuses simultaneously.
// Owner confirmed v6l99: "always consider presenting BONUS letters bonus, use game math RTP and RNG"
const BONUS_FEATURE_FREQ_DEFAULT   = 0.0067; // ~1-in-150 spins per spin

const RED_SPIN_FREQUENCY_DEFAULT  = 0.120; // effective ~1-in-17 all spins (0.120 × ~49.5% win rate ≈ 5.9%) — v6l92 MC target
const RED_SPIN_CONTINUANCE_DEFAULT = 0.60; // 60% continue / 40% end — owner confirmed 2026-05-18 (was 0.70)

// ── RED SPIN TIERED VOLATILITY SYSTEM ────────────────────────────────────────
// Owner confirmed 2026-05-18: 4-tier escalation, continuance-driven advancement
// Within-tier: 60/40 (same as RED_SPIN_CONTINUANCE_DEFAULT)
// Tier advancement: 20% when tier exhausts (P(Sisters) = 0.20³ = 0.8% of sequences)
// Win rules: win >= lastWin (can equal), within tier range, different payline set
const RED_SPIN_TIER_ADVANCE_PROB = 0.20; // 20% chance to advance tier when current exhausts
const RED_SPIN_TIERS = [
  { name: 'SMALL',   minMult:   1, maxMult:   10 }, // 1×–10× totalBet  ($5-$50 at 5c/$5) — bars, mixed bars
  { name: 'MEDIUM',  minMult:  10, maxMult:   35 }, // 10×–35× totalBet ($50-$175) — char 3-oaks, multi-line bars
  { name: 'LARGE',   minMult:  35, maxMult:  200 }, // 35×–200× totalBet ($175-$1000) — char 4/5-oaks
  { name: 'SISTERS', minMult: null, maxMult: null }, // Tier 4: Sisters GRAND only
];

// JP available per tier — owner confirmed 2026-05-18
// MINI (20× maxBet) always exceeds T1 ceiling (10×) → forces T2 advancement
// MINOR (60× maxBet) always exceeds T2 ceiling (35×) → forces T3 advancement
// MAJOR (200× maxBet) = T3 ceiling (200×) → stays in T3, no forced advancement
// Works identically at ALL denoms because seeds are proportional to max bet
// RS_TIER_JP_ODDS and RS_TIER_JP_TYPES removed v6l96 — replaced by JACKPOT_UNIFIED_PROBS.
// Red Spin now uses single entry check like all other bonuses. No per-spin JP rolls in RS tiers.

// Lipstick: 5-oak on center payline (Line 1) triggers Pick & Choose — reel freq controlled above

const HOLD_SPIN_LAND_PROBABILITY  = 0.022; // 2.2% — reduced from 0.055 v6l92 to target 8-9% H&S RTP

// ═══════════════════════════════════════════════════════════════════════
// RTP CALCULATOR
// ═══════════════════════════════════════════════════════════════════════
function calculateTheoreticalRTP(lines) {
  if (lines === undefined) lines = 20;
  var totalReturn = 0;
  var activeLines = PAYLINES.slice(0, lines);
  activeLines.forEach(function(line) {
    Object.keys(PAY_TABLE).forEach(function(key) {
      if (!SYMBOLS[key]) return;
      var symId  = SYMBOLS[key].id;
      var pays   = PAY_TABLE[key];
      var freq   = REEL_STRIPS.map(function(strip) { return strip.filter(function(s) { return s === symId; }).length / strip.length; });
      var wildFreq = REEL_STRIPS.map(function(strip) { return strip.filter(function(s) { return WILD_IDS.includes(s); }).length / strip.length; });
      if (pays[0] > 0) {
        var p5 = 1; for (var r=0;r<5;r++) p5 *= (freq[r]+wildFreq[r]);
        totalReturn += p5 * pays[0] / lines;
      }
      if (pays[1] > 0) {
        var p4 = 1; for (var r=0;r<4;r++) p4 *= (freq[r]+wildFreq[r]);
        p4 *= (1-freq[4]-wildFreq[4]); totalReturn += p4 * pays[1] / lines;
      }
      if (pays[2] > 0) {
        var p3 = 1; for (var r=0;r<3;r++) p3 *= (freq[r]+wildFreq[r]);
        p3 *= (1-freq[3]-wildFreq[3]); totalReturn += p3 * pays[2] / lines;
      }
      if (pays[3] > 0) {
        var p2 = (freq[0]+wildFreq[0])*(freq[1]+wildFreq[1])*(1-freq[2]-wildFreq[2]);
        totalReturn += p2 * pays[3] / lines;
      }
    });
  });
  // NOTE: Lipstick [0,0,0,0] — bonus trigger only, no payline pay (owner-confirmed 2026-05-18).
  // 5-oak triggers Pick & Choose. Bonus RTP not included in this theoretical calculation.
  console.log('Theoretical RTP (' + lines + ' lines): ' + (totalReturn*100).toFixed(2) + '%');
  return totalReturn;
}

// ═══════════════════════════════════════════════════════════════════════
// HOLD & SPIN COIN TIERS
// All values scale with totalBet (betPerLine × linesActive) — higher bets = higher coins.
// Fractions are of totalBet. E.g. at $1 total bet: tiny tier = $0.02–$0.10.
//                              At $10 total bet:  tiny tier = $0.20–$1.00.
// Cash tier weights must sum to 0.996667 (1 minus sum of jackpot weights = 0.003333 total JP).
// Monte Carlo verified: 8.58–8.66% H&S RTP contribution across all 6 denoms.
// ═══════════════════════════════════════════════════════════════════════
const HOLD_SPIN_CASH_TIERS = [
  { weight:0.40, minFrac:0.03, maxFrac:0.12 }, // 40% — tiny   (3–12% of bet)
  { weight:0.25, minFrac:0.12, maxFrac:0.35 }, // 25% — small  (12–35% of bet)
  { weight:0.14, minFrac:0.35, maxFrac:0.85 }, // 14% — medium (35–85% of bet)
  { weight:0.08, minFrac:0.85, maxFrac:2.50 }, //  8% — large  (85%–2.5× bet)
  { weight:0.04, minFrac:2.50, maxFrac:6.00 }, //  4% — big    (2.5–6× bet)
  { weight:0.01, minFrac:6.00, maxFrac:15.0 }, //  1% — huge   (6–15× bet) — rare big coin
];
const HOLD_SPIN_JACKPOT_TIERS = [
  { level:'MINI',  weight:0.008  }, // ~1-in-20  H&S bonuses — visible often enough to excite
  { level:'MINOR', weight:0.003  }, // ~1-in-50  H&S bonuses
  { level:'MAJOR', weight:0.0008 }, // ~1-in-200 H&S bonuses
  { level:'GRAND', weight:0.0002 }, // ~1-in-700 H&S bonuses — rare, special
];

// Near-miss cash multiplier — when counter = 1 and a coin lands, its value is boosted
// Rewards the player for the tension of the last-spin recovery
const HOLD_SPIN_NEAR_MISS_BOOST = 1.8; // 1.8× normal cash value on counter=1 landings

// ═══════════════════════════════════════════════════════════════════════
// PICK & CHOOSE PRIZES
// ═══════════════════════════════════════════════════════════════════════
// v6k5: multipliers reduced to target ~10x avg win (was 32.75x — too high at 1-in-178 trigger)
// New avg = 0.45×6.5 + 0.25×16 + 0.12×31 = 10.6× total bet
// PICK & CHOOSE prize table — mirrors bonuses.js _generatePickTiles PRIZE_WEIGHTS exactly.
// bonuses.js is authoritative (owner confirmed 2026-05-18). MC tool imports this.
// Cash prizes use one of PICK_CHOOSE_CASH_TIERS selected randomly (equal probability).
const PICK_CHOOSE_CASH_TIERS = [
  { minMult:5,  maxMult:25  },  // tier 0 — small
  { minMult:25, maxMult:75  },  // tier 1 — medium
  { minMult:75, maxMult:150 },  // tier 2 — large
];
const PICK_CHOOSE_PRIZES = [
  { type:'cash',      weight:0.40 }, // cash — random tier
  { type:'cash',      weight:0.20 }, // cash — random tier (second entry = second roll bucket)
  { type:'hold_spin', weight:0.14 },
  { type:'red_spin',  weight:0.12 },
  { type:'mini',      weight:0.07 },
  { type:'minor',     weight:0.04 },
  { type:'major',     weight:0.02 },
  { type:'grand',     weight:0.01 },
];

const PICK_CHOOSE_GRID_SIZE = 15;

// ═══════════════════════════════════════════════════════════════════════
// SERIAL NUMBER GENERATOR
// Generates a unique 9-digit serial number per spin
// ═══════════════════════════════════════════════════════════════════════
function generateSerialNumber() {
  // 9 digits: timestamp-seeded to guarantee uniqueness
  var ts   = Date.now();
  var rand = Math.floor(Math.random() * 100000);
  var raw  = ((ts % 100000) * 10000 + rand) % 1000000000;
  return String(raw).padStart(9, '0');
}

if (typeof module !== 'undefined') module.exports = {
  SYMBOLS, SYMBOL_BY_ID, WILD_IDS, BONUS_PC_ID, BONUS_ID,
  PAY_TABLE, PAY_TABLE_BY_DENOM, getPayTableForDenom, WILD_MULTIPLIERS,
  LETTER_IDS, LETTER_ORDER, BONUS_LETTER_PAYS,
  MIXED_BAR_PAY, BAR_IDS,
  REEL_STRIPS, REEL_FREQUENCIES, REEL_SIZE, PAYLINES, PAYLINE_NAMES, LINE_PRESETS,
  DENOMINATIONS, DENOM_LABELS, DEFAULT_DENOM,
  CREDITS_PER_LINE_OPTIONS, DEFAULT_CREDITS_PER_LINE,
  BET_INCREMENTS, DEFAULT_BET, DEFAULT_LINES, DEFAULT_BALANCE,
  calcTotalBet, calcWinCash, MIN_TOTAL_BET, MAX_TOTAL_BET,
  JACKPOT_CONFIG, JACKPOT_SEEDS_BY_DENOM, getJackpotSeedsForDenom,
  JACKPOT_ODDS, JACKPOT_UNIFIED_PROBS, JACKPOT_MHB_MULTIPLIERS,
  JACKPOT_CONTRIBUTION_RATE_DEFAULT, JACKPOT_SPLIT,
  TARGET_RTP_DEFAULT, BONUS_FEATURE_FREQ_DEFAULT,
  RED_SPIN_FREQUENCY_DEFAULT, RED_SPIN_CONTINUANCE_DEFAULT,
  RED_SPIN_TIERS, RED_SPIN_TIER_ADVANCE_PROB,
  HOLD_SPIN_LAND_PROBABILITY, HOLD_SPIN_CASH_TIERS, HOLD_SPIN_JACKPOT_TIERS, HOLD_SPIN_NEAR_MISS_BOOST,
  PICK_CHOOSE_CASH_TIERS, PICK_CHOOSE_PRIZES, PICK_CHOOSE_GRID_SIZE,
  generateSerialNumber, calculateTheoreticalRTP,
};
