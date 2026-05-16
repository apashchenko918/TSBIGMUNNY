'use strict';
/**
 * game.js — The Turrelle Sisters Big Munny v10
 */

class RNG {
  constructor() { this._buf = new Uint32Array(64); this._index = 64; }
  _refill() { crypto.getRandomValues(this._buf); this._index = 0; }
  next() { if (this._index >= this._buf.length) this._refill(); return this._buf[this._index++] / 0x100000000; }
  nextInt(min, max) { return Math.floor(this.next() * (max - min + 1)) + min; }
  chance(p) { return this.next() < p; }
}
const rng = new RNG();

// ── CURRENT SPIN SERIAL ──────────────────────────────────────────────
let _currentSpinSerial = '';

function generateReelStops() {
  const forced = GameState.operator.forceReelStops;
  return REEL_STRIPS.map((strip, r) => {
    if (forced[r] !== null && forced[r] !== undefined) {
      return Math.max(0, Math.min(strip.length - 1, forced[r]));
    }
    return rng.nextInt(0, strip.length - 1);
  });
}

function getVisibleSymbols(reelIndex, stopPosition) {
  const strip = REEL_STRIPS[reelIndex], len = strip.length;
  return [
    strip[(stopPosition - 1 + len) % len],
    strip[stopPosition],
    strip[(stopPosition + 1) % len],
  ];
}

function buildGrid(stops) {
  return stops.map((stop, r) => getVisibleSymbols(r, stop));
}

// ── WIN EVALUATION ───────────────────────────────────────────────────
function evaluateLine(lineSymbols, betPerLine) {
  let wildCount = 0, matchSymbol = null;
  for (let i = 0; i < lineSymbols.length; i++) {
    if (WILD_IDS.includes(lineSymbols[i])) wildCount++;
    else { matchSymbol = lineSymbols[i]; break; }
  }
  if (matchSymbol === null && wildCount > 0) { matchSymbol = SYMBOLS.JOSIE.id; wildCount = 0; }

  let matchCount = wildCount, extraWilds = 0;
  for (let i = wildCount; i < lineSymbols.length; i++) {
    if (lineSymbols[i] === matchSymbol) matchCount++;
    else if (WILD_IDS.includes(lineSymbols[i])) { matchCount++; extraWilds++; }
    else break;
  }
  if (matchCount < 2) return { amount: 0 };

  // Gold Coins never pay on paylines — only trigger Hold & Spin at 6+
  if (matchSymbol === BONUS_ID) return { amount: 0 };

  const symbolKey = Object.keys(SYMBOLS).find(k => SYMBOLS[k].id === matchSymbol);
  if (!symbolKey || !PAY_TABLE[symbolKey]) return { amount: 0 };
  const pays = PAY_TABLE[symbolKey];
  const payIndex = Math.max(0, 5 - matchCount);
  if (payIndex >= pays.length) return { amount: 0 };
  const basePay = pays[payIndex];
  if (basePay === 0) return { amount: 0 };

  // FIX: Identity-based wild multiplier — check WHICH wilds are in combo, not just count
  // Sasha alone (any count) = ×2 | Josie alone = ×4 | Both together = ×6
  // Scan the full combo window (leading wilds + body of matchCount symbols)
  const wildIdsInCombo = lineSymbols.slice(0, matchCount + extraWilds).filter(s => WILD_IDS.includes(s));
  const hasJosie = wildIdsInCombo.includes(SYMBOLS.JOSIE.id);
  const hasSasha = wildIdsInCombo.includes(SYMBOLS.SASHA.id);
  let multiplier = 1;
  if (wildIdsInCombo.length > 0) {
    if (hasJosie && hasSasha) multiplier = 6;
    else if (hasJosie)        multiplier = 4;
    else                      multiplier = 2; // Sasha only
  }
  const totalWildsInCombo = wildIdsInCombo.length;

  return { amount: basePay * betPerLine * multiplier, symbolKey, count: matchCount, wildCount: totalWildsInCombo, multiplier, basePay };
}
// ── CHERRY SPECIAL EVALUATION ─────────────────────────────────────────
// Pays on 1+ left-to-right starting reel 1, ANY row (not just paylines)
// Cherry: 1+ consecutive from reel 1, ALL rows pay simultaneously (not best row only)
// Returns { amount:total, wins:[{row,count,amount}] } for payline animation
function evaluateCherryWin(grid, betPerLine, activeLinesCount) {
  const cherryId   = SYMBOLS.CHERRY.id;
  const cherryPays = PAY_TABLE.CHERRY;
  let totalAmount = 0;
  const wins = [];
  for (let row = 0; row < 3; row++) {
    let count = 0;
    for (let col = 0; col < 5; col++) {
      if (grid[col][row] === cherryId) { count++; }
      else { break; }
    }
    if (count >= 1) {
      const idx = count >= 5 ? 0 : count === 4 ? 1 : count === 3 ? 2 : 3;
      const pay = (cherryPays[idx] || 0) * betPerLine;
      if (pay > 0) {
        totalAmount += pay;
        wins.push({ row, count, amount: pay });
      }
    }
  }
  // Return best row for animation (highest count), total for balance
  const best = wins.reduce((a,b) => b.count > a.count ? b : a, { row:-1, count:0, amount:0 });
  return { amount: totalAmount, row: best.row, count: best.count, wins };
}



// ── BONUS LETTER EVALUATION ───────────────────────────────────────────
// Checks each row for consecutive B-O-N-U-S letters starting from reel 1
// Returns: { count, row, triggerBonus } — best row result
function evaluateBonusLetters(grid) {
  var bestCount = 0, bestRow = -1;
  // Check each of the 3 rows
  for (var row = 0; row < 3; row++) {
    var count = 0;
    for (var col = 0; col < 5; col++) {
      var expectedId = LETTER_IDS[col]; // B=10 on col0, O=11 on col1, etc.
      if (grid[col][row] === expectedId) {
        count++;
      } else {
        break; // must be consecutive from reel 1
      }
    }
    if (count > bestCount) { bestCount = count; bestRow = row; }
  }
  return { count: bestCount, row: bestRow, triggerBonus: bestCount >= 5 };
}

// ── MIXED BAR EVALUATION ──────────────────────────────────────────────
// 5 of Any Bar (any mix of Single/Double/Triple Bar) on any active payline
// Only pays on 5 — no partial pay for 3 or 4
function evaluateMixedBars(grid, activeLinesCount, betPerLine) {
  // Mixed bar: 3,4,5 consecutive bars from reel 1 on active payline
  // 3 any bar = 5× | 4 any bar = 15× | 5 any bar = 35× bet/line
  // Wilds do NOT substitute. Pure same-bar 3/4/5-oak pays via normal paytable instead.
  var wins = [];
  var activeLines = PAYLINES.slice(0, activeLinesCount);
  activeLines.forEach(function(line, lineIndex) {
    var lineSyms = line.map(function(row, col) { return grid[col][row]; });

    // Count consecutive bars from reel 1
    var barCount = 0;
    for (var i = 0; i < 5; i++) {
      if (BAR_IDS.indexOf(lineSyms[i]) >= 0) barCount++;
      else break;
    }
    if (barCount < 3) return; // minimum 3 bars

    // Check if it's a pure same-bar combo (triple/double/single all same type)
    // Those are handled by regular payline evaluation — skip here
    var allSame = true;
    var firstBar = lineSyms[0];
    for (var j = 1; j < barCount; j++) {
      if (lineSyms[j] !== firstBar) { allSame = false; break; }
    }
    if (allSame) return; // pure same-bar pays via normal paytable

    // Mixed bar win
    var mixedPay = MIXED_BAR_PAY[barCount] || 0;
    if (mixedPay > 0) {
      wins.push({
        lineIndex: lineIndex, line: line,
        amount:    mixedPay * betPerLine,
        symbolKey: 'MIXED_BAR', count: barCount, isMixedBar: true,
      });
    }
  });
  return wins;
}

function evaluateSpin(grid, activeLinesCount, betPerLine) {
  const result = {
    paylineWins: [], scatterCount: 0, bonusCount: 0,
    totalWin: 0, triggerPickChoose: false, triggerHoldSpin: false,
    lipstickCount: 0,
  };

  let coinCount = 0;
  grid.forEach(col => col.forEach(symId => {
    if (symId === SCATTER_ID) result.scatterCount++;
    if (symId === BONUS_ID)   coinCount++;
  }));
  result.bonusCount    = coinCount;
  result.lipstickCount = result.scatterCount;
  result.scatterTriggered = false; // Set below if 5-oak lipstick lands on any active payline

  // Hold & Spin: 6+ gold coins anywhere in 15-position grid
  if (coinCount >= 6) result.triggerHoldSpin = true;

  const activeLines = PAYLINES.slice(0, activeLinesCount);
  activeLines.forEach((line, lineIndex) => {
    const lineSymbols = line.map((row, col) => grid[col][row]);
    // Skip lines with only Gold Coins (no value unless 6 trigger)
    const win = evaluateLine(lineSymbols, betPerLine);
    if (win.amount > 0) {
      result.paylineWins.push({ lineIndex, line, ...win });
      result.totalWin += win.amount;
      // LIPSTICK PAYLINE RULE: 5 Lipstick on any active payline = Pick & Choose trigger
      // The win has amount=0 per PAY_TABLE (5-oak pays 0 credits) but we still detect it
    }
    // Separately check for 5-oak lipstick — pays 0 credits but triggers P&C
    if (lineSymbols.every(id => id === SCATTER_ID)) {
      result.scatterTriggered = true;
    }
  });

  // Cherry special evaluation — 1+ left-to-right any row
  const cherryResult = evaluateCherryWin(grid, betPerLine, activeLinesCount);
  if (cherryResult.amount > 0) {
    // ALL rows pay simultaneously — add each winning row to paylineWins
    var lineColors = [0, 1, 2]; // different colors per row
    (cherryResult.wins || [{ row: cherryResult.row, count: cherryResult.count, amount: cherryResult.amount }]).forEach(function(cw, idx) {
      if (cw.row < 0) return;
      var cherryLine = [cw.row, cw.row, cw.row, cw.row, cw.row];
      result.paylineWins.push({
        lineIndex: lineColors[cw.row] || 0,
        line:      cherryLine,
        amount:    cw.amount,
        symbolKey: 'CHERRY',
        count:     cw.count,
        isCherry:  true,
      });
    });
    result.cherryWin = cherryResult.amount;
    result.totalWin += cherryResult.amount;
  }

  // Mixed Bar evaluation — 5 any bar on any payline
  var mixedBarWins = evaluateMixedBars(grid, activeLinesCount, betPerLine);
  mixedBarWins.forEach(function(win) {
    result.paylineWins.push(win);
    result.totalWin += win.amount;
  });

  // BONUS letter evaluation — B-O-N-U-S consecutive same row
  var letterResult = evaluateBonusLetters(grid);
  if (letterResult.count >= 1) {
    result.bonusLetterCount = letterResult.count;
    result.bonusLetterRow   = letterResult.row;
    if (letterResult.count >= 5) {
      result.triggerBonusFeature = true; // Full BONUS — triggers orb selection
    } else {
      // Partial pay
      var letterPay = BONUS_LETTER_PAYS[letterResult.count] || 0;
      if (letterPay > 0) {
        result.bonusLetterWin = letterPay * betPerLine;
        result.totalWin += result.bonusLetterWin;
      }
    }
  }

  // LIPSTICK TRIGGER: 5-oak on any active payline detected above — fire Pick & Choose
  if (result.scatterTriggered) {
    result.triggerPickChoose = true;
    result.scatterWin = 0; // Trigger only — no direct cash award
  }

  if (GameState.operator.maxWinPerSpin > 0) {
    result.totalWin = Math.min(result.totalWin, GameState.operator.maxWinPerSpin);
  }
  return result;
}

// ── JACKPOT CHECKS ───────────────────────────────────────────────────
function checkJackpot(context) {
  if (GameState.operator.forceJackpot !== 'none') {
    // If jackpot is set for base game context, only consume it in BASE_GAME checks
    // If set for bonus context, only consume it in non-BASE_GAME checks
    const jpCtx = GameState.operator.forceJackpotContext || 'bonus';
    const isBaseCheck = context === 'BASE_GAME';
    if (jpCtx === 'any' || (jpCtx === 'base' && isBaseCheck) || (jpCtx === 'bonus' && !isBaseCheck)) {
      const type = GameState.operator.forceJackpot;
      GameState.operator.forceJackpot = 'none';
      return { type, context, forced: true };
    }
  }
  const roll = rng.next();
  if (roll < JACKPOT_ODDS.GRAND)  return { type:'GRAND', context };
  if (roll < JACKPOT_ODDS.MAJOR)  return { type:'MAJOR', context };
  if (roll < JACKPOT_ODDS.MINOR)  return { type:'MINOR', context };
  if (roll < JACKPOT_ODDS.MINI)   return { type:'MINI',  context };
  return null;
}

async function processJackpotCheck(context) {
  const result = checkJackpot(context);
  if (!result) return null;
  const amount = awardJackpot(result.type);
  logEvent('JACKPOT_HIT', { bonusType:'JACKPOT', jackpotType:result.type, amount, context, serialNumber:_currentSpinSerial, balanceAfter:GameState.balance });
  if (typeof UI !== 'undefined') await UI.showJackpotCelebration(result.type, amount, context);
  return { ...result, amount };
}

// BASE GAME JACKPOTS — VGT Aristocrat style
// Scans ALL active paylines — jackpot fires on any active line
// MINI  = 3+ Sasha consecutive from reel 1 on any active payline
// MINOR = 3+ Josie consecutive from reel 1 on any active payline
// MAJOR = all 5 reels Josie/Sasha wilds on any active payline
// GRAND = all 5 reels Sisters on any active payline
// Gold Coins never trigger jackpots — only Hold & Spin
// Returns highest tier found — ONE jackpot per spin maximum
function checkCharacterJackpots(grid, activeLinesCount) {
  const activeLines = PAYLINES.slice(0, activeLinesCount);
  var highestTier = null;
  const tierOrder = ['MINI', 'MINOR', 'MAJOR', 'GRAND'];

  for (var li = 0; li < activeLines.length; li++) {
    const line = activeLines[li];
    const syms = line.map(function(row, col) { return grid[col][row]; });

    // Gold Coin on this line — skip, never a jackpot line
    if (syms.some(function(id) { return id === BONUS_ID; })) continue;

    var lineTier = null;

    // GRAND: all 5 Sisters on this payline
    if (syms.every(function(id) { return id === SYMBOLS.SISTERS.id; })) {
      lineTier = 'GRAND';
    }
    // MAJOR: all 5 wilds (Josie or Sasha) on this payline
    else if (syms.every(function(id) { return WILD_IDS.includes(id); })) {
      lineTier = 'MAJOR';
    }
    // MINOR: 3+ consecutive Josie from reel 1
    else if (syms[0] === SYMBOLS.JOSIE.id && syms[1] === SYMBOLS.JOSIE.id && syms[2] === SYMBOLS.JOSIE.id) {
      lineTier = 'MINOR';
    }
    // MINI: 3+ consecutive Sasha from reel 1
    else if (syms[0] === SYMBOLS.SASHA.id && syms[1] === SYMBOLS.SASHA.id && syms[2] === SYMBOLS.SASHA.id) {
      lineTier = 'MINI';
    }

    // Keep highest tier found across all lines — one jackpot per spin
    if (lineTier !== null) {
      if (highestTier === null || tierOrder.indexOf(lineTier) > tierOrder.indexOf(highestTier)) {
        highestTier = lineTier;
      }
    }
  }

  return highestTier ? [highestTier] : [];
}

async function processCharacterJackpots(grid, activeLinesCount, context) {
  const hits  = checkCharacterJackpots(grid, activeLinesCount);
  let totalAwarded = 0;
  const order  = ['MINI','MINOR','MAJOR','GRAND'];
  const validHits = order.filter(k => hits.includes(k));
  // HIGHEST TIER ONLY — only award the top jackpot, ignore lower tiers on same spin
  if (validHits.length > 0) {
    const key    = validHits[validHits.length - 1]; // highest tier
    const amount = awardJackpot(key);
    totalAwarded = amount;
    logEvent('JACKPOT_HIT', { bonusType:'JACKPOT', jackpotType:key, trigger:'CHARACTER_SYMBOL', amount, context, serialNumber:_currentSpinSerial, balanceAfter:GameState.balance });
    if (typeof UI !== 'undefined') await UI.showJackpotCelebration(key, amount, context);
  }
  return { hits: validHits, totalAwarded };
}

function buildRedSpinGrid() {
  return buildGrid(generateReelStops());
}

function checkRedSpinTrigger() {
  if (GameState.operator.forceRedSpin) { GameState.operator.forceRedSpin = false; return true; }
  const freq = GameState.operator.redSpinFrequency * GameState.operator.bonusFrequencyMultiplier;
  return rng.chance(freq);
}

function generateCashCoinValue(betPerLine, linesActive) {
  // Fraction-based tiers — value = random fraction of totalBet.
  // Max tier is 5× totalBet, so no hard cap needed.
  // Monte Carlo verified: contributes ~2.08× totalBet avg across all denoms.
  const totalBet = betPerLine * linesActive;
  const roll     = rng.next();
  let cumulative = 0;
  for (var i = 0; i < HOLD_SPIN_CASH_TIERS.length; i++) {
    var tier = HOLD_SPIN_CASH_TIERS[i];
    cumulative += tier.weight;
    if (roll < cumulative) {
      var frac = tier.minFrac + rng.next() * (tier.maxFrac - tier.minFrac);
      return Math.round(totalBet * frac * 100) / 100;
    }
  }
  // Fallback — tiny cash coin
  return Math.round(totalBet * 0.03 * 100) / 100;
}


// ── QUEUED SPIN ───────────────────────────────────────────────────────
// When player presses Spin during payline display, queue the next spin.
// executeSpin() checks this at the end and auto-fires it.
let _nextSpinQueued = false;
let _nextSpinBet    = null;
let _nextSpinLines  = null;

function queueNextSpin(betPerLine, linesActive) {
  // Never queue a spin during an active bonus — would cause phantom spin after bonus
  if (GameState.activeBonus) return;
  _nextSpinQueued = true;
  _nextSpinBet    = betPerLine;
  _nextSpinLines  = linesActive;
}

function clearQueuedSpin() {
  _nextSpinQueued = false;
  _nextSpinBet    = null;
  _nextSpinLines  = null;
}

function hasQueuedSpin() { return _nextSpinQueued; }

// ── MAIN SPIN HANDLER ────────────────────────────────────────────────
// Tracks a "skip paylines" flag set when player hits SPIN during animations
let _skipPaylineAnimations = false;

function setSkipPaylineAnimations(val) { _skipPaylineAnimations = val; }
function getSkipPaylineAnimations()    { return _skipPaylineAnimations; }

// MLMC executeSpin — accepts denom and creditsPerLine
// betPerLine = denom * creditsPerLine (passed pre-calculated for backward compat)
async function executeSpin(betPerLine, linesActive, denom=null, creditsPerLine=null) {
  if (GameState.spinInProgress) return;
  // MLMC: if denom provided, use it; otherwise treat betPerLine as flat amount
  var _denom   = (denom != null) ? denom : (GameState.lastDenom != null ? GameState.lastDenom : 0.05);
  var _credits = (creditsPerLine != null) ? creditsPerLine : (GameState.lastCreditsPerLine != null ? GameState.lastCreditsPerLine : 1);
  // betPerLine already = denom * creditsPerLine when called from index.html
  const totalBet = betPerLine * linesActive;
  if (GameState.balance < totalBet) {
    if (typeof UI !== 'undefined') UI.showMessage('Insufficient balance'); return;
  }

  // Generate serial number for this spin
  _currentSpinSerial = generateSerialNumber();

  GameState.spinInProgress = true;
  _skipPaylineAnimations   = false;
  GameState.balance       -= totalBet;
  GameState.lastBet        = betPerLine;
  GameState.lastLines      = linesActive;
  if (denom)          GameState.lastDenom          = _denom;
  if (creditsPerLine) GameState.lastCreditsPerLine = _credits;

  contributeToJackpots(totalBet);
  startGameRecord({ perLine: betPerLine, lines: linesActive, total: totalBet });
  logEvent('SPIN_START', {
    bet: { perLine: betPerLine, lines: linesActive, total: totalBet },
    serialNumber: _currentSpinSerial,
    balanceBefore: GameState.balance + totalBet,
  });

  if (typeof UI !== 'undefined') UI.onSpinStart();
  if (typeof Audio !== 'undefined') Audio.play('spin');

  const stops = generateReelStops();
  GameState.operator.forceReelStops = [null, null, null, null, null];
  const grid   = buildGrid(stops);
  const result = evaluateSpin(grid, linesActive, betPerLine);

  if (GameState.eventLog.currentGame) {
    GameState.eventLog.currentGame.reelStops  = stops;
    GameState.eventLog.currentGame.grid       = grid;
    GameState.eventLog.currentGame.serialNumber = _currentSpinSerial;
    GameState.eventLog.currentGame.baseResult = {
      wins: result.paylineWins, scatterCount: result.scatterCount,
      bonusCount: result.bonusCount, totalWin: result.totalWin,
    };
  }

  // Apply operator force overrides BEFORE animating — so reels show forced symbols
  if (GameState.operator.forceBonusGame)   { result.triggerHoldSpin    = true; GameState.operator.forceBonusGame   = false; }
  if (GameState.operator.forceFreeSpins) {
    result.triggerPickChoose = true;
    result.scatterTriggered  = true;
    GameState.operator.forceFreeSpins = false;
    // Write 5 lipstick symbols on center row (payline 0) so player sees 5-oak trigger
    for (var fCol = 0; fCol < 5; fCol++) {
      grid[fCol][1] = SCATTER_ID;
    }
    result.scatterCount = 5;
  }
  if (GameState.operator.forceBonusFeature) {
    result.triggerBonusFeature = true;
    GameState.operator.forceBonusFeature = false;
    // Write BONUS letters into grid BEFORE animation — clear duplicates first
    for (var bCol = 0; bCol < 5; bCol++) {
      var letterId = LETTER_IDS[bCol];
      for (var bRow = 0; bRow < 3; bRow++) {
        if (grid[bCol][bRow] === letterId) grid[bCol][bRow] = SYMBOLS.CHERRY.id;
      }
      grid[bCol][1] = letterId;
    }
    result.bonusLetterCount = 5;
    result.bonusLetterRow   = 1;
  }

  // Force base game jackpot — write actual reel combination to center row
  // VGT Aristocrat: jackpots fire on any active payline — force to center (row 1)
  if (GameState.operator.forceJackpot !== 'none' &&
      (GameState.operator.forceJackpotContext === 'base' || GameState.operator.forceJackpotContext === 'any')) {
    var fjType = GameState.operator.forceJackpot;
    GameState.operator.forceJackpot = 'none';
    // Pick a random active payline row to write the combination on
    // Use the first active payline's row pattern at a random column position
    var activeLines = PAYLINES.slice(0, linesActive);
    var randomLine  = activeLines[Math.floor(Math.random() * activeLines.length)];
    // Use the center column row value to determine the target row (consistent across reels)
    var fjRow = randomLine[2]; // center reel row — consistent for a straight line
    if (fjType === 'MINI') {
      for (var fc = 0; fc < 5; fc++) grid[fc][fjRow] = fc < 3 ? SYMBOLS.SASHA.id : SYMBOLS.CHERRY.id;
    } else if (fjType === 'MINOR') {
      for (var fc = 0; fc < 5; fc++) grid[fc][fjRow] = fc < 3 ? SYMBOLS.JOSIE.id : SYMBOLS.CHERRY.id;
    } else if (fjType === 'MAJOR') {
      for (var fc = 0; fc < 5; fc++) grid[fc][fjRow] = rng.chance(0.5) ? SYMBOLS.JOSIE.id : SYMBOLS.SASHA.id;
    } else if (fjType === 'GRAND') {
      for (var fc = 0; fc < 5; fc++) grid[fc][fjRow] = SYMBOLS.SISTERS.id;
    }
    // Re-evaluate with new grid so jackpot is detected
    var newResult = evaluateSpin(grid, linesActive, betPerLine);
    result.paylineWins      = newResult.paylineWins;
    result.totalWin         = newResult.totalWin;
    result.bonusCount       = newResult.bonusCount;
    result.scatterCount     = newResult.scatterCount;
    // Suppress any bonus triggers on this forced jackpot spin
    result.triggerHoldSpin    = false;
    result.triggerPickChoose  = false;
    result.triggerBonusFeature = false;
  }

  if (typeof UI !== 'undefined') await UI.animateReelsStop(stops, grid);

  // BASE GAME: No random-roll jackpots — character symbol jackpots on ANY active payline (VGT Aristocrat)
  const charJackpots = await processCharacterJackpots(grid, linesActive, 'BASE_GAME');

  let totalWon = result.totalWin
    + (charJackpots ? charJackpots.totalAwarded || 0 : 0);

  const redSpinTriggeredEarly = checkRedSpinTrigger();

  // Ring bells IMMEDIATELY when win detected — before any animation
  if (result.totalWin > 0 && typeof Audio !== 'undefined') {
    Audio.play(result.totalWin > totalBet * 10 ? 'win_big' : 'win_small');
    Audio.playBellsForWin(result.totalWin, betPerLine);
  }

  if (result.paylineWins.length > 0 || result.scatterWin) {
    if (redSpinTriggeredEarly || result.triggerBonusFeature) {
      // Red Spin or BONUS feature triggered — brief simultaneous flash only, then go straight to bonus
      // No cycling through individual lines — orbs/red screen appear immediately after
      if (typeof UI !== 'undefined') await UI.showBaseWins(result, betPerLine, linesActive, false, true);
    } else if (!_skipPaylineAnimations) {
      // Normal base game win display — full animation with cycling
      if (typeof UI !== 'undefined') await UI.showBaseWins(result, betPerLine, linesActive);
    }
  }

  // Credit base game win to balance FIRST — visible on meter before Red Spin starts
  GameState.balance += result.totalWin;

  // Show BONUS letter partial win toast
  if (result.bonusLetterWin && result.bonusLetterWin > 0 && typeof UI !== 'undefined') {
    UI.showBonusLetterWin(result.bonusLetterCount, result.bonusLetterWin, result.bonusLetterRow);
  }

  // Update balance and win display BEFORE activating red screen
  // Player sees their base win credited on meter, THEN Red Spin launches
  if (typeof UI !== 'undefined') {
    UI.updateBalance(GameState.balance);
    if (result.totalWin > 0) UI.updateWinDisplay(result.totalWin);
  }

  // Activate Red Spin screen AFTER base win is shown
  if (redSpinTriggeredEarly) {
    if (typeof Audio !== 'undefined') Audio.play('red_spin_entry');
    if (typeof UI !== 'undefined') UI.activateRedScreen();
  }

  logEvent(result.totalWin > 0 ? 'BASE_WIN' : 'BASE_LOSS', {
    bet: { perLine: betPerLine, lines: linesActive, total: totalBet },
    serialNumber: _currentSpinSerial,
    reelStops: stops, grid, wins: result.paylineWins,
    scatterCount: result.scatterCount, bonusCount: result.bonusCount,
    totalWin: result.totalWin, netResult: result.totalWin - totalBet,
    balanceBefore: GameState.balance - result.totalWin + totalBet,
    balanceAfter:  GameState.balance,
  });

  recordSpin(totalBet, totalWon);

  if (typeof UI !== 'undefined') {
    UI.updateBalance(GameState.balance);
    UI.updateWinDisplay(result.totalWin);
  }

  _skipPaylineAnimations = false;
  const currentContext = { base_game:true, red_spin:false, hold_spin:false, pick_choose:false };

  // Clear queued spin when any bonus fires
  if (result.triggerPickChoose || result.triggerHoldSpin || result.triggerBonusFeature) {
    if (typeof clearQueuedSpin !== 'undefined') clearQueuedSpin();
  }

  // BONUS Feature FIRST — its prize sets triggerHoldSpin/PickChoose/RedSpin
  // Suppress any coin/scatter triggered bonuses — BONUS feature overrides them
  if (result.triggerBonusFeature) {
    result.triggerHoldSpin   = false; // BONUS feature decides, not coin count
    result.triggerPickChoose = false; // BONUS feature decides, not scatter count
    GameState.stats.bonusFeatureCount = (GameState.stats.bonusFeatureCount || 0) + 1;
    logEvent('BONUS_TRIGGER', { bonusType:'BONUS_FEATURE', context:'base_game', serialNumber:_currentSpinSerial });
    if (typeof Audio !== 'undefined') Audio.play('bonus_trigger');
    const bonusResult = await Bonuses.runBonusFeature(betPerLine, linesActive, currentContext);
    totalWon += bonusResult.totalWon;
    // Set flags so the chosen bonus runs in the blocks below
    if (bonusResult.awardHoldSpin)   result.triggerHoldSpin   = true;
    if (bonusResult.awardRedSpin)    result.triggerRedSpin    = true;
    if (bonusResult.awardPickChoose) result.triggerPickChoose  = true;
  }

  // Pick & Choose (Lipstick scatter OR awarded from BONUS feature)
  // Note: disablePickChooseInRedSpin is a Red Spin operator flag — never applied in base game
  if (result.triggerPickChoose) {
    GameState.stats.pickChooseCount++;
    logEvent('BONUS_TRIGGER', { bonusType:'PICK_CHOOSE', context:'base_game', serialNumber:_currentSpinSerial });
    if (typeof Audio !== 'undefined') Audio.play('pick_trigger');
    const extraPicks = result.extraPickCount || 0;
    const pickResult = await Bonuses.runPickChoose(betPerLine, linesActive, currentContext, extraPicks);
    totalWon += pickResult.totalWon;
    if (GameState.eventLog.currentGame) {
      GameState.eventLog.currentGame.bonuses.push({ type:'PICK_CHOOSE', triggeredAt:'base_game', events:pickResult.events, outcome:pickResult.outcome });
    }
    if (pickResult.awardHoldSpin) result.triggerHoldSpin = true;
    if (pickResult.awardRedSpin)  result.triggerRedSpin  = true;
  }

  // Hold & Spin (coins OR awarded from BONUS feature / Pick & Choose)
  if (result.triggerHoldSpin) {
    GameState.stats.holdSpinCount++;
    logEvent('BONUS_TRIGGER', { bonusType:'HOLD_SPIN', context:'base_game', serialNumber:_currentSpinSerial });
    if (typeof Audio !== 'undefined') Audio.play('hold_spin_trigger');
    let holdResult = { totalWon: 0, events: [], outcome: null };
    try {
      holdResult = await Bonuses.runHoldSpin(betPerLine, linesActive, stops, grid, currentContext);
      totalWon += holdResult.totalWon;
    } catch(hsErr) {
      // Safety net — never leave game frozen
      console.error('Hold & Spin error:', hsErr);
      GameState.activeBonus = null;
      if (typeof UI !== 'undefined') {
        var hs = document.getElementById('hold-screen');
        if (hs) hs.classList.remove('active');
        UI.setControlsEnabled(true);
        UI.showToast('Hold & Spin error — please spin again');
      }
    }
    if (GameState.eventLog.currentGame) {
      GameState.eventLog.currentGame.bonuses.push({ type:'HOLD_SPIN', triggeredAt:'base_game', events:holdResult.events, outcome:holdResult.outcome });
    }
  }

  // Red Spin — bell + red screen already fired after reels stopped (see above)
  const redSpinTriggered = result.triggerRedSpin || redSpinTriggeredEarly;
  if (redSpinTriggered) {
    // Clear any queued spin — bonus takes full control, no auto-spin after
    clearQueuedSpin();
    // Bell + red screen already active — go straight to bonus
    GameState.stats.redSpinCount++;
    logEvent('BONUS_TRIGGER', { bonusType:'RED_SPIN', context:'base_game', serialNumber:_currentSpinSerial });
    const redResult = await Bonuses.runRedSpin(betPerLine, linesActive, currentContext);
    totalWon += redResult.totalWon;
    if (GameState.eventLog.currentGame) {
      GameState.eventLog.currentGame.bonuses.push({ type:'RED_SPIN', triggeredAt:'base_game', events:redResult.events, outcome:redResult.outcome });
    }
    // Immediately restore base game as soon as last red spin complete (no delay)
    clearQueuedSpin(); // Prevent phantom spin after bonus
    if (typeof UI !== 'undefined') {
      UI.endRedSpinImmediate();
      UI.deactivateRedScreen();
    }
  }

  const summary = {
    totalBet, totalWon, netResult: totalWon - totalBet,
    serialNumber: _currentSpinSerial,
    balanceBefore: GameState.balance - totalWon + totalBet,
    balanceAfter:  GameState.balance,
    biggestSingleWin: result.totalWin,
    bonusesTriggered: [
      result.triggerPickChoose && 'PICK_CHOOSE',
      result.triggerHoldSpin   && 'HOLD_SPIN',
      redSpinTriggered         && 'RED_SPIN',
    ].filter(Boolean),
  };

  finalizeGameRecord(summary);
  saveState();

  if (typeof UI !== 'undefined') {
    UI.updateBalance(GameState.balance);
    UI.onSpinComplete(summary);
  }

  GameState.spinInProgress = false;

  // Safety cleanup — ensure red screen is off if bonus ended abnormally
  if (!GameState.activeBonus && typeof UI !== 'undefined') {
    UI.deactivateRedScreen();
  }

  // Only fire queued spin if it was queued during BASE GAME payline display
  // Never fire after a bonus — bonuses clear the queue themselves
  if (_nextSpinQueued && !GameState.activeBonus) {
    const qBet   = _nextSpinBet;
    const qLines = _nextSpinLines;
    clearQueuedSpin();
    // Small yield so UI can update, then fire immediately
    setTimeout(() => executeSpin(qBet, qLines), 80);
  }

  return summary;
}

// Preview check for red spin (doesn't consume RNG — just peeks at state)
// Used to ring bell before showing base wins
function checkRedSpinTriggerPreview() {
  return false; // Preview disabled — actual check in main flow
}
