'use strict';
const UI = (() => {
  const $ = id => document.getElementById(id);
  let reelEls=[], paylineCanvas=null, paylineCtx=null;
  let pickTapCb = null;
  let _skipCreditAnim = false;
  let isAnimatingCredits = false;

  const PAYLINE_COLORS=['#ff0','#0ff','#f0f','#0f0','#f80','#08f','#f44','#4f4','#44f','#ff8','#8ff','#f8f','#8f8','#88f','#f88','#4ff','#ff4','#f4f','#4f8','#84f'];

  function init() {
    reelEls = [0,1,2,3,4].map(i => $('reel-'+i));
    // INSERT CASH TO PLAY ticker — only shown when balance is 0
    if (typeof GameState !== 'undefined' && GameState.balance <= 0) _startInsertCashTicker();
    paylineCanvas = $('payline-canvas');
    if (paylineCanvas) paylineCtx = paylineCanvas.getContext('2d');
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
  }

  function resizeCanvas() {
    const frame = $('reel-frame');
    if (!frame || !paylineCanvas) return;
    paylineCanvas.width  = frame.offsetWidth;
    paylineCanvas.height = frame.offsetHeight;
  }

  function makeSymbolImg(symId) {
    const sym = SYMBOL_BY_ID[symId];
    if (!sym) return null;
    const img = document.createElement('img');
    img.src = sym.file; img.alt = sym.name; img.draggable = false;
    return img;
  }

  function renderGrid(grid) {
    reelEls.forEach((reel, col) => {
      if (!reel) return;
      let strip = reel.querySelector('.reel-strip');
      if (!strip) {
        strip = document.createElement('div');
        strip.className = 'reel-strip';
        reel.appendChild(strip);
      }
      // Always reset inline styles that animation may have modified
      strip.innerHTML   = '';
      strip.style.transform  = '';
      strip.style.transition = '';
      strip.style.height     = '100%'; // ensure flex fill is restored
      for (let row = 0; row < 3; row++) {
        strip.appendChild(_makeCell(grid[col][row], col, row));
      }
    });
    resizeCanvas();
  }

  function _makeCell(symId, col, row) {
    const cell = document.createElement('div');
    cell.className = 'symbol-cell';
    cell.id = `sc-${col}-${row}`;
    const img = makeSymbolImg(symId);
    if (img) cell.appendChild(img);
    return cell;
  }

  // ── REEL SPIN ANIMATION ───────────────────────────────────────────────
  async function animateReelsStop(stops, grid, isReplay=false, isRedSpin=false) {
    clearPaylines(); clearHighlights();

    const DELAYS = isReplay  ? [190,230,270,320,370]
                             : [640,790,940,1090,1240]; // Same for base AND red spin
    const SPIN = isReplay ? 155 : 490;

    const promises = reelEls.map((reel, col) => new Promise(resolve => {
      if (!reel) { resolve(); return; }

      // No blur — crisp spin

      setTimeout(() => {
        const strip = reel.querySelector('.reel-strip');
        if (!strip) { reel.style.filter = ''; resolve(); return; }

        const reelStrip = REEL_STRIPS[col];
        const len = reelStrip.length;
        const stop = stops[col];

        // Measure reel — use EXPLICIT pixel heights on animation cells
        // so 9 cells don't get crushed to 1/9 by the flex layout
        const reelH = reel.offsetHeight || 210;
        const cellH = Math.floor(reelH / 3);

        strip.style.transition = 'none';
        strip.style.transform  = 'translateY(0)';
        strip.style.height     = 'auto'; // let strip grow to 9 x cellH
        strip.innerHTML        = '';

        // Build 18 symbols: i = -15 to 2
        // Cells 0-14 scroll past (5 visual rotations); cells 15,16,17 are final winners
        for (let i = -15; i < 3; i++) {
          const symId = reelStrip[((stop + i) % len + len) % len];
          const cell  = document.createElement('div');
          cell.className = 'symbol-cell';
          // Explicit pixel height — bypass flex completely during animation
          cell.style.cssText = `height:${cellH}px;flex:none;min-height:unset;`;
          const img = makeSymbolImg(symId);
          if (img) cell.appendChild(img);
          strip.appendChild(cell);
        }

        // Start: translateY(0) shows first 3 cells
        // End:   translateY(-15*cellH) shows last 3 cells (final symbols)
        // 15 symbols scroll past = ~5 visual rotations before stopping
        strip.style.transform = 'translateY(0)';

        requestAnimationFrame(() => requestAnimationFrame(() => {
          strip.style.transition = `transform ${SPIN}ms cubic-bezier(0.15,0.75,0.35,1)`;
          strip.style.transform  = `translateY(${-15 * cellH}px)`;

          setTimeout(() => {
            // Snap to clean 3-cell flex layout
            reel.style.transition  = '';
            strip.style.transition = 'none';
            strip.style.transform  = '';
            strip.style.height     = '100%'; // restore flex fill
            strip.innerHTML        = '';

            for (let row = 0; row < 3; row++) {
              strip.appendChild(_makeCell(grid[col][row], col, row));
            }

            // Bounce
            strip.style.transform = 'translateY(-5px)';
            setTimeout(() => {
              strip.style.transition = 'transform 0.11s ease-out';
              strip.style.transform  = 'translateY(2px)';
              setTimeout(() => {
                strip.style.transition = 'transform 0.08s ease-in';
                strip.style.transform  = '';
                if (!isReplay && !isRedSpin) Audio.play('reel_stop');
                resolve();
              }, 75);
            }, isRedSpin ? 55 : 105);

          }, SPIN + 25);
        }));
      }, DELAYS[col]);
    }));

    await Promise.all(promises);
    resizeCanvas();
  }


  // ── RED SPIN PAYLINE FLASH — non-blocking brief highlight ────────────
  async function showRedSpinPaylineFlash(paylineWins) {
    if (!paylineWins || paylineWins.length === 0) return;
    // Draw ALL winning lines simultaneously
    clearPaylines();
    paylineWins.forEach(function(win) {
      drawPayline(win.lineIndex, win.line);
      flashCells(win.line, win.count);
    });
    // Hold for 500ms so player can see — this runs BEFORE the win amount display
    await delay(500);
    clearPaylines();
    clearHighlights();
  }

  // ── WIN DISPLAY ───────────────────────────────────────────────────────
  // fast=true: shorter display time (used during Red Spin)
  function _skipRequested() {
    try { return typeof getSkipPaylineAnimations !== 'undefined' && getSkipPaylineAnimations(); }
    catch(e) { return false; }
  }

  // MLMC multi-line win display
  // Phase 1: All winning lines simultaneously (~1 second)
  // Phase 2: Cycle each line individually showing credits won
  // Skip anytime by pressing Spin
  async function showBaseWins(result, betPerLine, linesActive, isReplay=false, fast=false) {
    if (!isReplay && _skipRequested()) { clearPaylines(); clearHighlights(); return; }
    const wins = result.paylineWins || [];
    if (!wins.length && !result.scatterWin) return;

    // ── Phase 1: All lines flash at once ──────────────────────────────
    if (!_skipRequested()) {
      wins.forEach(win => { drawPayline(win.lineIndex, win.line); flashCells(win.line, win.count); });
      if (result.scatterWin) flashScatters();
      updateWinDisplay(result.totalWin);
      const p1 = fast ? 400 : isReplay ? 500 : 1000;
      for (let i = 0; i < 5; i++) {
        if (!isReplay && _skipRequested()) { clearPaylines(); clearHighlights(); return; }
        await delay(Math.ceil(p1 / 5));
      }
      clearPaylines(); clearHighlights();
    }

    // ── Phase 2: Cycle each line lowest→highest (skip in fast/replay mode) ─
    if (!fast) {
      const sortedWins = wins.slice().sort(function(a,b) { return a.amount - b.amount; });
      for (const win of sortedWins) {
        if (!isReplay && _skipRequested()) { clearPaylines(); clearHighlights(); return; }
        drawPayline(win.lineIndex, win.line);
        flashCells(win.line, win.count);
        updateWinDisplay(win.amount);
        const p2 = isReplay ? 400 : 700;
        for (let i = 0; i < 4; i++) {
          if (!isReplay && _skipRequested()) break;
          await delay(Math.ceil(p2 / 4));
        }
        clearPaylines(); clearHighlights();
      }
      if (result.scatterWin && !_skipRequested()) {
        flashScatters();
        updateWinDisplay(result.scatterWin);
        for (let i = 0; i < 4; i++) {
          if (!isReplay && _skipRequested()) break;
          await delay(isReplay ? 100 : 175);
        }
        clearPaylines(); clearHighlights();
      }
    }
    if (!_skipRequested()) updateWinDisplay(result.totalWin);
  }

  function drawPayline(lineIndex, line) {
    if (!paylineCtx || !line) return;
    const frame = $('reel-frame');
    if (!frame) return;
    resizeCanvas();
    const cw = frame.offsetWidth / 5;
    const ch = frame.offsetHeight / 3;
    // NO clearRect here — canvas accumulates all lines
    // Use clearPaylines() explicitly to wipe all lines at once
    paylineCtx.beginPath();
    paylineCtx.strokeStyle = PAYLINE_COLORS[lineIndex % PAYLINE_COLORS.length];
    paylineCtx.lineWidth   = 3;
    paylineCtx.shadowColor = PAYLINE_COLORS[lineIndex % PAYLINE_COLORS.length];
    paylineCtx.shadowBlur  = 10;
    paylineCtx.lineCap = 'round'; paylineCtx.lineJoin = 'round';
    line.forEach((row, col) => {
      const x = col * cw + cw / 2, y = row * ch + ch / 2;
      col === 0 ? paylineCtx.moveTo(x,y) : paylineCtx.lineTo(x,y);
    });
    paylineCtx.stroke();
    paylineCtx.shadowBlur = 0;
  }

  // Clear canvas — call this ONCE to wipe all paylines together
  // Never call clearRect inside drawPayline

  function flashCells(line, count) {
    for (let col = 0; col < count; col++) {
      const cell = $(`sc-${col}-${line[col]}`);
      if (cell) cell.classList.add('win-flash', 'highlight');
    }
  }

  function flashScatters() {
    document.querySelectorAll('.symbol-cell img').forEach(img => {
      if (img.src.includes('lipstick')) img.parentElement.classList.add('win-flash','highlight');
    });
  }

  function clearPaylines() {
    if (paylineCtx) paylineCtx.clearRect(0,0,(paylineCanvas?paylineCanvas.width:0),(paylineCanvas?paylineCanvas.height:0));
  }
  function clearHighlights(skipLetterFlash) {
    document.querySelectorAll('.symbol-cell').forEach(function(c) {
      c.classList.remove('win-flash', 'highlight');
      // letter-win-flash removes itself via setTimeout — don't clear it here
    });
  }

  // ── SKIP CREDIT ANIMATION ─────────────────────────────────────────────
  function skipCreditAnimation() {
    _skipCreditAnim = true;
    isAnimatingCredits = false;
    var _sb1=$('spin-btn'); if(_sb1) _sb1.classList.remove('skip-mode');
  }

  async function animateCreditCountup(amount, isRedSpin=false) {
    if (!isRedSpin) {
      isAnimatingCredits = true;
      _skipCreditAnim = false;
      var _sb2=$('spin-btn'); if(_sb2) _sb2.classList.add('skip-mode');
    }
    const end      = GameState.balance;
    const start    = end - amount;
    const duration = Math.min(1600, Math.max(350, amount * 6));
    const startTime = Date.now();

    while (true) {
      if (!isRedSpin && _skipCreditAnim) { updateBalance(end); break; }
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      updateBalance(start + (end - start) * eased);
      Audio.play('coin_drop');
      if (progress >= 1) break;
      await delay(40);
    }

    updateBalance(end);
    if (!isRedSpin) {
      isAnimatingCredits = false;
      _skipCreditAnim = false;
      var _sb1=$('spin-btn'); if(_sb1) _sb1.classList.remove('skip-mode');
    }
  }

  // ── CREDIT DISPLAYS ───────────────────────────────────────────────────
  function updateBalance(val) {
    const el = $('balance-val');
    if (el) el.textContent = '$' + (parseFloat(val)||0).toFixed(2);
    // Start/stop the insert-cash ticker based on balance
    if ((parseFloat(val)||0) > 0) _stopInsertCashTicker();
    else _startInsertCashTicker();
  }

  function updateWinDisplay(val, lineLabel=null) {
    const el = $('win-amount');
    if (!el) return;
    el.textContent = val > 0 ? '$' + val.toFixed(2) : '$0.00';
    const lblEl = $('win-line-label');
    if (lblEl) lblEl.textContent = lineLabel || '';
    if (val > 0) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  }

  function updateBetDisplay(val) {
    const el = $('bet-display');
    if (el) el.textContent = '$' + val.toFixed(2);
  }

  function updateJackpotMeters() {
    ['MINI','MINOR','MAJOR','GRAND'].forEach(key => {
      const val = '$' + GameState.jackpots[key].current.toFixed(2);
      const k   = key.toLowerCase();
      // Main jackpot bar
      const el = document.querySelector(`#jp-${k} .jp-amount`);
      if (el) el.textContent = val;
      // Hold & Spin bonus screen meters
      const holdEl = $(`hold-jp-${k}`);
      if (holdEl) holdEl.textContent = val;
      // Pick & Choose bonus screen meters
      const pickEl = $(`pick-jp-${k}`);
      if (pickEl) pickEl.textContent = val;
    });
  }

  // ── RED SPIN — reel-only overlay ─────────────────────────────────────
  async function showRedSpinEntry() {
    const overlay = $('red-reel-overlay');
    const frame   = $('reel-frame');
    if (overlay) overlay.classList.add('active');
    if (frame)   frame.classList.add('red-active');
    var _btb=$('bonus-total-box'); if(_btb) _btb.classList.add('visible');
    if ($('bonus-total-amount')) $('bonus-total-amount').textContent = '$0.00';
    setControlsEnabled(false);
    // Quick flash
    if (overlay) {
      for (let i = 0; i < 3; i++) {
        overlay.style.background = 'rgba(220,0,0,0.72)';
        await delay(100);
        overlay.style.background = '';
        await delay(100);
      }
    }
  }

  async function updateRedSpinWin(winAmount, bonusTotal, spinNum, isReplay=false) {
    // Flash each ascending win amount — player sees the escalation
    updateWinDisplay(winAmount);
    const bt = $('bonus-total-amount');
    if (bt) bt.textContent = '$' + bonusTotal.toFixed(2);
    var _btb=$('bonus-total-box'); if(_btb) _btb.classList.add('visible');
    // updateWinDisplay() above already triggers the pop animation — no need to repeat it
    await delay(isReplay ? 200 : 550);
  }

  async function endRedSpinBonus(total) {
    // Show final total — NO credit countup here (game.js handles balance)
    // Red screen drops immediately when bonus ends
    updateWinDisplay(total);
    updateBalance(GameState.balance);
    showToast('🔴 RED SPIN TOTAL: $' + total.toFixed(2), 2000);
    await delay(600); // Brief moment to see the total
    deactivateRedScreen();
  }

  // ── HOLD & SPIN ───────────────────────────────────────────────────────
  function _coinIcon(type) {
    return {cash:'🪙', mini:'🔵', minor:'🟢', major:'🟡', grand:'🔶'}[type] || '🪙';
  }
  function _coinColor(type) {
    return {cash:'var(--gold)', mini:'#a8d8ea', minor:'#c9f0a0', major:'#f5d878', grand:'#ff6b35'}[type] || 'var(--gold)';
  }

  function _fillHoldCell(cell, coin) {
    if (!coin) return;
    // Normalise jackpot coin shape — new coins use {type:'jackpot', jackpotLevel:'MINI'}
    // Legacy coins used {type:'mini'} etc. Support both so replays/logs stay compatible.
    var displayType = coin.type;
    if (coin.type === 'jackpot' && coin.jackpotLevel) {
      displayType = coin.jackpotLevel.toLowerCase(); // 'mini'|'minor'|'major'|'grand'
    }
    cell.className = 'hold-cell ' + displayType;
    if (displayType === 'cash') {
      var amt = coin.value >= 1000 ? '$' + (coin.value/1000).toFixed(1) + 'K'
              : coin.value >= 100  ? '$' + Math.round(coin.value)
              :                      '$' + coin.value.toFixed(2);
      cell.innerHTML = '<div class="chip-wrap"><div class="chip-inner"><span class="c-val">' + amt + '</span></div></div>';
    } else {
      var labels = {mini:'MINI', minor:'MINOR', major:'MAJOR', grand:'GRAND'};
      var lbl = labels[displayType] || displayType.toUpperCase();
      var valAmt = coin.value != null ? '$' + Math.round(coin.value) : '';
      cell.innerHTML = '<div class="chip-wrap"><div class="chip-inner"><span class="c-lbl">' + lbl + '</span><span class="c-val">' + valAmt + '</span></div></div>';
    }
  }

  async function showHoldSpinBoard(board, respins) {
    const screen = $('hold-screen');
    if (!screen) return;
    await _holdSpinReelIntro();
    screen.classList.add('active');
    updateJackpotMeters(); // Show jackpots in Hold & Spin screen
    _renderHoldBoard(board);
    updateRespinCounter(respins);
    updateHoldTotal(0);
    setControlsEnabled(false);
    await delay(300);
  }

  async function _holdSpinReelIntro() {
    const stops = REEL_STRIPS.map(s => Math.floor(Math.random() * s.length));
    const grid  = Array(5).fill(null).map(() => [BONUS_ID, BONUS_ID, BONUS_ID]);
    await animateReelsStop(stops, grid);
    await delay(450);
  }

  function _renderHoldBoard(board) {
    const holdBoard = $('hold-board');
    if (!holdBoard) return;
    holdBoard.innerHTML = '';
    board.forEach((coin, i) => {
      const cell = document.createElement('div');
      cell.className = 'hold-cell';
      cell.id = 'hcell-' + i;
      if (coin) _fillHoldCell(cell, coin);
      holdBoard.appendChild(cell);
    });
  }

  async function animateHoldSpinning(board, durationMs=480) {
    // Aristocrat style: rapid spinning coin on ALL empty cells during respin
    board.forEach(function(coin, i) {
      if (coin !== null) return; // skip locked coins
      var cell = $('hcell-' + i);
      if (!cell) return;
      // Show spinning coin on empty cell
      cell.innerHTML = '<div class="chip-wrap"><div class="chip-inner"></div></div>';
      cell.classList.add('spinning-cell');
    });
    await delay(durationMs);
    // Clear spinning on all empty cells
    document.querySelectorAll('.hold-cell.spinning-cell').forEach(function(c) {
      c.classList.remove('spinning-cell');
      c.innerHTML = '';
    });
  }

  async function animateCoinLand(pos, coin, isReplay=false) {
    var cell = $('hcell-' + pos);
    if (!cell) return;
    cell.classList.remove('spinning-cell');

    if (isReplay) {
      // Replay: instant coin placement
      _fillHoldCell(cell, coin);
      updateHoldTotal(_calcBoardTotal());
      return;
    }

    // ── ARISTOCRAT STYLE: Coin drops from above ──────────────────────────
    // Step 1: Fill cell with coin content, start hidden above
    _fillHoldCell(cell, coin);
    var chipWrap = cell.querySelector('.chip-wrap');
    if (chipWrap) {
      chipWrap.style.transform = 'translateY(-120px) rotateY(0deg) scale(0.6)';
      chipWrap.style.opacity = '0';
    }

    // Brief pause before drop (stagger effect if multiple coins land)
    await delay(30);

    // Step 2: Trigger drop animation
    cell.classList.add('coin-dropping');
    if (chipWrap) {
      chipWrap.style.transform = '';
      chipWrap.style.opacity = '';
    }

    // Step 3: Play coin sound on landing (after fall duration ~400ms)
    setTimeout(function() {
      if (typeof Audio !== 'undefined' && Audio.play) {
        Audio.play('coin_drop'); // coin clink sound
      }
      // Landing impact effects
      cell.classList.remove('coin-dropping');
      cell.classList.add('coin-dropped');

      // Sparkle particles on impact
      var sparkleCount = 6;
      var angles = [0, 60, 120, 180, 240, 300];
      angles.forEach(function(angle) {
        var spark = document.createElement('div');
        spark.className = 'coin-sparkle';
        var dist = 18 + Math.random() * 12;
        var rad = angle * Math.PI / 180;
        spark.style.setProperty('--sx', (Math.cos(rad) * dist) + 'px');
        spark.style.setProperty('--sy', (Math.sin(rad) * dist) + 'px');
        spark.style.left = '50%'; spark.style.top = '50%';
        spark.style.marginLeft = '-3px'; spark.style.marginTop = '-3px';
        cell.appendChild(spark);
        setTimeout(function() { spark.remove(); }, 400);
      });

      // Remove impact class after glow fades
      setTimeout(function() {
        cell.classList.remove('coin-dropped');
      }, 400);

    }, 420); // matches coinFall animation peak

    // Wait for full animation + bounce settle
    await delay(700);
    updateHoldTotal(_calcBoardTotal());
  }

  function _calcBoardTotal() {
    let total = 0;
    document.querySelectorAll('#hold-board .hold-cell').forEach(cell => {
      var _cv = cell.querySelector('.c-val'); var v = parseFloat(_cv ? (_cv.textContent||'').replace('$','') : '0');
      if (!isNaN(v)) total += v;
    });
    return total;
  }

  function updateHoldTotal(val) {
    const el = $('hold-total-val');
    if (el) el.textContent = '$' + val.toFixed(2);
  }

  async function updateRespinCounter(val) {
    const el = $('respin-counter');
    if (el) {
      el.textContent = val + (val === 1 ? ' SPIN REMAINING' : ' SPINS REMAINING');
      el.style.color = val <= 1 ? '#ff4040' : val === 2 ? '#ff9900' : '#ffffff';
      el.style.borderColor = val <= 1 ? '#ff4040' : val === 2 ? '#ff9900' : '#c8860a';
    }
  }

  async function showBlackoutCelebration(amount, wasDouble=false) {
    showToast(wasDouble ? '🏆 DOUBLE GRAND! FULL BOARD!' : '🏆 BLACKOUT! GRAND JACKPOT!', 3000);
    const board = $('hold-board');
    if (board) {
      for (let i=0; i<8; i++) {
        board.style.filter = i%2===0 ? 'brightness(2.5) saturate(1.5)' : 'brightness(1)';
        await delay(180);
      }
      board.style.filter = '';
    }
  }

  async function endHoldSpin(board, totalWon, isBlackout) {
    _renderHoldBoard(board);
    updateHoldTotal(totalWon);
    await delay(900);
    showToast('💰 HOLD & SPIN TOTAL: $' + totalWon.toFixed(2), 2500);
    await delay(2000);
    var _hs=$('hold-screen'); if(_hs) _hs.classList.remove('active');
    updateWinDisplay(totalWon);
    await animateCreditCountup(totalWon, false);
    setControlsEnabled(true);
  }

  // ── PICK & CHOOSE ─────────────────────────────────────────────────────
  function setPickTapCallback(cb) { pickTapCb = cb; }

  async function showPickChooseGrid(size, extraPicks=0) {
    const screen = $('pick-screen');
    if (!screen) return;
    screen.classList.add('active');
    updateJackpotMeters(); // Show jackpots in Pick & Choose screen
    const grid = $('pick-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const matchDiv = $('pick-matches');
    if (matchDiv) matchDiv.textContent = extraPicks > 0 ? `Match 3 symbols to win! (+${extraPicks} extra pick${extraPicks>1?'s':''})` : 'Match 3 symbols to win!';

    for (let i = 0; i < size; i++) {
      const tile = document.createElement('div');
      tile.className = 'pick-tile';
      tile.dataset.index = i;
      tile.innerHTML = `<div class="tile-back">⭐</div><div class="tile-front"></div>`;
      tile.addEventListener('click', () => {
        if (pickTapCb && !tile.classList.contains('revealed')) pickTapCb(parseInt(tile.dataset.index));
      });
      grid.appendChild(tile);
    }
    setControlsEnabled(false);
    await delay(300);
  }

  // Reveal tile — showValue=false hides the amount until match is confirmed
  async function revealPickTile(index, prize, isReplay=false, showValue=true) {
    const tile = document.querySelector(`.pick-tile[data-index="${index}"]`);
    if (!tile) return;
    tile.classList.add('revealed');
    const front = tile.querySelector('.tile-front');
    if (front) {
      const icons = {cash:'💰', red_spin:'🔴', hold_spin:'🪙', mini:'🔵', minor:'🟢', major:'🟡', grand:'🔶'};
      const icon  = icons[prize.type] || '❓';
      // Show symbol type but mask value until match
      const label = showValue && prize.type === 'cash' ? '$'+prize.value.toFixed(2) :
                    prize.type === 'cash'      ? '?' :
                    prize.type === 'red_spin'  ? 'RED SPIN' :
                    prize.type === 'hold_spin' ? 'HOLD SPIN' :
                    prize.type.toUpperCase() + ' JP';
      front.innerHTML = `<div style="font-size:17px">${icon}</div><div style="color:var(--gold-light);font-size:8px;margin-top:1px">${label}</div>`;
    }
    await delay(isReplay ? 180 : 260);
  }

  // Update the match progress display
  function updatePickMatches(matchCounts) {
    const el = $('pick-matches');
    if (!el) return;
    const icons = {cash:'💰', red_spin:'🔴', hold_spin:'🪙', mini:'🔵', minor:'🟢', major:'🟡', grand:'🔶'};
    const parts = Object.entries(matchCounts)
      .filter(([,c]) => c > 0)
      .map(([type, count]) => `${icons[type]||'?'} × ${count}`);
    el.textContent = parts.length > 0 ? parts.join('  |  ') : 'Match 3 symbols to win!';
  }

  // Called when player gets 3-of-a-kind match
  async function showPickChooseWin(matchedIndex, prize, totalWon, awardHoldSpin, awardRedSpin, matchCounts) {
    // Highlight all 3 matching tiles
    const type = prize.type;
    const icons = {cash:'💰', red_spin:'🔴', hold_spin:'🪙', mini:'🔵', minor:'🟢', major:'🟡', grand:'🔶'};
    let matchFound = 0;
    document.querySelectorAll('.pick-tile.revealed').forEach(tile => {
      const front = tile.querySelector('.tile-front');
      if (!front) return;
      // Check if this tile matches the winning type
      var _tq=front.querySelector('div'); var tileIcon = _tq ? _tq.textContent : '';
      if (tileIcon === icons[type] && matchFound < 3) {
        tile.classList.add('match');
        // Reveal value on matched tiles
        if (type === 'cash' && prize.value > 0) {
          const valDiv = front.querySelectorAll('div')[1];
          if (valDiv) valDiv.textContent = '$' + totalWon.toFixed(2);
        }
        matchFound++;
      }
    });

    // Big announcement
    const winText = type === 'cash'      ? `💰 MATCH! WON $${totalWon.toFixed(2)}` :
                    type === 'red_spin'  ? '🔴 MATCH! RED SPIN BONUS!' :
                    type === 'hold_spin' ? '🪙 MATCH! HOLD & SPIN BONUS!' :
                    `🏆 MATCH! ${type.toUpperCase()} JACKPOT!`;
    showToast(winText, 3000);
    await delay(2000);
  }

  async function revealAllPickTiles(tiles, revealed) {
    // Only reveal if needed (Pick & Choose stops on match — usually no extra reveals)
    for (let i = 0; i < tiles.length; i++) {
      if (!revealed[i]) { await revealPickTile(i, tiles[i], false, true); await delay(60); }
    }
  }

  async function endPickChoose(prize, totalWon, awardHoldSpin, awardRedSpin) {
    await delay(1500);
    var _ps=$('pick-screen'); if(_ps) _ps.classList.remove('active');
    if (totalWon > 0) {
      updateWinDisplay(totalWon);
      await animateCreditCountup(totalWon, false);
    }
    setControlsEnabled(true);
  }

  // ── JACKPOT ───────────────────────────────────────────────────────────
  async function showJackpotCelebration(type, amount, context) {
    const overlay = $('jackpot-overlay');
    if (!overlay) return;
    const colors = {MINI:'#a8d8ea', MINOR:'#c9f0a0', MAJOR:'#f5d878', GRAND:'#ff6b35'};
    const isMajorPlus = (type === 'MAJOR' || type === 'GRAND');
    const typeEl = $('jackpot-type-text'), amtEl = $('jackpot-amount-text'), ctxEl = $('jackpot-context-text');
    const sistersImg = $('jackpot-sisters-img');
    const actionsEl  = $('jackpot-actions');
    const tapEl      = $('jackpot-tap-hint');

    if (typeEl) { typeEl.textContent = type + ' JACKPOT!'; typeEl.style.color = colors[type] || '#fff'; }
    if (amtEl)  amtEl.textContent = '$' + amount.toFixed(2);
    if (ctxEl)  ctxEl.textContent = '';
    // Randomly alternate between sisters together and solo — not both at once
    if (sistersImg) {
      var celebImgs = ['assets/sisters_celebrate.png', 'assets/sasha_solo_celebrate.png'];
      sistersImg.src = celebImgs[Math.floor(Math.random() * celebImgs.length)];
      sistersImg.style.display = 'block';
    }

    // MAJOR and GRAND: lock screen with Cash Out / Continue
    if (isMajorPlus) {
      if (actionsEl) actionsEl.style.display = 'flex';
      if (tapEl)     tapEl.style.display = 'none';
    } else {
      if (actionsEl) actionsEl.style.display = 'none';
      if (tapEl)     tapEl.style.display = 'block';
    }

    overlay.classList.add('active');
    Audio.startJackpotBells();

    return new Promise(function(resolve) {
      if (isMajorPlus) {
        var cashBtn = $('jackpot-cashout-btn');
        var contBtn = $('jackpot-continue-btn');
        function onCash() {
          cleanup();
          // Generate voucher for jackpot amount
          if (typeof CashOut !== 'undefined' && CashOut.doCashOutAmount) {
            CashOut.doCashOutAmount(amount, type + '_JACKPOT');
          }
          resolve({action:'cashout'});
        }
        function onCont() { cleanup(); resolve({action:'continue'}); }
        function cleanup() {
          if (cashBtn) cashBtn.removeEventListener('click', onCash);
          if (contBtn) contBtn.removeEventListener('click', onCont);
          Audio.stopJackpotBells();
          overlay.classList.remove('active');
          if (sistersImg) sistersImg.style.display = 'none';
        }
        if (cashBtn) cashBtn.addEventListener('click', onCash, {once:true});
        if (contBtn) contBtn.addEventListener('click', onCont, {once:true});
      } else {
        // MINI / MINOR — tap anywhere to dismiss
        overlay.addEventListener('click', function dismiss() {
          Audio.stopJackpotBells();
          overlay.classList.remove('active');
          if (sistersImg) sistersImg.style.display = 'none';
          resolve({action:'dismiss'});
        }, {once:true});
        setTimeout(function() {
          Audio.stopJackpotBells();
          overlay.classList.remove('active');
          if (sistersImg) sistersImg.style.display = 'none';
          resolve({action:'timeout'});
        }, 8000);
      }
    });
  }

  // ── BONUS FEATURE ORB SCREEN ─────────────────────────────────────────
  var _orbTapCallback = null;

  function setOrbTapCallback(cb) { _orbTapCallback = cb; }

  async function showBonusLetterCelebration() {
    // Animate B-O-N-U-S spelling on screen before orb selection
    var cel = $('bonus-letter-celebrate');
    if (!cel) return;
    var spans = cel.querySelectorAll('.bonus-cel-letter');
    cel.style.display = 'flex';
    // Animate each letter in sequence
    for (var li = 0; li < spans.length; li++) {
      spans[li].classList.add('letter-pop');
      Audio.play('reel_stop');
      await delay(220);
    }
    // Hold full word then pulse
    await delay(600);
    cel.classList.add('bonus-cel-pulse');
    await delay(900);
    cel.style.display = 'none';
    cel.classList.remove('bonus-cel-pulse');
    for (var lj = 0; lj < spans.length; lj++) {
      spans[lj].classList.remove('letter-pop');
    }
  }

  async function showBonusOrbScreen(prizes, winPosition) {
    var screen = $('bonus-orb-screen');
    if (!screen) return;
    var container = $('bonus-orb-container');
    if (!container) return;

    container.innerHTML = '';

    for (var i = 0; i < prizes.length; i++) {
      var orb = document.createElement('div');
      orb.className = 'bonus-orb';
      orb.id = 'orb-' + i;
      var orbIcons  = { red_spin:'🔴', pick_choose:'⭐', hold_spin:'🪙' };
      var orbLabels = { red_spin:'RED SPIN', pick_choose:'PICK & CHOOSE', hold_spin:'HOLD & SPIN' };
      var thisPrize = prizes[i];
      orb.innerHTML = '<div class="orb-glow"></div><div class="orb-inner"><div class="orb-icon">' + (orbIcons[thisPrize] || '?') + '</div><div class="orb-label">' + (orbLabels[thisPrize] || 'TAP') + '</div></div>';
      (function(idx) {
        orb.addEventListener('click', function() {
          if (_orbTapCallback) {
            var cb = _orbTapCallback;
            _orbTapCallback = null;
            cb(idx);
          }
        });
      })(i);
      container.appendChild(orb);
      // Stagger animation
      (function(el, delay_ms) {
        setTimeout(function() { el.classList.add('orb-in'); }, delay_ms);
      })(orb, i * 400);
    }

    screen.style.display = 'flex';
    setControlsEnabled(false);
    await delay(1600);
  }

  async function revealBonusOrbs(prizes, winPosition, chosenIdx) {
    var labels = { red_spin:'RED SPIN', pick_choose:'PICK & CHOOSE', hold_spin:'HOLD & SPIN' };
    var icons  = { red_spin:'🔴', pick_choose:'⭐', hold_spin:'🪙' };

    for (var i = 0; i < prizes.length; i++) {
      var orb = $('orb-' + i);
      if (!orb) continue;
      var icon  = orb.querySelector('.orb-icon');
      var label = orb.querySelector('.orb-label');
      if (icon)  icon.textContent  = icons[prizes[i]]  || '?';
      if (label) label.textContent = labels[prizes[i]] || prizes[i];
      if (i === winPosition) {
        orb.classList.add('orb-winner');
      } else {
        orb.classList.add('orb-loser');
      }
    }
    await delay(800);
  }

  async function endBonusOrbScreen(winPrize) {
    var labels = { red_spin:'RED SPIN!', pick_choose:'PICK & CHOOSE!', hold_spin:'HOLD & SPIN!' };
    showToast('🎉 ' + (labels[winPrize] || winPrize), 2500);
    Audio.play('win_big');
    await delay(1500);
    var screen = $('bonus-orb-screen');
    if (screen) screen.style.display = 'none';
    setControlsEnabled(true);
  }

  // Show BONUS letter partial win — yellow highlight only, no toast (treat as normal win)
  // Full 5-letter BONUS still triggers orb screen via triggerBonusFeature flag
  function showBonusLetterWin(count, amount, row) {
    // Flash the row — use direct cell styling (visible through red overlay)
    // Canvas paylines are behind the red overlay so we use borders instead
    if (row >= 0 && row <= 2) {
      var flashCells = [];
      for (var col = 0; col < count; col++) {
        var cell = document.getElementById('sc-' + col + '-' + row);
        if (cell) {
          cell.classList.add('win-flash', 'letter-win-flash');
          cell.style.outline = '3px solid #f5d878';
          cell.style.outlineOffset = '-2px';
          flashCells.push(cell);
        }
      }
      setTimeout(function() {
        flashCells.forEach(function(c) {
          c.classList.remove('win-flash', 'letter-win-flash');
          c.style.outline = '';
          c.style.outlineOffset = '';
        });
      }, 1500);
    }
  }

  // ── ADDITIONAL RED SPINS WON ANIMATION ──────────────────────────────────
  async function showAdditionalRedSpinsWon() {
    // Flash "Additional Red Spins Won!" text on screen
    var el = document.getElementById('additional-rs-banner');
    if (!el) return;
    el.style.display = 'flex';
    // Animate in
    el.style.opacity = '0';
    el.style.transform = 'scale(0.7)';
    el.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.22,1,0.36,1)';
    await delay(30);
    el.style.opacity = '1';
    el.style.transform = 'scale(1)';
    await delay(2200); // Hold for player to read
    // Fade out
    el.style.opacity = '0';
    el.style.transform = 'scale(1.1)';
    await delay(350);
    el.style.display = 'none';
    el.style.transition = '';
  }

  // ── HELPERS ───────────────────────────────────────────────────────────
  function setControlsEnabled(enabled) {
    ['spin-btn','bet-up','bet-down','max-bet-btn','auto-btn'].forEach(id => {
      const el = $(id); if (el) el.disabled = !enabled;
    });
    document.querySelectorAll('.line-btn,.bet-btn').forEach(btn => {
      btn.style.pointerEvents = enabled ? '' : 'none';
      btn.style.opacity = enabled ? '' : '0.45';
    });
  }

  function showToast(msg, dur=2500) {
    const t = $('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), dur);
  }

  function showMessage(msg) { showToast(msg); }

  function onSpinStart() {
    clearPaylines(); clearHighlights(); updateWinDisplay(0);
    updateBalance(GameState.balance); // FIX: show deducted balance immediately on button press
    reelEls.forEach(r => { if(r) r.classList.add('spinning'); });
  }

  function onSpinComplete() {
    reelEls.forEach(r => { if(r) r.classList.remove('spinning'); });
    updateBalance(GameState.balance);
    updateJackpotMeters();
  }

  function showReplayBanner(gameNum, time) {
    const b=$('replay-banner'), wm=$('replay-watermark');
    if(b){ b.textContent=`🔄 AUDIT REPLAY — GAME #${gameNum} — ${time}`; b.classList.add('active'); }
    if(wm) wm.style.display='flex';
  }

  function showReplaySummary(summary) {
    showToast('REPLAY: Bet $' + ((summary&&summary.totalBet)?summary.totalBet.toFixed(2):'0') + ' | Won $' + ((summary&&summary.totalWon)?summary.totalWon.toFixed(2):'0'), 4000);
    setTimeout(()=>{
      var _rb=$('replay-banner'); if(_rb) _rb.classList.remove('active');
      const wm=$('replay-watermark'); if(wm) wm.style.display='none';
    }, 4300);
  }

  // ── INSERT CASH TO PLAY TICKER ────────────────────────────────────────
  let _insertCashTickerInterval = null;

  function _startInsertCashTicker() {
    if (_insertCashTickerInterval) return; // already running
    const el = $('reels-insert-msg');
    if (!el) return;
    function showMsg() {
      if (GameState.balance > 0) { _stopInsertCashTicker(); return; }
      el.classList.add('visible');
      setTimeout(() => el.classList.remove('visible'), 2000);
    }
    showMsg();
    _insertCashTickerInterval = setInterval(showMsg, 5000);
  }

  function _stopInsertCashTicker() {
    if (_insertCashTickerInterval) { clearInterval(_insertCashTickerInterval); _insertCashTickerInterval = null; }
    const el = $('reels-insert-msg');
    if (el) el.classList.remove('visible');
  }

  // ── RED SCREEN CONTROL ───────────────────────────────────────────────
  function flashReelRed() {
    // Alias kept for compatibility
    activateRedScreen();
  }

  function activateRedScreen() {
    const frame   = $('reel-frame');
    const overlay = $('red-reel-overlay');
    if (frame)   frame.classList.add('red-active');
    if (overlay) overlay.classList.add('active');
    var _btb=$('bonus-total-box'); if(_btb) _btb.classList.add('visible');
  }

  function deactivateRedScreen() {
    var _rro=$('red-reel-overlay'); if(_rro) _rro.classList.remove('active');
    var _rf=$('reel-frame'); if(_rf) _rf.classList.remove('red-active');
    var _btbr=$('bonus-total-box'); if(_btbr) _btbr.classList.remove('visible');
  }

  // ── END RED SPIN IMMEDIATELY (no delay) ──────────────────────────────
  function endRedSpinImmediate() {
    // Only deactivate screen and re-enable controls
    // DO NOT touch GameState.spinInProgress here — executeSpin owns that
    deactivateRedScreen();
    setControlsEnabled(true);
  }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  return {
    init, renderGrid, animateReelsStop, showBaseWins,
    updateBalance, updateWinDisplay, updateBetDisplay, updateJackpotMeters,
    startInsertCashTicker: _startInsertCashTicker, stopInsertCashTicker: _stopInsertCashTicker,
    animateCreditCountup,
    get isAnimatingCredits() { return isAnimatingCredits; },
    skipCreditAnimation,
    showRedSpinEntry, updateRedSpinWin, showRedSpinPaylineFlash,
    endRedSpin: endRedSpinBonus, endRedSpinBonus,
    showHoldSpinBoard, animateHoldSpinning, animateCoinLand,
    updateRespinCounter, showBlackoutCelebration, endHoldSpin, updateHoldTotal,
    showPickChooseGrid, revealPickTile, revealAllPickTiles,
    setPickTapCallback, endPickChoose, updatePickMatches, showPickChooseWin,
    showJackpotCelebration, setControlsEnabled,
    showBonusOrbScreen, revealBonusOrbs, endBonusOrbScreen, setOrbTapCallback,
    showBonusLetterWin,
    flashReelRed, activateRedScreen, deactivateRedScreen, endRedSpinImmediate,
    showAdditionalRedSpinsWon,
    showToast, showMessage, onSpinStart, onSpinComplete, clearPaylines,
    showReplayBanner, showReplaySummary,
  };
})();
