'use strict';
var Operator = (function() {
  function $(id) { return document.getElementById(id); }
  let tapCount = 0, tapTimer = null;
  let pinBuffer = '';
  const CORRECT_PIN = '7777';

  // ── TAP SEQUENCE DETECTION ───────────────────────────────────────────
  function initTapZone() {
    const title = $('game-title');
    if (!title) return;

    function onTitleTap(e) {
      // Prevent event firing twice from touch + click
      if (e.type === 'touchend') e.preventDefault();
      tapCount++;
      if (tapTimer) clearTimeout(tapTimer);
      tapTimer = setTimeout(function() { tapCount = 0; }, 3000);
      if (tapCount >= 5) {
        tapCount = 0;
        clearTimeout(tapTimer);
        showPinEntry();
      }
    }

    // Listen on both click and touchend for mobile PWA compatibility
    title.addEventListener('click', onTitleTap);
    title.addEventListener('touchend', onTitleTap);
  }

  // ── PIN ENTRY ─────────────────────────────────────────────────────────
  function showPinEntry() {
    pinBuffer = '';
    updatePinDisplay();
    const overlay = $('pin-overlay');
    if (overlay) overlay.classList.add('active');
    const err = $('pin-error');
    if (err) err.textContent = '';
  }

  function hidePinEntry() {
    const overlay = $('pin-overlay');
    if (overlay) overlay.classList.remove('active');
    pinBuffer = '';
  }

  function updatePinDisplay() {
    const el = $('pin-display');
    if (el) el.textContent = '●'.repeat(pinBuffer.length) || '';
  }

  function handlePinKey(key) {
    if (key === 'clear') { pinBuffer = ''; updatePinDisplay(); return; }
    if (key === 'enter') { checkPin(); return; }
    if (pinBuffer.length < 4) { pinBuffer += key; updatePinDisplay(); }
    if (pinBuffer.length === 4) checkPin();
  }

  function checkPin() {
    if (pinBuffer === CORRECT_PIN) {
      hidePinEntry();
      // Small delay ensures any pending popstate/touch events are consumed first
      setTimeout(function() {
        openPanel();
      }, 80);
    } else {
      var err = $('pin-error');
      if (err) err.textContent = 'Incorrect PIN. Try again.';
      pinBuffer = '';
      updatePinDisplay();
    }
  }

  // ── OPERATOR PANEL ───────────────────────────────────────────────────
  function openPanel() {
    GameState.operator.panelOpen = true;
    // Show overlay FIRST — before renderPanel in case it errors
    var overlay = $('op-overlay');
    if (overlay) {
      overlay.classList.add('active');
      overlay.scrollTop = 0;
    }
    // Render panel content with error protection
    try {
      renderPanel();
    } catch(err) {
      var panel = $('op-panel');
      if (panel) panel.innerHTML = '<div style="color:#ff6666;padding:20px;font-size:14px">Panel render error: ' + err.message + '</div>';
    }
    var panel = $('op-panel');
    if (panel) panel.scrollTop = 0;
  }

  function closePanel() {
    GameState.operator.panelOpen = false;
    var _ov = $('op-overlay');
    if (_ov) _ov.classList.remove('active');
    saveState();
  }

  function renderPanel() {
    var panel = $('op-panel');
    if (!panel) return;

    var op  = GameState.operator;
    var st  = GameState.stats;
    var actualRTP  = getActualRTP();
    var rtpClass   = Math.abs(actualRTP - op.targetRTP) > 3 ? 'rtp-warn' : '';
    var theoRTP    = (typeof calculateTheoreticalRTP !== 'undefined')
                   ? (calculateTheoreticalRTP(DEFAULT_LINES)*100).toFixed(2) + '%'
                   : op.targetRTP.toFixed(2) + '%';
    var jpKeys     = ['MINI','MINOR','MAJOR','GRAND'];
    var forceKeys  = ['MINI','MINOR','MAJOR','GRAND'];
    var ctxKeys    = ['bonus','base','any'];
    var ctxLabels  = {'bonus':'🎰 BONUS','base':'🎡 BASE','any':'⚡ ANY'};

    // ── Build HTML using string concatenation (ES5 — no template literals) ──
    var h = '';

    // Header
    h += '<div id="op-header">';
    h += '<div id="op-title">⚙️ OPERATOR PANEL</div>';
    h += '<button id="op-close">✕ CLOSE</button>';
    h += '</div>';

    // RTP & Hold
    h += '<div class="op-section">';
    h += '<div class="op-section-title">📊 RTP &amp; HOLD</div>';
    h += '<div class="op-row"><span class="op-label">Target RTP %</span>';
    h += '<input class="op-input" id="op-rtp" type="number" min="85" max="99" step="0.5" value="' + op.targetRTP.toFixed(1) + '"></div>';
    h += '<div class="op-row"><span class="op-label">Hold %</span>';
    h += '<input class="op-input" id="op-hold" type="number" min="1" max="15" step="0.5" value="' + (100 - op.targetRTP).toFixed(1) + '"></div>';
    h += '<div style="text-align:right;margin-top:6px"><button class="op-btn" onclick="Operator.applyRTP()">APPLY</button></div>';
    h += '<div class="op-rtp-stats" style="margin-top:10px">';
    h += 'Target RTP: <span>' + op.targetRTP.toFixed(1) + '%</span><br>';
    h += 'Theoretical RTP: <span id="op-theoretical-rtp">' + theoRTP + '</span><br>';
    h += 'Live RTP: <span class="' + rtpClass + '">' + actualRTP.toFixed(2) + '%</span><br>';
    h += 'Total Wagered: <span>$' + st.totalWagered.toFixed(2) + '</span><br>';
    h += 'Total Paid Out: <span>$' + st.totalWon.toFixed(2) + '</span><br>';
    h += 'Total Spins: <span>' + st.totalSpins + '</span><br>';
    h += 'Session: <span>' + getSessionDuration() + '</span><br>';
    h += 'Biggest Win: <span>$' + st.biggestWin.toFixed(2) + '</span>';
    h += '</div></div>';

    // Bonus Controls
    h += '<div class="op-section">';
    h += '<div class="op-section-title">🎰 BONUS CONTROLS</div>';
    h += '<div class="op-row"><span class="op-label">Bonus Freq Multiplier</span>';
    h += '<input class="op-input" id="op-bfreq" type="number" min="0.5" max="5" step="0.1" value="' + op.bonusFrequencyMultiplier.toFixed(1) + '"></div>';
    h += '<div class="op-row"><span class="op-label">Red Spin Continuance % <span style="color:#aaa;font-size:9px">(65=default)</span></span>';
    h += '<div style="display:flex;gap:4px;align-items:center"><input class="op-input" id="op-rscont" type="number" min="10" max="99" step="1" value="' + (op.redSpinContinuance*100).toFixed(0) + '" style="width:54px"><button class="op-btn" style="font-size:9px;padding:3px 6px" onclick="Operator.resetRedSpinContinuance()">RESET</button></div></div>';
    h += '<div class="op-row"><span class="op-label">Disable P&amp;C in Red Spin</span><button class="op-btn force-btn ' + (op.disablePickChooseInRedSpin?'armed':'') + '" data-fkey="disablePickChooseInRedSpin" onclick="Operator.toggleForce(this.dataset.fkey)">' + (op.disablePickChooseInRedSpin?'OFF':'ON') + '</button></div>';
    h += '<div class="op-row"><span class="op-label">Disable H&amp;S in Red Spin</span><button class="op-btn force-btn ' + (op.disableHoldSpinInRedSpin?'armed':'') + '" data-fkey="disableHoldSpinInRedSpin" onclick="Operator.toggleForce(this.dataset.fkey)">' + (op.disableHoldSpinInRedSpin?'OFF':'ON') + '</button></div>';
    h += '<div class="op-row"><span class="op-label">Jackpot Contribution %</span>';
    h += '<input class="op-input" id="op-jpct" type="number" min="1" max="10" step="0.5" value="' + (op.jackpotContribution*100).toFixed(1) + '"></div>';
    h += '<div class="op-row"><span class="op-label">Max Win Per Spin ($0=off)</span>';
    h += '<input class="op-input" id="op-maxwin" type="number" min="0" step="10" value="' + op.maxWinPerSpin + '"></div>';
    h += '<div style="text-align:right;margin-top:6px"><button class="op-btn" onclick="Operator.applyBonusSettings()">APPLY</button></div>';
    h += '</div>';

    // Force Triggers
    h += '<div class="op-section">';
    h += '<div class="op-section-title">⚡ FORCE TRIGGERS (Next Spin)</div>';
    var forceItems = [
      ['forceRedSpin',    'Force Red Spin'],
      ['forceFreeSpins',  'Force Scatter/Pick'],
      ['forceBonusGame',  'Force Hold &amp; Spin'],
      ['forceBonusFeature','Force BONUS Letters'],
    ];
    for (var fi = 0; fi < forceItems.length; fi++) {
      var fkey = forceItems[fi][0];
      var flbl = forceItems[fi][1];
      var farmed = op[fkey] ? 'armed' : '';
      var ftxt = op[fkey] ? '✅ ARMED' : 'ARM';
      h += '<div class="op-row"><span class="op-label">' + flbl + '</span>';
      h += '<button class="op-btn force-btn ' + farmed + '" data-fkey="' + fkey + '" onclick="Operator.toggleForce(this.dataset.fkey)">' + ftxt + '</button></div>';
    }
    // Jackpot force
    h += '<div class="op-row" style="flex-direction:column;align-items:flex-start;gap:6px">';
    h += '<span class="op-label">⚡ Force Jackpot Trigger</span>';
    h += '<div style="display:flex;gap:6px;flex-wrap:wrap;width:100%">';
    for (var ji = 0; ji < forceKeys.length; ji++) {
      var jk = forceKeys[ji];
      var jarmed = op.forceJackpot === jk ? ' armed' : '';
      var jtxt = (op.forceJackpot === jk ? '✅ ' : '') + jk;
      h += '<button class="op-btn force-btn' + jarmed + '" style="flex:1;min-width:56px" data-jptype="' + jk + '" onclick="Operator.selectJackpotType(this.dataset.jptype)">' + jtxt + '</button>';
    }
    h += '<button class="op-btn danger" style="flex:1;min-width:56px" data-jptype="none" onclick="Operator.selectJackpotType(this.dataset.jptype)">CLEAR</button>';
    h += '</div>';
    if (op.forceJackpot !== 'none') {
      h += '<div style="display:flex;gap:4px;width:100%;margin-top:2px">';
      for (var ci = 0; ci < ctxKeys.length; ci++) {
        var ck = ctxKeys[ci];
        var carmed = op.forceJackpotContext === ck ? ' armed' : '';
        var ctxt = (op.forceJackpotContext === ck ? '✅ ' : '') + ctxLabels[ck];
      h += '<button class="op-btn force-btn' + carmed + '" style="flex:1;font-size:9px" data-ctx="' + ck + '" onclick="Operator.setJackpotContext(this.dataset.ctx)">' + ctxt + '</button>';
      }
      h += '</div>';
      var armCtx = op.forceJackpotContext === 'base' ? '(BASE REELS)' : op.forceJackpotContext === 'any' ? '(ANY CONTEXT)' : '(NEXT BONUS)';
      h += '<button class="op-btn" style="width:100%;background:linear-gradient(135deg,#1a3a1a,#0d1f0d);border-color:#40cc40;color:#80ff80" onclick="Operator.armJackpot()">🚀 ARM — ' + op.forceJackpot + ' ' + armCtx + '</button>';
    }
    h += '</div></div>';

    // Reel Stops
    h += '<div class="op-section">';
    h += '<div class="op-section-title">🎯 FORCE REEL STOPS</div>';
    h += '<div style="display:flex;gap:5px;margin-bottom:6px">';
    for (var ri = 0; ri < 5; ri++) {
      var rv = (op.forceReelStops[ri] != null) ? op.forceReelStops[ri] : '';
      h += '<input class="op-input" id="op-stop' + ri + '" type="number" min="0" max="79" placeholder="R' + (ri+1) + '" style="width:52px;padding:5px 4px;font-size:12px" value="' + rv + '">';
    }
    h += '</div>';
    h += '<div style="display:flex;gap:6px;justify-content:flex-end">';
    h += '<button class="op-btn" onclick="Operator.applyReelStops()">SET STOPS</button>';
    h += '<button class="op-btn danger" onclick="Operator.clearReelStops()">CLEAR</button>';
    h += '</div></div>';

    // Balance & Jackpots
    h += '<div class="op-section">';
    h += '<div class="op-section-title">💰 BALANCE &amp; JACKPOTS</div>';
    h += '<div class="op-row"><span class="op-label">Current Balance</span><span class="op-val">$' + GameState.balance.toFixed(2) + '</span></div>';
    h += '<div class="op-row"><span class="op-label">Set Balance $</span>';
    h += '<input class="op-input" id="op-bal" type="number" min="0" step="10" value="' + op.startingBalance + '"></div>';
    h += '<div style="text-align:right;margin-bottom:8px"><button class="op-btn" onclick="Operator.setBalance()">SET BALANCE</button></div>';
    for (var jpi = 0; jpi < jpKeys.length; jpi++) {
      var jpk = jpKeys[jpi];
      h += '<div class="op-row"><span class="op-label">' + jpk + ' Jackpot</span>';
      h += '<span class="op-val">$' + GameState.jackpots[jpk].current.toFixed(2) + '</span>';
      h += '<button class="op-btn danger" style="padding:4px 8px;font-size:10px" data-jpkey="' + jpk + '" onclick="Operator.resetJP(this.dataset.jpkey)">RESET</button></div>';
    }
    h += '<div style="text-align:right;margin-top:6px"><button class="op-btn danger" onclick="Operator.resetAllJP()">RESET ALL JACKPOTS</button></div>';
    h += '</div>';

    // Auto-play
    h += '<div class="op-section">';
    h += '<div class="op-section-title">🤖 AUTO-PLAY</div>';
    h += '<div class="op-row"><span class="op-label">Spins</span>';
    h += '<input class="op-input" id="op-autospins" type="number" min="0" max="1000" step="10" value="' + op.autoPlaySpins + '"></div>';
    h += '<div class="op-row"><span class="op-label">Loss Limit $</span>';
    h += '<input class="op-input" id="op-losslimit" type="number" min="0" step="10" value="' + op.autoPlayLossLimit + '"></div>';
    h += '<div class="op-row"><span class="op-label">Win Limit $</span>';
    h += '<input class="op-input" id="op-winlimit" type="number" min="0" step="10" value="' + op.autoPlayWinLimit + '"></div>';
    h += '<div style="text-align:right"><button class="op-btn" onclick="Operator.applyAutoPlay()">APPLY AUTO-PLAY</button></div>';
    h += '</div>';

    // Bonus Stats
    h += '<div class="op-section">';
    h += '<div class="op-section-title">📈 BONUS STATS</div>';
    h += '<div class="op-rtp-stats">';
    h += 'Red Spin Triggers: <span>' + st.redSpinCount + '</span><br>';
    h += 'Hold &amp; Spin Triggers: <span>' + st.holdSpinCount + '</span><br>';
    h += 'Pick &amp; Choose Triggers: <span>' + st.pickChooseCount + '</span><br>';
    h += 'MINI Jackpots: <span>' + st.jackpotWins.MINI + '</span><br>';
    h += 'MINOR Jackpots: <span>' + st.jackpotWins.MINOR + '</span><br>';
    h += 'MAJOR Jackpots: <span>' + st.jackpotWins.MAJOR + '</span><br>';
    h += 'GRAND Jackpots: <span>' + st.jackpotWins.GRAND + '</span>';
    h += '</div></div>';

    // Event Log
    h += '<div class="op-section">';
    h += '<div class="op-section-title">📋 EVENT LOG &amp; REPLAY</div>';
    h += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
    h += '<button class="op-btn" data-tab="games" onclick="Operator.showLog(this.dataset.tab)">LAST 10 GAMES</button>';
    h += '<button class="op-btn" data-tab="events" onclick="Operator.showLog(this.dataset.tab)">FULL LOG</button>';
    h += '<button class="op-btn" onclick="exportLogAsCSV()">EXPORT CSV</button>';
    h += '<button class="op-btn" onclick="exportLogAsJSON()">EXPORT JSON</button>';
    h += '</div></div>';

    // Reset
    h += '<div class="op-section">';
    h += '<div class="op-section-title">⚠️ RESET OPTIONS</div>';
    h += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
    h += '<button class="op-btn danger" onclick="Operator.resetGame(false)">RESET PLAYER</button>';
    h += '<button class="op-btn danger" onclick="Operator.resetGame(true)">FULL RESET</button>';
    h += '</div></div>';
    h += '<div style="height:20px"></div>';

    panel.innerHTML = h;

    // Attach close button
    var closeBtn = $('op-close');
    if (closeBtn) closeBtn.onclick = function() { Operator.closePanel(); };
  }

  // ── OPERATOR ACTIONS ─────────────────────────────────────────────────
  function applyRTP() {
    var rtpEl  = $('op-rtp');
    var holdEl = $('op-hold');
    if (!rtpEl) return;
    const rtp  = Math.min(99, Math.max(85, parseFloat(rtpEl.value) || 94));
    const hold = parseFloat((100 - rtp).toFixed(1));
    GameState.operator.targetRTP      = rtp;
    GameState.operator.holdPercentage = hold;
    if (holdEl) holdEl.value = hold.toFixed(1);

    // Auto-adjust bonus frequency multiplier to push live RTP toward target
    const liveRTP = getActualRTP();
    if (liveRTP > 0) {
      const diff = rtp - liveRTP;
      // Positive diff = live is below target = increase bonus freq
      const adj = 1.0 + (diff / 15.0);
      GameState.operator.bonusFrequencyMultiplier = Math.max(0.5, Math.min(5.0, parseFloat(adj.toFixed(1))));
    }

    // Update theoretical RTP display live
    var theoEl = $('op-theoretical-rtp');
    if (theoEl && typeof calculateTheoreticalRTP !== 'undefined') {
      theoEl.textContent = (calculateTheoreticalRTP(DEFAULT_LINES)*100).toFixed(2) + '%';
    }

    saveState();
    renderPanel();
    UI.showToast('RTP ' + rtp + '% | Hold ' + hold + '% | BonusFreq ' + GameState.operator.bonusFrequencyMultiplier.toFixed(1) + 'x');
  }

  function applyBonusSettings() {
    const op = GameState.operator;
    op.bonusFrequencyMultiplier = Math.min(5, Math.max(0.5, parseFloat(($('op-bfreq')||{}).value) || 1));
    op.redSpinContinuance = Math.min(0.99, Math.max(0.1, (parseFloat(($('op-rscont')||{}).value)||65)/100));
    op.jackpotContribution = Math.min(0.1, Math.max(0.01, (parseFloat(($('op-jpct')||{}).value)||3)/100));
    op.maxWinPerSpin = Math.max(0, parseFloat(($('op-maxwin')||{}).value)||0);
    saveState();
    UI.showToast('Bonus settings applied');
  }

  function resetRedSpinContinuance() {
    GameState.operator.redSpinContinuance = 0.65;
    saveState();
    renderPanel();
    UI.showToast('Red Spin continuance reset to 65%');
  }

  function toggleForce(key) {
    GameState.operator[key] = !GameState.operator[key];
    saveState();
    renderPanel();
  }

  function setForceJP(val) {
    GameState.operator.forceJackpot = val;
    saveState();
  }

  function selectJackpotType(jp) {
    GameState.operator.forceJackpot = jp;
    // Default context to bonus when selecting a new type
    if (jp !== 'none' && !GameState.operator.forceJackpotContext) {
      GameState.operator.forceJackpotContext = 'bonus';
    }
    saveState();
    renderPanel();
  }

  function setJackpotContext(ctx) {
    GameState.operator.forceJackpotContext = ctx;
    saveState();
    renderPanel();
  }

  // ── ARM JACKPOT — sets up force trigger based on context ──────────────
  function armJackpot() {
    const op  = GameState.operator;
    const jp  = op.forceJackpot;
    const ctx = op.forceJackpotContext;
    if (jp === 'none') { UI.showToast('Select a jackpot type first'); return; }

    if (ctx === 'bonus') {
      // Will fire inside next bonus (Hold & Spin, Pick & Choose, Red Spin)
      // forceJackpot is already set; forceJackpotContext flags it as bonus
      saveState();
      UI.showToast('✅ ' + jp + ' jackpot armed — fires in next bonus');
      renderPanel();

    } else {
      // BASE GAME: force reels to land 6+ Gold Coins so Hold & Spin triggers,
      // then jackpot fires inside that Hold & Spin
      const coinStops = _findCoinStops(6);
      if (!coinStops) {
        UI.showToast('Could not find 6-coin combo — try fewer coins');
        return;
      }
      op.forceReelStops = coinStops;
      op.forceBonusGame = false; // reels will naturally trigger Hold & Spin
      // Keep forceJackpot set so it fires when Hold & Spin runs
      saveState();

      // Update the reel stop inputs in the panel so operator can see them
      [0,1,2,3,4].forEach(function(r) {
        var el = document.getElementById('op-stop' + r);
        if (el && coinStops[r] != null) el.value = coinStops[r];
      });

      UI.showToast('✅ ' + jp + ' jackpot — reels set to land 6 coins > Hold & Spin');
      renderPanel();
    }
  }

  // Find reel stop indices that place Gold Coins (id=9) in at least minCoins cells
  // Strategy: for each reel, find a stop where row 1 (middle) lands a Gold Coin.
  // For a 5-reel × 3-row grid that gives 5 coins. Then also try to get row 0/2
  // on a couple of reels to hit 6+.
  function _findCoinStops(minCoins) {
    const COIN = 9; // BONUS_ID
    // For each reel, collect all stops where each row shows a coin
    var reelCoinPositions = REEL_STRIPS.map(function(strip, col) {
      const len = strip.length;
      const positions = { row0: [], row1: [], row2: [] };
      for (let stop = 0; stop < len; stop++) {
        // buildGrid uses: row0 = (stop-1+len)%len, row1 = stop, row2 = (stop+1)%len
        if (strip[(stop - 1 + len) % len] === COIN) positions.row0.push(stop);
        if (strip[stop]                    === COIN) positions.row1.push(stop);
        if (strip[(stop + 1) % len]        === COIN) positions.row2.push(stop);
      }
      return positions;
    });

    // Try to build a combo with as many coins as possible
    // Phase 1: pick stops where middle row (row1) is a coin for all 5 reels
    var midStops = reelCoinPositions.map(function(p) { return p.row1[0] != null ? p.row1[0] : null; });
    if (midStops.every(function(s) { return s != null; })) {
      // All 5 middle rows = coins. Count actual grid coins for these stops.
      let count = 5;
      // Try to improve: swap a stop to one that also covers row0 or row2 coin
      for (let col = 0; col < 5; col++) {
        const strip = REEL_STRIPS[col];
        const len   = strip.length;
        for (const s of reelCoinPositions[col].row1) {
          const r0coin = strip[(s - 1 + len) % len] === COIN;
          const r2coin = strip[(s + 1) % len]       === COIN;
          if (r0coin || r2coin) { midStops[col] = s; count += (r0coin?1:0)+(r2coin?1:0); break; }
        }
      }
      if (count >= minCoins) return midStops;
    }

    // Phase 2: fallback — try each reel's best available mid-row stop
    const stops = [null, null, null, null, null];
    let coinCount = 0;
    for (let col = 0; col < 5; col++) {
      const strip = REEL_STRIPS[col];
      const len   = strip.length;
      // Prefer a stop that has coin in all 3 rows
      let best = null;
      for (const s of reelCoinPositions[col].row1) {
        const r0 = strip[(s - 1 + len) % len] === COIN;
        const r2 = strip[(s + 1) % len]       === COIN;
        const score = 1 + (r0?1:0) + (r2?1:0);
        if (!best || score > best.score) best = { s, score };
      }
      if (best) { stops[col] = best.s; coinCount += best.score; }
      else if (reelCoinPositions[col].row0[0] != null) {
        stops[col] = reelCoinPositions[col].row0[0]; coinCount++;
      } else if (reelCoinPositions[col].row2[0] != null) {
        stops[col] = reelCoinPositions[col].row2[0]; coinCount++;
      }
    }
    return coinCount >= minCoins ? stops : null;
  }

  function applyReelStops() {
    var stops = [0,1,2,3,4].map(function(r) {
      var el = document.getElementById('op-stop' + r);
      var val = el ? el.value : '';
      return val !== '' && val !== undefined ? parseInt(val) : null;
    });
    GameState.operator.forceReelStops = stops;
    saveState();
    UI.showToast('Reel stops set');
  }

  function clearReelStops() {
    GameState.operator.forceReelStops = [null,null,null,null,null];
    [0,1,2,3,4].forEach(function(r) { var el=document.getElementById('op-stop'+r); if(el) el.value=''; });
    saveState();
    UI.showToast('Reel stops cleared');
  }

  function setBalance() {
    const val = parseFloat(($('op-bal')||{}).value) || GameState.operator.startingBalance;
    GameState.balance = Math.max(0, val);
    GameState.operator.startingBalance = val;
    UI.updateBalance(GameState.balance);
    saveState();
    UI.showToast('Balance set to $' + val.toFixed(2));
  }

  function resetJP(key) {
    resetSingleJackpot(key);
    UI.updateJackpotMeters();
    renderPanel();
    UI.showToast(key + ' Jackpot reset to seed');
  }

  function resetAllJP() {
    resetJackpotValues();
    UI.updateJackpotMeters();
    renderPanel();
    UI.showToast('All jackpots reset');
  }

  function applyAutoPlay() {
    const op = GameState.operator;
    op.autoPlaySpins     = parseInt(($('op-autospins')||{}).value)||0;
    op.autoPlayLossLimit = parseFloat(($('op-losslimit')||{}).value)||0;
    op.autoPlayWinLimit  = parseFloat(($('op-winlimit')||{}).value)||0;
    saveState();
    UI.showToast('Auto-play settings applied');
  }

  function resetGame(full) {
    if (!confirm(full ? 'Full reset? Clears all stats, balance, jackpots.' :
                        'Reset player balance and stats?')) return;
    resetState({ keepJackpots: !full, keepOperator: true });
    UI.updateBalance(GameState.balance);
    UI.updateJackpotMeters();
    closePanel();
    UI.showToast(full ? 'Full reset complete' : 'Player reset complete');
  }

  // ── EVENT LOG VIEWER ─────────────────────────────────────────────────
  function showLog(tab = 'games') {
    const screen = $('log-screen');
    if (!screen) return;
    screen.classList.add('active');
    renderLogTab(tab);
  }

  function renderLogTab(tab) {
    var logContent = $('log-content');
    if (!logContent) return;
    logContent.innerHTML = '';

    if (tab === 'games') {
      var games = GameState.eventLog.games;
      if (!games.length) {
        logContent.innerHTML = '<p style="color:var(--text-dim);padding:20px;text-align:center">No games recorded yet.</p>';
        return;
      }
      for (var gi = 0; gi < games.length; gi++) {
        var g = games[gi];
        var net     = (g.summary && g.summary.netResult != null) ? g.summary.netResult : 0;
        var winCls  = net >= 0 ? 'win' : 'loss';
        var netStr  = (net >= 0 ? '+' : '') + '$' + Math.abs(net).toFixed(2);
        var bonuses = (g.bonuses && g.bonuses.length) ? g.bonuses.map(function(b){return b.type;}).join(', ') : 'None';
        var canReplay = !GameState.spinInProgress && !GameState.activeBonus;
        var betAmt  = (g.bet && g.bet.total) ? g.bet.total.toFixed(2) : '?';
        var row = document.createElement('div');
        row.className = 'log-game-row';
        var rowH = '';
        rowH += '<div class="log-game-header">';
        rowH += '<span class="log-game-num">Game #' + g.gameNumber + '</span>';
        rowH += '<span class="log-game-time">' + (g.timeFormatted || '') + '</span>';
        rowH += '</div>';
        rowH += '<div style="display:flex;justify-content:space-between;align-items:center">';
        rowH += '<div>';
        rowH += '<div class="log-game-result ' + winCls + '">Bet $' + betAmt + ' | ' + netStr + '</div>';
        rowH += '<div class="log-game-bonuses">Bonuses: ' + bonuses + '</div>';
        rowH += '</div>';
        rowH += '<button class="log-replay-btn" ' + (canReplay ? '' : 'disabled') + ' data-gameid="' + g.gameId + '" onclick="Operator.replayGame(this.dataset.gameid)">▶ REPLAY</button>';
        rowH += '</div>';
        row.innerHTML = rowH;
        logContent.appendChild(row);
      }
    } else {
      var allEvents = GameState.eventLog.allEvents.slice().reverse();
      if (!allEvents.length) {
        logContent.innerHTML = '<p style="color:var(--text-dim);padding:20px;text-align:center">No events logged yet.</p>';
        return;
      }
      var evSlice = allEvents.slice(0, 200);
      for (var ei = 0; ei < evSlice.length; ei++) {
        var e = evSlice[ei];
        var detail = '';
        if (e.type === 'CASH_OUT')      detail = 'Voucher ' + (e.voucherId||'') + ' $' + ((e.amount||0).toFixed(2));
        else if (e.type === 'CASH_IN')  detail = 'Voucher ' + (e.voucherId||'') + ' $' + ((e.amount||0).toFixed(2));
        else if (e.totalWin != null)    detail = 'Win: $' + (e.totalWin||0).toFixed(2);
        else if (e.amount != null)      detail = '$' + e.amount.toFixed(2);
        else                            detail = e.bonusType || '';
        var typeColor = e.type === 'CASH_OUT' ? '#7dcc20' : (e.type === 'CASH_IN' ? '#40a0ff' : 'var(--gold)');
        var eRow = document.createElement('div');
        eRow.className = 'log-event-row';
        eRow.innerHTML = '<span class="log-event-time">' + ((e.timeFormatted||'').slice(-8)) + '</span>'
          + '<span class="log-event-type" style="color:' + typeColor + '">' + e.type + '</span>'
          + '<span class="log-event-detail">' + detail + '</span>';
        logContent.appendChild(eRow);
      }
    }
  }

  async function replayGame(gameId) {
    if (GameState.spinInProgress || GameState.activeBonus) {
      UI.showToast('Replay unavailable during active game'); return;
    }
    var game = null;
    for (var _ri = 0; _ri < GameState.eventLog.games.length; _ri++) {
      if (GameState.eventLog.games[_ri].gameId === gameId) { game = GameState.eventLog.games[_ri]; break; }
    }
    if (!game) return;
    closeLogScreen();
    closePanel();
    await Bonuses.replayGame(game);
  }

  function closeLogScreen() {
    const screen = $('log-screen');
    if (screen) screen.classList.remove('active');
  }

  function closePanel() {
    GameState.operator.panelOpen = false;
    var _ov = $('op-overlay');
    if (_ov) _ov.classList.remove('active');
    saveState();
  }

  // ── INIT ─────────────────────────────────────────────────────────────
  function init() {
    initTapZone();

    // PIN keypad listeners
    document.querySelectorAll('.pin-key').forEach(function(btn) {
      btn.addEventListener('click', function() { handlePinKey(btn.dataset.val); });
    });
    var pinOverlay = $('pin-overlay');
    if (pinOverlay) pinOverlay.addEventListener('click', function(e) {
      if (e.target === pinOverlay) hidePinEntry();
    });

    // Log screen close
    const logClose = $('log-close');
    if (logClose) logClose.addEventListener('click', closeLogScreen);
    var logTabs = document.querySelectorAll('.log-tab');
    logTabs.forEach(function(tab) { tab.addEventListener('click', function() {
      logTabs.forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      renderLogTab(tab.dataset.tab);
    }); });
  }

  return {
    init, closePanel, showLog, replayGame,
    applyRTP, applyBonusSettings, resetRedSpinContinuance, toggleForce, setForceJP,
    selectJackpotType, setJackpotContext, armJackpot,
    applyReelStops, clearReelStops, setBalance,
    resetJP, resetAllJP, applyAutoPlay, resetGame,
  };
})();
