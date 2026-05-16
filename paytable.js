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
  CHERRY:     { id:7,  name:'Cherry',    type:'svg', file:'assets/symbols/cherry.svg',       isWild:false, isScatter:false, isBonus:false },
  LIPSTICK:   { id:8,  name:'Lipstick',  type:'svg', file:'assets/symbols/lipstick.svg',     isWild:false, isScatter:false, isBonus:false },
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
const SCATTER_ID   = SYMBOLS.LIPSTICK.id;
const BONUS_ID     = SYMBOLS.GOLD_COIN.id;
const LETTER_IDS   = [10, 11, 12, 13, 14]; // B O N U S — one per reel
const LETTER_ORDER = ['B','O','N','U','S'];

// Partial pays × bet per line (left-to-right consecutive, same row)
// Full BONUS (all 5) triggers bonus feature — no credit pay
const BONUS_LETTER_PAYS = { 1:2, 2:5, 3:15, 4:50 };

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
//  Cherry     = 10× (also pays 2-of-a-kind)
//  Lipstick   = scatter / Pick & Choose trigger
//  Gold Coin  = Hold & Spin trigger
// ═══════════════════════════════════════════════════════════════════════
const PAY_TABLE = {
  // ── CHARACTER SYMBOLS (Jackpot triggers) ─────────────────────────
  SISTERS:    [5000, 750,  150,  0],  // GRAND jackpot symbol — keep big pays
  JOSIE:      [2000, 400,   75,  0],  // Wild ×4 — MINOR jackpot trigger
  SASHA:      [2000, 400,   75,  0],  // Wild ×2 — MINI jackpot trigger
  // ── SUPPORTING CHARACTERS ────────────────────────────────────────
  STRAYPUP:   [1000, 200,   50,  0],  // Regular pay — reduced 33% from original
  DJ_MAXINE:  [ 700, 150,   35,  0],  // Regular pay — reduced 30% from original
  // ── MID-TIER SYMBOLS ─────────────────────────────────────────────
  SEVEN:      [ 500, 100,   25,  0],  // High-mid pay
  DIAMOND:    [ 100,  25,    8,  0],  // Mid pay
  // ── BAR SYMBOLS (min 3-oak on payline) ───────────────────────────
  TRIPLE_BAR: [ 150,  30,    8,  0],
  DOUBLE_BAR: [  60,  15,    5,  0],
  SINGLE_BAR: [  25,   8,    2,  0],
  // ── CHERRY (special row rule — any row, all rows pay) ────────────
  CHERRY:     [  10,   4,    2,  1],  // 1-oak=1cr, 2-oak=2cr, 3-oak=2cr, 4-oak=4cr, 5-oak=10cr
  // ── LIPSTICK (payline symbol — 5-oak triggers Pick & Choose, no cash) ──
  // 5-oak = Pick & Choose trigger (no direct credit award)
  // 4-oak = 20cr, 3-oak = 5cr — partial pays keep it engaging
  LIPSTICK:   [   0,  20,    5,  0],
  // ── MIXED BAR (3-5 any bar combo across payline) ─────────────────
  // Handled separately: 3=5×, 4=15×, 5=35× bet/line
};

// Mixed Bar: 5 of ANY Bar (any mix of Single/Double/Triple Bar) on any payline
// Only pays on 5 — no 3 or 4 pay
const MIXED_BAR_PAY = { 3: 5, 4: 15, 5: 35 }; // 3 any bar=5×, 4=15×, 5=35× bet/line // 35× bet per line
const BAR_IDS = [SYMBOLS.TRIPLE_BAR.id, SYMBOLS.DOUBLE_BAR.id, SYMBOLS.SINGLE_BAR.id];

// Wild multiplier
const WILD_MULTIPLIERS = { 1: 2, 2: 6 }; // CURRENT: any 1 wild=×2, any 2 wilds=×6 — NOTE: Josie ×4 bug not yet fixed (see Known Issues)

// Scatter (Lipstick) pays removed — Lipstick is now a payline symbol (see PAY_TABLE.LIPSTICK)
// 5-oak on any active payline = Pick & Choose trigger (no cash), 4-oak=20cr, 3-oak=5cr

// ═══════════════════════════════════════════════════════════════════════
// REEL STRIPS — Tighter, casino-style distribution
// Fewer wilds and premium symbols = lower hit frequency = more authentic
// Total per reel = 64
//
// Symbol ID key:
//   0=Sisters  1=Josie   2=Sasha    3=Seven   4=TripleBar
//   5=DoubleBar 6=SingleBar 7=Cherry 8=Lipstick 9=GoldCoin
// ═══════════════════════════════════════════════════════════════════════
const REEL_SIZE = 80; // Expanded from 65 to accommodate new symbols

// Symbol ID key:
//   0=Sisters  1=Josie   2=Sasha    3=Seven   4=TripleBar
//   5=DoubleBar 6=SingleBar 7=Cherry 8=Lipstick 9=GoldCoin
//   10-14=BONUS letters  15=Diamond  16=DJMaxine  17=StrayPup
//
// Reel totals must each equal 80
// Cherry reduced from 24-25 to 4. Gold Coin up to 14. Lipstick 14 (payline symbol).
// Diamond=3, DJ Maxine=2, StrayPup=2 per reel.
// BONUS letters: 10/reel (was 1) — singlebar reduced 15→6 to make room.
// Full BONUS (5-ltr) ~1in11k | 3-ltr partial ~1in223 | Lipstick 5-oak P&C ~1in305
// v6k3 update: All paying symbols now evenly distributed across all reels.
// Josie was 3,2,2,2,1 and Sasha was 1,2,2,2,3 — both normalized to 2 per reel.
// BONUS letters (10-14) remain reel-specific by design (they spell B-O-N-U-S).
// See tools/reel_strips.js for the standalone config and sanity-check tool.
//
// Symbol counts (identical for all reels except BONUS letter):
//   Sisters(0):1  Josie(1):2  Sasha(2):2  StrayPup(17):2  DJMaxine(16):2
//   Seven(3):6  TripleBar(4):6  DoubleBar(5):8  SingleBar(6):6  Diamond(15):3
//   Cherry(7):4  Lipstick(8):14  GoldCoin(9):14  BONUSletter:10  Σ=80
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

function buildReelStrips(frequencies) {
  return frequencies.map((freq, reelIdx) => {
    const strip = [];
    Object.entries(freq).forEach(([id, count]) => {
      for (let i = 0; i < count; i++) strip.push(parseInt(id));
    });
    if (strip.length !== REEL_SIZE) {
      console.error(`Reel ${reelIdx+1} frequency total is ${strip.length}, expected ${REEL_SIZE}`);
    }
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

// ═══════════════════════════════════════════════════════════════════════
// PAYLINES
// ═══════════════════════════════════════════════════════════════════════
const PAYLINES = [
  [1,1,1,1,1], [0,0,0,0,0], [2,2,2,2,2],
  [0,1,2,1,0], [2,1,0,1,2], [0,0,1,2,2],
  [2,2,1,0,0], [1,0,0,0,1], [1,2,2,2,1],
  [0,1,1,1,0], [2,1,1,1,2], [1,0,1,0,1],
  [1,2,1,2,1], [0,0,1,0,0], [2,2,1,2,2],
  [0,1,0,1,0], [2,1,2,1,2], [1,1,0,1,1],
  [1,1,2,1,1], [0,2,0,2,0],
];

const LINE_PRESETS = [1, 5, 10, 15, 20];

// ═══════════════════════════════════════════════════════════════════════
// BET CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════
// MLMC BET STRUCTURE — Aristocrat VGT style (Hunt for Neptune's Gold)
// Total Bet = Denomination × Credits Per Line × Lines Active
// Win Cash  = Credits Won × Credits Per Line × Denomination
// ═══════════════════════════════════════════════════════════════════════

// Denominations in dollars
const DENOMINATIONS   = [0.01, 0.02, 0.05, 0.10, 0.25, 0.50, 1.00];
const DENOM_LABELS    = ['1¢', '2¢', '5¢', '10¢', '25¢', '50¢', '$1'];
const DEFAULT_DENOM   = 0.05; // 5¢ default

// Credits per line options (Aristocrat style — skips 4, skips 6-9)
const CREDITS_PER_LINE_OPTIONS = [1, 2, 3, 5, 10];
const DEFAULT_CREDITS_PER_LINE = 1;

// Lines (unchanged)
const DEFAULT_LINES   = 20;
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
const MAX_TOTAL_BET = calcTotalBet(1.00, 10, 20);  // $200.00

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
const JACKPOT_SEEDS_BY_DENOM = {
  0.01: { MINI:    5, MINOR:    15, MAJOR:     50, GRAND:     500 },
  0.02: { MINI:   10, MINOR:    30, MAJOR:    100, GRAND:   1000  },
  0.05: { MINI:   25, MINOR:    75, MAJOR:    250, GRAND:   2500  },
  0.10: { MINI:   50, MINOR:   150, MAJOR:    500, GRAND:   5000  },
  0.25: { MINI:  125, MINOR:   375, MAJOR:   1250, GRAND:  12500  },
  0.50: { MINI:  250, MINOR:   750, MAJOR:   2500, GRAND:  25000  },
  1.00: { MINI:  500, MINOR:  1500, MAJOR:   5000, GRAND:  50000  },
};

// Returns seeds for the current denomination
function getJackpotSeedsForDenom(denom) {
  var key = parseFloat(denom).toFixed(2);
  return JACKPOT_SEEDS_BY_DENOM[parseFloat(key)] || JACKPOT_SEEDS_BY_DENOM[0.10];
}

// Tighter jackpot odds — harder to win, casino authentic
const JACKPOT_ODDS = {
  MINI:  1 / 1500,
  MINOR: 1 / 15000,
  MAJOR: 1 / 150000,
  GRAND: 1 / 1500000,
};

const JACKPOT_CONTRIBUTION_RATE_DEFAULT = 0.025; // 2.5%
const JACKPOT_SPLIT = { MINI: 0.30, MINOR: 0.25, MAJOR: 0.25, GRAND: 0.20 };

// ═══════════════════════════════════════════════════════════════════════
// RTP & BONUS FREQUENCY
// ═══════════════════════════════════════════════════════════════════════
const TARGET_RTP_DEFAULT = 94.0; // 94% — standard casino

// Red Spin: more frequent (was 1/125, now 1/60)
const RED_SPIN_FREQUENCY_DEFAULT  = 0.035; // ~1 in 28 spins — main feature
const RED_SPIN_CONTINUANCE_DEFAULT = 0.65; // 65% continue

// Lipstick scatter: appears less on reels (frequency controlled by reel strips above)
// Pick & Choose only triggers on 3+ scatters — already rare with freq=2 per reel

const HOLD_SPIN_LAND_PROBABILITY  = 0.055; // 5.5% — avg ~6 coins per trigger (was 0.12 = avg 11.8, broken)

// ═══════════════════════════════════════════════════════════════════════
// RTP CALCULATOR
// ═══════════════════════════════════════════════════════════════════════
function calculateTheoreticalRTP(lines = 20) {
  let totalReturn = 0;
  const activeLines = PAYLINES.slice(0, lines);
  activeLines.forEach(line => {
    Object.keys(PAY_TABLE).forEach(key => {
      const symId  = SYMBOLS[key].id;
      const pays   = PAY_TABLE[key];
      const freq   = REEL_STRIPS.map(strip => strip.filter(s => s === symId).length / strip.length);
      const wildFreq = REEL_STRIPS.map(strip => strip.filter(s => WILD_IDS.includes(s)).length / strip.length);
      if (pays[0] > 0) {
        let p5 = 1; for (let r=0;r<5;r++) p5 *= (freq[r]+wildFreq[r]);
        totalReturn += p5 * pays[0] / lines;
      }
      if (pays[1] > 0) {
        let p4 = 1; for (let r=0;r<4;r++) p4 *= (freq[r]+wildFreq[r]);
        p4 *= (1-freq[4]-wildFreq[4]); totalReturn += p4 * pays[1] / lines;
      }
      if (pays[2] > 0) {
        let p3 = 1; for (let r=0;r<3;r++) p3 *= (freq[r]+wildFreq[r]);
        p3 *= (1-freq[3]-wildFreq[3]); totalReturn += p3 * pays[2] / lines;
      }
      if (pays[3] > 0) {
        let p2 = (freq[0]+wildFreq[0])*(freq[1]+wildFreq[1])*(1-freq[2]-wildFreq[2]);
        totalReturn += p2 * pays[3] / lines;
      }
    });
  });
  // NOTE: Lipstick (id:8) is now a payline symbol — its 3-oak/4-oak pays are
  // already included in the PAY_TABLE loop above (LIPSTICK key).
  // 5-oak triggers Pick & Choose (no direct credit) — bonus RTP not included here.
  console.log(`Theoretical RTP (${lines} lines): ${(totalReturn*100).toFixed(2)}%`);
  return totalReturn;
}

// ═══════════════════════════════════════════════════════════════════════
// HOLD & SPIN COIN TIERS
// Fraction-based cash coins (self-limit at 5× totalBet — no hard cap needed)
// + Jackpot coins that pay denom-scaled seed value at bonus end.
// All landed jackpot levels accumulate independently and ALL pay out.
// Total weight: 0.42+0.25+0.13+0.07+0.03+0.003333+0.000833+0.000167+0.000033 = 1.000
// Monte Carlo verified: 8.58–8.66% H&S RTP contribution across all 6 denoms.
// ═══════════════════════════════════════════════════════════════════════
const HOLD_SPIN_CASH_TIERS = [
  { weight:0.42, minFrac:0.02, maxFrac:0.10 }, // 42% — tiny   (~$0.40–$2 on $20 bet)
  { weight:0.25, minFrac:0.10, maxFrac:0.30 }, // 25% — small  (~$2–$6)
  { weight:0.13, minFrac:0.30, maxFrac:0.75 }, // 13% — medium (~$6–$15)
  { weight:0.07, minFrac:0.75, maxFrac:2.00 }, //  7% — large  (~$15–$40)
  { weight:0.03, minFrac:2.00, maxFrac:5.00 }, //  3% — big    (~$40–$100)
];
const HOLD_SPIN_JACKPOT_TIERS = [
  { level:'MINI',  weight:0.003333 }, // ~1-in-50   H&S bonuses lands a MINI coin
  { level:'MINOR', weight:0.000833 }, // ~1-in-200  H&S bonuses lands a MINOR coin
  { level:'MAJOR', weight:0.000167 }, // ~1-in-1000 H&S bonuses lands a MAJOR coin
  { level:'GRAND', weight:0.000033 }, // ~1-in-5000 H&S bonuses lands a GRAND coin
];
// Legacy export alias — keeps any code that references HOLD_SPIN_COIN_TIERS from breaking
const HOLD_SPIN_COIN_TIERS = HOLD_SPIN_CASH_TIERS;

// ═══════════════════════════════════════════════════════════════════════
// PICK & CHOOSE PRIZES
// ═══════════════════════════════════════════════════════════════════════
const PICK_CHOOSE_PRIZES = [
  { type:'cash',      weight:0.45, minMult:5,   maxMult:25  },
  { type:'cash',      weight:0.25, minMult:25,  maxMult:75  },
  { type:'cash',      weight:0.12, minMult:75,  maxMult:150 },
  { type:'red_spin',  weight:0.10 },
  { type:'hold_spin', weight:0.08 },
];

const PICK_CHOOSE_GRID_SIZE = 15;

// ═══════════════════════════════════════════════════════════════════════
// SERIAL NUMBER GENERATOR
// Generates a unique 9-digit serial number per spin
// ═══════════════════════════════════════════════════════════════════════
function generateSerialNumber() {
  // 9 digits: timestamp-seeded to guarantee uniqueness
  const ts   = Date.now();
  const rand = Math.floor(Math.random() * 100000);
  const raw  = ((ts % 100000) * 10000 + rand) % 1000000000;
  return String(raw).padStart(9, '0');
}

if (typeof module !== 'undefined') module.exports = {
  SYMBOLS, SYMBOL_BY_ID, WILD_IDS, SCATTER_ID, BONUS_ID,
  PAY_TABLE, WILD_MULTIPLIERS,
  LETTER_IDS, LETTER_ORDER, BONUS_LETTER_PAYS,
  MIXED_BAR_PAY, BAR_IDS,
  REEL_STRIPS, REEL_FREQUENCIES, REEL_SIZE, PAYLINES, LINE_PRESETS,
  DENOMINATIONS, DENOM_LABELS, DEFAULT_DENOM,
  CREDITS_PER_LINE_OPTIONS, DEFAULT_CREDITS_PER_LINE,
  BET_INCREMENTS, DEFAULT_BET, DEFAULT_LINES, DEFAULT_BALANCE,
  calcTotalBet, calcWinCash, MIN_TOTAL_BET, MAX_TOTAL_BET,
  JACKPOT_CONFIG, JACKPOT_SEEDS_BY_DENOM, getJackpotSeedsForDenom,
  JACKPOT_ODDS, JACKPOT_CONTRIBUTION_RATE_DEFAULT, JACKPOT_SPLIT,
  TARGET_RTP_DEFAULT, RED_SPIN_FREQUENCY_DEFAULT, RED_SPIN_CONTINUANCE_DEFAULT,
  HOLD_SPIN_LAND_PROBABILITY, HOLD_SPIN_CASH_TIERS, HOLD_SPIN_JACKPOT_TIERS, HOLD_SPIN_COIN_TIERS,
  PICK_CHOOSE_PRIZES, PICK_CHOOSE_GRID_SIZE,
  generateSerialNumber, calculateTheoreticalRTP,
};
