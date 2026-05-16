'use strict';

const Bonuses = {

// ═══════════════════════════════════════════════════════════════════════
// BONUS #1 — RED SPIN BONUS
// As soon as reels stop → immediately go to next spin (no delay for wins)
// Pick & Choose and Hold & Spin can be disabled in operator menu during red spin
// Jackpot order rule: Mini first, then Minor, Major, Grand in sequence
// ═══════════════════════════════════════════════════════════════════════


  async runRedSpin(betPerLine, linesActive, callerContext={}) {
    // ══════════════════════════════════════════════════════════════════
    // RED SPIN — PURE RNG ASCENDING SYSTEM (2026-05-15)
    //
    // Design (confirmed by owner):
    // - No predetermined spin count — pure RNG, no pre-generated sequence
    // - Spin 1: ALWAYS fires guaranteed (continuance starts from spin 2)
    // - Each spin generates a REAL reel grid via evaluateSpin()
    // - Same payline rules as base game — active lines, bet/line, cherry rows etc.
    // - Each spin's win MUST exceed previous spin's win (re-roll up to 30x if needed)
    // - After spin 1: 65% continue / 35% end each subsequent spin
    // - Grand Jackpot = natural ceiling (sequence ends or could continue if 65% fires)
    // - CAN trigger: H&S, P&C, partial BONUS letter pays, jackpots on paylines
    // - CANNOT trigger: Jackpots inside BONUS orb feature
    // ══════════════════════════════════════════════════════════════════

    GameState.activeBonus = 'RED_SPIN';
    const totalBet    = betPerLine * linesActive;
    const op          = GameState.operator;
    let   bonusTotal  = 0;
    let   lastWin     = 0;       // each spin must beat this
    let   spinNum     = 0;
    let   grandHit    = false;

    // Activate red screen + music
    if (typeof UI !== 'undefined') {
      await UI.activateRedScreen();
      await UI.showRedSpinEntry(0, 0);
    }
    if (typeof Audio !== 'undefined') Audio.startRedSpinMusic();
    if (typeof UI !== 'undefined') UI.setControlsEnabled(false);

    // Log bonus start
    logEvent('RED_SPIN_START', {
      bonusType:'RED_SPIN', betPerLine, linesActive, totalBet,
      balanceBefore: GameState.balance
    });

    // ── SPIN LOOP ─────────────────────────────────────────────────────
    while (true) {
      spinNum++;

      // ── Generate real reel grid — must beat lastWin ────────────────
      let stops, grid, result, spinWin;
      let attempts = 0;

      do {
        // Generate fresh reel stops
        stops  = REEL_STRIPS.map(function(s) {
          return Math.floor(rng.next() * s.length);
        });
        grid   = buildGrid(stops);
        result = evaluateSpin(grid, linesActive, betPerLine);
        spinWin = result.totalWin;
        attempts++;
      } while (spinWin <= lastWin && attempts < 50);

      // Force ascending if RNG couldn't find a higher value after 50 attempts
      if (spinWin <= lastWin) {
        spinWin = Math.round((lastWin * 1.1 + totalBet) * 100) / 100;
        result.totalWin = spinWin;
      }

      // ── Animate reels ──────────────────────────────────────────────
      // animateReelsStop(stops, grid, isReplay, isRedSpin)
      if (typeof UI !== 'undefined') {
        await UI.animateReelsStop(stops, grid, false, true);
        // Show payline wins
        if (result.paylineWins && result.paylineWins.length > 0) {
          await UI.showRedSpinPaylineFlash(result.paylineWins);
        }
      }

      // ── Award win ──────────────────────────────────────────────────
      bonusTotal += spinWin;
      lastWin     = spinWin;
      GameState.balance += spinWin;

      if (typeof UI !== 'undefined') {
        await UI.updateRedSpinWin(spinWin, bonusTotal, spinNum);
        UI.updateBalance(GameState.balance);
      }

      // Ring bells for big wins
      if (typeof Audio !== 'undefined' && spinWin >= 10) {
        Audio.playBellsForWin(spinWin, betPerLine);
      }

      // Log spin
      logEvent('RED_SPIN', {
        bonusType:'RED_SPIN', spinNum, spinWin, bonusTotal,
        balanceAfter: GameState.balance
      });

      // ── Check for jackpots on paylines ─────────────────────────────
      // evaluateSpin doesn't process jackpots — call separately (same as base game)
      const charJackpots = await processCharacterJackpots(grid, linesActive, 'RED_SPIN');
      if (charJackpots && charJackpots.totalAwarded > 0) {
        bonusTotal += charJackpots.totalAwarded;
        GameState.balance += charJackpots.totalAwarded;
        if (typeof UI !== 'undefined') UI.updateBalance(GameState.balance);
        // Check if GRAND was hit
        if (charJackpots.hits && charJackpots.hits.indexOf('GRAND') >= 0) { grandHit = true; }
      }

      // ── Check for bonus triggers inside Red Spin ───────────────────
      // H&S: 6+ gold coins
      if (!op.disableHoldSpinInRedSpin && result.triggerHoldSpin) {
        const hsResult = await this.runHoldSpin(betPerLine, linesActive, null, grid, { from:'RED_SPIN' });
        bonusTotal += hsResult.totalWon || 0;
      }

      // P&C: Lipstick 5-oak on active payline
      if (!op.disablePickChooseInRedSpin && result.scatterTriggered) {
        const pcResult = await this.runPickChoose(betPerLine, linesActive, { from:'RED_SPIN' });
        bonusTotal += pcResult.totalWon || 0;
      }

      // BONUS letters: full B-O-N-U-S on same row
      if (result.bonusLetterCount === 5) {
        // No jackpots inside orb bonus — pass flag
        const bResult = await this.runBonusFeature(betPerLine, linesActive, { from:'RED_SPIN', noJackpots:true });
        bonusTotal += bResult.totalWon || 0;
        // Dispatch the sub-bonus the player won from the orb
        if (bResult.awardHoldSpin) {
          const hsResult = await this.runHoldSpin(betPerLine, linesActive, null, grid, { from:'RED_SPIN_BONUS', noJackpots:true });
          bonusTotal += hsResult.totalWon || 0;
        } else if (bResult.awardPickChoose) {
          const pcResult = await this.runPickChoose(betPerLine, linesActive, { from:'RED_SPIN_BONUS', noJackpots:true });
          bonusTotal += pcResult.totalWon || 0;
        }
        // awardRedSpin inside Red Spin — not dispatched recursively; totalWon already 0
      }

      // Partial BONUS letter pays already included in result.totalWin via evaluateSpin

      // ── Continuance check ──────────────────────────────────────────
      // Spin 1 is always guaranteed — continuance starts from spin 2
      if (spinNum >= 2) {
        const continues = grandHit ? false : rng.chance(GameState.operator.redSpinContinuance || RED_SPIN_CONTINUANCE_DEFAULT);
        if (!continues) break;
      }

      // Safety valve — prevent infinite loop (very long sessions)
      if (spinNum >= 200) break;

      // Brief pause between spins
      await this._delay(400);
    }

    // ── Sequence complete ──────────────────────────────────────────────
    if (typeof Audio !== 'undefined') Audio.stopRedSpinMusic();
    if (typeof UI !== 'undefined') {
      await UI.deactivateRedScreen();
      UI.setControlsEnabled(true);
    }

    // Log bonus end
    logEvent('RED_SPIN_END', {
      bonusType:'RED_SPIN', totalSpins:spinNum,
      totalWon:bonusTotal, balanceAfter:GameState.balance
    });

    GameState.activeBonus = null;
    saveState();

    return { totalWon: bonusTotal, spins: spinNum, events: [], outcome: { totalSpins: spinNum, totalWon: bonusTotal } };
  },


  // ── HOLD & SPIN OUTCOME GENERATOR ─────────────────────────────────────
  // Generates all coin positions and values in one RNG pass before any animation.
  // Returns { sequence, coinMap, isBlackout, totalCoins }
  _generateFullHoldSpinOutcome(betPerLine, linesActive, triggerGrid) {
    var GRID_SIZE    = 15;
    var landedSet    = new Set();   // positions that have coins
    var coinMap      = {};          // pos → coin
    var sequence     = [];          // ordered landing events {pos, coin, respinRound}

    // Lock trigger coins from the triggering grid first
    if (triggerGrid) {
      for (var row = 0; row < 3; row++) {
        for (var col = 0; col < 5; col++) {
          var sym = (triggerGrid[col] && triggerGrid[col][row]);
          if (sym === BONUS_ID) {
            var pos = col * 3 + row;
            var coin = this._generateCoin(betPerLine, linesActive);
            landedSet.add(pos);
            coinMap[pos] = coin;
            sequence.push({ pos: pos, coin: coin, respinRound: 0 });
          }
        }
      }
    }

    // Simulate respin rounds
    var respinRound = 1;
    var maxRounds   = 30; // safety valve

    while (respinRound <= maxRounds) {
      var newLandings = 0;
      var emptyPositions = [];
      for (var i = 0; i < GRID_SIZE; i++) {
        if (!landedSet.has(i)) emptyPositions.push(i);
      }
      if (emptyPositions.length === 0) break; // blackout

      // Each empty position has LAND_PROBABILITY chance of landing a coin
      for (var ei = 0; ei < emptyPositions.length; ei++) {
        var epos = emptyPositions[ei];
        if (rng.next() < HOLD_SPIN_LAND_PROBABILITY) {
          var ecoin = this._generateCoin(betPerLine, linesActive);
          landedSet.add(epos);
          coinMap[epos] = ecoin;
          sequence.push({ pos: epos, coin: ecoin, respinRound: respinRound });
          newLandings++;
        }
      }

      if (newLandings === 0) {
        respinRound++; // No new coins — one fewer respin
        if (respinRound > 3) break; // 3 respins exhausted
      } else {
        respinRound = 1; // Reset respin counter on any new landing
      }
    }

    var isBlackout = (landedSet.size === GRID_SIZE);
    return {
      sequence:    sequence,
      coinMap:     coinMap,
      isBlackout:  isBlackout,
      totalCoins:  landedSet.size,
    };
  },

  // ── COIN VALUE GENERATOR ────────────────────────────────────────────────
  // Returns a coin object: { type, value, isJackpotOrb, jackpotLevel }
  _generateCoin(betPerLine, linesActive) {
    var totalBet   = betPerLine * linesActive;
    var roll       = rng.next();
    var cumulative = 0;

    // Check jackpot tiers first
    for (var ji = 0; ji < HOLD_SPIN_JACKPOT_TIERS.length; ji++) {
      var jt = HOLD_SPIN_JACKPOT_TIERS[ji];
      cumulative += jt.weight;
      if (roll < cumulative) {
        var jpSeeds = getJackpotSeedsForDenom(GameState.lastDenom || DEFAULT_DENOM);
        var jpValue = jpSeeds ? (jpSeeds[jt.level] || JACKPOT_CONFIG[jt.level].seed) : JACKPOT_CONFIG[jt.level].seed;
        return {
          type:         'jackpot',
          value:        jpValue,
          isJackpotOrb: true,
          jackpotLevel: jt.level,
        };
      }
    }

    // Cash tiers
    for (var ci = 0; ci < HOLD_SPIN_CASH_TIERS.length; ci++) {
      var ct = HOLD_SPIN_CASH_TIERS[ci];
      cumulative += ct.weight;
      if (roll < cumulative) {
        var frac  = ct.minFrac + rng.next() * (ct.maxFrac - ct.minFrac);
        var value = Math.round(totalBet * frac * 100) / 100;
        value     = Math.max(value, 0.01); // never zero
        return {
          type:         'cash',
          value:        value,
          isJackpotOrb: false,
        };
      }
    }

    // Fallback — tiny cash coin
    return { type: 'cash', value: Math.round(totalBet * 0.02 * 100) / 100, isJackpotOrb: false };
  },

    async runHoldSpin(betPerLine, linesActive, triggerStops, triggerGrid, callerContext={}) {
    GameState.activeBonus = 'HOLD_SPIN';
    const events = [];
    const noJackpots = callerContext.noJackpots === true; // suppressed inside BONUS orb feature

    // ── STEP 1: Predetermined RNG pass — all outcomes decided NOW ───────
    const outcome = this._generateFullHoldSpinOutcome(betPerLine, linesActive, triggerGrid);
    const { sequence, coinMap, isBlackout } = outcome;

    logEvent('HOLD_SPIN_PREGEN', {
      bonusType: 'HOLD_SPIN',
      totalCoins: outcome.totalCoins,
      isBlackout,
      sequence: sequence.map(function(s) {
        var c = s.coin;
        var label = c.type === 'jackpot' ? ('jackpot:' + c.jackpotLevel) : c.type;
        return 'pos' + s.pos + ':' + label + ':$' + (c.value != null ? c.value.toFixed(2) : '0');
      }),
    });

    // Build empty board for display — coins revealed progressively
    const displayBoard = new Array(15).fill(null);

    // ── STEP 2: Show board (empty at start) ─────────────────────────────
    if (typeof UI !== 'undefined') await UI.showHoldSpinBoard(displayBoard, 3);
    if (typeof Audio !== 'undefined') Audio.startHoldSpinMusic();
    logEvent('HOLD_SPIN_ENTRY', { bonusType:'HOLD_SPIN', respins:3 });

    // ── STEP 3: Play out predetermined sequence visually ────────────────
    // Group coins by respin round so counter resets correctly
    let totalWon       = 0;
    let grandWon       = false;
    let currentRound   = 0;
    let respinDisplay  = 3;  // Visual respin counter

    // Accumulate jackpot levels that land — ALL pay out at bonus end
    var jackpotsAccumulated = {}; // { 'MINI':true, 'GRAND':true, ... }

    // Build round groups from sequence
    const rounds = {};
    for (const event of sequence) {
      if (!rounds[event.respinRound]) rounds[event.respinRound] = [];
      rounds[event.respinRound].push(event);
    }

    for (const roundKey of Object.keys(rounds).sort((a,b) => a-b)) {
      const roundNum    = parseInt(roundKey);
      const roundEvents = rounds[roundKey];

      // Show spinning animation for empty cells before coins land
      if (roundNum > 0) {
        if (typeof UI !== 'undefined') await UI.animateHoldSpinning(displayBoard, 500);
      }

      // Land each coin in this round
      for (const event of roundEvents) {
        const { pos, coin } = event;
        displayBoard[pos] = coin;

        // Animate coin landing
        if (typeof UI !== 'undefined') await UI.animateCoinLand(pos, coin);
        if (typeof Audio !== 'undefined') Audio.play('hold_spin_land');

        // ── Jackpot coin: accumulate for payout at bonus end ────────────
        if (coin.isJackpotOrb) {
          var key = coin.jackpotLevel; // 'MINI'|'MINOR'|'MAJOR'|'GRAND'
          jackpotsAccumulated[key] = true;
          // Update display coin to show jackpot level label (value shown at end)
          displayBoard[pos] = { type:'jackpot', jackpotLevel:key, value:coin.value, isJackpotOrb:true };
          // Play a brief sting so the player knows something special landed
          if (typeof Audio !== 'undefined') Audio.play('jackpot_' + key.toLowerCase());
          // Show a brief flash/highlight without awarding yet
          if (typeof UI !== 'undefined' && UI.flashJackpotCoin) {
            await UI.flashJackpotCoin(pos, key);
          }
        } else {
          // Cash coin — accumulate immediately
          totalWon += coin.value;
        }

        events.push(logEvent('HOLD_SPIN_LAND', {
          bonusType:'HOLD_SPIN', position:pos, coin,
          boardState: displayBoard.map(function(c) { return c ? (c.type + ':$' + (c.value != null ? c.value.toFixed(2) : '0')) : null; }),
          respinRound: roundNum,
        }));
      }

      // Update respin counter visually
      if (roundNum > 0 && roundEvents.length > 0) {
        respinDisplay = 3; // New coin(s) landed — reset
      } else if (roundNum > 0) {
        respinDisplay = Math.max(0, respinDisplay - 1);
      }
      if (typeof UI !== 'undefined') await UI.updateRespinCounter(respinDisplay);
    }

    // ── STEP 4: Pay out ALL accumulated jackpots at bonus end ────────────
    // All landed jackpot levels pay their denom-scaled seed value.
    // Paid in order MINI→MINOR→MAJOR→GRAND for escalating celebration.
    // Jackpots suppressed when called from inside BONUS orb feature (noJackpots flag).
    var jackpotOrder = ['MINI','MINOR','MAJOR','GRAND'];
    for (var jpi = 0; jpi < jackpotOrder.length; jpi++) {
      var jpLevel = jackpotOrder[jpi];
      if (!jackpotsAccumulated[jpLevel]) continue;
      if (noJackpots) continue; // suppressed — jackpot coin landed but award blocked by design

      var jpAmt = awardJackpot(jpLevel);
      totalWon += jpAmt;
      if (jpLevel === 'GRAND') grandWon = true;

      logEvent('JACKPOT_HIT', {
        bonusType:'JACKPOT', jackpotType:jpLevel,
        trigger:'HOLD_SPIN_END', amount:jpAmt,
        balanceAfter:GameState.balance
      });

      if (typeof Audio !== 'undefined') Audio.play('jackpot_' + jpLevel.toLowerCase());
      if (typeof UI !== 'undefined') await UI.showJackpotCelebration(jpLevel, jpAmt, 'HOLD_SPIN');
    }

    // ── STEP 5: Blackout bonus — Grand Jackpot again ─────────────────────
    if (isBlackout) {
      const blackoutAmt = awardJackpot('GRAND');
      totalWon += blackoutAmt;
      logEvent('JACKPOT_HIT', {
        bonusType:'JACKPOT', jackpotType:'GRAND',
        trigger:'HOLD_SPIN_BLACKOUT', amount:blackoutAmt,
        note: grandWon ? 'Second Grand (blackout)' : 'Blackout Grand',
        balanceAfter:GameState.balance,
      });
      if (typeof Audio !== 'undefined') Audio.play('jackpot_grand');
      if (typeof UI !== 'undefined') await UI.showBlackoutCelebration(blackoutAmt, grandWon);
    }

    // ── STEP 6: End bonus ─────────────────────────────────────────────────
    if (typeof Audio !== 'undefined') { Audio.stopHoldSpinMusic(); Audio.play('hold_spin_end'); }
    GameState.balance += totalWon;
    saveState();

    if (typeof UI !== 'undefined') {
      await UI.endHoldSpin(displayBoard, totalWon, isBlackout);
      UI.updateBalance(GameState.balance);
    }

    logEvent('HOLD_SPIN_END', {
      bonusType:'HOLD_SPIN', finalBoard:displayBoard,
      isBlackout, totalWon, totalCoins:outcome.totalCoins,
      jackpotsAwarded: Object.keys(jackpotsAccumulated),
      balanceAfter:GameState.balance,
    });
    GameState.activeBonus = null;
    return { totalWon, events, outcome:{ isBlackout, totalWon, board:displayBoard, sequence } };
  },

// ═══════════════════════════════════════════════════════════════════════
// BONUS #3 — PICK & CHOOSE
// extraPicks: additional picks allowed when 4+ lipsticks in base game
// ═══════════════════════════════════════════════════════════════════════

  async runPickChoose(betPerLine, linesActive, callerContext={}, extraPicks=0) {
    if (callerContext.from === 'HOLD_SPIN') return { totalWon:0, events:[], outcome:null };
    GameState.activeBonus = 'PICK_CHOOSE';
    const events = [], totalBet = betPerLine * linesActive, minAward = totalBet;
    const noJackpots = callerContext.noJackpots === true; // suppressed inside BONUS orb feature
    const tiles = this._generatePickTiles(totalBet, minAward);
    const revealed = new Array(PICK_CHOOSE_GRID_SIZE).fill(false);
    const matchCounts = {};
    let won=false, totalWon=0, awardHoldSpin=false, awardRedSpin=false, prize=null;
    // Extra taps allowed for 4+ lipsticks (each extra lipstick = 1 extra pick before matching)
    let extraTapsRemaining = extraPicks;

    if (typeof UI !== 'undefined') await UI.showPickChooseGrid(PICK_CHOOSE_GRID_SIZE, extraPicks);
    if (typeof Audio !== 'undefined') Audio.startPickMusic();
    logEvent('PICK_CHOOSE_ENTRY', { bonusType:'PICK_CHOOSE', gridSize:PICK_CHOOSE_GRID_SIZE, totalBet, extraPicks });

    while (!won) {
      const unrevealedCount = revealed.filter(v => !v).length;
      if (!unrevealedCount) break;
      const tileIndex = await this._waitForTileTap(revealed);
      if (tileIndex < 0) break;
      revealed[tileIndex] = true;

      const jack = noJackpots ? null : await processJackpotCheck('PICK_CHOOSE');
      let finalTile = { ...tiles[tileIndex] };
      if (jack) {
        var _jackObj = GameState.jackpots[jack.type]; finalTile = { type:jack.type.toLowerCase(), value:(_jackObj && _jackObj.current != null) ? _jackObj.current : 0 };
        tiles[tileIndex] = finalTile;
      }

      if (typeof UI !== 'undefined') await UI.revealPickTile(tileIndex, finalTile, false, false);
      if (typeof Audio !== 'undefined') Audio.play('pick_reveal');

      const key = finalTile.type;
      matchCounts[key] = (matchCounts[key] || 0) + 1;
      const evt = logEvent('PICK_REVEAL', { bonusType:'PICK_CHOOSE', tileIndex, tile:finalTile, matchCounts:{...matchCounts}, isMatch: matchCounts[key] >= 3 });
      events.push(evt);
      if (typeof UI !== 'undefined') UI.updatePickMatches(matchCounts);

      if (matchCounts[key] >= 3) {
        // If extra taps remaining, use one and continue (don't win yet)
        if (extraTapsRemaining > 0) {
          extraTapsRemaining--;
          if (typeof UI !== 'undefined') UI.showToast('🎁 Extra pick! ' + extraTapsRemaining + ' remaining');
          // Reset this match count to 2 so they need one more of same type OR start new
          // Actually: per rules "4+ lipstick = additional picks, same match-3 rule to win"
          // So extra picks just give more reveals before the match-3 wins
          won = true; // Let the normal win flow complete
          prize = finalTile;
        } else {
          won = true;
          prize = finalTile;
        }

        if (typeof Audio !== 'undefined') Audio.play('pick_match');

        if (['mini','minor','major','grand'].includes(key)) {
          totalWon = awardJackpot(key.toUpperCase());
          if (typeof Audio !== 'undefined') Audio.play('jackpot_' + key);
          if (typeof UI !== 'undefined') await UI.showJackpotCelebration(key.toUpperCase(), totalWon, 'PICK_CHOOSE');
        } else if (key === 'cash') {
          totalWon = Math.max(finalTile.value, minAward);
          GameState.balance += totalWon;
        } else if (key === 'red_spin') {
          awardRedSpin = true;
        } else if (key === 'hold_spin') {
          awardHoldSpin = true;
        }

        saveState();
        if (typeof UI !== 'undefined') {
          await UI.showPickChooseWin(tileIndex, prize, totalWon, awardHoldSpin, awardRedSpin, matchCounts);
        }
        break;
      }
    }

    if (typeof Audio !== 'undefined') Audio.stopPickMusic();
    if (typeof UI !== 'undefined') {
      await UI.endPickChoose(prize, totalWon, awardHoldSpin, awardRedSpin);
      UI.updateBalance(GameState.balance);
    }
    logEvent('PICK_CHOOSE_END', { bonusType:'PICK_CHOOSE', prize, totalWon, awardHoldSpin, awardRedSpin, matchCounts, balanceAfter:GameState.balance });
    GameState.activeBonus = null;
    return { totalWon, awardHoldSpin, awardRedSpin, events, outcome:{prize, totalWon, matchCounts} };
  },

  // ── FULLY PREDETERMINED PICK BOARD ─────────────────────────────────
  // Prize type AND amount decided by RNG before player picks anything.
  // Board is rigged: any tile player taps eventually completes match-3.
  // Method: decide winning prize type first, then fill board so exactly
  // 3 tiles of that type exist (the winning tiles), rest are "decoys"
  // of other types (also predetermined). Player ALWAYS finds 3 of the
  // winning type if they keep tapping — guaranteed.
  _generatePickTiles(totalBet, minAward) {
    const PRIZE_WEIGHTS = [
      { type:'cash',      weight:0.40 },
      { type:'cash',      weight:0.20 },
      { type:'hold_spin', weight:0.14 },
      { type:'red_spin',  weight:0.12 },
      { type:'mini',      weight:0.07 },
      { type:'minor',     weight:0.04 },
      { type:'major',     weight:0.02 },
      { type:'grand',     weight:0.01 },
    ];
    const CASH_TIERS = [
      { minMult:5,  maxMult:25 },
      { minMult:25, maxMult:75 },
      { minMult:75, maxMult:150 },
    ];

    // 1. Decide the winning prize type and value
    const roll = rng.next();
    let cum=0, winType=PRIZE_WEIGHTS[0];
    for (const p of PRIZE_WEIGHTS) { cum+=p.weight; if(roll<cum){winType=p;break;} }

    let winValue = 0;
    if (winType.type === 'cash') {
      const tier = CASH_TIERS[rng.nextInt(0, 2)];
      winValue = Math.max(Math.round(totalBet * rng.nextInt(tier.minMult, tier.maxMult) * 100)/100, minAward);
    }
    const winPrize = { type:winType.type, value:winValue };

    // 2. Build 15-tile board: exactly 3 winning tiles + 12 decoy tiles
    // Decoy types are all prize types EXCEPT the winning type
    const decoyTypes = PRIZE_WEIGHTS
      .filter(p => p.type !== winType.type)
      .map(p => p.type);

    const tiles = [];
    // Add 3 guaranteed winning tiles
    for (let i=0;i<3;i++) tiles.push({...winPrize});
    // Add 12 decoy tiles — each decoy type capped at max 2 occurrences.
    // With 12 decoys across 7 types (max 2 each), no decoy type can reach match-3
    // before the 3 guaranteed winning tiles are found — win is always achievable.
    const decoyCounts = {};
    for (let i=3;i<PICK_CHOOSE_GRID_SIZE;i++) {
      let dt, attempts = 0;
      do {
        dt = decoyTypes[rng.nextInt(0, decoyTypes.length-1)];
        attempts++;
      } while ((decoyCounts[dt] || 0) >= 2 && attempts < 20);
      decoyCounts[dt] = (decoyCounts[dt] || 0) + 1;
      let dv = 0;
      if (dt === 'cash') {
        const tier = CASH_TIERS[0];
        dv = Math.max(Math.round(totalBet * rng.nextInt(tier.minMult, tier.maxMult/2) * 100)/100, minAward);
      }
      tiles.push({ type:dt, value:dv });
    }

    // 3. Shuffle — winning tiles are randomly distributed
    for (let i=tiles.length-1;i>0;i--) {
      const j=rng.nextInt(0,i); [tiles[i],tiles[j]]=[tiles[j],tiles[i]];
    }
    return tiles;
  },

  // ═══════════════════════════════════════════════════════════════════
  // BONUS FEATURE — B-O-N-U-S Letter Bonus
  // 3 glowing orbs animate on screen. Player picks one.
  // Fully predetermined — RNG decides before player taps.
  // Prizes: Red Spin | Pick & Choose | Hold & Spin (no jackpots)
  // ═══════════════════════════════════════════════════════════════════
  async runBonusFeature(betPerLine, linesActive, callerContext={}) {
    GameState.activeBonus = 'BONUS_FEATURE';
    const events = [];
    const totalBet = betPerLine * linesActive;
    // Jackpots suppressed when called from inside Red Spin (design rule)
    const noJackpots = callerContext.noJackpots === true;

    // ── STEP 1: Predetermined RNG — decide prize before player picks ──
    const prizes = ['red_spin', 'pick_choose', 'hold_spin'];
    // Shuffle prizes so each orb position is random
    for (let i = prizes.length - 1; i > 0; i--) {
      const j = rng.nextInt(0, i);
      [prizes[i], prizes[j]] = [prizes[j], prizes[i]];
    }
    // Pick a winning position (0, 1, or 2) — player's pick always wins
    const winPosition = rng.nextInt(0, 2);
    const winPrize    = prizes[winPosition];

    // ── STEP 2: Show bonus orb selection screen ────────────────────────
    if (typeof UI !== 'undefined') await UI.showBonusOrbScreen(prizes, winPosition);
    if (typeof Audio !== 'undefined') Audio.startPickMusic();
    logEvent('BONUS_FEATURE_ENTRY', { bonusType:'BONUS_FEATURE', betPerLine, linesActive, winPrize, prizes });

    // ── STEP 3: Wait for player to tap an orb ─────────────────────────
    const chosenIdx = await this._waitForOrbTap();
    // Reveal all orbs — the one tapped is always the winner (predetermined)
    if (typeof UI !== 'undefined') await UI.revealBonusOrbs(prizes, winPosition, chosenIdx);
    if (typeof Audio !== 'undefined') Audio.play('pick_match');
    await this._delay(1200);

    // ── STEP 4: Award predetermined prize ─────────────────────────────
    let awardHoldSpin = false, awardRedSpin = false, awardPickChoose = false;
    if (winPrize === 'hold_spin')   awardHoldSpin  = true;
    if (winPrize === 'red_spin')    awardRedSpin   = true;
    if (winPrize === 'pick_choose') awardPickChoose = true;

    if (typeof Audio !== 'undefined') Audio.stopPickMusic();
    if (typeof UI !== 'undefined') await UI.endBonusOrbScreen(winPrize);

    logEvent('BONUS_FEATURE_END', { bonusType:'BONUS_FEATURE', winPrize, chosenIdx, winPosition });
    GameState.activeBonus = null;

    return { totalWon:0, awardHoldSpin, awardRedSpin, awardPickChoose, events,
             outcome:{ winPrize, chosenIdx, winPosition } };
  },

  _waitForOrbTap() {
    return new Promise(resolve => {
      if (typeof UI !== 'undefined') {
        // Delay before wiring tap — prevents tap-through from bonus trigger gesture
        setTimeout(function() {
          UI.setOrbTapCallback(resolve);
        }, 600);
      } else {
        setTimeout(() => resolve(0), 500);
      }
    });
  },

  _waitForTileTap(revealed) {
    return new Promise(resolve => {
      if (typeof UI !== 'undefined') {
        UI.setPickTapCallback(index => { if (!revealed[index]) resolve(index); });
      } else {
        const idx = revealed.findIndex(v => !v);
        setTimeout(() => resolve(idx >= 0 ? idx : -1), 200);
      }
    });
  },

  async replayGame(gameRecord) {
    if (!GameState.operator.panelOpen) return;
    if (GameState.spinInProgress || GameState.activeBonus) return;
    GameState.replayMode = true;
    if (typeof UI !== 'undefined') UI.showReplayBanner(gameRecord.gameNumber, gameRecord.timeFormatted);
    if (gameRecord.reelStops && gameRecord.grid) {
      if (typeof UI !== 'undefined') {
        await UI.animateReelsStop(gameRecord.reelStops, gameRecord.grid, true);
        if (gameRecord.baseResult && gameRecord.baseResult.wins && gameRecord.baseResult.wins.length) await UI.showBaseWins(gameRecord.baseResult, 0, 0, true);
      }
    }
    for (const bonus of (gameRecord.bonuses || [])) {
      for (const evt of (bonus.events || [])) {
        if (evt.type==='RED_SPIN_WIN' && typeof UI!=='undefined') await UI.updateRedSpinWin(evt.winAmount, evt.runningTotal, evt.spinNumber, true);
        if (evt.type==='HOLD_SPIN_LAND' && evt.position!=null && typeof UI!=='undefined') await UI.animateCoinLand(evt.position, evt.coin, true);
        if (evt.type==='PICK_REVEAL' && evt.tileIndex!=null && typeof UI!=='undefined') await UI.revealPickTile(evt.tileIndex, evt.tile, true);
        await this._delay(180);
      }
    }
    if (typeof UI !== 'undefined') UI.showReplaySummary(gameRecord.summary);
    GameState.replayMode = false;
  },

  _delay(ms) { return new Promise(r => setTimeout(r, ms)); },
};
