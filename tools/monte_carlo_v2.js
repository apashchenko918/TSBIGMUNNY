#!/usr/bin/env node
'use strict';
/**
 * monte_carlo_v2.js — The Turrelle Sisters Big Munny
 * Fresh full-engine Monte Carlo recalibration tool (v7.0.3)
 *
 * PURPOSE: Independently re-implement the complete game engine from scratch
 * and simulate millions of spins to verify RTP, bonus rates, jackpot rates,
 * and all component contributions. Does NOT import game.js or bonuses.js —
 * reads paytable.js constants only, then reimplements all logic here.
 *
 * USAGE:
 *   node tools/monte_carlo_v2.js                  # 1M spins, 5¢, 20 lines, 1 credit
 *   node tools/monte_carlo_v2.js --spins 5000000  # 5M spins
 *   node tools/monte_carlo_v2.js --denom 0.10     # 10¢ denomination
 *   node tools/monte_carlo_v2.js --lines 5        # 5 lines
 *   node tools/monte_carlo_v2.js --credits 3      # 3 credits per line
 *   node tools/monte_carlo_v2.js --full            # full 5M run across all denoms
 *   node tools/monte_carlo_v2.js --rtp-only        # fast base game RTP only (no bonus sims)
 *
 * WHAT IS SIMULATED:
 *   ✅ All 20 paylines, left-to-right evaluation
 *   ✅ Wild substitution + multiplier (Josie×2 + Sasha×1, min×1)
 *   ✅ Mixed bar pays (any mix of 1/2/3 bar on same payline, 3-5 consecutive)
 *   ✅ BONUS letter pays (cherry-style, all 3 rows, consecutive from reel 1)
 *   ✅ Character jackpot triggers on paylines (MINI/MINOR/MAJOR/GRAND)
 *   ✅ P&C trigger (5 Lipstick on center payline)
 *   ✅ Hold & Spin trigger (6+ Gold Coins anywhere on grid)
 *   ✅ BONUS orb trigger (B-O-N-U-S on bottom row)
 *   ✅ Red Spin trigger (RED_SPIN_FREQUENCY_DEFAULT on winning spins)
 *   ✅ Hold & Spin bonus full simulation (coins, jackpots, near-miss boost)
 *   ✅ Pick & Choose bonus simulation (weighted prize table)
 *   ✅ Red Spin bonus full tier simulation (4 tiers, continuance, tier advance)
 *   ✅ BONUS orb simulation (routes to H&S/P&C/RS per pick weights)
 *   ✅ Jackpot unified entry checks at each bonus type
 *   ✅ Jackpot contribution deduction (2.5% of wagered)
 *   ✅ Per-denomination reporting
 *   ✅ Variance / standard deviation of session wins
 */

// ══════════════════════════════════════════════════════════════════════
// LOAD PAYTABLE CONSTANTS
// ══════════════════════════════════════════════════════════════════════
const pt = require('./paytable_node_shim.js');

// Destructure everything we need
const {
  SYMBOLS, WILD_IDS, BONUS_ID, BONUS_PC_ID, LETTER_IDS,
  PAY_TABLE, MIXED_BAR_PAY, BAR_IDS, BONUS_LETTER_PAYS,
  REEL_STRIPS, REEL_SIZE, PAYLINES,
  DEFAULT_DENOM, CREDITS_PER_LINE_OPTIONS, DENOMINATIONS,
  JACKPOT_UNIFIED_PROBS, JACKPOT_CONFIG, JACKPOT_SEEDS_BY_DENOM,
  JACKPOT_MHB_MULTIPLIERS, JACKPOT_CONTRIBUTION_RATE_DEFAULT, JACKPOT_SPLIT,
  RED_SPIN_TIERS, RED_SPIN_TIER_ADVANCE_PROB, RED_SPIN_CONTINUANCE_DEFAULT, RED_SPIN_FREQUENCY_DEFAULT,
  HOLD_SPIN_CASH_TIERS, HOLD_SPIN_JACKPOT_TIERS, HOLD_SPIN_NEAR_MISS_BOOST, HOLD_SPIN_LAND_PROBABILITY,
  PICK_CHOOSE_CASH_TIERS, PICK_CHOOSE_PRIZES, PICK_CHOOSE_GRID_SIZE,
} = pt;

// ══════════════════════════════════════════════════════════════════════
// CLI ARGS
// ══════════════════════════════════════════════════════════════════════
const args = process.argv.slice(2);
const flag  = (name) => args.includes(name);
const param = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i+1] : def; };

const RUN_FULL   = flag('--full');
const RTP_ONLY   = flag('--rtp-only');
const SPINS      = parseInt(param('--spins',  RUN_FULL ? '5000000' : '1000000'));
const DENOM      = parseFloat(param('--denom', DEFAULT_DENOM));
const LINES      = parseInt(param('--lines',  '20'));
const CREDITS    = parseInt(param('--credits', '1'));

// ══════════════════════════════════════════════════════════════════════
// RNG — Pure Math.random for speed (crypto not available in Node MC context)
// Seeded per run — NOT the game RNG (which uses crypto). Results are statistical.
// ══════════════════════════════════════════════════════════════════════
// LCG fast RNG — sufficient for MC simulation (not for game use)
let _seed = (Date.now() ^ (Math.random() * 0xFFFFFFFF)) >>> 0;
function mcRand() {
  _seed = (_seed * 1664525 + 1013904223) >>> 0;
  return _seed / 0x100000000;
}
function mcChance(p) { return mcRand() < p; }
function mcInt(min, max) { return Math.floor(mcRand() * (max - min + 1)) + min; }
function mcPick(arr) { return arr[Math.floor(mcRand() * arr.length)]; }
function mcWeightedPick(items) {
  // items: array of { weight, ... }
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = mcRand() * total;
  for (const item of items) { r -= item.weight; if (r <= 0) return item; }
  return items[items.length - 1];
}

// ══════════════════════════════════════════════════════════════════════
// REEL ENGINE — mirrors game.js exactly
// ══════════════════════════════════════════════════════════════════════
function getVisibleSymbols(reelIndex, stop) {
  const strip = REEL_STRIPS[reelIndex], len = strip.length;
  return [strip[(stop - 1 + len) % len], strip[stop], strip[(stop + 1) % len]];
}

function buildGrid(stops) {
  return stops.map((stop, r) => getVisibleSymbols(r, stop));
}

function randomStops() {
  return REEL_STRIPS.map(strip => mcInt(0, strip.length - 1));
}

// ══════════════════════════════════════════════════════════════════════
// PAYLINE EVALUATION — mirrors game.js evaluateLine exactly
// ══════════════════════════════════════════════════════════════════════
function evaluateLine(lineSymbols, betPerLine) {
  let wildCount = 0, matchSymbol = null;
  for (let i = 0; i < lineSymbols.length; i++) {
    if (WILD_IDS.indexOf(lineSymbols[i]) >= 0) wildCount++;
    else { matchSymbol = lineSymbols[i]; break; }
  }
  if (matchSymbol === null && wildCount > 0) { matchSymbol = SYMBOLS.JOSIE.id; wildCount = 0; }

  let matchCount = wildCount, extraWilds = 0;
  for (let j = wildCount; j < lineSymbols.length; j++) {
    if (lineSymbols[j] === matchSymbol) matchCount++;
    else if (WILD_IDS.indexOf(lineSymbols[j]) >= 0) { matchCount++; extraWilds++; }
    else break;
  }

  if (matchCount < 2) return 0;
  if (matchSymbol === BONUS_ID) return 0;

  const symEntry = Object.keys(SYMBOLS).find(k => SYMBOLS[k].id === matchSymbol);
  if (!symEntry || !PAY_TABLE[symEntry]) return 0;

  const pays    = PAY_TABLE[symEntry];
  const payIdx  = Math.max(0, 5 - matchCount);
  if (payIdx >= pays.length || pays[payIdx] === 0) return 0;

  let josieCount = 0, sashaCount = 0;
  for (let wi = 0; wi < matchCount; wi++) {
    if (lineSymbols[wi] === SYMBOLS.JOSIE.id) josieCount++;
    else if (lineSymbols[wi] === SYMBOLS.SASHA.id) sashaCount++;
  }
  const multiplier = Math.max(1, josieCount * 2 + sashaCount);
  return pays[payIdx] * betPerLine * multiplier;
}

// Mixed bar evaluation — mirrors evaluateMixedBars exactly
function evalMixedBars(grid, linesActive, betPerLine) {
  let total = 0;
  const activeLines = PAYLINES.slice(0, linesActive);
  for (let li = 0; li < activeLines.length; li++) {
    const line = activeLines[li];
    const lineSyms = line.map((row, col) => grid[col][row]);
    let barCount = 0;
    for (let i = 0; i < 5; i++) {
      if (BAR_IDS.indexOf(lineSyms[i]) >= 0) barCount++;
      else break;
    }
    if (barCount < 3) continue;
    let allSame = true;
    for (let j = 1; j < barCount; j++) { if (lineSyms[j] !== lineSyms[0]) { allSame = false; break; } }
    if (allSame) continue;
    total += (MIXED_BAR_PAY[barCount] || 0) * betPerLine;
  }
  return total;
}

// Bonus letter evaluation — mirrors evaluateLetterPays exactly
function evalLetterPays(grid, betPerLine) {
  let total = 0;
  for (let row = 0; row < 3; row++) {
    let count = 0;
    for (let col = 0; col < 5; col++) {
      if (grid[col][row] === LETTER_IDS[col]) count++;
      else break;
    }
    if (count >= 1) {
      const pay = (BONUS_LETTER_PAYS[count] || 0) * betPerLine;
      total += pay;
    }
  }
  return total;
}

// Full spin evaluation — returns all trigger flags and win amounts
function evalSpin(grid, linesActive, betPerLine) {
  let totalWin = 0;
  let coinCount = 0, lipstickCount = 0;

  for (let c = 0; c < 5; c++) {
    for (let r = 0; r < 3; r++) {
      if (grid[c][r] === BONUS_ID)    coinCount++;
      if (grid[c][r] === BONUS_PC_ID) lipstickCount++;
    }
  }

  const triggerHS = (coinCount >= 6);

  // Payline wins
  const activeLines = PAYLINES.slice(0, linesActive);
  for (let li = 0; li < activeLines.length; li++) {
    const lineSyms = activeLines[li].map((row, col) => grid[col][row]);
    totalWin += evaluateLine(lineSyms, betPerLine);
  }
  // Lipstick 5-oak center line triggers P&C (no credit pay)
  const centerLine = PAYLINES[0].map((row, col) => grid[col][row]);
  const triggerPC = centerLine.every(id => id === BONUS_PC_ID);

  totalWin += evalMixedBars(grid, linesActive, betPerLine);

  // Bonus letters
  const letterWin = evalLetterPays(grid, betPerLine);
  let letterTotal = letterWin;
  // Bottom-row BONUS → orb trigger; remove the 5-letter pay from credit win
  const bottomBonus =
    grid[0][2] === LETTER_IDS[0] && grid[1][2] === LETTER_IDS[1] &&
    grid[2][2] === LETTER_IDS[2] && grid[3][2] === LETTER_IDS[3] &&
    grid[4][2] === LETTER_IDS[4];
  if (bottomBonus) {
    // Remove bottom-row 5-letter pay from totalWin (it's a trigger, not a credit pay)
    const bottomRowPay = (BONUS_LETTER_PAYS[5] || 0) * betPerLine;
    letterTotal -= bottomRowPay;
  }
  totalWin += letterTotal;

  // Character jackpots on active paylines (MINI/MINOR/MAJOR/GRAND)
  let charJP = null;
  const tierOrder = ['MINI','MINOR','MAJOR','GRAND'];
  for (let li = 0; li < activeLines.length; li++) {
    const syms = activeLines[li].map((row, col) => grid[col][row]);
    if (syms.some(id => id === BONUS_ID)) continue;
    let tier = null;
    if (syms.every(id => id === SYMBOLS.SISTERS.id))              tier = 'GRAND';
    else if (syms.every(id => WILD_IDS.indexOf(id) >= 0))         tier = 'MAJOR';
    else if (syms[0]===SYMBOLS.JOSIE.id && syms[1]===SYMBOLS.JOSIE.id && syms[2]===SYMBOLS.JOSIE.id) tier = 'MINOR';
    else if (syms[0]===SYMBOLS.SASHA.id && syms[1]===SYMBOLS.SASHA.id && syms[2]===SYMBOLS.SASHA.id) tier = 'MINI';
    if (tier && (charJP === null || tierOrder.indexOf(tier) > tierOrder.indexOf(charJP))) charJP = tier;
  }

  // Red Spin trigger — only on winning spins
  const triggerRS = (totalWin > 0 && mcChance(RED_SPIN_FREQUENCY_DEFAULT));
  // BONUS orb trigger — bottom row B-O-N-U-S
  const triggerBonus = bottomBonus;

  return { totalWin, triggerHS, triggerPC, triggerRS, triggerBonus, charJP, coinCount };
}

// ══════════════════════════════════════════════════════════════════════
// JACKPOT STATE
// ══════════════════════════════════════════════════════════════════════
function makeJackpotState(denom) {
  const seeds = JACKPOT_SEEDS_BY_DENOM[denom] || JACKPOT_SEEDS_BY_DENOM[0.05];
  const caps  = {};
  const state = {};
  for (const t of ['MINI','MINOR','MAJOR','GRAND']) {
    state[t] = seeds[t];
    caps[t]  = seeds[t] * JACKPOT_MHB_MULTIPLIERS[t];
  }
  return { state, caps, seeds };
}

function contributeJackpots(jp, wagered) {
  const contrib = wagered * JACKPOT_CONTRIBUTION_RATE_DEFAULT;
  for (const t of ['MINI','MINOR','MAJOR','GRAND']) {
    jp.state[t] += contrib * JACKPOT_SPLIT[t];
  }
}

function checkUnifiedJackpot(jp) {
  for (const t of ['GRAND','MAJOR','MINOR','MINI']) {
    if (jp.state[t] >= jp.caps[t] * 0.98) {
      const amount = jp.state[t];
      jp.state[t] = jp.seeds[t];
      return { tier: t, amount };
    }
  }
  if (mcChance(JACKPOT_UNIFIED_PROBS.GRAND)) { const a = jp.state.GRAND; jp.state.GRAND = jp.seeds.GRAND; return { tier:'GRAND', amount:a }; }
  if (mcChance(JACKPOT_UNIFIED_PROBS.MAJOR)) { const a = jp.state.MAJOR; jp.state.MAJOR = jp.seeds.MAJOR; return { tier:'MAJOR', amount:a }; }
  if (mcChance(JACKPOT_UNIFIED_PROBS.MINOR)) { const a = jp.state.MINOR; jp.state.MINOR = jp.seeds.MINOR; return { tier:'MINOR', amount:a }; }
  if (mcChance(JACKPOT_UNIFIED_PROBS.MINI))  { const a = jp.state.MINI;  jp.state.MINI  = jp.seeds.MINI;  return { tier:'MINI',  amount:a }; }
  return null;
}

// ══════════════════════════════════════════════════════════════════════
// BONUS SIMULATIONS
// ══════════════════════════════════════════════════════════════════════

// Hold & Spin — full grid simulation
function simHoldSpin(totalBet, jp) {
  let won = 0;
  const GRID_COLS = 5, GRID_ROWS = 3;
  const GRID_TOTAL = GRID_COLS * GRID_ROWS;
  const STARTING_COINS = 3; // always start at 3 spins
  let grid = Array(GRID_TOTAL).fill(null);
  let counter = STARTING_COINS;

  // Jackpot check at entry
  const entryJP = checkUnifiedJackpot(jp);
  if (entryJP) won += entryJP.amount;

  while (counter > 0) {
    counter--;
    // Roll each empty cell for a coin
    let coinLanded = false;
    for (let cell = 0; cell < GRID_TOTAL; cell++) {
      if (grid[cell] !== null) continue;
      if (!mcChance(HOLD_SPIN_LAND_PROBABILITY)) continue;
      coinLanded = true;

      // Determine coin value
      const jpRoll = mcRand();
      let cumJP = 0;
      let jpHit = null;
      for (const jt of HOLD_SPIN_JACKPOT_TIERS) {
        cumJP += jt.weight;
        if (jpRoll < cumJP) { jpHit = jt.level; break; }
      }
      if (jpHit) {
        const jpAmt = jp.state[jpHit]; jp.state[jpHit] = jp.seeds[jpHit];
        grid[cell] = jpAmt; won += jpAmt;
      } else {
        const nearMissBoost = (counter === 0) ? HOLD_SPIN_NEAR_MISS_BOOST : 1.0;
        const tier = mcWeightedPick(HOLD_SPIN_CASH_TIERS);
        const val  = (tier.minFrac + mcRand() * (tier.maxFrac - tier.minFrac)) * totalBet * nearMissBoost;
        grid[cell] = Math.round(val * 100) / 100;
        won += grid[cell];
      }
    }
    if (coinLanded) counter = STARTING_COINS; // reset counter
  }

  // Full board bonus — 5× total bet for filling all cells
  const filledCells = grid.filter(v => v !== null).length;
  if (filledCells === GRID_TOTAL) won += totalBet * 5;

  return won;
}

// Pick & Choose — single pick simulation
function simPickChoose(totalBet, jp) {
  let won = 0;
  const entryJP = checkUnifiedJackpot(jp);
  if (entryJP) won += entryJP.amount;

  const prize = mcWeightedPick(PICK_CHOOSE_PRIZES);
  switch (prize.type) {
    case 'cash': {
      const tier = mcPick(PICK_CHOOSE_CASH_TIERS);
      won += (tier.minMult + mcRand() * (tier.maxMult - tier.minMult)) * totalBet;
      break;
    }
    case 'hold_spin':
      won += simHoldSpin(totalBet, jp);
      break;
    case 'red_spin':
      won += simRedSpin(totalBet, jp);
      break;
    case 'mini':  { const a = jp.state.MINI;  jp.state.MINI  = jp.seeds.MINI;  won += a; break; }
    case 'minor': { const a = jp.state.MINOR; jp.state.MINOR = jp.seeds.MINOR; won += a; break; }
    case 'major': { const a = jp.state.MAJOR; jp.state.MAJOR = jp.seeds.MAJOR; won += a; break; }
    case 'grand': { const a = jp.state.GRAND; jp.state.GRAND = jp.seeds.GRAND; won += a; break; }
  }
  return won;
}

// Red Spin — full 4-tier escalation simulation
function simRedSpin(totalBet, jp) {
  let won = 0;
  let currentTier = 0;
  let lastWin = totalBet; // BIG MUNNY floor
  let spinNum = 0;

  // Jackpot check at RS entry
  const entryJP = checkUnifiedJackpot(jp);
  if (entryJP) won += entryJP.amount;

  while (true) {
    spinNum++;
    if (spinNum > 200) break; // safety valve

    const tier = RED_SPIN_TIERS[currentTier];

    // Sisters tier (T4)
    if (!tier || tier.minMult === null) {
      const grandAmt = jp.state.GRAND; jp.state.GRAND = jp.seeds.GRAND;
      won += grandAmt;
      break;
    }

    // Generate a valid win for this tier
    const minWin = tier.minMult * totalBet;
    const maxWin = tier.maxMult * totalBet;
    const spinWin = minWin + mcRand() * (maxWin - minWin);
    won += spinWin;
    lastWin = spinWin;

    // Jackpot check per tier (at first spin of each tier)
    if (spinNum === 1 || mcChance(0.33)) {
      const tierJP = checkUnifiedJackpot(jp);
      if (tierJP) won += tierJP.amount;
    }

    // Continue or advance
    if (mcChance(RED_SPIN_CONTINUANCE_DEFAULT)) {
      continue; // stay in current tier for another spin
    } else {
      // End tier — advance?
      if (currentTier < 3 && mcChance(RED_SPIN_TIER_ADVANCE_PROB)) {
        currentTier++;
        continue;
      } else {
        break; // RS ends
      }
    }
  }
  return won;
}

// BONUS orb — routes to H&S / P&C / RS based on pick weights (mirrors bonuses.js PRIZE_WEIGHTS)
const BONUS_ORB_WEIGHTS = [
  { type:'hold_spin', weight:0.35 },
  { type:'pick_choose', weight:0.35 },
  { type:'red_spin',    weight:0.30 },
];
function simBonusOrb(totalBet, jp) {
  const entryJP = checkUnifiedJackpot(jp);
  let won = entryJP ? entryJP.amount : 0;
  const route = mcWeightedPick(BONUS_ORB_WEIGHTS);
  switch (route.type) {
    case 'hold_spin':   won += simHoldSpin(totalBet, jp);   break;
    case 'pick_choose': won += simPickChoose(totalBet, jp); break;
    case 'red_spin':    won += simRedSpin(totalBet, jp);    break;
  }
  return won;
}

// ══════════════════════════════════════════════════════════════════════
// MAIN SIMULATION LOOP
// ══════════════════════════════════════════════════════════════════════
function runSimulation(spins, denom, lines, creditsPerLine) {
  const betPerLine = denom * creditsPerLine;
  const totalBet   = betPerLine * lines;
  const jp         = makeJackpotState(denom);

  // Accumulators
  let totalWagered   = 0;
  let totalWon       = 0;
  let baseWon        = 0;
  let hsWon          = 0;
  let pcWon          = 0;
  let rsWon          = 0;
  let bonusOrbWon    = 0;
  let charJPWon      = 0;
  let jpWon          = { MINI:0, MINOR:0, MAJOR:0, GRAND:0 };
  let jpHits         = { MINI:0, MINOR:0, MAJOR:0, GRAND:0 };
  let hsCount = 0, pcCount = 0, rsCount = 0, bonusOrbCount = 0;
  let winningSpins   = 0;
  let bonusSpins     = 0; // any bonus triggered
  let sessionWins    = []; // for variance calculation — every 1000-spin block
  let blockWon       = 0;

  for (let spin = 0; spin < spins; spin++) {
    const stops  = randomStops();
    const grid   = buildGrid(stops);
    const result = evalSpin(grid, lines, betPerLine);

    const wagered = totalBet;
    totalWagered += wagered;
    contributeJackpots(jp, wagered);

    let spinWon = 0;

    // Character jackpots (base game, on paylines)
    if (result.charJP) {
      const jpAmt = jp.state[result.charJP];
      jp.state[result.charJP] = jp.seeds[result.charJP];
      charJPWon += jpAmt;
      jpWon[result.charJP] += jpAmt;
      jpHits[result.charJP]++;
      spinWon += jpAmt;
    }

    // Payline / letter / mixed bar wins
    spinWon += result.totalWin;
    baseWon += result.totalWin;

    if (result.totalWin > 0 || result.triggerHS || result.triggerPC || result.triggerRS || result.triggerBonus || result.charJP) {
      winningSpins++;
    }

    // Bonus triggers — priority: H&S > BONUS orb > P&C > RS
    if (result.triggerHS && !RTP_ONLY) {
      hsCount++;
      bonusSpins++;
      const w = simHoldSpin(totalBet, jp);
      hsWon += w; spinWon += w;
    } else if (result.triggerBonus && !RTP_ONLY) {
      bonusOrbCount++;
      bonusSpins++;
      const w = simBonusOrb(totalBet, jp);
      bonusOrbWon += w; spinWon += w;
    } else if (result.triggerPC && !RTP_ONLY) {
      pcCount++;
      bonusSpins++;
      const w = simPickChoose(totalBet, jp);
      pcWon += w; spinWon += w;
    } else if (result.triggerRS && !RTP_ONLY) {
      rsCount++;
      bonusSpins++;
      const w = simRedSpin(totalBet, jp);
      rsWon += w; spinWon += w;
    }

    totalWon += spinWon;
    blockWon += spinWon;

    if ((spin + 1) % 1000 === 0) {
      sessionWins.push(blockWon / (totalBet * 1000));
      blockWon = 0;
    }

    // Progress
    if ((spin + 1) % 250000 === 0) {
      const pct = ((spin + 1) / spins * 100).toFixed(0);
      const rtp = (totalWon / totalWagered * 100).toFixed(2);
      process.stdout.write(`\r  Progress: ${pct}% — RTP so far: ${rtp}%    `);
    }
  }
  process.stdout.write('\r' + ' '.repeat(50) + '\r');

  // Variance
  const meanBlock = sessionWins.reduce((a, b) => a + b, 0) / sessionWins.length;
  const variance  = sessionWins.reduce((a, v) => a + (v - meanBlock) ** 2, 0) / sessionWins.length;
  const stdDev    = Math.sqrt(variance);

  return {
    spins, denom, lines, creditsPerLine, betPerLine, totalBet,
    totalWagered, totalWon, rtp: totalWon / totalWagered,
    baseWon, baseRTP: baseWon / totalWagered,
    hsWon,   hsRTP: hsWon / totalWagered,   hsCount,
    pcWon,   pcRTP: pcWon / totalWagered,   pcCount,
    rsWon,   rsRTP: rsWon / totalWagered,   rsCount,
    bonusOrbWon, bonusOrbRTP: bonusOrbWon / totalWagered, bonusOrbCount,
    charJPWon, charJPRTP: charJPWon / totalWagered,
    jpWon, jpHits,
    winningSpins, winRate: winningSpins / spins,
    bonusSpins, bonusRate: bonusSpins / spins,
    hsRate:       hsCount / spins,
    pcRate:       pcCount / spins,
    rsRate:       rsCount / spins,
    bonusOrbRate: bonusOrbCount / spins,
    stdDev,
  };
}

// ══════════════════════════════════════════════════════════════════════
// REPORTING
// ══════════════════════════════════════════════════════════════════════
function pct(v)   { return (v * 100).toFixed(3) + '%'; }
function freq(n)  { return n > 0 ? ('1-in-' + Math.round(1/n).toLocaleString()) : 'never'; }
function dollar(v){ return '$' + v.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}); }
function num(v)   { return v.toLocaleString(); }

function printReport(r) {
  const sep = '═'.repeat(68);
  const div = '─'.repeat(68);
  console.log('\n' + sep);
  console.log(` TURRELLE SISTERS BIG MUNNY — Monte Carlo v2 — ${new Date().toISOString().slice(0,10)}`);
  console.log(sep);
  console.log(` Denomination:  ${dollar(r.denom)}   Lines: ${r.lines}   Credits/Line: ${r.creditsPerLine}`);
  console.log(` Total Bet:     ${dollar(r.totalBet)}   Spins: ${num(r.spins).padStart(12)}`);
  console.log(div);

  console.log('\n ── RTP SUMMARY ──────────────────────────────────────────────────');
  console.log(` Total RTP:              ${pct(r.rtp).padStart(10)}   (target: ~94.0%)`);
  console.log(` Base Game RTP:          ${pct(r.baseRTP).padStart(10)}   (target: ~68.0%)`);
  console.log(` Hold & Spin RTP:        ${pct(r.hsRTP).padStart(10)}   (target: ~11.0%)`);
  console.log(` Pick & Choose RTP:      ${pct(r.pcRTP).padStart(10)}   (target: ~9.0%)`);
  console.log(` Red Spin RTP:           ${pct(r.rsRTP).padStart(10)}   (target: ~5.5%)`);
  console.log(` BONUS Orb RTP:          ${pct(r.bonusOrbRTP).padStart(10)}`);
  console.log(` Char Jackpot RTP:       ${pct(r.charJPRTP).padStart(10)}`);
  const unifiedJPRTP = (Object.values(r.jpWon).reduce((a,b)=>a+b,0) - r.charJPWon) / r.totalWagered;
  console.log(` Unified Jackpot RTP:    ${pct(Math.max(0,unifiedJPRTP)).padStart(10)}`);

  console.log('\n ── TRIGGER RATES ────────────────────────────────────────────────');
  console.log(` Win Rate:               ${pct(r.winRate).padStart(10)}   (${num(r.winningSpins)} wins)`);
  console.log(` Hold & Spin:            ${pct(r.hsRate).padStart(10)}   ${freq(r.hsRate)}   (${num(r.hsCount)} triggers)`);
  console.log(` Pick & Choose:          ${pct(r.pcRate).padStart(10)}   ${freq(r.pcRate)}   (${num(r.pcCount)} triggers)`);
  console.log(` Red Spin:               ${pct(r.rsRate).padStart(10)}   ${freq(r.rsRate)}   (${num(r.rsCount)} triggers)`);
  console.log(` BONUS Orb:              ${pct(r.bonusOrbRate).padStart(10)}   ${freq(r.bonusOrbRate)}   (${num(r.bonusOrbCount)} triggers)`);

  console.log('\n ── JACKPOT HITS ─────────────────────────────────────────────────');
  for (const t of ['MINI','MINOR','MAJOR','GRAND']) {
    const rate = r.jpHits[t] / r.spins;
    console.log(` ${t.padEnd(6)} hits: ${String(r.jpHits[t]).padStart(6)}  freq: ${freq(rate).padStart(14)}  total: ${dollar(r.jpWon[t])}`);
  }

  console.log('\n ── VARIANCE ─────────────────────────────────────────────────────');
  console.log(` Std Dev (1k-spin RTP blocks): ${(r.stdDev * 100).toFixed(3)}%`);
  console.log(` Hit Rate:                     ${pct(r.winRate)} (${num(r.winningSpins)} winning spins of ${num(r.spins)})`);

  // Flag any out-of-spec values
  console.log('\n ── SPEC CHECK ───────────────────────────────────────────────────');
  const checks = [
    [ r.rtp,       0.90, 0.98, 'Total RTP',       '90–98%'   ],
    [ r.baseRTP,   0.60, 0.75, 'Base RTP',         '60–75%'   ],
    [ r.hsRTP,     0.08, 0.15, 'H&S RTP',          '8–15%'    ],
    [ r.pcRTP,     0.06, 0.14, 'P&C RTP',          '6–14%'    ],
    [ r.rsRTP,     0.03, 0.10, 'RS RTP',           '3–10%'    ],
    [ r.hsRate,    1/60,  1/20, 'H&S rate',         '1-in-20–60'],
    [ r.rsRate,    0.02, 0.10, 'RS rate',           '2–10%'    ],
    [ r.winRate,   0.40, 0.65, 'Win rate',          '40–65%'   ],
  ];
  for (const [val, lo, hi, label, range] of checks) {
    const ok = val >= lo && val <= hi;
    console.log(` ${ok ? '✅' : '⚠️ '} ${label.padEnd(14)} ${pct(val).padStart(10)}   expected: ${range}`);
  }

  console.log('\n' + sep + '\n');
}

// ══════════════════════════════════════════════════════════════════════
// ENTRY POINT
// ══════════════════════════════════════════════════════════════════════
if (RUN_FULL) {
  // Run across all denominations with 5M spins each
  const denoms = DENOMINATIONS.slice(0, 7); // 1¢ through $1 — most common
  console.log(`\n🎰 FULL CALIBRATION RUN — ${(SPINS/1e6).toFixed(1)}M spins × ${denoms.length} denoms\n`);
  for (const d of denoms) {
    console.log(`\n▶ Running denom ${dollar(d)}...`);
    const result = runSimulation(SPINS, d, LINES, CREDITS);
    printReport(result);
  }
} else {
  console.log(`\n🎰 Running ${num(SPINS)} spins @ ${dollar(DENOM)} denom, ${LINES} lines, ${CREDITS} credit/line${RTP_ONLY ? ' (RTP only)' : ''}...\n`);
  const result = runSimulation(SPINS, DENOM, LINES, CREDITS);
  printReport(result);
}
