'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// Turrelle Sisters — Monte Carlo RTP Simulator
// Run: node tools/monte_carlo.js [spins] [denom]
// Defaults: 500,000 spins, $0.05 denom
//
// v6l101 rewrite — unified jackpot system fully modelled:
//   - _checkUnifiedJackpot() fires once at each bonus entry (H&S, P&C, RS)
//   - Must-hit-by cap enforcement (2% grace zone)
//   - Progressive meter tracked across session (contributeToJackpots per spin)
//   - RS per-tier JP check uses _rollTierJackpot() — NOT old JP_POOLS/JP_ODDS
//   - H&S jackpot via entry check + Option X (guaranteed coin injection)
//   - P&C jackpot via match-3 tiles (tile pool includes jackpot types by weight)
//   - BONUS orb: bottom-row letter check only — no RNG shortcut
//   - Wild multiplier: max(1, josie×2 + sasha×1)
// ═══════════════════════════════════════════════════════════════════════════════

var path = require('path');
var pt   = require(path.join(__dirname, '..', 'paytable.js'));

var SYMBOLS              = pt.SYMBOLS;
var WILD_IDS             = pt.WILD_IDS;
var BONUS_ID             = pt.BONUS_ID;
var BONUS_PC_ID          = pt.BONUS_PC_ID;
var PAY_TABLE            = pt.PAY_TABLE;
var LETTER_IDS           = pt.LETTER_IDS;
var BONUS_LETTER_PAYS    = pt.BONUS_LETTER_PAYS;
var MIXED_BAR_PAY        = pt.MIXED_BAR_PAY;
var BAR_IDS              = pt.BAR_IDS;
var REEL_STRIPS          = pt.REEL_STRIPS;
var PAYLINES             = pt.PAYLINES;
var RED_SPIN_FREQUENCY_DEFAULT   = pt.RED_SPIN_FREQUENCY_DEFAULT;
var RED_SPIN_CONTINUANCE_DEFAULT = pt.RED_SPIN_CONTINUANCE_DEFAULT;
var RED_SPIN_TIERS               = pt.RED_SPIN_TIERS;
var RED_SPIN_TIER_ADVANCE_PROB   = pt.RED_SPIN_TIER_ADVANCE_PROB;
var HOLD_SPIN_LAND_PROBABILITY   = pt.HOLD_SPIN_LAND_PROBABILITY;
var HOLD_SPIN_CASH_TIERS         = pt.HOLD_SPIN_CASH_TIERS;
var PICK_CHOOSE_PRIZES           = pt.PICK_CHOOSE_PRIZES;
var PICK_CHOOSE_CASH_TIERS       = pt.PICK_CHOOSE_CASH_TIERS;
var JACKPOT_UNIFIED_PROBS        = pt.JACKPOT_UNIFIED_PROBS;
var JACKPOT_MHB_MULTIPLIERS      = pt.JACKPOT_MHB_MULTIPLIERS;
var JACKPOT_CONTRIBUTION_RATE_DEFAULT = pt.JACKPOT_CONTRIBUTION_RATE_DEFAULT;
var JACKPOT_SPLIT                = pt.JACKPOT_SPLIT;
var getJackpotSeedsForDenom      = pt.getJackpotSeedsForDenom;

// ── Config ────────────────────────────────────────────────────────────────────
var SPINS = parseInt(process.argv[2]) || 500000;
var DENOM = parseFloat(process.argv[3]) || 0.05;
var LINES = 20;
var CPL   = 5;
var BPL   = DENOM * CPL;
var TOTAL = BPL * LINES;
var SEEDS = getJackpotSeedsForDenom(DENOM);

// ── Progressive jackpot state ─────────────────────────────────────────────────
// Tracks live progressive values and must-hit-by caps across the simulation
var jpState = {
  MINI:  { current: SEEDS.MINI,  seed: SEEDS.MINI,  cap: SEEDS.MINI  * JACKPOT_MHB_MULTIPLIERS.MINI  },
  MINOR: { current: SEEDS.MINOR, seed: SEEDS.MINOR, cap: SEEDS.MINOR * JACKPOT_MHB_MULTIPLIERS.MINOR },
  MAJOR: { current: SEEDS.MAJOR, seed: SEEDS.MAJOR, cap: SEEDS.MAJOR * JACKPOT_MHB_MULTIPLIERS.MAJOR },
  GRAND: { current: SEEDS.GRAND, seed: SEEDS.GRAND, cap: SEEDS.GRAND * JACKPOT_MHB_MULTIPLIERS.GRAND },
};
var jpHits = { MINI: 0, MINOR: 0, MAJOR: 0, GRAND: 0 };
var jpTotal = 0;

function contributeJP(betTotal) {
  var pool = betTotal * JACKPOT_CONTRIBUTION_RATE_DEFAULT;
  Object.keys(jpState).forEach(function(k) {
    jpState[k].current += pool * JACKPOT_SPLIT[k];
  });
}

function awardJP(tier) {
  var amt = jpState[tier].current;
  jpState[tier].current = jpState[tier].seed; // reset to seed
  jpState[tier].cap = jpState[tier].seed * JACKPOT_MHB_MULTIPLIERS[tier]; // reset cap
  jpHits[tier]++;
  jpTotal += amt;
  return amt;
}

// ── Unified jackpot entry check ───────────────────────────────────────────────
// Mirrors _checkUnifiedJackpot() in bonuses.js exactly.
// Fires once per bonus entry. Returns tier name or null.
function checkUnifiedJackpot() {
  var tiers = ['GRAND', 'MAJOR', 'MINOR', 'MINI'];

  // Must-hit-by: force award when within 2% of cap (highest tier first)
  for (var i = 0; i < tiers.length; i++) {
    var t = tiers[i];
    if (jpState[t].current >= jpState[t].cap * 0.98) {
      return t;
    }
  }

  // Random roll — highest to lowest priority
  var p = JACKPOT_UNIFIED_PROBS;
  if (Math.random() < p.GRAND)  return 'GRAND';
  if (Math.random() < p.MAJOR)  return 'MAJOR';
  if (Math.random() < p.MINOR)  return 'MINOR';
  if (Math.random() < p.MINI)   return 'MINI';
  return null;
}

// ── Per-tier RS jackpot check ─────────────────────────────────────────────────
// Mirrors _rollTierJackpot() in bonuses.js.
// Fires once at tier entry. T1→MINI, T2→MINOR, T3→MAJOR. GRAND always eligible.
// Each RS tier entry is a full unified jackpot check — same probabilities as
// _checkUnifiedJackpot(). Must-hit-by caps enforced. Any tier can win in any RS tier.
// Owner confirmed 2026-05-21: tiered jackpots tied to unified system.
function rollTierJackpot() {
  // Must-hit-by: force award when within 2% of cap (highest tier first)
  var tiers = ['GRAND', 'MAJOR', 'MINOR', 'MINI'];
  for (var i = 0; i < tiers.length; i++) {
    var t = tiers[i];
    if (jpState[t].current >= jpState[t].cap * 0.98) return t;
  }
  // Full unified random roll — identical to checkUnifiedJackpot()
  var p = JACKPOT_UNIFIED_PROBS;
  if (Math.random() < p.GRAND)  return 'GRAND';
  if (Math.random() < p.MAJOR)  return 'MAJOR';
  if (Math.random() < p.MINOR)  return 'MINOR';
  if (Math.random() < p.MINI)   return 'MINI';
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function rs() { return Math.random(); }

function randStops() {
  return REEL_STRIPS.map(function(s) {
    return Math.floor(rs() * s.length);
  });
}

function grid(stops) {
  return stops.map(function(s, i) {
    var sz = REEL_STRIPS[i].length;
    return [
      REEL_STRIPS[i][(s - 1 + sz) % sz],
      REEL_STRIPS[i][s],
      REEL_STRIPS[i][(s + 1) % sz],
    ];
  });
}

// ── Line evaluator ────────────────────────────────────────────────────────────
function evalLine(syms) {
  var wc = 0, ms = null;
  for (var i = 0; i < 5; i++) {
    if (WILD_IDS.indexOf(syms[i]) >= 0) wc++;
    else { ms = syms[i]; break; }
  }
  if (ms === null && wc > 0) { ms = SYMBOLS.JOSIE.id; wc = 0; }

  var mc = wc;
  for (var j = wc; j < 5; j++) {
    if (syms[j] === ms) mc++;
    else if (WILD_IDS.indexOf(syms[j]) >= 0) mc++;
    else break;
  }
  if (mc < 2 || ms === BONUS_ID || ms === BONUS_PC_ID) return 0;

  var sk = null, keys = Object.keys(SYMBOLS);
  for (var ki = 0; ki < keys.length; ki++) {
    if (SYMBOLS[keys[ki]].id === ms) { sk = keys[ki]; break; }
  }
  if (!sk || !PAY_TABLE[sk]) return 0;

  var pays = PAY_TABLE[sk], pi = Math.max(0, 5 - mc);
  if (pi >= pays.length || pays[pi] === 0) return 0;

  // Wild multiplier: Josie×2 + Sasha×1, min 1
  var josie = 0, sasha = 0;
  for (var wi = 0; wi < mc; wi++) {
    if (WILD_IDS.indexOf(syms[wi]) >= 0) {
      if (syms[wi] === SYMBOLS.JOSIE.id) josie++;
      else sasha++;
    }
  }
  var mult = Math.max(1, josie * 2 + sasha * 1);
  return pays[pi] * BPL * mult;
}

// ── Character jackpot checker (BUG-D1 fix — v6l112 2026-05-21) ───────────────
// Mirrors checkCharacterJackpots() in game.js exactly (ES5).
// Scans all active paylines; returns highest tier hit or null.
// Rules (owner-confirmed / matching live game):
//   GRAND  = all 5 symbols are Sisters (id 0)
//   MAJOR  = all 5 symbols are wilds (any mix of Josie id 1 + Sasha id 2)
//   MINOR  = first 3 symbols are Josie
//   MINI   = first 3 symbols are Sasha
//   Highest tier wins; only one jackpot awarded per spin (live game rule).
//   Lines containing BONUS_ID (GOLD_COIN) are skipped (same as live game).
function checkCharJP(g) {
  var JOSIE_ID    = SYMBOLS.JOSIE.id;
  var SASHA_ID    = SYMBOLS.SASHA.id;
  var SISTERS_ID  = SYMBOLS.SISTERS.id;
  var tierOrder   = ['MINI', 'MINOR', 'MAJOR', 'GRAND'];
  var highestTier = null;

  for (var li = 0; li < LINES; li++) {
    var pl = PAYLINES[li];
    var syms = [g[0][pl[0]], g[1][pl[1]], g[2][pl[2]], g[3][pl[3]], g[4][pl[4]]];

    // Skip lines containing GOLD_COIN (BONUS_ID) — matches live game
    var hasBonus = false;
    for (var bi = 0; bi < 5; bi++) { if (syms[bi] === BONUS_ID) { hasBonus = true; break; } }
    if (hasBonus) continue;

    var lineTier = null;

    // GRAND: all 5 are Sisters
    var allSis = true;
    for (var si = 0; si < 5; si++) { if (syms[si] !== SISTERS_ID) { allSis = false; break; } }
    if (allSis) {
      lineTier = 'GRAND';
    } else {
      // MAJOR: all 5 are wilds (any mix of Josie + Sasha)
      var allW = true;
      for (var wi = 0; wi < 5; wi++) { if (WILD_IDS.indexOf(syms[wi]) < 0) { allW = false; break; } }
      if (allW) {
        lineTier = 'MAJOR';
      } else if (syms[0] === JOSIE_ID && syms[1] === JOSIE_ID && syms[2] === JOSIE_ID) {
        lineTier = 'MINOR';
      } else if (syms[0] === SASHA_ID && syms[1] === SASHA_ID && syms[2] === SASHA_ID) {
        lineTier = 'MINI';
      }
    }

    if (lineTier !== null) {
      if (highestTier === null ||
          tierOrder.indexOf(lineTier) > tierOrder.indexOf(highestTier)) {
        highestTier = lineTier;
      }
    }
  }
  return highestTier; // null = no character jackpot this spin
}

// ── Spin evaluator ─────────────────────────────────────────────────────────────
function evalSpin(g) {
  var win = 0, coins = 0;

  for (var c = 0; c < 5; c++) {
    for (var r = 0; r < 3; r++) {
      if (g[c][r] === BONUS_ID) coins++;
    }
  }

  for (var li = 0; li < LINES; li++) {
    var pl = PAYLINES[li], syms = [];
    for (var ci = 0; ci < 5; ci++) syms.push(g[ci][pl[ci]]);
    win += evalLine(syms);
  }

  // Mixed bar — BUG-D2 fix (v6l111 2026-05-21):
  // (A) changed mbc < 5 guard removed so 5-oak mixed combos (15×) are now paid.
  // (B) added allSame guard: skip if all matched bars are the same type (already
  //     paid as a regular payline win by evalLine — double-counting is wrong).
  for (var mi = 0; mi < LINES; mi++) {
    var mpl = PAYLINES[mi], mbc = 0;
    for (var mc2 = 0; mc2 < 5; mc2++) {
      if (BAR_IDS.indexOf(g[mc2][mpl[mc2]]) >= 0) mbc++;
      else break;
    }
    if (mbc >= 3) {
      // allSame check: if every bar in the run is identical, skip (handled by evalLine)
      var firstBar = g[0][mpl[0]];
      var allSame = true;
      for (var asc = 1; asc < mbc; asc++) {
        if (g[asc][mpl[asc]] !== firstBar) { allSame = false; break; }
      }
      if (!allSame) win += (MIXED_BAR_PAY[mbc] || 0) * BPL;
    }
  }

  // Letter pays
  for (var row = 0; row < 3; row++) {
    var cnt = 0;
    for (var col = 0; col < 5; col++) {
      if (g[col][row] === LETTER_IDS[col]) cnt++;
      else break;
    }
    if (cnt >= 1) win += (BONUS_LETTER_PAYS[cnt] || 0) * BPL;
  }

  // Trigger flags
  var trigHS = coins >= 6;

  var pl0 = PAYLINES[0];
  var trigPC = true;
  for (var pcc = 0; pcc < 5; pcc++) {
    if (g[pcc][pl0[pcc]] !== BONUS_PC_ID) { trigPC = false; break; }
  }

  var trigBonus = true;
  for (var bc = 0; bc < 5; bc++) {
    if (g[bc][2] !== LETTER_IDS[bc]) { trigBonus = false; break; }
  }

  // BUG-D3 fix (v6l111 2026-05-21): when BONUS triggers on the bottom row,
  // the live game subtracts the bottom-row partial pay (trigger takes priority
  // over the cash pay for that row). The MC was adding it unconditionally.
  // Subtract BONUS_LETTER_PAYS[4] * BPL here to match live game behaviour.
  if (trigBonus) {
    win -= (BONUS_LETTER_PAYS[4] || 0) * BPL;
  }

  var trigRS = !trigHS && win > 0 && rs() < RED_SPIN_FREQUENCY_DEFAULT;

  return { win: win, coins: coins, trigHS: trigHS, trigPC: trigPC, trigRS: trigRS, trigBonus: trigBonus };
}

// ── H&S simulator ─────────────────────────────────────────────────────────────
// Unified JP check fires at entry (Option X: JP coin guaranteed on board if won)
function simHS(initCoins, entryJP) {
  var board = new Array(15).fill(false);
  var occ = 0, placed = 0;
  while (placed < Math.min(initCoins, 15)) {
    var c = Math.floor(rs() * 15);
    if (!board[c]) { board[c] = true; occ++; placed++; }
  }

  var resp = 3;
  while (resp > 0 && occ < 15) {
    var landed = false;
    for (var i = 0; i < 15; i++) {
      if (!board[i] && rs() < HOLD_SPIN_LAND_PROBABILITY) {
        board[i] = true; occ++; landed = true;
      }
    }
    if (landed) resp = 3; else resp--;
  }

  // Cash payout for all landed coins
  var win = 0;
  var cap = Math.min(TOTAL * 25, 500);
  for (var ci = 0; ci < occ; ci++) {
    var r2 = rs(), cum = 0;
    var isJP = false;
    // Option X: one coin is the guaranteed jackpot coin (entry JP)
    // We award the JP separately at end — regular coins pay cash
    for (var ct = 0; ct < HOLD_SPIN_CASH_TIERS.length; ct++) {
      cum += HOLD_SPIN_CASH_TIERS[ct].weight;
      if (r2 < cum) {
        var f = HOLD_SPIN_CASH_TIERS[ct].minFrac
          + rs() * (HOLD_SPIN_CASH_TIERS[ct].maxFrac - HOLD_SPIN_CASH_TIERS[ct].minFrac);
        win += Math.min(f * TOTAL, cap);
        break;
      }
    }
  }

  // Award entry jackpot on top (Option X)
  var jpWin = 0;
  if (entryJP) jpWin = awardJP(entryJP);

  return { win: win + jpWin, coins: occ };
}

// ── RS simulator ───────────────────────────────────────────────────────────────
// Per-tier JP check via rollTierJackpot() at tier entry. Not per-spin.
function simRS(prevWin) {
  var total = 0;
  var last  = Math.max(prevWin || 0, TOTAL);
  var tier  = 0, firstInTier = true, spins = 0;

  // RS uses per-tier JP checks only (rollTierJackpot at each tier entry).
  // NO unified entry check — GRAND is possible from any tier via rollTierJackpot.
  // H&S uses unified entry check. P&C uses tile pool. RS uses tier-based system.

  while (true) {
    spins++;
    if (spins > 100) break;

    var T = RED_SPIN_TIERS[tier];

    // T4 Sisters: check for tier JP at entry, then play high-value spins
    if (!T || T.maxMult === null) {
      var t4JP = rollTierJackpot(); // T4 gets GRAND + MAJOR/MINOR if progressive qualifies
      if (t4JP) {
        total += awardJP(t4JP);
      } else {
        total += TOTAL * 201 + rs() * TOTAL * 50; // high-value T4 spin
      }
      break;
    }

    var tMin = T.minMult * TOTAL;
    var tMax = T.maxMult * TOTAL;

    // Per-tier JP at first spin of tier (not per-spin)
    var tierJP = null;
    if (firstInTier) {
      tierJP = rollTierJackpot();
    }

    var spinWin = 0;
    if (tierJP && firstInTier) {
      // 1-3 normal spins first, then JP spin (simplified: just award JP win)
      var normalSpins = 1 + Math.floor(rs() * 3);
      for (var ns = 0; ns < normalSpins; ns++) {
        var nw = tMin + rs() * (tMax - tMin);
        if (nw > last) { total += nw; last = nw; spins++; }
      }
      spinWin = awardJP(tierJP);
      total += spinWin;
      last = spinWin > last ? spinWin : last;
      firstInTier = false;
    } else {
      // Regular spin: random win within tier range, must exceed last
      var found = false;
      for (var att = 0; att < 200; att++) {
        var candidate = tMin + rs() * (tMax - tMin);
        if (candidate > last && candidate >= tMin && candidate <= tMax) {
          spinWin = candidate; found = true; break;
        }
      }
      if (!found) {
        // Fallback: advance tier or end
        if (tier < RED_SPIN_TIERS.length - 1) {
          tier++; firstInTier = true; last = tMax * 0.9;
          continue;
        } else { break; }
      }
      total += spinWin;
      last = spinWin;
      firstInTier = false;
    }

    // Continuance / advancement
    var cont = rs() < RED_SPIN_CONTINUANCE_DEFAULT;
    if (!cont) {
      var adv = tier < RED_SPIN_TIERS.length - 1 && rs() < RED_SPIN_TIER_ADVANCE_PROB;
      if (adv) { tier++; firstInTier = true; }
      else { break; }
    }
  }

  return { win: total, spins: spins };
}

// ── P&C simulator ──────────────────────────────────────────────────────────────
// Jackpots embedded in PRIZE_WEIGHTS tile pool (match-3 tiles).
// entryJP passed from H&S context when H&S is called from P&C prize route.
function simPC(entryJP) {
  // Determine prize from weighted table (jackpot tiles included in pool)
  var r2 = rs(), cum = 0, prizeType = 'cash';
  for (var pi = 0; pi < PICK_CHOOSE_PRIZES.length; pi++) {
    cum += PICK_CHOOSE_PRIZES[pi].weight;
    if (r2 < cum) { prizeType = PICK_CHOOSE_PRIZES[pi].type; break; }
  }

  var win = 0;
  if (prizeType === 'cash') {
    var ti = Math.floor(rs() * PICK_CHOOSE_CASH_TIERS.length);
    var t  = PICK_CHOOSE_CASH_TIERS[ti];
    win = TOTAL * (t.minMult + rs() * (t.maxMult - t.minMult));
  } else if (prizeType === 'hold_spin') {
    var pcHsJP = checkUnifiedJackpot(); // H&S sub-bonus gets its own JP check
    win = simHS(6, pcHsJP).win;
  } else if (prizeType === 'red_spin') {
    win = simRS(TOTAL).win;
  } else {
    // Jackpot tile matched (MINI/MINOR/MAJOR/GRAND)
    var jpKey = prizeType.toUpperCase();
    if (jpState[jpKey]) win = awardJP(jpKey);
  }

  // Award entry JP on top of match-3 prize
  if (entryJP) win += awardJP(entryJP);

  return win;
}

// ── Main loop ──────────────────────────────────────────────────────────────────
var baseW = 0, hsW = 0, rsW = 0, pcW = 0, bonW = 0;
var hsTrig = 0, rsTrig = 0, pcTrig = 0, bonTrig = 0, charJPTrig = 0;
var wagered = SPINS * TOTAL;

process.stderr.write('Monte Carlo v6l101: ' + SPINS.toLocaleString()
  + ' spins @ $' + TOTAL.toFixed(2) + '/spin (unified JP system)\n');

for (var s = 0; s < SPINS; s++) {
  if (s % 100000 === 0) process.stderr.write('\r  ' + (s / SPINS * 100).toFixed(0) + '%...');

  contributeJP(TOTAL);

  var g   = grid(randStops());
  var res = evalSpin(g);

  baseW += res.win;

  // BUG-D1 fix (v6l112 2026-05-21): character jackpot check — mirrors live game
  // processCharacterJackpots(). Fires every base-game spin; awards highest tier
  // only; result goes into baseW (base game RTP) and jpHits (jackpot breakdown).
  var charJP = checkCharJP(g);
  if (charJP) {
    charJPTrig++;
    baseW += awardJP(charJP);
  }

  // Priority: H&S > P&C > RS. BONUS orb independent.
  if (res.trigHS) {
    // H&S: unified entry check → guaranteed jackpot coin on board (Option X)
    hsTrig++;
    var hsJP = checkUnifiedJackpot();
    var hr   = simHS(res.coins, hsJP);
    hsW += hr.win;
  } else if (res.trigPC) {
    // P&C: jackpots via match-3 tile pool (embedded in PRIZE_WEIGHTS). No separate entry check.
    pcTrig++;
    pcW += simPC(null);
  } else if (res.trigRS) {
    // RS: per-tier checks via rollTierJackpot(). GRAND eligible every tier. No unified entry check.
    rsTrig++;
    var rr = simRS(res.win);
    rsW += rr.win;
  }

  // BONUS orb: bottom-row letters only. Routes to P&C equivalent.
  if (res.trigBonus) {
    bonTrig++;
    bonW += simPC(null);
  }
}
process.stderr.write('\n');

// ── Output ─────────────────────────────────────────────────────────────────────
var totalPaid = baseW + hsW + rsW + pcW + bonW + jpTotal;
// Note: jpTotal is already included in hsW/rsW/pcW via awardJP()
// Recalculate without double-counting: jpTotal tracks awarded amounts which are
// inside the bonus wins already — do not add separately
totalPaid = baseW + hsW + rsW + pcW + bonW;

function P(v) { return (v / wagered * 100).toFixed(2) + '%'; }
function fmt(n) { return '$' + n.toFixed(2); }
function rate(t) { return t > 0 ? '1 in ' + Math.round(SPINS / t) : 'never'; }

console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║  MONTE CARLO v6l112 — UNIFIED JP + CHARACTER JPs     ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log('Denom: $' + DENOM + ' | ' + CPL + 'cr/line | ' + LINES
  + ' lines | Bet: ' + fmt(TOTAL) + '/spin');
console.log('Spins: ' + SPINS.toLocaleString() + ' | Wagered: ' + fmt(wagered));
console.log('RS_FREQ=' + RED_SPIN_FREQUENCY_DEFAULT
  + ' | RS_CONT=' + RED_SPIN_CONTINUANCE_DEFAULT
  + ' | HS_LAND=' + HOLD_SPIN_LAND_PROBABILITY);
console.log('JP Unified: MINI=' + (JACKPOT_UNIFIED_PROBS.MINI*100).toFixed(2)
  + '% | MINOR=' + (JACKPOT_UNIFIED_PROBS.MINOR*100).toFixed(2)
  + '% | MAJOR=' + (JACKPOT_UNIFIED_PROBS.MAJOR*100).toFixed(2)
  + '% | GRAND=' + (JACKPOT_UNIFIED_PROBS.GRAND*100).toFixed(2) + '% per bonus entry');
console.log('─────────────────────────────────────────────────────────');
console.log('BASE GAME    ' + fmt(baseW).padStart(14) + '  RTP: ' + P(baseW)
  + '  (incl. char JPs: ' + charJPTrig.toLocaleString() + ' hits, ' + rate(charJPTrig) + ')');
console.log('H&S BONUS    ' + fmt(hsW).padStart(14) + '  RTP: ' + P(hsW)
  + '  trig: ' + hsTrig.toLocaleString() + ' (' + rate(hsTrig) + ')'
  + '  avg: ' + fmt(hsTrig ? hsW / hsTrig : 0));
console.log('RED SPIN     ' + fmt(rsW).padStart(14) + '  RTP: ' + P(rsW)
  + '  trig: ' + rsTrig.toLocaleString() + ' (' + rate(rsTrig) + ')'
  + '  avg: ' + fmt(rsTrig ? rsW / rsTrig : 0));
console.log('PICK&CHOOSE  ' + fmt(pcW).padStart(14) + '  RTP: ' + P(pcW)
  + '  trig: ' + pcTrig.toLocaleString() + ' (' + rate(pcTrig) + ')'
  + '  avg: ' + fmt(pcTrig ? pcW / pcTrig : 0));
console.log('BONUS ORB    ' + fmt(bonW).padStart(14) + '  RTP: ' + P(bonW)
  + '  trig: ' + bonTrig.toLocaleString() + ' (' + rate(bonTrig) + ')');
console.log('─────────────────────────────────────────────────────────');
console.log('JACKPOT BREAKDOWN (included in bonus totals above):');
console.log('  MINI:  ' + jpHits.MINI.toLocaleString()
  + ' hits (' + rate(jpHits.MINI) + ') — seed $' + SEEDS.MINI
  + ' cap $' + (SEEDS.MINI * JACKPOT_MHB_MULTIPLIERS.MINI).toFixed(0));
console.log('  MINOR: ' + jpHits.MINOR.toLocaleString()
  + ' hits (' + rate(jpHits.MINOR) + ') — seed $' + SEEDS.MINOR
  + ' cap $' + (SEEDS.MINOR * JACKPOT_MHB_MULTIPLIERS.MINOR).toFixed(0));
console.log('  MAJOR: ' + jpHits.MAJOR.toLocaleString()
  + ' hits (' + rate(jpHits.MAJOR) + ') — seed $' + SEEDS.MAJOR
  + ' cap $' + (SEEDS.MAJOR * JACKPOT_MHB_MULTIPLIERS.MAJOR).toFixed(0));
console.log('  GRAND: ' + jpHits.GRAND.toLocaleString()
  + ' hits (' + rate(jpHits.GRAND) + ') — seed $' + SEEDS.GRAND
  + ' cap $' + (SEEDS.GRAND * JACKPOT_MHB_MULTIPLIERS.GRAND).toFixed(0));
console.log('─────────────────────────────────────────────────────────');
console.log('TOTAL        ' + fmt(totalPaid).padStart(14) + '  RTP: ' + P(totalPaid));
console.log('TARGET: 94-98% | GAP: ' + ((totalPaid / wagered * 100) - 96).toFixed(2) + '%');
