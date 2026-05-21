'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// Turrelle Sisters — Monte Carlo RTP Simulator
// Run: node tools/monte_carlo.js [spins] [denom]
// Defaults: 1,000,000 spins, $0.05 denom
//
// FIXED v6l90:
//   - Path: relative ../paytable.js (no hardcoded absolute path)
//   - evalLine: wild multiplier removed — base pays only (matches game.js evalLine)
//   - trigRS: gated on win > 0 (was firing on every spin)
//   - trigPC: Lipstick on center ROW (row index 1), not payline 5-oak
//   - simHS: for..of loops replaced with indexed for (Node.js safe either way, but consistent)
//   - bonusBottom: checks LETTER_IDS[col] for each column on bottom ROW (row 2) only
//   - Priority order: H&S > P&C > RS (matches game.js executeSpin)
//   - Letter pays: check all 3 rows, left-contiguous, correct LETTER_IDS per column
// ═══════════════════════════════════════════════════════════════════════════════

var path = require('path');
var pt   = require(path.join(__dirname, '..', 'paytable.js'));

var SYMBOLS              = pt.SYMBOLS;
var WILD_IDS             = pt.WILD_IDS;
var SCATTER_ID           = pt.SCATTER_ID;
var BONUS_ID             = pt.BONUS_ID;
var BONUS_PC_ID          = pt.BONUS_PC_ID;
var PAY_TABLE            = pt.PAY_TABLE;
var LETTER_IDS           = pt.LETTER_IDS;
var BONUS_LETTER_PAYS    = pt.BONUS_LETTER_PAYS;
var MIXED_BAR_PAY        = pt.MIXED_BAR_PAY;
var BAR_IDS              = pt.BAR_IDS;
var REEL_STRIPS          = pt.REEL_STRIPS;
var REEL_SIZE            = pt.REEL_SIZE;
var PAYLINES             = pt.PAYLINES;
var RED_SPIN_FREQUENCY_DEFAULT  = pt.RED_SPIN_FREQUENCY_DEFAULT;
var RED_SPIN_CONTINUANCE_DEFAULT = pt.RED_SPIN_CONTINUANCE_DEFAULT;
var HOLD_SPIN_LAND_PROBABILITY  = pt.HOLD_SPIN_LAND_PROBABILITY;
var HOLD_SPIN_CASH_TIERS        = pt.HOLD_SPIN_CASH_TIERS;
var HOLD_SPIN_JACKPOT_TIERS     = pt.HOLD_SPIN_JACKPOT_TIERS;
var PICK_CHOOSE_CASH_TIERS      = pt.PICK_CHOOSE_CASH_TIERS;
var PICK_CHOOSE_PRIZES          = pt.PICK_CHOOSE_PRIZES;
var getJackpotSeedsForDenom     = pt.getJackpotSeedsForDenom;

// ── Config ───────────────────────────────────────────────────────────────────
var SPINS = parseInt(process.argv[2]) || 1000000;
var DENOM = parseFloat(process.argv[3]) || 0.05;
var LINES = 20;
var CPL   = 5;        // credits per line
var BPL   = DENOM * CPL;
var TOTAL = BPL * LINES;
var SEEDS = getJackpotSeedsForDenom(DENOM);

// ── Helpers ──────────────────────────────────────────────────────────────────
function rs() { return Math.random(); }

function randStops() {
  var stops = [];
  for (var i = 0; i < REEL_STRIPS.length; i++) {
    stops.push(Math.floor(rs() * REEL_STRIPS[i].length));
  }
  return stops;
}

function grid(stops) {
  var g = [];
  for (var i = 0; i < stops.length; i++) {
    var sz  = REEL_STRIPS[i].length;
    var s   = stops[i];
    g.push([
      REEL_STRIPS[i][(s - 1 + sz) % sz],
      REEL_STRIPS[i][s],
      REEL_STRIPS[i][(s + 1) % sz],
    ]);
  }
  return g;
}

// ── Line evaluator — BASE PAY ONLY, no wild multiplier ──────────────────────
// Matches game.js evaluateLine() base path. Wild multiplier is applied separately
// in the game and only affects display/credit, not RTP simulation at this level.
function evalLine(syms) {
  var wc = 0, ms = null;
  for (var i = 0; i < 5; i++) {
    if (WILD_IDS.indexOf(syms[i]) >= 0) wc++;
    else { ms = syms[i]; break; }
  }
  // All wilds — treat as best wild (Josie) for pay lookup
  if (ms === null && wc > 0) { ms = SYMBOLS.JOSIE.id; wc = 0; }

  var mc = wc;
  for (var j = wc; j < 5; j++) {
    if (syms[j] === ms) mc++;
    else if (WILD_IDS.indexOf(syms[j]) >= 0) mc++;
    else break;
  }
  if (mc < 2) return 0;
  if (ms === BONUS_ID || ms === BONUS_PC_ID) return 0; // Neither gold coin nor lipstick pays on lines

  var sk = null;
  var keys = Object.keys(SYMBOLS);
  for (var ki = 0; ki < keys.length; ki++) {
    if (SYMBOLS[keys[ki]].id === ms) { sk = keys[ki]; break; }
  }
  if (!sk || !PAY_TABLE[sk]) return 0;

  var pays = PAY_TABLE[sk];
  var pi   = Math.max(0, 5 - mc);
  if (pi >= pays.length || pays[pi] === 0) return 0;

  // Wild multiplier — owner confirmed 2026-05-20 (v6l96)
  // Additive: Josie contributes ×2, Sasha contributes ×1, minimum ×1
  // Applies to regular payline pays only — jackpots always pay fixed seed.
  var wildIdsInCombo = syms.slice(0, mc).filter(function(s) { return WILD_IDS.indexOf(s) >= 0; });
  var josieCount = wildIdsInCombo.filter(function(id) { return id === SYMBOLS.JOSIE.id; }).length;
  var sashaCount = wildIdsInCombo.filter(function(id) { return id === SYMBOLS.SASHA.id; }).length;
  var multiplier = Math.max(1, josieCount * 2 + sashaCount * 1);
  return pays[pi] * BPL * multiplier;
}

// ── Spin evaluator ───────────────────────────────────────────────────────────
function evalSpin(g) {
  var win = 0, coins = 0;

  // Count gold coins across full 3×5 grid
  for (var c = 0; c < 5; c++) {
    for (var r = 0; r < 3; r++) {
      if (g[c][r] === BONUS_ID) coins++;
    }
  }

  // Payline wins
  for (var li = 0; li < LINES; li++) {
    var pl   = PAYLINES[li];
    var syms = [];
    for (var ci = 0; ci < 5; ci++) syms.push(g[ci][pl[ci]]);
    win += evalLine(syms);
  }

  // Mixed bar wins (3–4 any-bar left-contiguous on any payline)
  for (var mi = 0; mi < LINES; mi++) {
    var mpl = PAYLINES[mi], mbc = 0;
    for (var mc2 = 0; mc2 < 5; mc2++) {
      if (BAR_IDS.indexOf(g[mc2][mpl[mc2]]) >= 0) mbc++;
      else break;
    }
    if (mbc >= 3 && mbc < 5) win += (MIXED_BAR_PAY[mbc] || 0) * BPL;
  }

  // Letter pays — all 3 rows, left-contiguous, per-column LETTER_ID check
  for (var row = 0; row < 3; row++) {
    var cnt = 0;
    for (var col = 0; col < 5; col++) {
      if (g[col][row] === LETTER_IDS[col]) cnt++;
      else break;
    }
    if (cnt >= 1) win += (BONUS_LETTER_PAYS[cnt] || 0) * BPL;
  }

  // Character jackpots (5-oak on any payline)
  var jpWin = 0, jpType = null;
  for (var jli = 0; jli < LINES; jli++) {
    var jpl   = PAYLINES[jli];
    var jsyms = [];
    for (var jci = 0; jci < 5; jci++) jsyms.push(g[jci][jpl[jci]]);
    var allMatch = function(id) {
      for (var x = 0; x < jsyms.length; x++) if (jsyms[x] !== id) return false;
      return true;
    };
    if (allMatch(SYMBOLS.SISTERS.id)) { jpWin = SEEDS.GRAND || 2000; jpType = 'GRAND'; break; }
    if (!jpType && allMatch(SYMBOLS.JOSIE.id))  { jpWin = SEEDS.MINOR || 60;   jpType = 'MINOR'; }
    if (!jpType && allMatch(SYMBOLS.SASHA.id))  { jpWin = SEEDS.MINI  || 20;   jpType = 'MINI';  }
  }

  // ── Trigger flags ─────────────────────────────────────────────────────────
  // H&S: 6+ gold coins visible in grid
  var trigHS = coins >= 6;

  // P&C: 5-oak Lipstick on PAYLINE 0 (center row [1,1,1,1,1]) — matches game.js line 192
  var pl0    = PAYLINES[0]; // [1,1,1,1,1]
  var trigPC = true;
  for (var pcc = 0; pcc < 5; pcc++) {
    if (g[pcc][pl0[pcc]] !== BONUS_PC_ID) { trigPC = false; break; }
  }

  // BONUS: all 5 LETTER_IDs on BOTTOM ROW (row 2) of their respective columns
  var trigBonus = true;
  for (var bc = 0; bc < 5; bc++) {
    if (g[bc][2] !== LETTER_IDS[bc]) { trigBonus = false; break; }
  }

  // RS: only on a winning spin (win > 0), gated by frequency
  // H&S takes priority — RS does not fire when H&S triggered
  var trigRS = !trigHS && win > 0 && rs() < RED_SPIN_FREQUENCY_DEFAULT;

  return {
    win: win, coins: coins,
    trigHS: trigHS, trigRS: trigRS,
    trigPC: trigPC, trigBonus: trigBonus,
    jpWin: jpWin, jpType: jpType,
  };
}

// ── H&S simulator ────────────────────────────────────────────────────────────
function simHS(initCoins) {
  var board = [];
  for (var bi = 0; bi < 15; bi++) board.push(false);
  var occ = 0, placed = 0;

  // Place trigger coins
  while (placed < Math.min(initCoins, 15)) {
    var c = Math.floor(rs() * 15);
    if (!board[c]) { board[c] = true; occ++; placed++; }
  }

  // Respin loop
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

  // Payout — cash tiers + jackpot tiers
  var cap = TOTAL < 1 ? 3 : TOTAL <= 5 ? 25 : Infinity;
  var win = 0;
  for (var ci = 0; ci < occ; ci++) {
    var jr = rs(), cjp = 0, isJp = false;
    for (var jt = 0; jt < HOLD_SPIN_JACKPOT_TIERS.length; jt++) {
      cjp += HOLD_SPIN_JACKPOT_TIERS[jt].weight;
      if (jr < cjp) {
        win  += SEEDS[HOLD_SPIN_JACKPOT_TIERS[jt].level] || 0;
        isJp  = true; break;
      }
    }
    if (!isJp) {
      var r2 = rs(), cum = 0;
      for (var ct = 0; ct < HOLD_SPIN_CASH_TIERS.length; ct++) {
        cum += HOLD_SPIN_CASH_TIERS[ct].weight;
        if (r2 < cum) {
          var f = HOLD_SPIN_CASH_TIERS[ct].minFrac + rs() * (HOLD_SPIN_CASH_TIERS[ct].maxFrac - HOLD_SPIN_CASH_TIERS[ct].minFrac);
          win += Math.round(Math.min(f * TOTAL, cap));
          break;
        }
      }
    }
  }
  return { win: win, coins: occ };
}

// ── Red Spin simulator ───────────────────────────────────────────────────────
// Tier config — owner confirmed 2026-05-18
var TIER_MULT = [
  { min: 1,    max: 10  },   // T1 Small
  { min: 10,   max: 35  },   // T2 Medium
  { min: 35,   max: 200 },   // T3 Large
  { min: null, max: null },  // T4 Sisters Grand
];
var JP_ODDS  = 0.02;
var JP_POOLS = [
  ['MINI'],
  ['MINOR','MINI','MINI','MINI','MINI','MINI','MINI','MINI','MINI','MINI'],
  ['MAJOR','MINOR','MINOR','MINOR','MINI','MINI','MINI','MINI','MINI','MINI'],
  ['GRAND'],
];
var ADV_PROB  = 0.20;
var CONT_PROB = RED_SPIN_CONTINUANCE_DEFAULT; // 60% — owner confirmed 2026-05-18

// Per-run counters (reset each sim run)
var jpByTier   = [0, 0, 0, 0];
var jpTypeHits = { MINI: 0, MINOR: 0, MAJOR: 0, GRAND: 0 };
var tierSpins  = [0, 0, 0, 0];
var tierSeqs   = [0, 0, 0, 0];
var rsSpinTotal = 0, rsSeqCount = 0;

function simRS(prevWin) {
  rsSeqCount++;
  var total = 0;
  var last  = Math.max(prevWin || 0, TOTAL);
  var tier  = 0, firstInTier = true, jpFired = false, spins = 0;
  var lastStops = [], lastPlKey = '';
  tierSeqs[0]++;

  while (true) {
    spins++; rsSpinTotal++;
    tierSpins[tier]++;

    // T4: Sisters Grand — always pays, always ends
    if (tier === 3) {
      var gv = SEEDS.GRAND || 10000;
      total += gv;
      jpByTier[3]++; jpTypeHits.GRAND++;
      break;
    }

    var tMin    = TIER_MULT[tier].min * TOTAL;
    var tMax    = TIER_MULT[tier].max * TOTAL;
    var spinWin = 0;

    // JP roll — once per tier entry
    if (!jpFired && rs() < JP_ODDS) {
      var pool   = JP_POOLS[tier];
      var jpType = pool[Math.floor(rs() * pool.length)];
      spinWin    = SEEDS[jpType] || 0;
      jpFired    = true;
      jpByTier[tier]++;
      jpTypeHits[jpType] = (jpTypeHits[jpType] || 0) + 1;
      lastStops = []; lastPlKey = '';

    } else {
      // Find a valid spin: win in tier range, escalating from last
      var found = false, att = 0;
      var curStops = [], curPlKey = '';
      while (!found && att < 800) {
        curStops = randStops();
        var g2   = grid(curStops);
        var r2   = evalSpin(g2);
        // Build payline key from active winning lines
        var winLines = [];
        for (var wli = 0; wli < LINES; wli++) {
          var wpl   = PAYLINES[wli];
          var wsyms = [];
          for (var wci = 0; wci < 5; wci++) wsyms.push(g2[wci][wpl[wci]]);
          if (evalLine(wsyms) > 0) winLines.push(wli);
        }
        curPlKey = winLines.sort().join(',');
        var stopsMatch = lastStops.length === 5 && curStops.every(function(s, i) { return s === lastStops[i]; });
        var plMatch    = curPlKey !== '' && curPlKey === lastPlKey;
        if (r2.win >= last && r2.win >= tMin && r2.win <= tMax && (!stopsMatch || !plMatch)) {
          spinWin = r2.win; found = true;
        }
        att++;
      }
      if (!found) {
        // Fallback: T1 advances to T2. T2/T3 end.
        if (tier === 0) { tier++; firstInTier = true; jpFired = false; tierSeqs[tier]++; continue; }
        else break;
      }
      lastStops = curStops; lastPlKey = curPlKey;
    }

    total += spinWin;
    last   = spinWin;

    // Tier advance if JP or win exceeded ceiling
    if (spinWin > tMax && tier < 3) {
      tier++; firstInTier = true; jpFired = false; tierSeqs[tier]++;
      lastStops = []; lastPlKey = '';
      continue;
    }

    // Continuance / advancement roll
    if (firstInTier) {
      firstInTier = false;
    } else {
      if (rs() >= CONT_PROB) {
        if (tier < 3 && rs() < ADV_PROB) {
          tier++; firstInTier = true; jpFired = false; tierSeqs[tier]++;
          lastStops = []; lastPlKey = '';
        } else { break; }
      }
    }

    if (spins >= 100) break; // safety ceiling
  }
  return { win: total, spins: spins };
}

// ── Pick & Choose simulator ───────────────────────────────────────────────────
function simPC() {
  var r2 = rs(), cum = 0, prizeType = 'cash';
  for (var pi = 0; pi < PICK_CHOOSE_PRIZES.length; pi++) {
    cum += PICK_CHOOSE_PRIZES[pi].weight;
    if (r2 < cum) { prizeType = PICK_CHOOSE_PRIZES[pi].type; break; }
  }
  if (prizeType === 'cash') {
    var ti = Math.floor(rs() * PICK_CHOOSE_CASH_TIERS.length);
    var t  = PICK_CHOOSE_CASH_TIERS[ti];
    return Math.round(TOTAL * (t.minMult + rs() * (t.maxMult - t.minMult)));
  }
  if (prizeType === 'hold_spin') return simHS(6).win;
  if (prizeType === 'red_spin')  return simRS(TOTAL).win;
  return SEEDS[(prizeType || 'MINI').toUpperCase()] || SEEDS.MINI || 20;
}

// ── Main loop ─────────────────────────────────────────────────────────────────
var baseW = 0, hsW = 0, rsW = 0, pcW = 0, bonW = 0, jpW = 0;
var hsTrig = 0, rsTrig = 0, pcTrig = 0, bonTrig = 0, jpTrig = 0;
var wagered = SPINS * TOTAL;

process.stderr.write('Monte Carlo: ' + SPINS.toLocaleString() + ' spins @ $' + TOTAL.toFixed(2) + '/spin (' + DENOM + ' denom)...\n');

for (var s = 0; s < SPINS; s++) {
  if (s % 100000 === 0) process.stderr.write('\r  ' + (s / SPINS * 100).toFixed(0) + '%...');

  var g   = grid(randStops());
  var res = evalSpin(g);

  baseW += res.win;
  if (res.jpWin) { jpTrig++; jpW += res.jpWin; }

  // Priority order matching game.js: H&S > P&C > RS
  if (res.trigHS) {
    hsTrig++;
    var hr = simHS(res.coins);
    hsW += hr.win;
  } else if (res.trigPC) {
    pcTrig++; pcW += simPC();
  } else if (res.trigRS) {
    // trigRS already excludes H&S wins (gated in evalSpin)
    rsTrig++;
    var rr = simRS(res.win);
    rsW += rr.win;
  }

  // BONUS orb — independent of above (bottom row trigger)
  if (res.trigBonus) { bonTrig++; bonW += simPC(); }
}
process.stderr.write('\n');

// ── Output ────────────────────────────────────────────────────────────────────
var totalPaid = baseW + hsW + rsW + pcW + bonW + jpW;
function P(v)  { return (v / wagered * 100).toFixed(2) + '%'; }
function fmt(n) { return '$' + n.toFixed(2); }
function rate(t) { return t > 0 ? '1 in ' + Math.round(SPINS / t) : 'never'; }

console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║  MONTE CARLO RESULTS                                 ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log('Denom: $' + DENOM + ' | ' + CPL + 'cr/line | ' + LINES + ' lines | Bet: ' + fmt(TOTAL) + '/spin');
console.log('Spins: ' + SPINS.toLocaleString() + ' | Wagered: ' + fmt(wagered));
console.log('RS_FREQ=' + RED_SPIN_FREQUENCY_DEFAULT + ' | RS_CONT=' + RED_SPIN_CONTINUANCE_DEFAULT + ' | HS_LAND=' + HOLD_SPIN_LAND_PROBABILITY);
console.log('─────────────────────────────────────────────────────────');
console.log('BASE GAME    ' + fmt(baseW).padStart(14) + '  RTP: ' + P(baseW));
console.log('H&S BONUS    ' + fmt(hsW).padStart(14) + '  RTP: ' + P(hsW) +
            '  trig: ' + hsTrig.toLocaleString() + ' (' + rate(hsTrig) + ')' +
            '  avg: ' + fmt(hsTrig ? hsW / hsTrig : 0));
console.log('RED SPIN     ' + fmt(rsW).padStart(14) + '  RTP: ' + P(rsW) +
            '  trig: ' + rsTrig.toLocaleString() + ' (' + rate(rsTrig) + ')' +
            '  avg: ' + fmt(rsTrig ? rsW / rsTrig : 0));
console.log('  avg spins/seq: ' + (rsTrig ? rsSpinTotal / rsTrig : 0).toFixed(2));
console.log('  Tier sequences:');
var tNames = ['T1 Small','T2 Medium','T3 Large','T4 Sisters'];
for (var ti = 0; ti < 4; ti++) {
  var pct = rsTrig ? (tierSeqs[ti] / rsTrig * 100).toFixed(1) + '%' : '0%';
  console.log('    ' + tNames[ti] + ': ' + tierSeqs[ti].toLocaleString() + ' (' + pct + ')  ' + tierSpins[ti].toLocaleString() + ' spins');
}
console.log('  JP hits: MINI=' + jpTypeHits.MINI + ' MINOR=' + jpTypeHits.MINOR +
            ' MAJOR=' + jpTypeHits.MAJOR + ' GRAND=' + jpTypeHits.GRAND);
console.log('PICK & CHOOSE' + fmt(pcW).padStart(14) + '  RTP: ' + P(pcW) +
            '  trig: ' + pcTrig.toLocaleString() + ' (' + rate(pcTrig) + ')' +
            '  avg: ' + fmt(pcTrig ? pcW / pcTrig : 0));
console.log('BONUS ORB    ' + fmt(bonW).padStart(14) + '  RTP: ' + P(bonW) +
            '  trig: ' + bonTrig.toLocaleString() + ' (' + rate(bonTrig) + ')');
console.log('BASE JPs     ' + fmt(jpW).padStart(14) + '  RTP: ' + P(jpW) +
            '  hits: ' + jpTrig.toLocaleString() + ' (' + rate(jpTrig) + ')');
console.log('─────────────────────────────────────────────────────────');
console.log('TOTAL        ' + fmt(totalPaid).padStart(14) + '  RTP: ' + P(totalPaid));
console.log('TARGET: 94% | GAP: ' + ((totalPaid / wagered * 100) - 94).toFixed(2) + '%');
