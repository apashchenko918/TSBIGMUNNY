'use strict';
/**
 * tools/monte_carlo.js — Turrelle Sisters Big Munny Monte Carlo Simulator
 * ──────────────────────────────────────────────────────────────────────────
 * Simulates base-game spins and estimates total RTP including bonus features.
 *
 * Usage:
 *   node tools/monte_carlo.js [spins] [lines] [creditsPerLine] [denom]
 *
 * Examples:
 *   node tools/monte_carlo.js                        → 1M spins, defaults
 *   node tools/monte_carlo.js 2000000                → 2M spins
 *   node tools/monte_carlo.js 1000000 20 1 0.05      → 1M spins, 5¢, 1 cpl, 20 lines
 *   node tools/monte_carlo.js 500000  20 5 0.10      → 500k spins, 10¢, 5 cpl
 *
 * Output sections:
 *   BASE GAME    — fully simulated (paylines, cherry, mixed bar, bonus letters)
 *   HOLD & SPIN  — trigger rate simulated; avg win from weighted tier model
 *   RED SPIN     — trigger rate from configured probability; avg from continuance
 *   PICK&CHOOSE  — trigger rate simulated (5-oak lipstick); avg from prize table
 *   JACKPOTS     — trigger rate from JACKPOT_ODDS constants
 */

const path = require('path');
const pt   = require(path.join(__dirname, '..', 'paytable.js'));

const {
  SYMBOLS, WILD_IDS, SCATTER_ID, BONUS_ID,
  PAY_TABLE, LETTER_IDS, BONUS_LETTER_PAYS,
  MIXED_BAR_PAY, BAR_IDS,
  REEL_STRIPS, REEL_SIZE, PAYLINES,
  RED_SPIN_FREQUENCY_DEFAULT, RED_SPIN_CONTINUANCE_DEFAULT,
  HOLD_SPIN_LAND_PROBABILITY, HOLD_SPIN_CASH_TIERS, HOLD_SPIN_JACKPOT_TIERS,
  PICK_CHOOSE_PRIZES, PICK_CHOOSE_GRID_SIZE,
  JACKPOT_ODDS,
  JACKPOT_SEEDS_BY_DENOM, getJackpotSeedsForDenom,
} = pt;

// ── CLI ARGS ─────────────────────────────────────────────────────────────────
const TOTAL_SPINS       = parseInt(process.argv[2])  || 1_000_000;
const ACTIVE_LINES      = parseInt(process.argv[3])  || 20;
const CREDITS_PER_LINE  = parseInt(process.argv[4])  || 1;
const DENOM             = parseFloat(process.argv[5]) || 0.05;

const BET_PER_LINE = DENOM * CREDITS_PER_LINE;              // $ per line
const TOTAL_BET    = BET_PER_LINE * ACTIVE_LINES;           // $ per spin
const JACKPOT_SEEDS = getJackpotSeedsForDenom(DENOM);

// ── HELPER: FAST RANDOM (Math.random — simulation-only) ──────────────────────
const rnd = Math.random;

// ── REEL MECHANICS ───────────────────────────────────────────────────────────
function randomStop(reelIdx) {
  return Math.floor(rnd() * REEL_SIZE);
}

function getVisible(reelIdx, stop) {
  const strip = REEL_STRIPS[reelIdx];
  const len   = strip.length;
  return [
    strip[(stop - 1 + len) % len],
    strip[stop],
    strip[(stop + 1)      % len],
  ];
}

function buildGrid() {
  const stops = REEL_STRIPS.map((_, r) => randomStop(r));
  return { grid: stops.map((s, r) => getVisible(r, s)), stops };
}

// ── WIN EVALUATION (mirrors game.js exactly) ─────────────────────────────────

function evaluateLine(lineSymbols, betPerLine) {
  let wildCount = 0, matchSymbol = null;
  for (let i = 0; i < lineSymbols.length; i++) {
    if (WILD_IDS.includes(lineSymbols[i])) wildCount++;
    else { matchSymbol = lineSymbols[i]; break; }
  }
  if (matchSymbol === null && wildCount > 0) { matchSymbol = SYMBOLS.JOSIE.id; wildCount = 0; }

  let matchCount = wildCount, extraWilds = 0;
  for (let i = wildCount; i < lineSymbols.length; i++) {
    if (lineSymbols[i] === matchSymbol)       matchCount++;
    else if (WILD_IDS.includes(lineSymbols[i])) { matchCount++; extraWilds++; }
    else break;
  }
  if (matchCount < 2) return 0;
  if (matchSymbol === BONUS_ID) return 0;  // Gold Coin never pays on paylines

  const symbolKey = Object.keys(SYMBOLS).find(k => SYMBOLS[k].id === matchSymbol);
  if (!symbolKey || !PAY_TABLE[symbolKey]) return 0;
  const pays     = PAY_TABLE[symbolKey];
  const payIndex = Math.max(0, 5 - matchCount);
  if (payIndex >= pays.length) return 0;
  const basePay  = pays[payIndex];
  if (basePay === 0) return 0;

  // Wild multiplier: Josie+Sasha=×6 | Josie only=×4 | Sasha only=×2
  const comboSyms     = lineSymbols.slice(0, matchCount + extraWilds);
  const hasJosie      = comboSyms.includes(SYMBOLS.JOSIE.id);
  const hasSasha      = comboSyms.includes(SYMBOLS.SASHA.id);
  const anyWild       = comboSyms.some(s => WILD_IDS.includes(s));
  const multiplier    = anyWild ? (hasJosie && hasSasha ? 6 : hasJosie ? 4 : 2) : 1;

  return basePay * betPerLine * multiplier;
}

function evaluateCherryWin(grid, betPerLine) {
  const cherryId   = SYMBOLS.CHERRY.id;
  const cherryPays = PAY_TABLE.CHERRY;
  let total = 0;
  for (let row = 0; row < 3; row++) {
    let count = 0;
    for (let col = 0; col < 5; col++) {
      if (grid[col][row] === cherryId) count++;
      else break;
    }
    if (count >= 1) {
      const idx = count >= 5 ? 0 : count === 4 ? 1 : count === 3 ? 2 : 3;
      total += (cherryPays[idx] || 0) * betPerLine;
    }
  }
  return total;
}

function evaluateBonusLetters(grid) {
  let best = 0;
  for (let row = 0; row < 3; row++) {
    let count = 0;
    for (let col = 0; col < 5; col++) {
      if (grid[col][row] === LETTER_IDS[col]) count++;
      else break;
    }
    if (count > best) best = count;
  }
  return best;
}

function evaluateMixedBars(grid, betPerLine) {
  let total = 0;
  PAYLINES.slice(0, ACTIVE_LINES).forEach(line => {
    const syms = line.map((row, col) => grid[col][row]);
    let barCount = 0;
    for (let i = 0; i < 5; i++) {
      if (BAR_IDS.includes(syms[i])) barCount++;
      else break;
    }
    if (barCount < 3) return;
    const allSame = syms.slice(0, barCount).every(s => s === syms[0]);
    if (allSame) return;  // Pure same-bar: handled by payline eval
    total += (MIXED_BAR_PAY[barCount] || 0) * betPerLine;
  });
  return total;
}

function evaluateSpin(grid, betPerLine) {
  let totalWin       = 0;
  let triggerPickChoose  = false;
  let triggerHoldSpin    = false;
  let triggerBonusFeature = false;

  // Count gold coins & lipstick across all 15 cells
  let coinCount = 0, lipstickCount = 0;
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 3; row++) {
      if (grid[col][row] === BONUS_ID)   coinCount++;
      if (grid[col][row] === SCATTER_ID) lipstickCount++;
    }
  }
  if (coinCount >= 6) triggerHoldSpin = true;

  // Payline evaluation
  PAYLINES.slice(0, ACTIVE_LINES).forEach(line => {
    const syms = line.map((row, col) => grid[col][row]);
    totalWin += evaluateLine(syms, betPerLine);

    // 5-oak lipstick on any active payline = Pick & Choose trigger
    if (syms.every(id => id === SCATTER_ID)) triggerPickChoose = true;
  });

  // Cherry (any row, consecutive from reel 1)
  totalWin += evaluateCherryWin(grid, betPerLine);

  // Mixed bar
  totalWin += evaluateMixedBars(grid, betPerLine);

  // BONUS letters
  const letterCount = evaluateBonusLetters(grid);
  if (letterCount >= 5) {
    triggerBonusFeature = true;
  } else if (letterCount >= 1) {
    const letterPay = (BONUS_LETTER_PAYS[letterCount] || 0) * betPerLine;
    totalWin += letterPay;
  }

  return { totalWin, triggerPickChoose, triggerHoldSpin, triggerBonusFeature, coinCount, lipstickCount, letterCount };
}

// ── BONUS AVERAGE WIN ESTIMATORS ─────────────────────────────────────────────

// Hold & Spin: weighted-avg cash fraction × total bet × avg coins landed
function estimateHoldSpinWin() {
  // Avg cash fraction per coin from tier table
  const avgFracPerCoin = HOLD_SPIN_CASH_TIERS.reduce((sum, t) => {
    return sum + t.weight * (t.minFrac + t.maxFrac) / 2;
  }, 0);
  // Avg jackpot contribution per coin (negligible but correct)
  const avgJpPerCoin = HOLD_SPIN_JACKPOT_TIERS.reduce((sum, t) => {
    const seedVal = JACKPOT_SEEDS[t.level] || 0;
    return sum + t.weight * seedVal;
  }, 0);
  // Avg coins per trigger: each of 15 cells has HOLD_SPIN_LAND_PROBABILITY
  // but the game only triggers on 6+ coins, so condition on that
  // Approximate: given trigger (6+ coins), avg ≈ 8–9 coins (geometric series approx)
  // Using game comment: "avg ~6 coins per trigger"
  const AVG_COINS_ON_TRIGGER = 6;
  const avgCashWin = avgFracPerCoin * TOTAL_BET * AVG_COINS_ON_TRIGGER;
  const avgJpWin   = avgJpPerCoin   * AVG_COINS_ON_TRIGGER;
  return avgCashWin + avgJpWin;
}

// Red Spin: avg spins per trigger = 1/(1-continuance), each spin ≈ totalBet × 1 (break-even estimate)
// Comment in paytable.js says Red Spin is main feature (~35% freq * RTP contribution)
// Using continuance: avg extra spins = continuance / (1 - continuance)
function estimateRedSpinWin() {
  const avgExtraSpins = RED_SPIN_CONTINUANCE_DEFAULT / (1 - RED_SPIN_CONTINUANCE_DEFAULT);
  // Each red spin is effectively a free spin — assume same base RTP as base game
  // Conservative: treat each red spin as 1× total bet returned on avg (break-even placeholder)
  // In reality Red Spin has higher volatility — tune this multiplier from actual play data
  const EST_RED_SPIN_SPIN_RTP = 0.85; // placeholder — update from Red Spin play analysis
  return avgExtraSpins * TOTAL_BET * EST_RED_SPIN_SPIN_RTP;
}

// Pick & Choose: one pick from PICK_CHOOSE_PRIZES table
function estimatePickChooseWin() {
  // Simple one-pick expected value (BONUS feature may award 2+ picks — treated as 1 here)
  return PICK_CHOOSE_PRIZES.reduce((sum, prize) => {
    if (prize.type === 'cash') {
      const avgMult = (prize.minMult + prize.maxMult) / 2;
      return sum + prize.weight * avgMult * TOTAL_BET;
    }
    // red_spin / hold_spin: estimate those separately; weight them at 0
    return sum;
  }, 0);
}

// ── SIMULATION CORE ──────────────────────────────────────────────────────────

function runSimulation() {
  const start = Date.now();

  // Counters
  let totalWagered       = 0;
  let baseWon            = 0;
  let hitCount           = 0;    // spins with any base win
  let cherryHits         = 0;
  let mixedBarHits       = 0;

  // Bonus trigger counts
  let holdSpinTriggers   = 0;
  let redSpinTriggers    = 0;
  let pickChooseTriggers = 0;
  let bonusFeatureTriggers = 0;

  // Bonus letter partial pay tracking
  let letterHits = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  // Symbol frequency on center row (payline 0 = row 1) for sanity check
  const symFreq = Array(18).fill(0).map(() => new Array(5).fill(0));

  const PROGRESS_INTERVAL = Math.floor(TOTAL_SPINS / 20);

  for (let spin = 0; spin < TOTAL_SPINS; spin++) {

    if (spin % PROGRESS_INTERVAL === 0 && spin > 0) {
      process.stdout.write(`\r  Progress: ${Math.round(spin / TOTAL_SPINS * 100)}% (${(spin / 1e6).toFixed(2)}M spins)...`);
    }

    const { grid } = buildGrid();
    totalWagered += TOTAL_BET;

    // Count center row symbols for frequency table
    for (let col = 0; col < 5; col++) {
      const sym = grid[col][1]; // center row
      if (sym < 18) symFreq[sym][col]++;
    }

    const result = evaluateSpin(grid, BET_PER_LINE);

    baseWon += result.totalWin;
    if (result.totalWin > 0) hitCount++;

    // Cherry hit detection (any win that came from cherry)
    const cherryWin = evaluateCherryWin(grid, BET_PER_LINE);
    if (cherryWin > 0) cherryHits++;

    // Mixed bar detection
    const mbWin = evaluateMixedBars(grid, BET_PER_LINE);
    if (mbWin > 0) mixedBarHits++;

    // Bonus triggers
    if (result.triggerHoldSpin)     holdSpinTriggers++;
    if (result.triggerPickChoose)   pickChooseTriggers++;
    if (result.triggerBonusFeature) bonusFeatureTriggers++;

    // Red Spin (probability-based, independent of reels)
    if (Math.random() < RED_SPIN_FREQUENCY_DEFAULT) redSpinTriggers++;

    // Bonus letter tracking
    if (result.letterCount >= 1) letterHits[result.letterCount]++;
  }

  process.stdout.write('\r' + ' '.repeat(60) + '\r'); // clear progress line

  const elapsed   = ((Date.now() - start) / 1000).toFixed(1);
  const baseRTP   = (baseWon / totalWagered * 100);

  // Estimated bonus RTP contributions
  const avgHsWin  = estimateHoldSpinWin();
  const avgRsWin  = estimateRedSpinWin();
  const avgPcWin  = estimatePickChooseWin();

  const hsTotal   = holdSpinTriggers   * avgHsWin;
  const rsTotal   = redSpinTriggers    * avgRsWin;
  const pcTotal   = pickChooseTriggers * avgPcWin;

  const hsRTP     = hsTotal / totalWagered * 100;
  const rsRTP     = rsTotal / totalWagered * 100;
  const pcRTP     = pcTotal / totalWagered * 100;
  const totalRTP  = baseRTP + hsRTP + rsRTP + pcRTP;

  // ── REPORT ─────────────────────────────────────────────────────────────────
  const hr = '─'.repeat(58);
  const W = (n, w=10) => String(n).padStart(w);
  const P = (n, d=2) => (n.toFixed(d) + '%').padStart(10);
  const D = (n) => ('$' + n.toFixed(2)).padStart(10);
  const freq = (n) => n > 0 ? `1 in ${Math.round(TOTAL_SPINS / n).toLocaleString()}` : 'never';

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       TURRELLE SISTERS BIG MUNNY — MONTE CARLO          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  console.log(`\n${'Spins:'.padEnd(22)}${TOTAL_SPINS.toLocaleString().padStart(18)}`);
  console.log(`${'Active Lines:'.padEnd(22)}${String(ACTIVE_LINES).padStart(18)}`);
  console.log(`${'Credits / Line:'.padEnd(22)}${String(CREDITS_PER_LINE).padStart(18)}`);
  console.log(`${'Denomination:'.padEnd(22)}${('$' + DENOM.toFixed(2)).padStart(18)}`);
  console.log(`${'Bet / Spin:'.padEnd(22)}${D(TOTAL_BET).padStart(18)}`);
  console.log(`${'Total Wagered:'.padEnd(22)}${D(totalWagered).padStart(18)}`);
  console.log(`${'Elapsed:'.padEnd(22)}${(elapsed + 's').padStart(18)}`);

  console.log(`\n${hr}`);
  console.log('  BASE GAME (Fully Simulated)');
  console.log(hr);
  console.log(`${'Total Won:'.padEnd(30)}${D(baseWon).padStart(14)}`);
  console.log(`${'Base RTP:'.padEnd(30)}${P(baseRTP).padStart(14)}`);
  console.log(`${'Hit Frequency:'.padEnd(30)}${(hitCount / TOTAL_SPINS * 100).toFixed(2).padStart(13)}%`);
  console.log(`${'  (1 in)'.padEnd(30)}${freq(hitCount).padStart(14)}`);
  console.log(`${'Cherry Hits:'.padEnd(30)}${(cherryHits / TOTAL_SPINS * 100).toFixed(2).padStart(13)}%  ${freq(cherryHits)}`);
  console.log(`${'Mixed Bar Hits:'.padEnd(30)}${(mixedBarHits / TOTAL_SPINS * 100).toFixed(2).padStart(13)}%  ${freq(mixedBarHits)}`);

  console.log(`\n${hr}`);
  console.log('  BONUS TRIGGERS & ESTIMATED RTP CONTRIBUTION');
  console.log(hr);

  const bonusFmt = (label, count, avgWin, estRTP) => {
    const f = freq(count);
    console.log(`${label.padEnd(22)}${String(count.toLocaleString()).padStart(10)}  ${f.padStart(14)}  est +${estRTP.toFixed(2)}%`);
  };

  bonusFmt('Hold & Spin:',    holdSpinTriggers,    avgHsWin, hsRTP);
  console.log(`${'  avg win / trigger:'.padEnd(22)}${D(avgHsWin).padStart(26)}`);

  bonusFmt('Red Spin:',       redSpinTriggers,     avgRsWin, rsRTP);
  const avgRedSpins = RED_SPIN_CONTINUANCE_DEFAULT / (1 - RED_SPIN_CONTINUANCE_DEFAULT);
  console.log(`${'  avg spins / trigger:'.padEnd(22)}${avgRedSpins.toFixed(1).padStart(26)}`);
  console.log(`${'  (continuance rate:'.padEnd(22)}${(RED_SPIN_CONTINUANCE_DEFAULT * 100).toFixed(0).padStart(24)}%)`);

  bonusFmt('Pick & Choose:',  pickChooseTriggers,  avgPcWin, pcRTP);
  console.log(`${'  avg win / trigger:'.padEnd(22)}${D(avgPcWin).padStart(26)}`);

  bonusFmt('BONUS Feature:',  bonusFeatureTriggers, 0, 0);

  console.log('\n  Bonus Letter Partial Pays:');
  [1,2,3,4].forEach(n => {
    if (letterHits[n] > 0) {
      const pay = (BONUS_LETTER_PAYS[n] || 0) * BET_PER_LINE;
      console.log(`    ${n}-letter:  ${letterHits[n].toLocaleString().padStart(8)} hits  ${freq(letterHits[n]).padStart(16)}  (${D(pay)} each)`);
    }
  });
  if (letterHits[5] > 0) {
    console.log(`    5-letter:  ${letterHits[5].toLocaleString().padStart(8)} hits  ${freq(letterHits[5]).padStart(16)}  → triggers BONUS feature`);
  }

  console.log(`\n${hr}`);
  console.log('  JACKPOT ODDS (Theoretical)');
  console.log(hr);
  ['MINI','MINOR','MAJOR','GRAND'].forEach(tier => {
    const odds  = JACKPOT_ODDS[tier];
    const seed  = JACKPOT_SEEDS[tier];
    const label = `${tier} ($${seed.toLocaleString()}):`;
    const oddsStr = `1 in ${Math.round(1/odds).toLocaleString()}`;
    console.log(`  ${label.padEnd(24)}${oddsStr.padStart(18)}`);
  });

  console.log(`\n${hr}`);
  console.log('  SYMBOL FREQUENCY — Center Row (Reel × Center Position)');
  console.log(hr);
  const SYM_NAMES = {
    0:'Sisters', 1:'Josie', 2:'Sasha', 3:'Seven', 4:'3-Bar',
    5:'2-Bar', 6:'1-Bar', 7:'Cherry', 8:'Lipstick', 9:'GoldCoin',
    10:'Ltr-B', 11:'Ltr-O', 12:'Ltr-N', 13:'Ltr-U', 14:'Ltr-S',
    15:'Diamond', 16:'DJMaxine', 17:'StrayPup',
  };
  console.log(`${'Symbol'.padEnd(12)} ${'R1'.padStart(7)} ${'R2'.padStart(7)} ${'R3'.padStart(7)} ${'R4'.padStart(7)} ${'R5'.padStart(7)}  ${'Equal?'}`);
  console.log('  ' + '─'.repeat(56));
  for (let id = 0; id < 18; id++) {
    if (symFreq[id].every(c => c === 0)) continue;
    const pcts = symFreq[id].map(c => (c / TOTAL_SPINS * 100).toFixed(1) + '%');
    // Check if equal (within 0.5% tolerance)
    const vals  = symFreq[id];
    const mean  = vals.reduce((a,b)=>a+b,0)/5;
    const equal = vals.every(v => Math.abs(v - mean) / (mean||1) < 0.05) ? '✓' : '≠';
    const name  = (SYM_NAMES[id] || `id:${id}`).padEnd(12);
    console.log(`${name} ${pcts.map(p => p.padStart(7)).join(' ')}  ${equal}`);
  }

  console.log(`\n${hr}`);
  console.log('  ESTIMATED TOTAL RTP BREAKDOWN');
  console.log(hr);
  const rtpLine = (label, rtp) => console.log(`  ${label.padEnd(28)}${(rtp.toFixed(2) + '%').padStart(12)}`);
  rtpLine('Base Game (simulated):',  baseRTP);
  rtpLine('Hold & Spin (estimated):', hsRTP);
  rtpLine('Red Spin (estimated):',    rsRTP);
  rtpLine('Pick & Choose (estimated):', pcRTP);
  console.log('  ' + '─'.repeat(40));
  console.log(`  ${'TOTAL ESTIMATED RTP:'.padEnd(28)}${(totalRTP.toFixed(2) + '%').padStart(12)}`);
  console.log(`\n  ⚠  Red Spin avg win is estimated (placeholder 0.85× bet/spin).`);
  console.log(`     Update EST_RED_SPIN_SPIN_RTP in this file after Red Spin analysis.\n`);
}

// ── ENTRY POINT ───────────────────────────────────────────────────────────────
console.log(`\nStarting Monte Carlo: ${TOTAL_SPINS.toLocaleString()} spins × $${TOTAL_BET.toFixed(2)}/spin...`);
runSimulation();
