/* ═══════════════════════════════════════════════════════════════════════
 * ORIGINAL RED SPIN DESIGN — v6l64 (PRE-TIERED VOLATILITY)
 * 
 * DESIGN: Pure ascending RNG system — each spin must strictly beat previous win.
 * No tiers. Single win floor (max of triggering win, totalBet).
 * Continuance: 60% (was 70% until v6l64).
 * Sisters cap: when no real combination can beat lastWin, force Sisters 5-oak → GRAND.
 *
 * TO REVERT: Replace the runRedSpin() function in bonuses.js with this code.
 * Also remove RED_SPIN_TIERS and RED_SPIN_TIER_ADVANCE_PROB from paytable.js.
 * Change RED_SPIN_CONTINUANCE_DEFAULT back to 0.70 if desired.
 *
 * Saved from: turrelle_v6l64/bonuses.js
 * Date saved: 2026-05-18
 * ═══════════════════════════════════════════════════════════════════════ */
  async runRedSpin(betPerLine, linesActive, callerContext={}) {
    // ══════════════════════════════════════════════════════════════════
    // RED SPIN — CLASS III SCRIPTED VOLATILITY ARCHITECTURE
    // Modelled on Neptune's Gold (VGT/Aristocrat Class III)
    //
    // ARCHITECTURE (owner confirmed 2026-05-18):
    //   - SAME reel strips as base game — no dynamic strip switching
    //   - SAME evaluateSpin() engine — paylines, wilds, letters, all active
    //   - RNG constrained: each spin must produce a REAL combination
    //     where the payline total EXCEEDS the previous spin's win
    //   - The effect feels scripted because wins genuinely escalate,
    //     but the math is true RNG within that constraint
    //   - No pre-determined spin count — pure random via continuance check
    //
    // FLOOR / CEILING:
    //   - Floor = max(triggering base win, totalBet). Spin 1 always beats
    //     the triggering win. Never awards less than the bet.
    //   - Ceiling = Sisters 5-oak center line → GRAND jackpot fires naturally
    //     via processCharacterJackpots. This is the last possible real
    //     combination — no higher combination exists in the reel math.
    //
    // CONTINUANCE:
    //   - Spin 1: guaranteed (no check)
    //   - Spin 2+: 60% continue / 40% end (RED_SPIN_CONTINUANCE_DEFAULT)
    //   - Grand jackpot hit always ends the sequence
    //
    // BONUSES WITHIN SEQUENCE:
    //   - H&S, P&C, BONUS letters CAN trigger on RS spins (same as base)
    //   - Additional RS awards from sub-bonuses are QUEUED (pendingRedSpins)
    //     and dispatched after the primary sequence completes
    //
    // LAST RESORT (Sisters cap):
    //   - If 500 random attempts AND full R1×R2 scan cannot beat lastWin,
    //     game forces Sisters stops [46,68,42,16,54] → GRAND jackpot
    //   - This maintains reel/win integrity: reels always match payout
    // ══════════════════════════════════════════════════════════════════

    GameState.activeBonus = 'RED_SPIN';
    const totalBet    = betPerLine * linesActive;
    const op          = GameState.operator;
    let   bonusTotal  = 0;
    // Spin 1 floor — VGT rule: Red Spin Screen Bonus ALWAYS pays more than the total bet (all denoms).
    // From base game: floor = max(base game win, totalBet). e.g. $1 cherry on a $100 bet → floor = $100.
    // From BONUS orb or Pick & Choose (no prevWin): floor = totalBet.
    // The zero fallback is intentionally removed — no valid trigger context has a floor below totalBet.
    // totalBet is already denom-scaled (betPerLine = denom × creditsPerLine) — no per-denom logic needed.
    let   lastWin     = (callerContext && callerContext.prevWin != null)
                        ? Math.max(callerContext.prevWin, totalBet)
                        : totalBet;
    let   spinNum     = 0;
    let   grandHit    = false;

    // Track additional Red Spin awards triggered DURING this sequence.
    // Each entry = { source: 'P&C' | 'LETTERS' } — dispatched after sequence ends.
    const pendingRedSpins = [];

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
      } while (spinWin <= lastWin && attempts < 500);

      // ── Fallback: RNG couldn't find a real winning grid after 500 attempts ──
      // Scan all 80^5 stop combinations is infeasible, so we use a targeted scan:
      // Try all stops on reel 1 × all stops on reel 2 with reels 3-5 random,
      // looking for any grid whose totalWin > lastWin.
      // This guarantees the displayed symbols MATCH the awarded win amount.
      if (spinWin <= lastWin) {
        logEvent('RED_SPIN_FALLBACK', { spinNum, lastWin, attempts });
        var found = false;
        var r3 = Math.floor(rng.next() * REEL_STRIPS[2].length);
        var r4 = Math.floor(rng.next() * REEL_STRIPS[3].length);
        var r5 = Math.floor(rng.next() * REEL_STRIPS[4].length);
        outer: for (var r1 = 0; r1 < REEL_STRIPS[0].length; r1++) {
          for (var r2 = 0; r2 < REEL_STRIPS[1].length; r2++) {
            var tryStops = [r1, r2, r3, r4, r5];
            var tryGrid  = buildGrid(tryStops);
            var tryResult = evaluateSpin(tryGrid, linesActive, betPerLine);
            if (tryResult.totalWin > lastWin) {
              stops  = tryStops;
              grid   = tryGrid;
              result = tryResult;
              spinWin = tryResult.totalWin;
              found = true;
              break outer;
            }
          }
        }
        // ── SISTERS CAP — absolute maximum Red Spin win ───────────────
        // No real reel combination can beat lastWin. Force Sisters 5-oak on
        // middle payline → GRAND jackpot fires via processCharacterJackpots.
        // Reels always match the win. GRAND jackpot = cap (owner confirmed 2026-05-18).
        //
        // Sisters stop positions where id=0 lands on row 1 (middle row):
        // Reel1=46, Reel2=68, Reel3=42, Reel4=16, Reel5=54 — verified against REEL_STRIPS.
        var sistersId    = (typeof SYMBOLS !== 'undefined' && SYMBOLS.SISTERS) ? SYMBOLS.SISTERS.id : 0;
        var sisterStops  = [];
        var sistersValid = true;
        for (var si = 0; si < 5; si++) {
          var sIdx = REEL_STRIPS[si].indexOf(sistersId);
          if (sIdx === -1) { sistersValid = false; break; }
          sisterStops.push(sIdx);
        }

        if (sistersValid) {
          stops  = sisterStops;
          grid   = buildGrid(stops);
          result = evaluateSpin(grid, linesActive, betPerLine);
          // evaluateSpin returns 0 for Sisters (no payline pay — jackpot only).
          // spinWin stays 0 here; the GRAND jackpot fires via processCharacterJackpots below.
          // Setting spinWin to 0 is correct — the GRAND value gets added to bonusTotal separately.
          spinWin = 0;
          found   = true;
          logEvent('RED_SPIN_SISTERS_CAP', { spinNum, lastWin, reason: 'No real grid exceeds lastWin — forcing Sisters GRAND jackpot cap' });
        } else {
          // Sisters not found in strips (should never happen) — end sequence gracefully
          logEvent('RED_SPIN_ABORT', { spinNum, lastWin, reason: 'Sisters not found in reel strips' });
          break;
        }
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

      // H&S: 6+ gold coins anywhere on grid
      // H&S CANNOT trigger additional bonuses — runs contained, no pending dispatch
      if (!op.disableHoldSpinInRedSpin && result.triggerHoldSpin) {
        const hsResult = await this.runHoldSpin(betPerLine, linesActive, null, grid, { from:'RED_SPIN', noRestoreReels:true });
        bonusTotal += hsResult.totalWon || 0;
      }

      // P&C: Lipstick 5-oak on active payline
      // P&C CAN award: Cash (included in totalWon), Jackpots (handled inside runPickChoose),
      //                Red Spin (queued as pending — dispatched after this sequence ends)
      if (!op.disablePickChooseInRedSpin && result.scatterTriggered) {
        const pcResult = await this.runPickChoose(betPerLine, linesActive, { from:'RED_SPIN', triggerStops: stops, triggerGrid: grid });
        bonusTotal += pcResult.totalWon || 0;
        if (pcResult.awardRedSpin) {
          pendingRedSpins.push({ source: 'PICK_CHOOSE' });
          logEvent('RED_SPIN_ADDITIONAL_QUEUED', { bonusType:'RED_SPIN', source:'PICK_CHOOSE', queueLength: pendingRedSpins.length });
        }
        // awardHoldSpin from P&C inside Red Spin — H&S cannot chain back, skip
      }

      // BONUS letters: full B-O-N-U-S on bottom row
      // Letters CAN award: H&S, P&C, Red Spin
      // H&S runs immediately (no chaining), P&C runs immediately, Red Spin queued as pending
      if (result.bonusLetterCount === 5) {
        const bResult = await this.runBonusFeature(betPerLine, linesActive, { from:'RED_SPIN', noJackpots:true });
        bonusTotal += bResult.totalWon || 0;

        if (bResult.awardHoldSpin) {
          // H&S runs now — no further chaining from H&S inside Red Spin
          const hsResult = await this.runHoldSpin(betPerLine, linesActive, null, grid, { from:'RED_SPIN_BONUS', noJackpots:true, noRestoreReels:true });
          bonusTotal += hsResult.totalWon || 0;
        } else if (bResult.awardPickChoose) {
          // P&C runs now — its own Red Spin award is also queued if won
          const pcResult = await this.runPickChoose(betPerLine, linesActive, { from:'RED_SPIN_BONUS', noJackpots:true });
          bonusTotal += pcResult.totalWon || 0;
          if (pcResult.awardRedSpin) {
            pendingRedSpins.push({ source: 'LETTERS_PC' });
            logEvent('RED_SPIN_ADDITIONAL_QUEUED', { bonusType:'RED_SPIN', source:'LETTERS_PC', queueLength: pendingRedSpins.length });
          }
        } else if (bResult.awardRedSpin) {
          // Letters orb awarded Red Spin — queue it
          pendingRedSpins.push({ source: 'LETTERS' });
          logEvent('RED_SPIN_ADDITIONAL_QUEUED', { bonusType:'RED_SPIN', source:'LETTERS', queueLength: pendingRedSpins.length });
        }
      }

      // Partial BONUS letter pays already included in result.totalWin via evaluateSpin

      // ── Continuance check ──────────────────────────────────────────
      // Spin 1 is always guaranteed — continuance starts from spin 2
      if (spinNum >= 2) {
