'use strict';
/**
 * game.js — The Turrelle Sisters Big Munny v10
 * ES5 rewrite v6l95 — removed class, const, let, arrow functions, for...of
 */

// ── RNG (crypto-backed, cryptographically secure) ────────────────────
function RNG() { this._buf = new Uint32Array(64); this._index = 64; }
RNG.prototype._refill = function() { crypto.getRandomValues(this._buf); this._index = 0; };
RNG.prototype.next    = function() { if (this._index >= this._buf.length) this._refill(); return this._buf[this._index++] / 0x100000000; };
RNG.prototype.nextInt = function(min, max) { return Math.floor(this.next() * (max - min + 1)) + min; };
RNG.prototype.chance  = function(p) { return this.next() < p; };
var rng = new RNG();

// ── CURRENT SPIN SERIAL ──────────────────────────────────────────────
var _currentSpinSerial = '';

function generateReelStops() {
  var forced = GameState.operator.forceReelStops;
  return REEL_STRIPS.map(function(strip, r) {
    if (forced[r] !== null && forced[r] !== undefined) {
      return Math.max(0, Math.min(strip.length - 1, forced[r]));
    }
    return rng.nextInt(0, strip.length - 1);
  });
}

function getVisibleSymbols(reelIndex, stopPosition) {
  var strip = REEL_STRIPS[reelIndex], len = strip.length;
  return [
    strip[(stopPosition - 1 + len) % len],
    strip[stopPosition],
    strip[(stopPosition + 1) % len],
  ];
}

function buildGrid(stops) {
  return stops.map(function(stop, r) { return getVisibleSymbols(r, stop); });
}

// ── WIN EVALUATION ───────────────────────────────────────────────────
function evaluateLine(lineSymbols, betPerLine) {
  var wildCount = 0, matchSymbol = null;
  for (var i = 0; i < lineSymbols.length; i++) {
    if (WILD_IDS.indexOf(lineSymbols[i]) >= 0) wildCount++;
    else { matchSymbol = lineSymbols[i]; break; }
  }
  if (matchSymbol === null && wildCount > 0) { matchSymbol = SYMBOLS.JOSIE.id; wildCount = 0; }

  var matchCount = wildCount, extraWilds = 0;
  for (var j = wildCount; j < lineSymbols.length; j++) {
    if (lineSymbols[j] === matchSymbol) matchCount++;
    else if (WILD_IDS.indexOf(lineSymbols[j]) >= 0) { matchCount++; extraWilds++; }
    else break;
  }

  if (matchCount < 2) return { amount: 0 };
  if (matchSymbol === BONUS_ID) return { amount: 0 };

  var symbolKey = null;
  var keys = Object.keys(SYMBOLS);
  for (var ki = 0; ki < keys.length; ki++) {
    if (SYMBOLS[keys[ki]].id === matchSymbol) { symbolKey = keys[ki]; break; }
  }
  if (!symbolKey || !PAY_TABLE[symbolKey]) return { amount: 0 };

  var pays     = PAY_TABLE[symbolKey];
  var payIndex = Math.max(0, 5 - matchCount);
  if (payIndex >= pays.length) return { amount: 0 };
  var basePay  = pays[payIndex];
  if (basePay === 0) return { amount: 0 };

  // Wild multiplier — owner confirmed 2026-05-21 (v6l114)
  // ALL Josie and Sasha symbols anywhere in the matched run contribute to the multiplier,
  // regardless of position (leading or trailing the match symbol).
  //   Josie (id:1) contributes ×2, Sasha (id:2) contributes ×1 per occurrence.
  //   Total = (josieCount × 2) + (sashaCount × 1), minimum ×1
  // Examples: J S 7 7 7 → ×3 | 7 J 7 7 7 → ×2 | 7 7 J J S → ×5
  // RULE: Multiplier applies to regular payline pays only.
  //       Jackpots always pay their fixed progressive seed regardless of wilds.
  //       Same rule applies in Red Spin bonus (uses same evaluateLine).
  var josieCount = 0, sashaCount = 0;
  for (var wi = 0; wi < matchCount; wi++) {
    if (lineSymbols[wi] === SYMBOLS.JOSIE.id) josieCount++;
    else if (lineSymbols[wi] === SYMBOLS.SASHA.id) sashaCount++;
  }
  var multiplier = Math.max(1, josieCount * 2 + sashaCount * 1);

  return {
    amount: basePay * betPerLine * multiplier,
    symbolKey: symbolKey, count: matchCount,
    wildCount: wildCount, multiplier: multiplier, basePay: basePay,
  };
}

// ── BONUS LETTER EVALUATION ───────────────────────────────────────────
// Phase M rework 2026-05-16 — cherry-style, all 3 rows, consecutive from reel 1
function evaluateLetterPays(grid, betPerLine) {
  var totalAmount = 0, wins = [];
  for (var row = 0; row < 3; row++) {
    var count = 0;
    for (var col = 0; col < 5; col++) {
      if (grid[col][row] === LETTER_IDS[col]) count++;
      else break;
    }
    if (count >= 1) {
      var pay = (BONUS_LETTER_PAYS[count] || 0) * betPerLine;
      if (pay > 0) { totalAmount += pay; wins.push({ row: row, count: count, amount: pay }); }
    }
  }
  var best = wins.reduce(function(a, b) { return b.count > a.count ? b : a; }, { row: -1, count: 0, amount: 0 });
  return { amount: totalAmount, row: best.row, count: best.count, wins: wins };
}

// ── MIXED BAR EVALUATION ──────────────────────────────────────────────
function evaluateMixedBars(grid, activeLinesCount, betPerLine) {
  var wins = [];
  var activeLines = PAYLINES.slice(0, activeLinesCount);
  activeLines.forEach(function(line, lineIndex) {
    var lineSyms = line.map(function(row, col) { return grid[col][row]; });
    var barCount = 0;
    for (var i = 0; i < 5; i++) {
      if (BAR_IDS.indexOf(lineSyms[i]) >= 0) barCount++;
      else break;
    }
    if (barCount < 3) return;
    var allSame = true, firstBar = lineSyms[0];
    for (var j = 1; j < barCount; j++) { if (lineSyms[j] !== firstBar) { allSame = false; break; } }
    if (allSame) return;
    var mixedPay = MIXED_BAR_PAY[barCount] || 0;
    if (mixedPay > 0) {
      wins.push({ lineIndex: lineIndex, line: line, amount: mixedPay * betPerLine, symbolKey: 'MIXED_BAR', count: barCount, isMixedBar: true });
    }
  });
  return wins;
}

function evaluateSpin(grid, activeLinesCount, betPerLine) {
  var result = {
    paylineWins: [], scatterCount: 0, bonusCount: 0,
    totalWin: 0, triggerPickChoose: false, triggerHoldSpin: false,
    lipstickCount: 0, scatterTriggered: false,
  };

  var coinCount = 0, lipstickCount = 0;
  for (var gc = 0; gc < grid.length; gc++) {
    for (var gr = 0; gr < grid[gc].length; gr++) {
      if (grid[gc][gr] === BONUS_PC_ID) lipstickCount++;
      if (grid[gc][gr] === BONUS_ID)    coinCount++;
    }
  }
  result.bonusCount    = coinCount;
  result.lipstickCount = lipstickCount;
  result.scatterCount  = lipstickCount;
  if (coinCount >= HOLD_SPIN_MIN_COINS) result.triggerHoldSpin = true; // v7.0.5: named constant

  var activeLines = PAYLINES.slice(0, activeLinesCount);
  activeLines.forEach(function(line, lineIndex) {
    var lineSymbols = line.map(function(row, col) { return grid[col][row]; });
    var win = evaluateLine(lineSymbols, betPerLine);
    if (win.amount > 0) {
      result.paylineWins.push({
        lineIndex: lineIndex, line: line,
        lineName: (typeof PAYLINE_NAMES !== 'undefined' && PAYLINE_NAMES[lineIndex]) ? PAYLINE_NAMES[lineIndex] : ('Line ' + (lineIndex + 1)),
        amount: win.amount, count: win.count, symbolKey: win.symbolKey,
      });
      result.totalWin += win.amount;
    }
    if (lineIndex === 0 && lineSymbols.every(function(id) { return id === BONUS_PC_ID; })) {
      result.scatterTriggered = true;
    }
  });

  var mixedBarWins = evaluateMixedBars(grid, activeLinesCount, betPerLine);
  mixedBarWins.forEach(function(win) { result.paylineWins.push(win); result.totalWin += win.amount; });

  var letterResult = evaluateLetterPays(grid, betPerLine);
  if (letterResult.amount > 0) {
    result.bonusLetterWin   = letterResult.amount;
    result.bonusLetterRow   = letterResult.row;
    result.bonusLetterWins  = letterResult.wins;
    result.bonusLetterCount = letterResult.count;
    result.totalWin += letterResult.amount;
    var rowToPaylineIndex = { 0: 1, 1: 0, 2: 2 };
    if (letterResult.wins) {
      letterResult.wins.forEach(function(w) {
        var plIdx = rowToPaylineIndex[w.row];
        var line  = PAYLINES[plIdx] || [w.row, w.row, w.row, w.row, w.row];
        result.paylineWins.push({ lineIndex: plIdx, line: line, amount: w.amount, count: w.count, symbolKey: 'BONUS_LETTER', isLetter: true, letterRow: w.row });
      });
    }
  }

  var bottomRowBonus =
    grid[0][2] === LETTER_IDS[0] && grid[1][2] === LETTER_IDS[1] &&
    grid[2][2] === LETTER_IDS[2] && grid[3][2] === LETTER_IDS[3] &&
    grid[4][2] === LETTER_IDS[4];
  if (bottomRowBonus) {
    result.triggerBonusFeature = true;
    if (result.bonusLetterWins) {
      var bottomRowWin = null;
      for (var bwi = 0; bwi < result.bonusLetterWins.length; bwi++) {
        if (result.bonusLetterWins[bwi].row === 2 && result.bonusLetterWins[bwi].count === 5) { bottomRowWin = result.bonusLetterWins[bwi]; break; }
      }
      if (bottomRowWin) { result.totalWin -= bottomRowWin.amount; result.bonusLetterWin -= bottomRowWin.amount; }
    }
  }

  if (result.scatterTriggered) { result.triggerPickChoose = true; result.scatterWin = 0; }
  if (GameState.operator.maxWinPerSpin > 0) result.totalWin = Math.min(result.totalWin, GameState.operator.maxWinPerSpin);
  return result;
}

// ── JACKPOT CHECKS ───────────────────────────────────────────────────
// DEPRECATED v6l99: checkJackpot/processJackpotCheck were per-spin odds (JACKPOT_ODDS).
// Replaced by _checkUnifiedJackpot() in bonuses.js. Kept only for operator force-jackpot tool.
function checkJackpot(context) {
  if (GameState.operator.forceJackpot !== 'none') {
    var jpCtx = GameState.operator.forceJackpotContext || 'bonus';
    var isBaseCheck = context === 'BASE_GAME';
    if (jpCtx === 'any' || (jpCtx === 'base' && isBaseCheck) || (jpCtx === 'bonus' && !isBaseCheck)) {
      var type = GameState.operator.forceJackpot;
      GameState.operator.forceJackpot = 'none';
      return { type: type, context: context, forced: true };
    }
  }
  var roll = rng.next();
  if (roll < JACKPOT_ODDS.GRAND) return { type: 'GRAND', context: context };
  if (roll < JACKPOT_ODDS.MAJOR) return { type: 'MAJOR', context: context };
  if (roll < JACKPOT_ODDS.MINOR) return { type: 'MINOR', context: context };
  if (roll < JACKPOT_ODDS.MINI)  return { type: 'MINI',  context: context };
  return null;
}

async function processJackpotCheck(context) {
  var result = checkJackpot(context);
  if (!result) return null;
  var amount = awardJackpot(result.type);
  logEvent('JACKPOT_HIT', { bonusType:'JACKPOT', jackpotType:result.type, amount:amount, context:context, serialNumber:_currentSpinSerial, balanceAfter:GameState.balance });
  if (typeof UI !== 'undefined') await UI.showJackpotCelebration(result.type, amount, context);
  return Object.assign({}, result, { amount: amount });
}

function checkCharacterJackpots(grid, activeLinesCount) {
  var activeLines = PAYLINES.slice(0, activeLinesCount);
  var highestTier = null;
  var tierOrder   = ['MINI', 'MINOR', 'MAJOR', 'GRAND'];

  for (var li = 0; li < activeLines.length; li++) {
    var line = activeLines[li];
    var syms = line.map(function(row, col) { return grid[col][row]; });
    if (syms.some(function(id) { return id === BONUS_ID; })) continue;

    var lineTier = null;
    if (syms.every(function(id) { return id === SYMBOLS.SISTERS.id; })) {
      lineTier = 'GRAND';
    } else if (syms.every(function(id) { return WILD_IDS.indexOf(id) >= 0; })) {
      lineTier = 'MAJOR';
    } else if (syms[0] === SYMBOLS.JOSIE.id && syms[1] === SYMBOLS.JOSIE.id && syms[2] === SYMBOLS.JOSIE.id) {
      lineTier = 'MINOR';
    } else if (syms[0] === SYMBOLS.SASHA.id && syms[1] === SYMBOLS.SASHA.id && syms[2] === SYMBOLS.SASHA.id) {
      lineTier = 'MINI';
    }

    if (lineTier !== null) {
      if (highestTier === null || tierOrder.indexOf(lineTier) > tierOrder.indexOf(highestTier)) {
        highestTier = lineTier;
      }
    }
  }
  return highestTier ? [highestTier] : [];
}

async function processCharacterJackpots(grid, activeLinesCount, context) {
  var hits  = checkCharacterJackpots(grid, activeLinesCount);
  var totalAwarded = 0;
  var order = ['MINI','MINOR','MAJOR','GRAND'];
  var validHits = order.filter(function(k) { return hits.indexOf(k) >= 0; });
  if (validHits.length > 0) {
    var key    = validHits[validHits.length - 1];
    var amount = awardJackpot(key);
    totalAwarded = amount;
    logEvent('JACKPOT_HIT', { bonusType:'JACKPOT', jackpotType:key, trigger:'CHARACTER_SYMBOL', amount:amount, context:context, serialNumber:_currentSpinSerial, balanceAfter:GameState.balance });
    if (typeof UI !== 'undefined') await UI.showJackpotCelebration(key, amount, context);
  }
  return { hits: validHits, totalAwarded: totalAwarded };
}

// buildRedSpinGrid() removed v6l99 — dead code, not called anywhere.

function checkRedSpinTrigger() {
  if (GameState.operator.forceRedSpin) { GameState.operator.forceRedSpin = false; return true; }
  var freq = GameState.operator.redSpinFrequency * GameState.operator.bonusFrequencyMultiplier;
  return rng.chance(freq);
}

// ── QUEUED SPIN ───────────────────────────────────────────────────────
var _nextSpinQueued = false, _nextSpinBet = null, _nextSpinLines = null;

function queueNextSpin(betPerLine, linesActive) {
  if (GameState.activeBonus) return;
  _nextSpinQueued = true; _nextSpinBet = betPerLine; _nextSpinLines = linesActive;
}
function clearQueuedSpin() { _nextSpinQueued = false; _nextSpinBet = null; _nextSpinLines = null; }

// ── SKIP PAYLINES ─────────────────────────────────────────────────────
var _skipPaylineAnimations = false;
function setSkipPaylineAnimations(val) { _skipPaylineAnimations = val; }
function getSkipPaylineAnimations()    { return _skipPaylineAnimations; }

// ── MAIN SPIN HANDLER ────────────────────────────────────────────────
async function executeSpin(betPerLine, linesActive, denom, creditsPerLine) {
  if (GameState.spinInProgress) return;
  var _denom   = (denom   != null) ? denom   : (GameState.lastDenom          != null ? GameState.lastDenom          : 0.05);
  var _credits = (creditsPerLine != null) ? creditsPerLine : (GameState.lastCreditsPerLine != null ? GameState.lastCreditsPerLine : 1);
  var totalBet = betPerLine * linesActive;
  if (GameState.balance < totalBet) {
    if (typeof UI !== 'undefined') UI.showMessage('Insufficient balance'); return;
  }

  _currentSpinSerial   = generateSerialNumber();
  GameState.spinInProgress = true;
  _skipPaylineAnimations   = false;
  // SAFETY: spinInProgress must always be cleared even if an uncaught error occurs.
  // All code below is wrapped in the function body — if it throws, the caller's
  // .catch() or unhandledrejection should call UI.setControlsEnabled(true).
  // The per-bonus try/catch blocks already handle individual bonus errors.
  GameState.balance       -= totalBet;
  GameState.lastBet        = betPerLine;
  GameState.lastLines      = linesActive;
  if (denom)          GameState.lastDenom          = _denom;
  if (creditsPerLine) GameState.lastCreditsPerLine = _credits;

  contributeToJackpots(totalBet);
  startGameRecord({ perLine: betPerLine, lines: linesActive, total: totalBet });
  logEvent('SPIN_START', { bet: { perLine: betPerLine, lines: linesActive, total: totalBet }, serialNumber: _currentSpinSerial, balanceBefore: GameState.balance + totalBet });

  if (typeof UI !== 'undefined') UI.onSpinStart();
  if (typeof Audio !== 'undefined') Audio.play('spin');

  var stops  = generateReelStops();
  GameState.operator.forceReelStops = [null, null, null, null, null];
  var grid   = buildGrid(stops);
  var result = evaluateSpin(grid, linesActive, betPerLine);

  if (GameState.eventLog.currentGame) {
    GameState.eventLog.currentGame.reelStops    = stops;
    GameState.eventLog.currentGame.grid         = grid;
    GameState.eventLog.currentGame.serialNumber = _currentSpinSerial;
    GameState.eventLog.currentGame.baseResult   = { wins: result.paylineWins, scatterCount: result.scatterCount, bonusCount: result.bonusCount, totalWin: result.totalWin };
  }

  if (GameState.operator.comboArmed) GameState.operator.comboArmed = false;

  // BONUS Feature triggers via natural bottom-row B-O-N-U-S only.
  // PERMANENT RULE: No RNG check here — orb pick fires ONLY when B-O-N-U-S
  // genuinely lands on bottom row (row 2) simultaneously. See evaluateSpin().
  // RNG shortcut removed v6l100 — it caused the orb to appear without letters.
  // (BONUS_FEATURE_FREQ_DEFAULT constant kept in paytable.js for operator use only.)

  // ── FORCE OVERRIDES ──────────────────────────────────────────────────
  // v7.0.1 — COMBO MODE: when comboArmed is true, ALL selected bonuses fire
  // sequentially (RS → H&S → BONUS Letters → P&C). Mutual exclusion is bypassed.
  // When comboArmed is false, forceRedSpin still takes single-trigger priority
  // over other single force flags (original behaviour preserved).
  var _comboMode = !!(GameState.operator.comboArmed);

  if (!_comboMode && GameState.operator.forceRedSpin) {
    // Single-trigger mode: RS takes priority, clear other single-trigger flags
    GameState.operator.forceBonusGame    = false;
    GameState.operator.forceFreeSpins    = false;
    GameState.operator.forceBonusFeature = false;
    // forceRedSpin itself is consumed inside checkRedSpinTrigger() below
    result.triggerHoldSpin     = false;
    result.triggerPickChoose   = false;
    result.triggerBonusFeature = false;
  }
  if (GameState.operator.forceBonusGame) {
    GameState.operator.forceBonusGame = false;
    var coinId = BONUS_ID, allPos = [];
    for (var fCol = 0; fCol < 5; fCol++) for (var fRow = 0; fRow < 3; fRow++) allPos.push([fCol, fRow]);
    for (var si = allPos.length - 1; si > 0; si--) {
      var sj = Math.floor(Math.random() * (si + 1));
      var tmp = allPos[si]; allPos[si] = allPos[sj]; allPos[sj] = tmp;
    }
    var coinCount2 = 6 + Math.floor(Math.random() * 4);
    var placed2 = 0;
    for (var pi = 0; pi < allPos.length && placed2 < coinCount2; pi++) { grid[allPos[pi][0]][allPos[pi][1]] = coinId; placed2++; }
    result.bonusCount = placed2; result.triggerHoldSpin = true;
  }
  if (GameState.operator.forceFreeSpins) {
    GameState.operator.forceFreeSpins = false;
    var centerLine2 = PAYLINES[0];
    for (var fCol2 = 0; fCol2 < 5; fCol2++) grid[fCol2][centerLine2[fCol2]] = BONUS_PC_ID;
    result.triggerPickChoose = true; result.scatterTriggered = true; result.scatterCount = 5;
  }
  if (GameState.operator.forceBonusFeature) {
    GameState.operator.forceBonusFeature = false;
    var bRow = 2;
    for (var bCol = 0; bCol < 5; bCol++) {
      var letterId = LETTER_IDS[bCol];
      for (var br = 0; br < 3; br++) { if (br !== bRow && grid[bCol][br] === letterId) grid[bCol][br] = SYMBOLS.LIPSTICK.id; }
      grid[bCol][bRow] = letterId;
    }
    var neutralSymbols = [SYMBOLS.SEVEN.id, SYMBOLS.TRIPLE_BAR.id, SYMBOLS.DIAMOND.id, SYMBOLS.DOUBLE_BAR.id];
    for (var nr = 0; nr < 3; nr++) {
      if (nr === bRow) continue;
      for (var nc = 0; nc < 5; nc++) {
        if (LETTER_IDS.indexOf(grid[nc][nr]) >= 0) grid[nc][nr] = neutralSymbols[Math.floor(Math.random() * neutralSymbols.length)];
      }
    }
    result.triggerBonusFeature = true; result.bonusLetterCount = 5; result.bonusLetterRow = bRow;
  }
  if (GameState.operator.forceJackpot !== 'none' &&
      (GameState.operator.forceJackpotContext === 'base' || GameState.operator.forceJackpotContext === 'any')) {
    var fjType = GameState.operator.forceJackpot;
    GameState.operator.forceJackpot = 'none';
    var activeLines2 = PAYLINES.slice(0, linesActive);
    var randomLine   = activeLines2[Math.floor(Math.random() * activeLines2.length)];
    var fjRow        = randomLine[2];
    if (fjType === 'MINI')  { for (var fc = 0; fc < 5; fc++) grid[fc][fjRow] = fc < 3 ? SYMBOLS.SASHA.id : SYMBOLS.LIPSTICK.id; }
    else if (fjType === 'MINOR') { for (var fc = 0; fc < 5; fc++) grid[fc][fjRow] = fc < 3 ? SYMBOLS.JOSIE.id : SYMBOLS.LIPSTICK.id; }
    else if (fjType === 'MAJOR') { for (var fc = 0; fc < 5; fc++) grid[fc][fjRow] = rng.chance(0.5) ? SYMBOLS.JOSIE.id : SYMBOLS.SASHA.id; }
    else if (fjType === 'GRAND') { for (var fc = 0; fc < 5; fc++) grid[fc][fjRow] = SYMBOLS.SISTERS.id; }
    var newResult = evaluateSpin(grid, linesActive, betPerLine);
    result.paylineWins = newResult.paylineWins; result.totalWin = newResult.totalWin;
    result.bonusCount  = newResult.bonusCount;  result.scatterCount = newResult.scatterCount;
    result.triggerHoldSpin = false; result.triggerPickChoose = false; result.triggerBonusFeature = false;
  }

  // Pre-generate H&S coin values
  var _spinCoinData = null;
  if (result.bonusCount > 0) {
    _spinCoinData = Bonuses.pregenerateTriggerCoins(grid, betPerLine, linesActive);
    if (typeof UI !== 'undefined') UI.setPendingCoinMap(_spinCoinData.coinMap);
  }

  if (typeof UI !== 'undefined') await UI.animateReelsStop(stops, grid);
  if (typeof UI !== 'undefined') UI.setPendingCoinMap(null);

  var charJackpots = await processCharacterJackpots(grid, linesActive, 'BASE_GAME');
  var totalWon = result.totalWin + (charJackpots ? charJackpots.totalAwarded || 0 : 0);

  // Red Spin — PERMANENT RULE: only on winning spins, never on $0 spins
  var redSpinTriggeredEarly = (result.totalWin > 0 || (charJackpots && charJackpots.totalAwarded > 0))
    ? checkRedSpinTrigger()
    : false;

  if (result.totalWin > 0 && typeof Audio !== 'undefined') {
    Audio.play(result.totalWin > totalBet * 10 ? 'win_big' : 'win_small');
    Audio.playBellsForWin(result.totalWin, betPerLine);
  }

  if (result.paylineWins.length > 0 || result.scatterWin) {
    // Always show payline animations — even when RS or bonus triggers.
    // RS fires AFTER the payline flash so player sees their win first.
    // fast=true when RS or bonus triggers (400ms abbreviated) so there's no delay.
    if (!_skipPaylineAnimations) {
      var _fastWin = !!(redSpinTriggeredEarly || result.triggerBonusFeature || result.triggerHoldSpin);
      if (typeof UI !== 'undefined') await UI.showBaseWins(result, betPerLine, linesActive, false, _fastWin);
    }
  }

  GameState.balance += result.totalWin;
  if (typeof UI !== 'undefined') {
    UI.updateBalance(GameState.balance);
    if (result.totalWin > 0) UI.updateWinDisplay(result.totalWin);
  }

  if (redSpinTriggeredEarly) {
    if (typeof Audio !== 'undefined') Audio.play('red_spin_entry');
    if (typeof UI !== 'undefined') UI.activateRedScreen();
  }

  logEvent(result.totalWin > 0 ? 'BASE_WIN' : 'BASE_LOSS', {
    bet: { perLine: betPerLine, lines: linesActive, total: totalBet },
    serialNumber: _currentSpinSerial, reelStops: stops, grid: grid, wins: result.paylineWins,
    scatterCount: result.scatterCount, bonusCount: result.bonusCount, totalWin: result.totalWin,
    netResult: result.totalWin - totalBet,
    balanceBefore: GameState.balance - result.totalWin + totalBet, balanceAfter: GameState.balance,
  });

  if (typeof UI !== 'undefined') { UI.updateBalance(GameState.balance); UI.updateWinDisplay(result.totalWin); }
  _skipPaylineAnimations = false;
  var currentContext = { base_game: true, red_spin: false, hold_spin: false, pick_choose: false };

  if (result.triggerPickChoose || result.triggerHoldSpin || result.triggerBonusFeature) {
    if (typeof clearQueuedSpin !== 'undefined') clearQueuedSpin();
  }

  // ── BONUS PRIORITY: RS > H&S > BONUS Letters > P&C ──────────────────
  // v7.0.1 COMBO MODE: when comboArmed, ALL selected bonuses fire in order.
  // In single-trigger mode, RS still suppresses all other triggers (original rule).
  if (redSpinTriggeredEarly && !_comboMode) {
    result.triggerHoldSpin = false; result.triggerPickChoose = false; result.triggerBonusFeature = false;
  }

  if (result.triggerBonusFeature) {
    result.triggerHoldSpin = false; result.triggerPickChoose = false;
    GameState.stats.bonusFeatureCount = (GameState.stats.bonusFeatureCount || 0) + 1;
    logEvent('BONUS_TRIGGER', { bonusType: 'BONUS_FEATURE', context: 'base_game', serialNumber: _currentSpinSerial });
    if (typeof Audio !== 'undefined') Audio.play('bonus_trigger');
    var bonusResult = { totalWon: 0, awardHoldSpin: false, awardPickChoose: false, awardRedSpin: false };
    try {
      // noJackpots removed v6l114 — H&S, P&C, RS triggered via BONUS orb are
      // fully jackpot-eligible. Each sub-bonus runs its own _checkUnifiedJackpot().
      // Owner confirmed 2026-05-21.
      bonusResult = await Bonuses.runBonusFeature(betPerLine, linesActive, Object.assign({}, currentContext));
    } catch(bfErr) {
      console.error('BONUS Feature error:', bfErr);
      GameState.activeBonus = null;
      if (typeof UI !== 'undefined') { UI.setControlsEnabled(true); UI.showToast('Bonus error — please spin again'); }
    }
    totalWon += bonusResult.totalWon;
    // noJackpots propagation removed v6l114 — sub-bonuses are fully JP eligible (owner confirmed 2026-05-21)
    if (bonusResult.awardHoldSpin)   result.triggerHoldSpin  = true;
    if (bonusResult.awardRedSpin)    result.triggerRedSpin   = true;
    if (bonusResult.awardPickChoose) result.triggerPickChoose = true;
  }

  if (result.triggerPickChoose && !redSpinTriggeredEarly) {
    GameState.stats.pickChooseCount++;
    logEvent('BONUS_TRIGGER', { bonusType: 'PICK_CHOOSE', context: 'base_game', serialNumber: _currentSpinSerial });
    if (typeof Audio !== 'undefined') Audio.play('pick_trigger');
    var pcContext  = Object.assign({}, currentContext, { triggerStops: stops, triggerGrid: grid });
    var pickResult = await Bonuses.runPickChoose(betPerLine, linesActive, pcContext);
    totalWon += pickResult.totalWon;
    if (GameState.eventLog.currentGame) {
      GameState.eventLog.currentGame.bonuses.push({ type: 'PICK_CHOOSE', triggeredAt: 'base_game', events: pickResult.events, outcome: pickResult.outcome });
    }
    if (pickResult.awardHoldSpin) { result.triggerHoldSpin = true; currentContext.fromPickChoose = true; }
    if (pickResult.awardRedSpin)   result.triggerRedSpin = true;
  }

  if (result.triggerHoldSpin && !redSpinTriggeredEarly) {
    GameState.stats.holdSpinCount++;
    logEvent('BONUS_TRIGGER', { bonusType: 'HOLD_SPIN', context: 'base_game', serialNumber: _currentSpinSerial });
    if (typeof Audio !== 'undefined') Audio.play('hold_spin_trigger');
    var holdResult = { totalWon: 0, events: [], outcome: null };
    try {
      if (!_spinCoinData && result.bonusCount > 0) _spinCoinData = Bonuses.pregenerateTriggerCoins(grid, betPerLine, linesActive);
      if (_spinCoinData && typeof UI !== 'undefined') {
        UI.overlayReelCoinValues(grid, _spinCoinData.coinMap);
        await new Promise(function(res) { setTimeout(res, 800); });
      }
      var hsContext = Object.assign({}, currentContext, { triggerCoinMap: _spinCoinData ? _spinCoinData.coinMap : null });
      holdResult = await Bonuses.runHoldSpin(betPerLine, linesActive, stops, grid, hsContext);
      totalWon += holdResult.totalWon;
    } catch(hsErr) {
      console.error('Hold & Spin error:', hsErr);
      GameState.activeBonus = null;
      if (typeof UI !== 'undefined') {
        var hs = document.getElementById('hold-screen');
        if (hs) hs.classList.remove('active');
        UI.setControlsEnabled(true); UI.showToast('Hold & Spin error — please spin again');
      }
    }
    if (GameState.eventLog.currentGame) {
      GameState.eventLog.currentGame.bonuses.push({ type: 'HOLD_SPIN', triggeredAt: 'base_game', events: holdResult.events, outcome: holdResult.outcome });
    }
  }

  var redSpinTriggered = result.triggerRedSpin || redSpinTriggeredEarly;
  if (redSpinTriggered) {
    clearQueuedSpin();
    GameState.stats.redSpinCount++;
    logEvent('BONUS_TRIGGER', { bonusType: 'RED_SPIN', context: 'base_game', serialNumber: _currentSpinSerial });
    var redResult = { totalWon: 0, events: [], outcome: null };
    try {
      var rsContext = Object.assign({}, currentContext, { prevWin: result.totalWin });
      redResult = await Bonuses.runRedSpin(betPerLine, linesActive, rsContext);
    } catch(rsErr) {
      // Log the actual error — critical for debugging
      console.error('[RS] Red Spin threw:', rsErr && rsErr.message ? rsErr.message : rsErr);
      console.error('[RS] Stack:', rsErr && rsErr.stack ? rsErr.stack : 'no stack');
      GameState.activeBonus = null;
      GameState.spinInProgress = false;
      if (typeof UI !== 'undefined') {
        UI.endRedSpinImmediate();
        UI.deactivateRedScreen();
        UI.setControlsEnabled(true);
        // Only show toast if controls were actually locked (real error, not cleanup race)
        if (redResult.totalWon === 0) UI.showToast('Red Spin ended');
      }
    }
    totalWon += redResult.totalWon;
    if (GameState.eventLog.currentGame) {
      GameState.eventLog.currentGame.bonuses.push({ type: 'RED_SPIN', triggeredAt: 'base_game', events: redResult.events, outcome: redResult.outcome });
    }
    clearQueuedSpin();
    if (typeof UI !== 'undefined') { UI.endRedSpinImmediate(); UI.deactivateRedScreen(); }

    // ── Additional RS rounds ─────────────────────────────────────────────
    // No automatic chain. After RS ends, player returns to base game.
    // If they spin and land a winning combination, natural RS trigger applies.
    // (Owner confirmed v6l97 — additional RS via natural base game trigger only)
  }

  // v7.0.1 — Auto-disarm combo after all armed bonuses have fired
  if (_comboMode) {
    GameState.operator.comboArmed = false;
    var cm = GameState.operator.comboModes;
    if (cm) { cm.hold_spin = false; cm.red_spin = false; cm.pick_choose = false; cm.bonus_letters = false; }
    logEvent('COMBO_COMPLETE', { serialNumber: _currentSpinSerial });
  }

  recordSpin(totalBet, totalWon);

  var summary = {
    totalBet: totalBet, totalWon: totalWon, netResult: totalWon - totalBet,
    serialNumber: _currentSpinSerial,
    balanceBefore: GameState.balance - totalWon + totalBet, balanceAfter: GameState.balance,
    biggestSingleWin: result.totalWin,
    bonusesTriggered: [
      result.triggerPickChoose && 'PICK_CHOOSE',
      result.triggerHoldSpin   && 'HOLD_SPIN',
      redSpinTriggered         && 'RED_SPIN',
    ].filter(Boolean),
  };

  if (GameState.eventLog.currentGame) {
    var _cg = GameState.eventLog.currentGame;
    _cg.denom = _denom; _cg.creditsPerLine = _credits;
    if (grid) {
      _cg.centerRow = grid.map(function(col) {
        var sym = SYMBOL_BY_ID[col[1]];
        return sym ? sym.name : 'Unknown';
      });
    }
  }

  finalizeGameRecord(summary);
  saveState();

  if (typeof UI !== 'undefined') { UI.updateBalance(GameState.balance); UI.onSpinComplete(summary); }
  GameState.spinInProgress = false;
  if (!GameState.activeBonus && typeof UI !== 'undefined') UI.deactivateRedScreen();

  if (_nextSpinQueued && !GameState.activeBonus) {
    var qBet = _nextSpinBet, qLines = _nextSpinLines;
    clearQueuedSpin();
    setTimeout(function() { executeSpin(qBet, qLines); }, 80);
  }

  return summary;
}
