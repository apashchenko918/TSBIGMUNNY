'use strict';

// ── UNIFIED JACKPOT CHECK — v6l96 ────────────────────────────────────────────
// Single roll at bonus entry (H&S, P&C, RS). Must-hit-by takes priority.
// PERMANENT RULE: Fire once per bonus trigger. Never per-spin or per-tile.
// PERMANENT RULE: BONUS orb never calls this — only its sub-bonuses do.
function _checkUnifiedJackpot() {
  var tiers = ['GRAND', 'MAJOR', 'MINOR', 'MINI'];

  // Must-hit-by: force award when within 2% of cap (highest tier first)
  for (var mhi = 0; mhi < tiers.length; mhi++) {
    var mhKey = tiers[mhi];
    var mhJp  = GameState.jackpots[mhKey];
    if (mhJp && mhJp.mustHitBy > 0 && mhJp.current >= mhJp.mustHitBy * 0.98) {
      logEvent('JACKPOT_MUST_HIT_BY_FORCED', { tier: mhKey, current: mhJp.current, cap: mhJp.mustHitBy });
      return mhKey;
    }
  }

  // ── v7.0.1 — Operator forceJackpotQueue (bonus/any context) ─────────────
  // Fires when operator has armed a jackpot for bonus or any context.
  // Queue allows multi-jackpot: each call pops one tier from the queue.
  var op = GameState.operator;
  var fqCtx = op.forceJackpotContext || 'bonus';
  if (op.forceJackpotQueue && op.forceJackpotQueue.length > 0 &&
      (fqCtx === 'bonus' || fqCtx === 'any')) {
    var forcedTier = op.forceJackpotQueue.shift(); // pop first item
    logEvent('JACKPOT_OPERATOR_FORCED', { tier: forcedTier, context: 'UNIFIED_BONUS', remaining: op.forceJackpotQueue.length });
    if (op.forceJackpotQueue.length === 0) {
      // Queue exhausted — reset legacy forceJackpot flag too
      op.forceJackpot = 'none';
    }
    return forcedTier;
  }
  // Legacy single forceJackpot support (context bonus/any)
  if (op.forceJackpot && op.forceJackpot !== 'none' &&
      (fqCtx === 'bonus' || fqCtx === 'any')) {
    var legTier = op.forceJackpot;
    op.forceJackpot = 'none';
    logEvent('JACKPOT_OPERATOR_FORCED', { tier: legTier, context: 'UNIFIED_BONUS_LEGACY' });
    return legTier;
  }

  // Random roll — highest tier first so GRAND takes priority
  var p = JACKPOT_UNIFIED_PROBS;
  if (rng.chance(p.GRAND))  return 'GRAND';
  if (rng.chance(p.MAJOR))  return 'MAJOR';
  if (rng.chance(p.MINOR))  return 'MINOR';
  if (rng.chance(p.MINI))   return 'MINI';
  return null;
}

var Bonuses = {

// ═══════════════════════════════════════════════════════════════════════
// BONUS #1 — RED SPIN BONUS
// As soon as reels stop → immediately go to next spin (no delay for wins)
// Pick & Choose and Hold & Spin can be disabled in operator menu during red spin
// Jackpot order rule: Mini first, then Minor, Major, Grand in sequence
// ═══════════════════════════════════════════════════════════════════════


  async runRedSpin(betPerLine, linesActive, callerContext) {
    if (callerContext === undefined) callerContext = {};
    // ── RS PER-TIER JACKPOT SYSTEM (v7.0.4) ─────────────────────────────────
    // Jackpot check fires at each tier ENTRY via _rollTierJackpot().
    // T1 (index 0): MINI or MAJOR/MINOR/GRAND via unified probs
    // T2 (index 1): MINOR if MINOR progressive ≥ 3× totalBet, else MINI. GRAND always eligible.
    // T3 (index 2): MAJOR designated. GRAND always eligible.
    // T4 (index 3): GRAND always. 4-oak wild combos ascending then GRAND jackpot forced.
    // NO unified entry check at RS start — RS uses per-tier checks exclusively.
    // H&S and P&C use the unified entry check. RS tier system is separate.
    // Both draw from the same progressive pool via awardJackpot().
    var _tierJackpot       = null;  // jackpot type won at current tier entry
    var _tierJpSpinsLeft   = 0;     // normal spins to play before jackpot spin
    var _tierJpFired       = false; // jackpot spin played this tier

    // ══════════════════════════════════════════════════════════════════
    // RED SPIN — CLASS III SCRIPTED VOLATILITY ARCHITECTURE
    // Modelled on BIG MUNNY (BIG MUNNY Class III)
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
    //   - Additional RS awards: player must re-trigger naturally after RS ends
    //     and dispatched after the primary sequence completes
    //
    // LAST RESORT (Sisters cap):
    //   - If 500 random attempts AND full R1×R2 scan cannot beat lastWin,
    //     game forces Sisters stops [46,68,42,16,54] → GRAND jackpot
    //   - This maintains reel/win integrity: reels always match payout
    // ══════════════════════════════════════════════════════════════════

    GameState.activeBonus = 'RED_SPIN';
    var totalBet    = betPerLine * linesActive;
    var op          = GameState.operator;
    var bonusTotal  = 0;
    // Spin 1 floor — BIG MUNNY rule: Red Spin Screen Bonus ALWAYS pays more than the total bet (all denoms).
    // From base game: floor = max(base game win, totalBet). e.g. $1 win on a $100 bet → floor = $100.
    // From BONUS orb or Pick & Choose (no prevWin): floor = totalBet.
    // The zero fallback is intentionally removed — no valid trigger context has a floor below totalBet.
    // totalBet is already denom-scaled (betPerLine = denom × creditsPerLine) — no per-denom logic needed.
    var lastWin     = (callerContext && callerContext.prevWin != null)
                        ? Math.max(callerContext.prevWin, totalBet)
                        : totalBet;
    var spinNum    = 0;
    var grandHit   = false;
    var currentTier = 0;           // index into RED_SPIN_TIERS
    var firstInTier = true;        // spin 1 of each tier is guaranteed
    var lastPaylineKey = '';       // sorted winning lineIndex string from previous spin
    var lastStops = [];            // reel stops from previous spin (for repeat detection)

    var TIERS      = (typeof RED_SPIN_TIERS !== 'undefined') ? RED_SPIN_TIERS : [
      { name:'SMALL',   minMult:1,   maxMult:10   },
      { name:'MEDIUM',  minMult:10,  maxMult:35   },
      { name:'LARGE',   minMult:35,  maxMult:200  },
      { name:'SISTERS', minMult:null, maxMult:null },
    ];
    var ADVANCE_PROB  = (typeof RED_SPIN_TIER_ADVANCE_PROB !== 'undefined') ? RED_SPIN_TIER_ADVANCE_PROB : 0.20;
    // JP_ODDS / JP_TYPES / jpFiredThisTier removed v6l99 — per-tier jackpot handled by _rollTierJackpot().

    // ── v7.0.2 SWEEP MODE ───────────────────────────────────────────────────
    // When op.rsSweepMode is true, RS plays through all winning symbol combinations
    // within each tier's win range for QA verification. Ascending rule is suspended.
    var _sweepMode    = !!(op.rsSweepMode);
    var _sweepTier    = (op.rsSweepTier !== undefined) ? op.rsSweepTier : -1;
    var _sweepList    = [];   // flat ordered list of sweep cases across target tiers
    var _sweepIdx     = 0;    // current position in _sweepList

    // Generate sweep cases for a single tier — all (symbolKey, count, wildConfig) combos
    // whose per-payline win falls within [tier.minMult, tier.maxMult] × totalBet.
    function _buildSweepCasesForTier(tierIdx) {
      var tier = TIERS[tierIdx];
      if (!tier || tier.minMult === null) {
        // T4 Sisters tier — one special case: GRAND (Sisters 5-oak)
        return [{ type:'SISTERS', tierIdx: tierIdx, winAmount: totalBet * 1000 }];
      }
      var minW = tier.minMult * totalBet;
      var maxW = tier.maxMult * totalBet;
      var cases = [];
      var symKeys = ['SINGLE_BAR','DOUBLE_BAR','TRIPLE_BAR','DIAMOND','SEVEN','DJ_MAXINE','STRAYPUP','JOSIE','SASHA'];
      var counts  = [3, 4, 5];
      // Wild multiplier configs: [josieCount, sashaCount]
      var wildCfgs = [[0,0],[1,0],[0,1],[1,1],[2,0],[2,1],[2,2]];

      for (var ski = 0; ski < symKeys.length; ski++) {
        var sk = symKeys[ski];
        if (!PAY_TABLE || !PAY_TABLE[sk]) continue;
        var pays = PAY_TABLE[sk];
        for (var ci = 0; ci < counts.length; ci++) {
          var cnt = counts[ci];
          var payIdx = Math.max(0, 5 - cnt);
          if (payIdx >= pays.length || pays[payIdx] === 0) continue;
          var basePay = pays[payIdx];
          for (var wi = 0; wi < wildCfgs.length; wi++) {
            var jc = wildCfgs[wi][0]; var sc = wildCfgs[wi][1];
            // Wilds occupy slots — match symbol needs at least 1 slot
            if (cnt - jc - sc < 1) continue;
            // Skip wild-on-wild (Josie/Sasha don't need additional wilds)
            if ((sk === 'JOSIE' || sk === 'SASHA') && (jc > 0 || sc > 0)) continue;
            var mult = Math.max(1, jc * 2 + sc * 1);
            var winAmt = basePay * betPerLine * mult;
            if (winAmt >= minW && winAmt <= maxW) {
              cases.push({ type:'PAYLINE', symKey:sk, count:cnt, josie:jc, sasha:sc, mult:mult, winAmount:winAmt, tierIdx:tierIdx });
            }
          }
        }
      }
      // Mixed bar combos
      var mbPay = (typeof MIXED_BAR_PAY !== 'undefined') ? MIXED_BAR_PAY : {};
      var mbCounts = [3, 4, 5];
      for (var mbi = 0; mbi < mbCounts.length; mbi++) {
        var mbc = mbCounts[mbi];
        var mbW = (mbPay[mbc] || 0) * betPerLine;
        if (mbW >= minW && mbW <= maxW) {
          cases.push({ type:'MIXED_BAR', count:mbc, winAmount:mbW, tierIdx:tierIdx });
        }
      }
      // Sort ascending so wins escalate naturally
      cases.sort(function(a, b) { return a.winAmount - b.winAmount; });
      return cases;
    }

    // Build a grid that displays the given sweep case on the center payline ([1,1,1,1,1])
    function _buildSweepGrid(swCase) {
      var centerLine = PAYLINES[0]; // [1,1,1,1,1] — middle row
      // Start with random stops for variety in the non-target cells
      var stops = REEL_STRIPS.map(function(r) { return Math.floor(rng.next() * r.length); });
      var grid  = buildGrid(stops);

      if (swCase.type === 'SISTERS') {
        // Place Sisters on all 5 reels at center row
        for (var c = 0; c < 5; c++) grid[c][centerLine[c]] = SYMBOLS.SISTERS.id;
      } else if (swCase.type === 'MIXED_BAR') {
        // Alternate bar types, ensure they differ
        var barIds = [SYMBOLS.SINGLE_BAR.id, SYMBOLS.DOUBLE_BAR.id, SYMBOLS.TRIPLE_BAR.id];
        for (var mc = 0; mc < swCase.count; mc++) {
          grid[mc][centerLine[mc]] = barIds[mc % 3];
        }
        for (var mc2 = swCase.count; mc2 < 5; mc2++) {
          grid[mc2][centerLine[mc2]] = SYMBOLS.LIPSTICK.id; // breaks combo cleanly
        }
      } else {
        // Standard payline combo: wilds first, then match symbol, then breaker
        var symId = SYMBOLS[swCase.symKey] ? SYMBOLS[swCase.symKey].id : SYMBOLS.SEVEN.id;
        var col = 0;
        for (var j = 0; j < swCase.josie && col < swCase.count; j++, col++) {
          grid[col][centerLine[col]] = SYMBOLS.JOSIE.id;
        }
        for (var s = 0; s < swCase.sasha && col < swCase.count; s++, col++) {
          grid[col][centerLine[col]] = SYMBOLS.SASHA.id;
        }
        for (; col < swCase.count; col++) {
          grid[col][centerLine[col]] = symId;
        }
        for (; col < 5; col++) {
          grid[col][centerLine[col]] = SYMBOLS.LIPSTICK.id; // breaks combo
        }
      }
      return { stops: stops, grid: grid };
    }

    if (_sweepMode) {
      // Build the full sweep list across target tiers
      var tierRange = (_sweepTier === -1) ? [0, 1, 2, 3] : [_sweepTier];
      for (var tri = 0; tri < tierRange.length; tri++) {
        var tCases = _buildSweepCasesForTier(tierRange[tri]);
        for (var tci = 0; tci < tCases.length; tci++) {
          _sweepList.push(tCases[tci]);
        }
      }
      logEvent('RS_SWEEP_START', { sweepTier: _sweepTier, totalCases: _sweepList.length });
      if (typeof UI !== 'undefined') UI.showToast('SWEEP: ' + _sweepList.length + ' combos');
    }

    // Helper: get sorted payline key from result
    function _paylineKey(res) {
      if (!res || !res.paylineWins || !res.paylineWins.length) return '__none__';
      return res.paylineWins.map(function(w) { return w.lineIndex; }).sort().join(',');
    }

    // pendingRedSpins removed v6l97 — additional RS via natural base game trigger only.

    // Activate red screen + music
    if (typeof UI !== 'undefined') {
      try {
        await UI.activateRedScreen();
        await UI.showRedSpinEntry(0, 0);
      } catch(actErr) {
        console.error('[RS] activateRedScreen/showRedSpinEntry threw:', actErr && actErr.message ? actErr.message : actErr);
      }
    }
    if (typeof Audio !== 'undefined') Audio.startRedSpinMusic();
    if (typeof UI !== 'undefined') UI.setControlsEnabled(false);

    logEvent('RED_SPIN_START', {
      bonusType:'RED_SPIN', betPerLine, linesActive, totalBet,
      balanceBefore: GameState.balance
    });

    // ── Helper: find a real grid where the given jackpot type fires ─────────
    // v7.0.2 REWRITE: deterministic strip scan replaces 800-attempt random search.
    // OLD: random rolls had ~22% success for MINI/MINOR, ~0% for GRAND/MAJOR.
    // NEW: scans actual reel strips to find valid stop positions guaranteed to
    //      show the required jackpot symbols in the correct payline row.
    //      Falls back to 400 random attempts only if strip scan somehow fails.
    function _findJpGrid(jpType) {
      var activeLines = PAYLINES.slice(0, linesActive);

      // Shuffle active lines — varies which payline gets highlighted each time
      var lines = activeLines.slice();
      for (var si = lines.length - 1; si > 0; si--) {
        var sj = Math.floor(rng.next() * (si + 1));
        var st = lines[si]; lines[si] = lines[sj]; lines[sj] = st;
      }

      // Number of reels that must show the jackpot symbol
      // MINI/MINOR: 3 consecutive from reel 0
      // MAJOR/GRAND: all 5
      var numJpReels = (jpType === 'GRAND' || jpType === 'MAJOR') ? 5 : 3;

      for (var li = 0; li < lines.length; li++) {
        var line  = lines[li];
        var stops = [];
        var ok    = true;

        for (var col = 0; col < 5; col++) {
          var strip      = REEL_STRIPS[col];
          var targetRow  = line[col];

          if (col < numJpReels) {
            // ── Find stops that place the jackpot symbol in targetRow ──────
            var valid = [];
            for (var s = 0; s < strip.length; s++) {
              var sym = strip[(s + targetRow) % strip.length];
              var hit;
              if      (jpType === 'MINI')   hit = (sym === SYMBOLS.SASHA.id);
              else if (jpType === 'MINOR')  hit = (sym === SYMBOLS.JOSIE.id);
              else if (jpType === 'MAJOR')  hit = (WILD_IDS.indexOf(sym) >= 0);
              else /* GRAND */              hit = (sym === SYMBOLS.SISTERS.id);
              if (hit) valid.push(s);
            }
            if (valid.length === 0) { ok = false; break; }
            stops.push(valid[Math.floor(rng.next() * valid.length)]);

          } else {
            // ── Reels beyond the jackpot window (reels 3-4 for MINI/MINOR) ──
            // Prefer stops that do NOT show wild symbols at targetRow.
            // This prevents accidentally upgrading MINI→MAJOR or MINOR→MAJOR
            // when reels 3-4 happen to also show Josie/Sasha.
            if (jpType === 'MINI' || jpType === 'MINOR') {
              var safe = [];
              for (var ss = 0; ss < strip.length; ss++) {
                var safeSym = strip[(ss + targetRow) % strip.length];
                if (WILD_IDS.indexOf(safeSym) < 0) safe.push(ss);
              }
              stops.push(safe.length > 0
                ? safe[Math.floor(rng.next() * safe.length)]
                : Math.floor(rng.next() * strip.length));
            } else {
              stops.push(Math.floor(rng.next() * strip.length));
            }
          }
        }

        if (!ok) continue;

        var grid = buildGrid(stops);
        var hits = checkCharacterJackpots(grid, linesActive);
        // Verify we got the right tier (another payline might have triggered a higher tier)
        if (hits.indexOf(jpType) >= 0) return { stops: stops, grid: grid };
        // Mismatch (rare edge case) — try next payline
      }

      // Emergency random fallback — should almost never reach here
      for (var _ji = 0; _ji < 400; _ji++) {
        var _s = REEL_STRIPS.map(function(r) { return Math.floor(rng.next() * r.length); });
        var _g = buildGrid(_s);
        var _h = checkCharacterJackpots(_g, linesActive);
        if (_h.indexOf(jpType) >= 0) return { stops: _s, grid: _g };
      }
      return null; // truly unreachable under normal reel configurations
    }

    // ── Helper: fire tier-entry jackpot check (unified system) ──────────
    // Each RS tier entry is a full unified jackpot check — same system as
    // H&S and P&C. All four tiers eligible at every tier entry.
    // Must-hit-by caps enforced first (highest tier priority).
    // GRAND always eligible. T4 also allows MAJOR/MINOR if progressive qualifies.
    // The "designated" tier jackpot determines which symbols appear on the
    // jackpot spin — it does NOT restrict which jackpot can be won.
    // Owner confirmed 2026-05-21: tiered jackpots tied to unified system.
    function _rollTierJackpot(tierIndex) {
      var tiers = ['GRAND', 'MAJOR', 'MINOR', 'MINI'];

      // Must-hit-by: force award when within 2% of cap (highest tier first)
      for (var mhi = 0; mhi < tiers.length; mhi++) {
        var mhKey = tiers[mhi];
        var mhJp  = GameState.jackpots[mhKey];
        if (mhJp && mhJp.mustHitBy > 0 && mhJp.current >= mhJp.mustHitBy * 0.98) {
          logEvent('JACKPOT_MUST_HIT_BY_FORCED', { tier:mhKey, current:mhJp.current, cap:mhJp.mustHitBy, context:'RED_SPIN_TIER_'+tierIndex });
          return mhKey;
        }
      }

      // ── v7.0.2 — Operator RS tier jackpot force via forceRSTierMap ──────────
      // forceRSTierMap: { 0:'MINI', 1:'MINOR', 2:'MAJOR', 3:'GRAND' }
      // Each tier index has its own designated jackpot. null = no force for that tier.
      var opRS   = GameState.operator;
      var rsCtx  = opRS.forceJackpotContext || 'bonus';
      var tierMap = opRS.forceRSTierMap || {};
      var designatedJp = tierMap[tierIndex]; // may be undefined/null
      if (designatedJp && (rsCtx === 'bonus' || rsCtx === 'any')) {
        // Clear this tier's assignment after it fires (one-shot per tier)
        tierMap[tierIndex] = null;
        logEvent('JACKPOT_OPERATOR_FORCED', { tier: designatedJp, context: 'RED_SPIN_TIER_MAP_'+tierIndex });
        return designatedJp;
      }
      // Legacy: forceJackpotQueue (used by non-RS bonuses — pop if ANY tier is targeted)
      var rsTier = (opRS.forceRSTier !== undefined) ? opRS.forceRSTier : -1;
      if (opRS.forceJackpotQueue && opRS.forceJackpotQueue.length > 0 &&
          (rsCtx === 'bonus' || rsCtx === 'any') &&
          (rsTier === -1 || rsTier === tierIndex)) {
        var rsForcedTier = opRS.forceJackpotQueue.shift();
        logEvent('JACKPOT_OPERATOR_FORCED', { tier: rsForcedTier, context: 'RED_SPIN_TIER_QUEUE_'+tierIndex, remaining: opRS.forceJackpotQueue.length });
        if (opRS.forceJackpotQueue.length === 0) { opRS.forceJackpot = 'none'; }
        return rsForcedTier;
      }
      // Legacy single forceJackpot
      if (opRS.forceJackpot && opRS.forceJackpot !== 'none' &&
          (rsCtx === 'bonus' || rsCtx === 'any') &&
          (rsTier === -1 || rsTier === tierIndex)) {
        var rsLegTier = opRS.forceJackpot;
        opRS.forceJackpot = 'none';
        logEvent('JACKPOT_OPERATOR_FORCED', { tier: rsLegTier, context: 'RED_SPIN_TIER_LEGACY_'+tierIndex });
        return rsLegTier;
      }

      // Full unified random roll — identical to _checkUnifiedJackpot()
      // GRAND always first. T2 (tierIndex=1) uses dynamic MINOR/MINI selection
      // based on current MINOR progressive vs 3× totalBet threshold (v7.0.4).
      var p = JACKPOT_UNIFIED_PROBS;
      if (rng.chance(p.GRAND)) return 'GRAND';

      if (tierIndex === 2) {
        // T3: MAJOR designated
        if (rng.chance(p.MAJOR)) return 'MAJOR';
        if (rng.chance(p.MINOR)) return 'MINOR';
        if (rng.chance(p.MINI))  return 'MINI';
      } else if (tierIndex === 1) {
        // T2: MINOR if MINOR progressive >= 3× totalBet, else MINI (v7.0.4 owner confirmed)
        var minorProg = (GameState.jackpots && GameState.jackpots.MINOR) ? GameState.jackpots.MINOR.current : 0;
        if (rng.chance(p.MINOR)) {
          return (minorProg >= totalBet * 3) ? 'MINOR' : 'MINI';
        }
        if (rng.chance(p.MINI)) return 'MINI';
      } else {
        // T1 and T4: MINI/MAJOR/MINOR per unified probs
        if (rng.chance(p.MAJOR)) return 'MAJOR';
        if (rng.chance(p.MINOR)) return 'MINOR';
        if (rng.chance(p.MINI))  return 'MINI';
      }
      return null;
    }

    // ── TIERED SPIN LOOP ──────────────────────────────────────────────────
    while (true) {
      spinNum++;

      // ── v7.0.2 SWEEP MODE — plays through all combos in _sweepList ────────
      if (_sweepMode) {
        if (_sweepIdx >= _sweepList.length) {
          // All sweep cases played — end RS
          logEvent('RS_SWEEP_COMPLETE', { totalSpins: spinNum - 1 });
          break;
        }
        var _sweepCase = _sweepList[_sweepIdx++];
        var _sg = _buildSweepGrid(_sweepCase);
        var _sResult = evaluateSpin(_sg.grid, linesActive, betPerLine);
        var _sWin = _sResult.totalWin || _sweepCase.winAmount;
        // Update tier display to match the sweep case's tier
        currentTier = _sweepCase.tierIdx || 0;
        var _sTier = TIERS[currentTier] || TIERS[0];
        if (typeof UI !== 'undefined') {
          await UI.animateReelsStop(_sg.stops, _sg.grid);
          if (typeof UI.showRedSpinPaylineFlash !== 'undefined' && _sResult.paylineWins) {
            await UI.showRedSpinPaylineFlash(_sResult.paylineWins);
          }
          UI.updateRedSpinWin(_sWin, bonusTotal + _sWin, spinNum);
          UI.showRedSpinTier(_sTier.name, spinNum);
        }
        bonusTotal += _sWin;
        GameState.balance += _sWin;
        if (typeof UI !== 'undefined') UI.updateBalance(GameState.balance);
        lastWin = _sWin;
        logEvent('RS_SWEEP_SPIN', { sweepIdx: _sweepIdx, type: _sweepCase.type, symKey: _sweepCase.symKey, count: _sweepCase.count, winAmount: _sWin });
        await this._delay(1200);
        continue;
      }

      var tier = TIERS[currentTier];

      // ── Per-tier jackpot check on first spin of each tier ────────────
      if (firstInTier) {
        _tierJackpot     = _rollTierJackpot(currentTier);
        _tierJpSpinsLeft = _tierJackpot ? (1 + Math.floor(rng.next() * 3)) : 0; // 1-3 normal spins before JP
        _tierJpFired     = false;
        if (_tierJackpot) {
          logEvent('RS_TIER_JP_PENDING', { tier: tier.name, jpType: _tierJackpot, spinsBeforeJp: _tierJpSpinsLeft });
        }
      }

      var stops, grid, result, spinWin;
      var _isJpSpin = (_tierJackpot && !_tierJpFired && _tierJpSpinsLeft <= 0);

      // ── JACKPOT SPIN: find real grid with jackpot symbols ────────────
      if (_isJpSpin) {
        var jpGrid = _findJpGrid(_tierJackpot);
        if (jpGrid) {
          stops  = jpGrid.stops;
          grid   = jpGrid.grid;
          result = evaluateSpin(grid, linesActive, betPerLine);
          spinWin = result.totalWin;
        } else {
          // No matching grid found — award jackpot without symbol match (fallback)
          stops  = REEL_STRIPS.map(function(s) { return Math.floor(rng.next() * s.length); });
          grid   = buildGrid(stops);
          result = evaluateSpin(grid, linesActive, betPerLine);
          spinWin = result.totalWin;
          // Force jackpot award directly
          var directJpAmt = awardJackpot(_tierJackpot);
          bonusTotal += directJpAmt;
          GameState.balance += directJpAmt;
          if (typeof UI !== 'undefined') await UI.showJackpotCelebration(_tierJackpot, directJpAmt, 'RED_SPIN');
          _tierJpFired = true;
          if (_tierJackpot === 'GRAND') { grandHit = true; }
        }
        _tierJpFired = true;
        _tierJackpot = null;

      } else if (tier.name === 'SISTERS' || currentTier >= 3) {
        // ── T4 Sisters tier (v7.0.4) ─────────────────────────────────────────
        // Five 4-oak all-wild combos in ascending order (50→62.5→75→87.5→100× totalBet)
        // then GRAND jackpot. Same ascending/continuance rules as T1-T3.
        // matchSymbol = JOSIE (all-wild 4-oak), base pay 250. Josie=×2, Sasha=×1.
        var T4_WILD_COMBOS = [
          [0, 4, 50.0],   // 4S: ×4 → 50×
          [1, 3, 62.5],   // 1J+3S: ×5 → 62.5×
          [2, 2, 75.0],   // 2J+2S: ×6 → 75×
          [3, 1, 87.5],   // 3J+1S: ×7 → 87.5×
          [4, 0, 100.0],  // 4J: ×8 → 100×
        ];
        var tierMin4 = tier.minMult * totalBet;
        var tierMax4 = tier.maxMult * totalBet;
        var t4found  = false;

        for (var t4ci = 0; t4ci < T4_WILD_COMBOS.length; t4ci++) {
          var t4combo  = T4_WILD_COMBOS[t4ci];
          var t4target = t4combo[2] * totalBet;
          if (t4target < lastWin)   continue;
          if (t4target < tierMin4)  continue;
          if (t4target > tierMax4)  break;
          var t4jc  = t4combo[0];
          var t4sc  = t4combo[1];
          var t4ln  = PAYLINES[0];
          stops = REEL_STRIPS.map(function(s) { return Math.floor(rng.next() * s.length); });
          grid  = buildGrid(stops);
          var t4wi = 0;
          for (var t4r = 0; t4r < 4; t4r++) {
            grid[t4r][t4ln[t4r]] = (t4wi < t4jc) ? SYMBOLS.JOSIE.id : SYMBOLS.SASHA.id;
            t4wi++;
          }
          grid[4][t4ln[4]] = SYMBOLS.LIPSTICK ? SYMBOLS.LIPSTICK.id : SYMBOLS.SINGLE_BAR.id;
          result  = evaluateSpin(grid, linesActive, betPerLine);
          spinWin = result.totalWin;
          if (Math.abs(spinWin - t4target) > 0.01) { spinWin = t4target; }
          lastStops = stops.slice();
          lastPaylineKey = _paylineKey(result);
          t4found = true;
          logEvent('RED_SPIN_T4_WILD_COMBO', { spinNum: spinNum, jc: t4jc, sc: t4sc, target: t4target });
          break;
        }

        if (!t4found) {
          var sisId2   = SYMBOLS.SISTERS ? SYMBOLS.SISTERS.id : 0;
          var sisStops = REEL_STRIPS.map(function(s) {
            var idx = s.indexOf(sisId2);
            return idx >= 0 ? idx : Math.floor(rng.next() * s.length);
          });
          stops  = sisStops;
          grid   = buildGrid(stops);
          result = evaluateSpin(grid, linesActive, betPerLine);
          spinWin = result.totalWin;
          grandHit = true;
          logEvent('RED_SPIN_T4_GRAND_FORCED', { spinNum: spinNum, lastWin: lastWin });
        }
        if (_tierJpSpinsLeft > 0) _tierJpSpinsLeft--;

      } else {
        // ── Tiers 1-3: find a real grid within tier range ─────────────
        if (_tierJpSpinsLeft > 0) _tierJpSpinsLeft--;

        var tierMin = tier.minMult * totalBet;
        var tierMax = tier.maxMult * totalBet;

        // ── v7.0.4: bonus trigger exclusion helper ────────────────────────
        // Rejects any grid that would trigger H&S, P&C, or BONUS orb during RS.
        // Individual partial BONUS letters (1-4) are allowed and pay normally.
        // This helper is called at EVERY grid acceptance check in this loop.
        function _rsHasBonusTrigger(g) {
          // H&S: 6+ Gold Coins anywhere
          var coins = 0;
          for (var _rc = 0; _rc < 5; _rc++) {
            for (var _rr = 0; _rr < 3; _rr++) {
              if (g[_rc][_rr] === BONUS_ID) { coins++; if (coins >= 6) return true; }
            }
          }
          // P&C: 5× Lipstick on center payline (row 1 of all 5 reels)
          var centerLine = PAYLINES[0];
          var allLipstick = true;
          for (var _lc = 0; _lc < 5; _lc++) {
            if (g[_lc][centerLine[_lc]] !== BONUS_PC_ID) { allLipstick = false; break; }
          }
          if (allLipstick) return true;
          // BONUS orb: all 5 BONUS letters on bottom row simultaneously
          var allLetters = true;
          for (var _bc = 0; _bc < 5; _bc++) {
            if (g[_bc][2] !== LETTER_IDS[_bc]) { allLetters = false; break; }
          }
          if (allLetters) return true;
          return false;
        }

        // Regular spin: find real grid within tier range, beating lastWin, no bonus triggers
        var found = false;
        var attempts = 0;

        do {
          stops  = REEL_STRIPS.map(function(s) { return Math.floor(rng.next() * s.length); });
          grid   = buildGrid(stops);
          result = evaluateSpin(grid, linesActive, betPerLine);
          spinWin = result.totalWin;
          var plKey = _paylineKey(result);
          var stopsMatch = lastStops.length === 5 && stops.every(function(s, si) { return s === lastStops[si]; });
          var plMatch    = plKey !== '' && plKey === lastPaylineKey;
          var coinCount  = grid.reduce(function(n, col) { return n + col.filter(function(id) { return id === BONUS_ID; }).length; }, 0);
          found = spinWin >= lastWin
               && spinWin >= tierMin
               && spinWin <= tierMax
               && (!stopsMatch || !plMatch)
               && coinCount < 6
               && !_rsHasBonusTrigger(grid); // v7.0.4: exclude P&C, BONUS orb, H&S
          attempts++;
        } while (!found && attempts < 500);

          // Fallback R1×R2 scan within tier range
          if (!found) {
            logEvent('RED_SPIN_TIER_FALLBACK', { spinNum, tier: tier.name, lastWin, tierMin, tierMax });
            var r3 = Math.floor(rng.next() * REEL_STRIPS[2].length);
            var r4 = Math.floor(rng.next() * REEL_STRIPS[3].length);
            var r5 = Math.floor(rng.next() * REEL_STRIPS[4].length);
            outer: for (var f1 = 0; f1 < REEL_STRIPS[0].length; f1++) {
              for (var f2 = 0; f2 < REEL_STRIPS[1].length; f2++) {
                var fStops = [f1, f2, r3, r4, r5];
                var fGrid  = buildGrid(fStops);
                var fResult = evaluateSpin(fGrid, linesActive, betPerLine);
                var fKey    = _paylineKey(fResult);
                var fCoins  = fGrid.reduce(function(n, col) { return n + col.filter(function(id) { return id === BONUS_ID; }).length; }, 0);
                if (fResult.totalWin >= lastWin
                 && fResult.totalWin >= tierMin
                 && fResult.totalWin <= tierMax
                 && fKey !== lastPaylineKey
                 && fCoins < 6
                 && !_rsHasBonusTrigger(fGrid)) { // v7.0.4: exclude bonus triggers
                  stops = fStops; grid = fGrid; result = fResult;
                  spinWin = fResult.totalWin; found = true;
                  break outer;
                }
              }
            }
          }

          // Relax payline constraint if still not found
          if (!found) {
            logEvent('RED_SPIN_TIER_RELAX', { spinNum, tier: tier.name });
            var r3b = Math.floor(rng.next() * REEL_STRIPS[2].length);
            var r4b = Math.floor(rng.next() * REEL_STRIPS[3].length);
            var r5b = Math.floor(rng.next() * REEL_STRIPS[4].length);
            outer2: for (var g1 = 0; g1 < REEL_STRIPS[0].length; g1++) {
              for (var g2 = 0; g2 < REEL_STRIPS[1].length; g2++) {
                var gStops = [g1, g2, r3b, r4b, r5b];
                var gGrid  = buildGrid(gStops);
                var gResult = evaluateSpin(gGrid, linesActive, betPerLine);
                var gCoins  = gGrid.reduce(function(n, col) { return n + col.filter(function(id) { return id === BONUS_ID; }).length; }, 0);
                if (gResult.totalWin >= tierMin && gResult.totalWin <= tierMax && gCoins < 6 && !_rsHasBonusTrigger(gGrid)) { // v7.0.4: exclude bonus triggers
                  stops = gStops; grid = gGrid; result = gResult;
                  spinWin = gResult.totalWin; found = true;
                  break outer2;
                }
              }
            }
          }

          // Fallback: T1 → advance to T2. T2/T3 → end sequence (no cascade).
          // T4 Sisters reached only via natural 20% advancement or JP chain.
          if (!found) {
            logEvent('RED_SPIN_TIER_FALLBACK_END', { spinNum, tier: tier.name });
            if (currentTier === 0) {
              currentTier = 1; firstInTier = true; _tierJpFired = false; // (was jpFiredThisTier)
              lastPaylineKey = ''; continue;
            } else {
              break; // T2/T3 end sequence gracefully
            }
          }

          lastPaylineKey = _paylineKey(result);
          lastStops      = stops.slice();
        }

      // ── Animate reels ────────────────────────────────────────────────
      if (typeof UI !== 'undefined') {
        await UI.animateReelsStop(stops, grid, false, true);
        if (result.paylineWins && result.paylineWins.length > 0) {
          await UI.showRedSpinPaylineFlash(result.paylineWins);
        }
      }

      // ── Award win ────────────────────────────────────────────────────
      bonusTotal += spinWin;
      lastWin     = spinWin > 0 ? spinWin : lastWin; // Sisters: lastWin unchanged
      GameState.balance += spinWin;

      if (typeof UI !== 'undefined') {
        await UI.updateRedSpinWin(spinWin, bonusTotal, spinNum);
        UI.updateBalance(GameState.balance);
      }

      if (typeof Audio !== 'undefined' && spinWin >= totalBet) {
        Audio.playBellsForWin(spinWin, betPerLine);
      }

      logEvent('RED_SPIN', {
        bonusType:'RED_SPIN', spinNum, tier: tier.name,
        spinWin, bonusTotal, balanceAfter: GameState.balance
      });

      // ── Jackpots on paylines (Sisters fires here) ────────────────────
      var charJackpots = await processCharacterJackpots(grid, linesActive, 'RED_SPIN');
      if (charJackpots && charJackpots.totalAwarded > 0) {
        bonusTotal += charJackpots.totalAwarded;
        GameState.balance += charJackpots.totalAwarded;
        if (typeof UI !== 'undefined') UI.updateBalance(GameState.balance);
        if (charJackpots.hits && charJackpots.hits.indexOf('GRAND') >= 0) { grandHit = true; }
      }

      // End immediately after Sisters
      if (grandHit) break;

      // ── Bonus triggers within Red Spin ───────────────────────────────
      if (!op.disableHoldSpinInRedSpin && result.triggerHoldSpin) {
        var hsResult = await this.runHoldSpin(betPerLine, linesActive, null, grid, { from:'RED_SPIN', noRestoreReels:true });
        bonusTotal += hsResult.totalWon || 0;
      }
      if (!op.disablePickChooseInRedSpin && result.scatterTriggered) {
        var pcResult = await this.runPickChoose(betPerLine, linesActive, { from:'RED_SPIN', triggerStops:stops, triggerGrid:grid });
        bonusTotal += pcResult.totalWon || 0;
        // awardRedSpin from P&C inside RS noted but no auto-queue — player must trigger RS naturally.
      }
      if (result.bonusLetterCount === 5) {
        var bResult = await this.runBonusFeature(betPerLine, linesActive, { from:'RED_SPIN' }); // noJackpots removed v6l99
        bonusTotal += bResult.totalWon || 0;
        if (bResult.awardHoldSpin) {
          var hsR = await this.runHoldSpin(betPerLine, linesActive, null, grid, { from:'RED_SPIN_BONUS', noRestoreReels:true }); // noJackpots removed v6l96
          bonusTotal += hsR.totalWon || 0;
        } else if (bResult.awardPickChoose) {
          var pcR = await this.runPickChoose(betPerLine, linesActive, { from:'RED_SPIN_BONUS' }); // noJackpots removed v6l96
          bonusTotal += pcR.totalWon || 0;
          // LETTERS_PC inside RS: any awardRedSpin is discarded — player triggers RS naturally after bonus ends.
        } else if (bResult.awardRedSpin) {
          // pendingRedSpins removed v6l97 — additional RS via natural base game trigger.
        }
      }

      // ── Partial letter pays already included in result.totalWin ──────

      // ── Continuance / tier advancement check ─────────────────────────
      // Spin 1 of each tier is guaranteed — no check
      if (firstInTier) { firstInTier = false; }
      else {
        var continuesInTier = rng.chance(RED_SPIN_CONTINUANCE_DEFAULT); // 60%
        if (!continuesInTier) {
          // Tier exhausted — check advancement (Option C array: 20%/30%/50% per boundary)
          var hasNextTier = currentTier < TIERS.length - 1;
          var advProb  = Array.isArray(ADVANCE_PROB) ? (ADVANCE_PROB[currentTier] || 0.20) : ADVANCE_PROB;
          var advances = hasNextTier && rng.chance(advProb);
          if (advances) {
            currentTier++;
            firstInTier = true;
            _tierJpFired = false;
            lastPaylineKey = ''; lastStops = [];
            logEvent('RED_SPIN_TIER_ADVANCE', { spinNum: spinNum, newTier: TIERS[currentTier].name, advProb: advProb });
          } else {
            break; // sequence ends
          }
        }
        // Force tier advance if JP pushed lastWin above current tier ceiling
        if (!grandHit && currentTier < TIERS.length - 1 && tier.maxMult && lastWin > tier.maxMult * totalBet) {
          currentTier++;
          firstInTier = true;
          _tierJpFired = false;
          lastPaylineKey = '';
          logEvent('RED_SPIN_TIER_ADVANCE_JP', { spinNum: spinNum, newTier: TIERS[currentTier].name, lastWin: lastWin });
        }
      }

      if (spinNum >= 200) break; // safety valve
    } // end while(true) tier loop

    // ── Sequence complete ──────────────────────────────────────────────
    if (typeof Audio !== 'undefined') { try { Audio.stopRedSpinMusic(); } catch(e) { console.warn('[RS] stopRedSpinMusic error:', e); } }
    if (typeof UI !== 'undefined') {
      try {
        await UI.showRedSpinEndCelebration(bonusTotal, spinNum);
      } catch(celebErr) {
        console.error('[RS] showRedSpinEndCelebration threw:', celebErr && celebErr.message ? celebErr.message : celebErr);
        console.error('[RS] Stack:', celebErr && celebErr.stack ? celebErr.stack : '');
      }
      try {
        await UI.deactivateRedScreen();
      } catch(deactErr) {
        console.error('[RS] deactivateRedScreen threw:', deactErr);
      }
    }

    // Log bonus end
    logEvent('RED_SPIN_END', {
      bonusType:'RED_SPIN', totalSpins:spinNum,
      totalWon:bonusTotal, balanceAfter:GameState.balance,
      pendingRedSpins: 0 // removed v6l97
    });

    // ── Additional RS rounds ─────────────────────────────────────────────
    // Removed pendingRedSpins queue (v6l97 owner confirmed).
    // Additional RS only fires if the player presses SPIN after RS ends and
    // lands a winning combination — the natural base game RS trigger applies.
    // No automatic chaining from sub-bonus outcomes.

    // ── Sweep cleanup ──────────────────────────────────────────────────
    if (_sweepMode) {
      GameState.operator.rsSweepMode = false;
      GameState.operator.rsSweepTier = -1;
    }

    GameState.activeBonus = null;
    saveState();

    if (typeof UI !== 'undefined') UI.setControlsEnabled(true);

    return { totalWon: bonusTotal, spins: spinNum, events: [], outcome: { totalSpins: spinNum, totalWon: bonusTotal } };
  },


  // ── HOLD & SPIN OUTCOME GENERATOR ─────────────────────────────────────
  // Generates all coin positions and values in one RNG pass before any animation.
  // Returns { sequence, coinMap, isBlackout, totalCoins }
  _generateFullHoldSpinOutcome(betPerLine, linesActive, triggerGrid, preCoinMap, guaranteedJackpot) {
    if (guaranteedJackpot === undefined) guaranteedJackpot = null;
    var GRID_SIZE    = 15;
    var landedSet    = new Set();
    var coinMap      = {};
    var sequence     = [];

    // Lock trigger coins — use pre-assigned values if provided (pre-generated at spin time)
    var initialCoins = [];
    if (triggerGrid) {
      for (var col = 0; col < 5; col++) {
        for (var row = 0; row < 3; row++) {
          var sym = (triggerGrid[col] && triggerGrid[col][row]);
          if (sym === BONUS_ID) {
            var pos  = col * 3 + row;
            // Use pre-assigned coin if available — ensures value matches what was shown on reel
            var coin = (preCoinMap && preCoinMap[pos]) ? preCoinMap[pos] : this._generateCoin(betPerLine, linesActive);
            landedSet.add(pos);
            coinMap[pos] = coin;
            sequence.push({ pos: pos, coin: coin, respinRound: 0 });
            initialCoins.push({ pos: pos, coin: coin });
          }
        }
      }
    }

    // eventTimeline — ordered visual steps for the animation loop.
    // Each entry is one of:
    //   { type:'initial', events:[...] }  — trigger coins, no spinning animation
    //   { type:'land',    events:[...] }  — respin where ≥1 coin landed (counter resets to 3)
    //   { type:'empty' }                  — respin where nothing landed (counter ticks down)
    var eventTimeline = [];
    if (initialCoins.length > 0) {
      eventTimeline.push({ type: 'initial', events: initialCoins });
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
      var roundCoins = [];
      for (var ei = 0; ei < emptyPositions.length; ei++) {
        var epos = emptyPositions[ei];
        if (rng.next() < HOLD_SPIN_LAND_PROBABILITY) {
          // Pass isNearMiss so counter=1 landings get a value boost
          var ecoin = this._generateCoin(betPerLine, linesActive, respinRound >= 3);
          landedSet.add(epos);
          coinMap[epos] = ecoin;
          sequence.push({ pos: epos, coin: ecoin, respinRound: respinRound });
          roundCoins.push({ pos: epos, coin: ecoin });
          newLandings++;
        }
      }

      if (newLandings === 0) {
        eventTimeline.push({ type: 'empty' }); // counter ticks down
        respinRound++; // No new coins — one fewer respin
        if (respinRound > 3) break; // 3 respins exhausted
      } else {
        eventTimeline.push({ type: 'land', events: roundCoins }); // counter resets to 3
        respinRound = 1; // Reset respin counter on any new landing
      }
    }

    var isBlackout = (landedSet.size === GRID_SIZE);

    // ── OPTION X: Guaranteed jackpot coin injection ──────────────────────
    // If a jackpot was won at entry but didn't land naturally, inject it now.
    // Replaces a randomly chosen cash coin so the jackpot coin appears on the board.
    if (guaranteedJackpot) {
      var alreadyHasJp = false;
      var posKeys = Object.keys(coinMap);
      for (var gji = 0; gji < posKeys.length; gji++) {
        var gpc = coinMap[posKeys[gji]];
        if (gpc.isJackpotOrb && gpc.jackpotLevel === guaranteedJackpot) { alreadyHasJp = true; break; }
      }
      if (!alreadyHasJp && posKeys.length > 0) {
        // Prefer to replace a cash coin (non-jackpot)
        var cashKeys = posKeys.filter(function(p) { return !coinMap[p].isJackpotOrb; });
        var replaceKey = cashKeys.length > 0
          ? cashKeys[Math.floor(rng.next() * cashKeys.length)]
          : posKeys[Math.floor(rng.next() * posKeys.length)];
        var jpVal = (GameState.jackpots[guaranteedJackpot] && GameState.jackpots[guaranteedJackpot].current) || 0;
        var jpCoin = { type:'jackpot', isJackpotOrb:true, jackpotLevel:guaranteedJackpot, value:jpVal };
        coinMap[replaceKey] = jpCoin;
        // Sync the sequence entry for this position
        for (var seqi = 0; seqi < sequence.length; seqi++) {
          if (String(sequence[seqi].pos) === String(replaceKey)) { sequence[seqi].coin = jpCoin; break; }
        }
        logEvent('HS_JACKPOT_COIN_INJECTED', { tier:guaranteedJackpot, pos:replaceKey, value:jpVal });
      }
    }

    return {
      sequence:      sequence,
      coinMap:       coinMap,
      isBlackout:    isBlackout,
      totalCoins:    landedSet.size,
      eventTimeline: eventTimeline,
    };
  },

  // ── COIN VALUE GENERATOR ────────────────────────────────────────────────
  // Returns a coin object: { type, value, isJackpotOrb, jackpotLevel }
  // ── PUBLIC: Pre-generate trigger coin values at spin time ────────────
  // Called from game.js immediately after detecting 6+ gold coins.
  // Uses the real H&S RNG so values are deterministic and match what H&S will show.
  // Returns { coinMap: {pos:coin}, orderedCoins: [{pos,coin}] }
  pregenerateTriggerCoins(grid, betPerLine, linesActive) {
    var coinMap      = {};
    var orderedCoins = [];
    for (var col = 0; col < 5; col++) {
      for (var row = 0; row < 3; row++) {
        var sym = grid[col] && grid[col][row];
        if (sym === BONUS_ID) {
          var pos  = col * 3 + row;
          var coin = this._generateCoin(betPerLine, linesActive);
          coinMap[pos]  = coin;
          orderedCoins.push({ pos: pos, coin: coin });
        }
      }
    }
    return { coinMap: coinMap, orderedCoins: orderedCoins };
  },

  // Coin cap by total bet — owner confirmed 2026-05-18:
  // Under $1 = $3 cap, $1-$5 = $25 cap, over $5 = no cap
  _coinCapForBet(totalBet) {
    // Per-bet coin value cap — scales with denomination so small-bet players
    // don't get oversized wins and high-bet players get proportional rewards.
    // Updated v6l93 — 7 tiers covering all supported bets ($0.20–$2,000/spin).
    // RULE: Always update this table when adding new denominations.
    // NOTE: $10 and $20 denominations permanently removed v6l94. Max denom is $5.
    if (totalBet <   1.00) return   3;   // < $1 bet   → max $3/coin
    if (totalBet <   5.00) return  15;   // $1–$4.99   → max $15/coin
    if (totalBet <  10.00) return  30;   // $5–$9.99   → max $30/coin
    if (totalBet <  25.00) return  75;   // $10–$24.99 → max $75/coin
    if (totalBet < 100.00) return 200;   // $25–$99.99 → max $200/coin
    if (totalBet < 500.00) return 750;   // $100–$499  → max $750/coin
    return 2500;                          // $500+       → max $2,500/coin
  },

  _generateCoin(betPerLine, linesActive, isNearMiss) {
    if (isNearMiss === undefined) isNearMiss = false;
    var totalBet   = betPerLine * linesActive;
    var cap        = this._coinCapForBet(totalBet);
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

    // Cash tiers — reset cumulative so JP and cash tiers are evaluated independently
    // against the same roll value. Without reset, tiers whose threshold exceeds 1.0 are unreachable.
    cumulative = 0;
    var boost = (isNearMiss && typeof HOLD_SPIN_NEAR_MISS_BOOST !== 'undefined') ? HOLD_SPIN_NEAR_MISS_BOOST : 1;
    for (var ci = 0; ci < HOLD_SPIN_CASH_TIERS.length; ci++) {
      var ct = HOLD_SPIN_CASH_TIERS[ci];
      cumulative += ct.weight;
      if (roll < cumulative) {
        var frac  = ct.minFrac + rng.next() * (ct.maxFrac - ct.minFrac);
        var value = Math.round(totalBet * frac * boost);
        value     = Math.max(value, 1);                        // minimum $1
        value     = Math.min(value, isFinite(cap) ? cap : value); // apply cap
        return {
          type:         'cash',
          value:        value,
          isJackpotOrb: false,
          nearMissSave: isNearMiss || false,
        };
      }
    }

    // Fallback — minimum $1
    return { type: 'cash', value: 1, isJackpotOrb: false };
  },

    async runHoldSpin(betPerLine, linesActive, triggerStops, triggerGrid, callerContext) {
    if (callerContext === undefined) callerContext = {};
    GameState.activeBonus = 'HOLD_SPIN';
    var events = [];
    // Jackpots fully eligible (unified system v6l96 — noJackpots suppression removed).

    // ── UNIFIED JACKPOT CHECK AT ENTRY ────────────────────────────────
    // Option X: if jackpot won, a coin of that type is guaranteed to appear on the board.
    // noJackpots flag removed — H&S triggered from inside RS is now fully eligible.
    var _hsEntryJackpot = _checkUnifiedJackpot();

    // Pre-assigned coin map — generated at spin time and shown on the base reels
    var preCoinMap = callerContext.triggerCoinMap || null;

    // ── STEP 1: Predetermined RNG pass — all outcomes decided NOW ───────
    // Pass _hsEntryJackpot so the outcome generator guarantees that coin lands.
    var outcome = this._generateFullHoldSpinOutcome(betPerLine, linesActive, triggerGrid, preCoinMap, _hsEntryJackpot);
    var sequence      = outcome.sequence;
    var coinMap       = outcome.coinMap;
    var isBlackout    = outcome.isBlackout;
    var eventTimeline = outcome.eventTimeline;

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

    // ── STEP 2: Build displayBoard — trigger coins PRE-POPULATED ────────
    // Trigger coins are already visible on the base game reels with their values.
    // They appear locked on the H&S board the moment it opens — no landing animation.
    var displayBoard = new Array(15).fill(null);
    var triggerCoinsPreloaded = false;
    if (eventTimeline.length > 0 && eventTimeline[0].type === 'initial') {
      eventTimeline[0].events.forEach(function(ev) {
        displayBoard[ev.pos] = ev.coin;
      });
      triggerCoinsPreloaded = true;
    }

    if (typeof UI !== 'undefined') await UI.showHoldSpinBoard(displayBoard, 3);
    if (typeof Audio !== 'undefined') Audio.startHoldSpinMusic();
    logEvent('HOLD_SPIN_ENTRY', { bonusType:'HOLD_SPIN', respins:3 });

    // ── STEP 3: Play out predetermined sequence visually ────────────────
    var totalWon       = 0;
    var grandWon       = false;
    var respinDisplay  = 3;
    // Trigger coins are pre-placed — count them toward totalCoinsLanded for 6th-coin slam tracking
    var totalCoinsLanded = triggerCoinsPreloaded ? eventTimeline[0].events.length : 0;

    // Accumulate jackpot levels that land — ALL pay out at bonus end
    // MUST be declared before first use (trigger-coin accounting block below)
    var jackpotsAccumulated = {};

    // Account for trigger coin values immediately (they're already on board)
    if (triggerCoinsPreloaded) {
      eventTimeline[0].events.forEach(function(ev) {
        if (ev.coin.isJackpotOrb) {
          jackpotsAccumulated[ev.coin.jackpotLevel] = true;
        } else {
          totalWon += ev.coin.value;
        }
      });
    }

    // Helper: land a single coin and handle jackpot/cash accounting
    var landCoin = async function(pos, coin, stepRound) {
      totalCoinsLanded++;
      displayBoard[pos] = coin;

      // Compute running cash total AFTER this coin lands (for display update in animateCoinLand)
      var cashAfter = totalWon + ((!coin.isJackpotOrb && coin.value != null) ? coin.value : 0);
      if (typeof UI !== 'undefined') await UI.animateCoinLand(pos, coin, false, totalCoinsLanded, cashAfter);

      if (coin.isJackpotOrb) {
        var key = coin.jackpotLevel;
        jackpotsAccumulated[key] = true;
        displayBoard[pos] = { type:'jackpot', jackpotLevel:key, value:coin.value, isJackpotOrb:true };
        if (typeof Audio !== 'undefined') Audio.play('jackpot_' + key.toLowerCase());
        if (typeof UI !== 'undefined' && UI.flashJackpotCoin) await UI.flashJackpotCoin(pos, key);
      } else {
        totalWon += coin.value;
      }

      events.push(logEvent('HOLD_SPIN_LAND', {
        bonusType:'HOLD_SPIN', position:pos, coin,
        boardState: displayBoard.map(function(c) { return c ? (c.type + ':$' + (c.value != null ? c.value.toFixed(2) : '0')) : null; }),
        respinRound: stepRound,
      }));
    };

    // Drive animation from eventTimeline — skip 'initial' (already shown)
    var stepIndex   = 0;
    var respinCount = 0; // counts total respins for audio escalation

    for (var eti = 0; eti < eventTimeline.length; eti++) {
      var step = eventTimeline[eti];

      if (step.type === 'initial') {
        if (typeof UI !== 'undefined') await UI.updateRespinCounter(respinDisplay);

      } else if (step.type === 'empty') {
        respinCount++;
        var emptyCells = displayBoard.filter(function(c) { return c === null; }).length;
        var isLastThree = (emptyCells <= 3); // only 3 cells left — dramatic red glow

        // Brief pause with conveyor STOPPED — cells dark between respins
        await this._delay(320);

        // Pulse locked coins, then start conveyor
        if (typeof UI !== 'undefined') {
          // v7.0.5: pass entryJackpot so belt shows awarded tier 3×
          UI.startHoldSpinning(displayBoard, respinDisplay, emptyCells, isLastThree, _hsEntryJackpot);
        }

        // Per-respin escalating audio
        if (typeof Audio !== 'undefined') Audio.holdSpinRespin(respinCount, respinDisplay);

        await this._delay(respinDisplay === 1 ? 2200 : 1600);

        // v7.0.5: decelerate (500ms ease-out) before coin drop — replaces instant clear
        if (typeof UI !== 'undefined' && UI.decelerateHoldSpinning) {
          await new Promise(function(res) { UI.decelerateHoldSpinning(res); });
        } else if (typeof UI !== 'undefined') {
          UI.clearHoldSpinning();
        }
        await this._delay(80);

        respinDisplay = Math.max(0, respinDisplay - 1);
        if (typeof UI !== 'undefined') await UI.updateRespinCounter(respinDisplay);

        // Counter exhausted with nothing landing — respin cycle ends
        if (respinDisplay === 0 && typeof UI !== 'undefined') {
          await UI.updateRespinCounter(0);
        }

      } else if (step.type === 'land') {
        respinCount++;
        var emptyCells = displayBoard.filter(function(c) { return c === null; }).length;
        var isLastThree = (emptyCells <= 3);

        // Brief pause with conveyor STOPPED before each respin
        await this._delay(320);

        // Pulse locked coins + start conveyor
        if (typeof UI !== 'undefined') {
          // v7.0.5: pass entryJackpot so belt shows awarded tier 3×
          UI.startHoldSpinning(displayBoard, respinDisplay, emptyCells, isLastThree, _hsEntryJackpot);
        }

        if (typeof Audio !== 'undefined') Audio.holdSpinRespin(respinCount, respinDisplay);

        await this._delay(respinDisplay === 1 ? 1800 : 1200);

        // v7.0.5: decelerate before coins land
        if (typeof UI !== 'undefined' && UI.decelerateHoldSpinning) {
          await new Promise(function(res) { UI.decelerateHoldSpinning(res); });
        } else if (typeof UI !== 'undefined') {
          UI.clearHoldSpinning();
        }
        await this._delay(60);

        for (var evi = 0; evi < step.events.length; evi++) {
          await landCoin(step.events[evi].pos, step.events[evi].coin, stepIndex);
        }
        respinDisplay = 3;
        if (typeof UI !== 'undefined') await UI.updateRespinCounter(respinDisplay);
      }

      stepIndex++;
    }

    // ── STEP 4: Pay out ALL accumulated jackpots at bonus end ────────────
    // All landed jackpot levels pay their denom-scaled seed value.
    // Paid in order MINI→MINOR→MAJOR→GRAND for escalating celebration.
    // Jackpots fully eligible — unified system. noJackpots suppression fully removed v6l114.
    var jackpotOrder = ['MINI','MINOR','MAJOR','GRAND'];
    for (var jpi = 0; jpi < jackpotOrder.length; jpi++) {
      var jpLevel = jackpotOrder[jpi];
      if (!jackpotsAccumulated[jpLevel]) continue;

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
      var blackoutAmt = awardJackpot('GRAND');
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

    // Restore reels to triggering position after H&S exits (BIG MUNNY design rule).
    // Applies to: base game (triggerStops provided), Red Spin, BONUS letters.
    // Suppressed for: Pick & Choose (fromPickChoose), nested Red Spin / BONUS orb H&S (noRestoreReels),
    //                 and any context where triggerStops/triggerGrid were not captured.
    var _noRestore    = callerContext.fromPickChoose === true || callerContext.noRestoreReels === true;
    var _restoreReels = !_noRestore && (triggerStops != null) && (triggerGrid != null);

    if (typeof UI !== 'undefined') {
      await UI.endHoldSpin(displayBoard, totalWon, isBlackout, _restoreReels ? triggerStops : null, _restoreReels ? triggerGrid : null);
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
// ═══════════════════════════════════════════════════════════════════════
// PICK & CHOOSE — match-3 tile reveal bonus
// Player taps tiles freely until 3 matching tiles found. Always 3 picks to win.
// Prize predetermined by RNG before grid shows. No extra picks mechanic.
// ═══════════════════════════════════════════════════════════════════════

  async runPickChoose(betPerLine, linesActive, callerContext) {
    if (callerContext === undefined) callerContext = {};
    if (callerContext.from === 'HOLD_SPIN') return { totalWon:0, events:[], outcome:null };
    GameState.activeBonus = 'PICK_CHOOSE';
    var events = [], totalBet = betPerLine * linesActive, minAward = totalBet;
    // Jackpots via match-3 tiles only (unified system v6l96).
    var tiles = this._generatePickTiles(totalBet, minAward);
    var revealed = new Array(PICK_CHOOSE_GRID_SIZE).fill(false);
    var matchCounts = {};
    var won=false, totalWon=0, awardHoldSpin=false, awardRedSpin=false, prize=null;

    if (typeof UI !== 'undefined') await UI.showPickChooseGrid(PICK_CHOOSE_GRID_SIZE);
    if (typeof Audio !== 'undefined') Audio.startPickMusic();
    logEvent('PICK_CHOOSE_ENTRY', { bonusType:'PICK_CHOOSE', gridSize:PICK_CHOOSE_GRID_SIZE, totalBet });

    while (!won) {
      var unrevealedCount = 0;
      for (var uri = 0; uri < revealed.length; uri++) { if (!revealed[uri]) unrevealedCount++; }
      if (!unrevealedCount) break;
      var tileIndex = await this._waitForTileTap(revealed);
      if (tileIndex < 0) break;
      revealed[tileIndex] = true;

      // Per-tile JP check removed v6l96 — replaced by _pcEntryJackpot at entry.
      var finalTile = Object.assign({}, tiles[tileIndex]);

      if (typeof UI !== 'undefined') await UI.revealPickTile(tileIndex, finalTile, false, false);
      if (typeof Audio !== 'undefined') Audio.play('pick_reveal');

      var key = finalTile.type;
      matchCounts[key] = (matchCounts[key] || 0) + 1;
      var matchCountsCopy = Object.assign({}, matchCounts);
      var evt = logEvent('PICK_REVEAL', { bonusType:'PICK_CHOOSE', tileIndex: tileIndex, tile:finalTile, matchCounts:matchCountsCopy, isMatch: matchCounts[key] >= 3 });
      events.push(evt);
      if (typeof UI !== 'undefined') UI.updatePickMatches(matchCounts);

      if (matchCounts[key] >= 3) {
        // Match found — lock all tiles immediately
        if (typeof UI !== 'undefined') {
          UI.setPickTapCallback(null);
          if (UI._lockAllPickTiles) UI._lockAllPickTiles();
        }
        won = true;
        prize = finalTile;
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
      // Restore reels to P&C trigger position (shows 5-oak Lipstick briefly before returning)
      if (callerContext.triggerStops && callerContext.triggerGrid) {
        await UI.animateReelsStop(callerContext.triggerStops, callerContext.triggerGrid, false, false);
      }
    }
    logEvent('PICK_CHOOSE_END', { bonusType:'PICK_CHOOSE', prize, totalWon, awardHoldSpin, awardRedSpin, matchCounts, balanceAfter:GameState.balance });
    GameState.activeBonus = null;
    // Jackpots in P&C are match-3 tiles only — no separate entry award.
    // When the player matches 3 jackpot tiles, awardJackpot fires in the match block above.
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
    // v6l100 calibration — owner approved 2026-05-21.
    // Mirrors PICK_CHOOSE_PRIZES in paytable.js — must stay in sync.
    var PRIZE_WEIGHTS = [
      { type:'cash_a',    weight:0.48 },  // 48% cash (was 40%)
      { type:'cash_b',    weight:0.22 },  // 22% cash (was 20%)
      { type:'hold_spin', weight:0.08 },  // 8%  H&S  (was 14%)
      { type:'red_spin',  weight:0.06 },  // 6%  RS   (was 12%)
      { type:'mini',      weight:0.07 },  // 7%  MINI
      { type:'minor',     weight:0.05 },  // 5%  MINOR (was 4%)
      { type:'major',     weight:0.03 },  // 3%  MAJOR (was 2%)
      { type:'grand',     weight:0.01 },  // 1%  GRAND
    ];
    var CASH_TIERS = [
      { minMult:5,  maxMult:25 },
      { minMult:25, maxMult:75 },
      { minMult:75, maxMult:150 },
    ];

    // 1. Decide the winning prize type and value
    var roll = rng.next();
    var cum = 0;
    var winEntry = PRIZE_WEIGHTS[0];
    for (var pi = 0; pi < PRIZE_WEIGHTS.length; pi++) {
      cum += PRIZE_WEIGHTS[pi].weight;
      if (roll < cum) { winEntry = PRIZE_WEIGHTS[pi]; break; }
    }
    // Map internal bucket names to the public prize type used everywhere else
    var winTypeName = (winEntry.type === 'cash_a' || winEntry.type === 'cash_b') ? 'cash' : winEntry.type;

    var winValue = 0;
    if (winTypeName === 'cash') {
      var tier = CASH_TIERS[rng.nextInt(0, 2)];
      winValue = Math.max(Math.round(totalBet * rng.nextInt(tier.minMult, tier.maxMult)), Math.round(minAward));
    }
    var winPrize = { type: winTypeName, value: winValue };

    // 2. Build 15-tile board: exactly 3 winning tiles + 12 decoy tiles
    // Decoy types are all prize entries whose internal type does NOT map to the winning type.
    // Using the internal names (cash_a / cash_b) means both cash buckets are excluded when cash wins.
    var decoyTypes = [];
    for (var di = 0; di < PRIZE_WEIGHTS.length; di++) {
      var pw = PRIZE_WEIGHTS[di];
      var pwPublic = (pw.type === 'cash_a' || pw.type === 'cash_b') ? 'cash' : pw.type;
      if (pwPublic !== winTypeName) decoyTypes.push(pwPublic);
    }

    var tiles = [];
    // Add 3 guaranteed winning tiles
    for (var wi = 0; wi < 3; wi++) tiles.push(Object.assign({}, winPrize));
    // Add 12 decoy tiles — each decoy type capped at max 2 occurrences.
    // With 12 decoys across types (max 2 each), no decoy type can reach match-3
    // before the 3 guaranteed winning tiles are found — win is always achievable.
    var decoyCounts = {};
    for (var dfi = 3; dfi < PICK_CHOOSE_GRID_SIZE; dfi++) {
      var dt, dattempts = 0;
      do {
        dt = decoyTypes[rng.nextInt(0, decoyTypes.length - 1)];
        dattempts++;
      } while ((decoyCounts[dt] || 0) >= 2 && dattempts < 20);
      decoyCounts[dt] = (decoyCounts[dt] || 0) + 1;
      var dv = 0;
      if (dt === 'cash') {
        var dTier = CASH_TIERS[rng.nextInt(0, CASH_TIERS.length - 1)];
        dv = Math.max(Math.round(totalBet * rng.nextInt(dTier.minMult, dTier.maxMult)), minAward);
      }
      tiles.push({ type: dt, value: dv });
    }

    // 3. Shuffle — winning tiles are randomly distributed
    for (var si = tiles.length - 1; si > 0; si--) {
      var sj = rng.nextInt(0, si);
      var stmp = tiles[si]; tiles[si] = tiles[sj]; tiles[sj] = stmp;
    }
    return tiles;
  },

  // ═══════════════════════════════════════════════════════════════════
  // BONUS FEATURE — B-O-N-U-S Letter Bonus
  // 3 glowing orbs animate on screen. Player picks one.
  // Fully predetermined — RNG decides before player taps.
  // Prizes: Red Spin | Pick & Choose | Hold & Spin (no jackpots)
  // ═══════════════════════════════════════════════════════════════════
  async runBonusFeature(betPerLine, linesActive, callerContext) {
    if (callerContext === undefined) callerContext = {};
    GameState.activeBonus = 'BONUS_FEATURE';
    var events = [];
    var totalBet = betPerLine * linesActive;
    // Jackpots fully eligible for all sub-bonuses triggered via BONUS orb.
    // noJackpots suppression removed v6l114 — owner confirmed 2026-05-21.
    // Each sub-bonus (H&S, P&C, RS) runs its own _checkUnifiedJackpot() at entry.

    // ── STEP 1: Predetermined RNG — decide prize before player picks ──
    var prizes = ['red_spin', 'pick_choose', 'hold_spin'];
    // Shuffle prizes so each orb position is random
    for (var bfi = prizes.length - 1; bfi > 0; bfi--) {
      var bfj = rng.nextInt(0, bfi);
      var bftmp = prizes[bfi]; prizes[bfi] = prizes[bfj]; prizes[bfj] = bftmp;
    }
    // winPosition here is a display placeholder only — it is overwritten with chosenIdx after the player taps.
    // The actual award is always prizes[chosenIdx]. (v6l114 — owner confirmed real player choice.)
    var winPosition = rng.nextInt(0, 2);
    var winPrize    = prizes[winPosition];

    // ── STEP 2: Show bonus orb selection screen ────────────────────────
    if (typeof UI !== 'undefined') await UI.showBonusOrbScreen(prizes, winPosition);
    if (typeof Audio !== 'undefined') Audio.startPickMusic();
    logEvent('BONUS_FEATURE_ENTRY', { bonusType:'BONUS_FEATURE', betPerLine, linesActive, winPrize, prizes });

    // ── STEP 3: Wait for player to tap an orb ─────────────────────────
    var chosenIdx = await this._waitForOrbTap();
    // Award whatever prize is genuinely behind the orb the player tapped.
    // Player choice is real — not predetermined. Shuffle above ensures each
    // orb hides a different sub-bonus so every tap is meaningful.
    // Owner confirmed v6l114 2026-05-21.
    winPrize    = prizes[chosenIdx];
    winPosition = chosenIdx;
    if (typeof UI !== 'undefined') await UI.revealBonusOrbs(prizes, winPosition, chosenIdx);
    if (typeof Audio !== 'undefined') Audio.play('pick_match');
    await this._delay(1200);

    // ── STEP 4: Award the orb the player actually chose ───────────────
    var awardHoldSpin = false, awardRedSpin = false, awardPickChoose = false;
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
    return new Promise(function(resolve) {
      if (typeof UI !== 'undefined') {
        // Delay before wiring tap — prevents tap-through from bonus trigger gesture
        setTimeout(function() {
          UI.setOrbTapCallback(resolve);
        }, 600);
      } else {
        setTimeout(function() { resolve(0); }, 500);
      }
    });
  },

  _waitForTileTap(revealed) {
    return new Promise(function(resolve) {
      if (typeof UI !== 'undefined') {
        UI.setPickTapCallback(function(index) { if (!revealed[index]) resolve(index); });
      } else {
        var idx = -1;
        for (var ri = 0; ri < revealed.length; ri++) { if (!revealed[ri]) { idx = ri; break; } }
        setTimeout(function() { resolve(idx); }, 200);
      }
    });
  },


  _delay(ms) { return new Promise(function(r) { setTimeout(r, ms); }); },
};
