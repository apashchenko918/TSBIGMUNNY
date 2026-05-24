'use strict';
var UI = (function() {
  function $(id) { return document.getElementById(id); }
  var reelEls = [], paylineCanvas = null, paylineCtx = null;
  var pickTapCb = null;
  var _skipCreditAnim = false;
  var isAnimatingCredits = false;

  var PAYLINE_COLORS = ['#ff0','#0ff','#f0f','#0f0','#f80','#08f','#f44','#4f4','#44f','#ff8','#8ff','#f8f','#8f8','#88f','#f88','#4ff','#ff4','#f4f','#4f8','#84f'];

  function init() {
    reelEls = [0,1,2,3,4].map(function(i) { return $('reel-'+i); });
    if (typeof GameState !== 'undefined' && GameState.balance <= 0) _startInsertCashTicker();
    paylineCanvas = $('payline-canvas');
    if (paylineCanvas) paylineCtx = paylineCanvas.getContext('2d');
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
  }

  function resizeCanvas() {
    var frame = $('reel-frame');
    if (!frame || !paylineCanvas) return;
    // Use clientWidth/clientHeight (excludes border) so canvas coords match
    // the CSS pixel space of the cells inside the frame. offsetWidth includes
    // the 3px border on each side, which would create a 1.5% scale mismatch.
    var cw = frame.clientWidth, ch = frame.clientHeight;
    if (cw === 0 || ch === 0) { setTimeout(resizeCanvas, 100); return; }
    if (paylineCanvas.width  !== cw) paylineCanvas.width  = cw;
    if (paylineCanvas.height !== ch) paylineCanvas.height = ch;
  }

  function _roundCoinValue(raw) { return Math.round(raw); }

  function _formatCoinAmt(raw) {
    var v = _roundCoinValue(raw);
    if (v < 1) v = 1;
    if (v >= 1000) return '$' + Math.round(v / 1000) + 'K';
    return '$' + v;
  }

  function _makeCoinSVG(amt, jpLabel) {
    var isJp = !!jpLabel;
    var labelText = isJp ? jpLabel : (amt || '');
    var fontSize  = isJp ? (labelText.length <= 4 ? 32 : 26)
                         : (labelText.length <= 4 ? 40 : labelText.length <= 5 ? 34 : 28);
    var textY     = 104;
    var gradId    = 'lg_cv_' + Math.floor(Math.random() * 99999);
    var gradDef   = isJp ? '' :
      '<linearGradient id="' + gradId + '" x1="0%" y1="0%" x2="0%" y2="100%">' +
        '<stop offset="0%" stop-color="#ffffff"/>' +
        '<stop offset="40%" stop-color="#f5d878"/>' +
        '<stop offset="100%" stop-color="#7a6000"/>' +
      '</linearGradient>';
    var filterId = isJp ? ('tg_cv_' + Math.floor(Math.random() * 99999)) : null;
    var fillVal  = isJp ? 'url(#label_' + jpLabel.toLowerCase() + ')' : '#fff0c0';
    var underline = '<line x1="62" y1="' + (textY + 9) + '" x2="138" y2="' + (textY + 9) + '" stroke="#f5d878" stroke-width="1.2" opacity="0.6"/>';

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">' +
      '<defs>' +
        '<radialGradient id="cvFace" cx="36%" cy="30%" r="68%">' +
          '<stop offset="0%" stop-color="#fffde0"/>' +
          '<stop offset="18%" stop-color="#f9ee80"/>' +
          '<stop offset="45%" stop-color="#d4af37"/>' +
          '<stop offset="72%" stop-color="#b8930a"/>' +
          '<stop offset="100%" stop-color="#7a5c00"/>' +
        '</radialGradient>' +
        '<radialGradient id="cvRim" cx="50%" cy="50%" r="50%">' +
          '<stop offset="0%" stop-color="#c8a820"/>' +
          '<stop offset="100%" stop-color="#5a4000"/>' +
        '</radialGradient>' +
        '<linearGradient id="cvBg" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#1a0d2e"/>' +
          '<stop offset="100%" stop-color="#0a0818"/>' +
        '</linearGradient>' +
        '<linearGradient id="cvFrame" x1="0%" y1="0%" x2="0%" y2="100%">' +
          '<stop offset="0%" stop-color="#fffde0"/>' +
          '<stop offset="50%" stop-color="#d4af37"/>' +
          '<stop offset="100%" stop-color="#7a5c00"/>' +
        '</linearGradient>' +
        '<radialGradient id="cvShine" cx="32%" cy="26%" r="48%">' +
          '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>' +
          '<stop offset="60%" stop-color="#ffffff" stop-opacity="0.08"/>' +
          '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>' +
        '</radialGradient>' +
        '<filter id="cvGlow" x="-20%" y="-20%" width="140%" height="140%">' +
          '<feGaussianBlur stdDeviation="4" result="blur"/>' +
          '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
        '</filter>' +
        (isJp ? ('<filter id="' + filterId + '">' +
          '<feGaussianBlur stdDeviation="2" result="blur"/>' +
          '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
        '</filter>') : '') +
        gradDef +
      '</defs>' +
      '<rect width="200" height="200" rx="18" fill="url(#cvBg)"/>' +
      '<rect x="3" y="3" width="194" height="194" rx="16" fill="none" stroke="url(#cvFrame)" stroke-width="3"/>' +
      '<circle cx="100" cy="100" r="82" fill="#d4af37" opacity="0.12" filter="url(#cvGlow)"/>' +
      '<circle cx="100" cy="100" r="77" fill="url(#cvRim)"/>' +
      '<g stroke="#f0d060" stroke-width="2" opacity="0.5">' +
        '<line x1="100" y1="24" x2="100" y2="30" transform="rotate(0,100,100)"/>' +
        '<line x1="100" y1="24" x2="100" y2="30" transform="rotate(18,100,100)"/>' +
        '<line x1="100" y1="24" x2="100" y2="30" transform="rotate(36,100,100)"/>' +
        '<line x1="100" y1="24" x2="100" y2="30" transform="rotate(54,100,100)"/>' +
        '<line x1="100" y1="24" x2="100" y2="30" transform="rotate(72,100,100)"/>' +
        '<line x1="100" y1="24" x2="100" y2="30" transform="rotate(90,100,100)"/>' +
        '<line x1="100" y1="24" x2="100" y2="30" transform="rotate(108,100,100)"/>' +
        '<line x1="100" y1="24" x2="100" y2="30" transform="rotate(126,100,100)"/>' +
        '<line x1="100" y1="24" x2="100" y2="30" transform="rotate(144,100,100)"/>' +
        '<line x1="100" y1="24" x2="100" y2="30" transform="rotate(162,100,100)"/>' +
        '<line x1="100" y1="24" x2="100" y2="30" transform="rotate(180,100,100)"/>' +
        '<line x1="100" y1="24" x2="100" y2="30" transform="rotate(198,100,100)"/>' +
        '<line x1="100" y1="24" x2="100" y2="30" transform="rotate(216,100,100)"/>' +
        '<line x1="100" y1="24" x2="100" y2="30" transform="rotate(234,100,100)"/>' +
        '<line x1="100" y1="24" x2="100" y2="30" transform="rotate(252,100,100)"/>' +
        '<line x1="100" y1="24" x2="100" y2="30" transform="rotate(270,100,100)"/>' +
        '<line x1="100" y1="24" x2="100" y2="30" transform="rotate(288,100,100)"/>' +
        '<line x1="100" y1="24" x2="100" y2="30" transform="rotate(306,100,100)"/>' +
        '<line x1="100" y1="24" x2="100" y2="30" transform="rotate(324,100,100)"/>' +
        '<line x1="100" y1="24" x2="100" y2="30" transform="rotate(342,100,100)"/>' +
      '</g>' +
      '<circle cx="100" cy="100" r="72" fill="url(#cvFace)"/>' +
      '<circle cx="100" cy="100" r="66" fill="none" stroke="#9a7800" stroke-width="1.8" opacity="0.7"/>' +
      '<circle cx="100" cy="100" r="60" fill="none" stroke="#d4af37" stroke-width="0.8" opacity="0.4"/>' +
      '<circle cx="100" cy="100" r="54" fill="none" stroke="#c8a820" stroke-width="0.6" opacity="0.35"/>' +
      '<ellipse cx="100" cy="104" rx="38" ry="22" fill="#8a6200" opacity="0.18"/>' +
      '<ellipse cx="100" cy="103" rx="36" ry="20" fill="#6a4800" opacity="0.12"/>' +
      '<circle cx="100" cy="100" r="72" fill="url(#cvShine)"/>' +
      '<text x="100" y="' + textY + '" ' +
        'font-family="\'Cinzel\',Georgia,serif" ' +
        'font-size="' + fontSize + '" ' +
        'font-weight="900" ' +
        'text-anchor="middle" ' +
        'letter-spacing="0" ' +
        'stroke="' + (isJp ? 'rgba(0,0,0,0.92)' : '#1a0800') + '" ' +
        'stroke-width="' + (isJp ? '6' : '5') + '" ' +
        'stroke-linejoin="round" ' +
        'paint-order="stroke fill" ' +
        'fill="' + fillVal + '"' +
        (filterId ? ' filter="url(#' + filterId + ')"' : '') + '>' +
        labelText +
      '</text>' +
      underline +
      '<g opacity="0.75"><circle cx="20" cy="20" r="2.5" fill="#d4af37"/>' +
        '<line x1="20" y1="14" x2="20" y2="26" stroke="#d4af37" stroke-width="1.2"/>' +
        '<line x1="14" y1="20" x2="26" y2="20" stroke="#d4af37" stroke-width="1.2"/>' +
      '</g>' +
      '<g opacity="0.5"><circle cx="180" cy="20" r="1.8" fill="#d4af37"/>' +
        '<line x1="180" y1="15" x2="180" y2="25" stroke="#d4af37" stroke-width="1"/>' +
        '<line x1="175" y1="20" x2="185" y2="20" stroke="#d4af37" stroke-width="1"/>' +
      '</g>' +
      '<g opacity="0.5"><circle cx="20" cy="180" r="1.8" fill="#d4af37"/>' +
        '<line x1="20" y1="175" x2="20" y2="185" stroke="#d4af37" stroke-width="1"/>' +
        '<line x1="15" y1="180" x2="25" y2="180" stroke="#d4af37" stroke-width="1"/>' +
      '</g>' +
      '<g opacity="0.4"><circle cx="180" cy="180" r="1.5" fill="#d4af37"/>' +
        '<line x1="180" y1="175" x2="180" y2="185" stroke="#d4af37" stroke-width="0.9"/>' +
        '<line x1="175" y1="180" x2="185" y2="180" stroke="#d4af37" stroke-width="0.9"/>' +
      '</g>' +
    '</svg>';
  }

  function _makeCoinElement(coin) {
    var jpLabel = (coin && coin.isJackpotOrb && coin.jackpotLevel) ? coin.jackpotLevel : null;
    var amt = '';
    if (!jpLabel && coin && coin.value != null) amt = _formatCoinAmt(coin.value);
    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;';
    wrapper.innerHTML = _makeCoinSVG(amt, jpLabel);
    return wrapper;
  }

  function makeSymbolImg(symId) {
    var sym = SYMBOL_BY_ID[symId];
    if (!sym) return null;
    var img = document.createElement('img');
    img.src = sym.file; img.alt = sym.name; img.draggable = false;
    return img;
  }

  function renderGrid(grid) {
    for (var col = 0; col < reelEls.length; col++) {
      var reel = reelEls[col];
      if (!reel) continue;
      var strip = reel.querySelector('.reel-strip');
      if (!strip) {
        strip = document.createElement('div');
        strip.className = 'reel-strip';
        reel.appendChild(strip);
      }
      strip.innerHTML   = '';
      strip.style.transform  = '';
      strip.style.transition = '';
      strip.style.height     = '100%';
      for (var row = 0; row < 3; row++) {
        strip.appendChild(_makeCell(grid[col][row], col, row));
      }
    }
    resizeCanvas();
  }

  var _pendingCoinMap = null;

  function setPendingCoinMap(coinMap) { _pendingCoinMap = coinMap || null; }

  function overlayReelCoinValues(grid, coinMap) {
    var prev = _pendingCoinMap;
    _pendingCoinMap = coinMap;
    renderGrid(grid);
    _pendingCoinMap = prev;
  }

  function clearReelCoinOverlay() {
    var frame = document.getElementById('reel-frame');
    if (!frame) return;
    var layer = frame.querySelector('.reel-coin-overlay-layer');
    if (layer) layer.parentNode.removeChild(layer);
    var banner = frame.querySelector('.hs-win-banner');
    if (banner) banner.parentNode.removeChild(banner);
  }

  function _makeCell(symId, col, row) {
    var cell = document.createElement('div');
    cell.className = 'symbol-cell';
    cell.id = 'sc-' + col + '-' + row;
    if (symId === BONUS_ID && _pendingCoinMap) {
      var pos  = col * 3 + row;
      var coin = _pendingCoinMap[pos];
      if (coin) { cell.appendChild(_makeCoinElement(coin)); return cell; }
    }
    var img = makeSymbolImg(symId);
    if (img) cell.appendChild(img);
    return cell;
  }

  async function animateReelsStop(stops, grid, isReplay, isRedSpin) {
    if (isReplay === undefined) isReplay = false;
    if (isRedSpin === undefined) isRedSpin = false;
    clearPaylines(); clearHighlights();

    var DELAYS = isReplay ? [190,230,270,320,370] : [640,790,940,1090,1240];
    var SPIN   = isReplay ? 155 : 490;

    var promises = reelEls.map(function(reel, col) {
      return new Promise(function(resolve) {
        if (!reel) { resolve(); return; }
        setTimeout(function() {
          var strip = reel.querySelector('.reel-strip');
          if (!strip) { reel.style.filter = ''; resolve(); return; }

          var reelStrip = REEL_STRIPS[col];
          var len       = reelStrip.length;
          var stop      = stops[col];
          var reelH     = reel.offsetHeight || 210;
          var cellH     = Math.floor(reelH / 3);

          strip.style.transition = 'none';
          strip.style.transform  = 'translateY(0)';
          strip.style.height     = 'auto';
          strip.innerHTML        = '';

          for (var i = -15; i < 3; i++) {
            var symId = reelStrip[((stop + i) % len + len) % len];
            var cell  = document.createElement('div');
            cell.className = 'symbol-cell';
            cell.style.cssText = 'height:' + cellH + 'px;flex:none;min-height:unset;';
            var img = makeSymbolImg(symId);
            if (img) cell.appendChild(img);
            strip.appendChild(cell);
          }

          strip.style.transform = 'translateY(0)';

          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              strip.style.transition = 'transform ' + SPIN + 'ms cubic-bezier(0.15,0.75,0.35,1)';
              strip.style.transform  = 'translateY(' + (-15 * cellH) + 'px)';

              setTimeout(function() {
                reel.style.transition  = '';
                strip.style.transition = 'none';
                strip.style.transform  = '';
                strip.style.height     = '100%';
                strip.innerHTML        = '';

                for (var row = 0; row < 3; row++) {
                  strip.appendChild(_makeCell(grid[col][row], col, row));
                }

                strip.style.transform = 'translateY(-5px)';
                setTimeout(function() {
                  strip.style.transition = 'transform 0.11s ease-out';
                  strip.style.transform  = 'translateY(2px)';
                  setTimeout(function() {
                    strip.style.transition = 'transform 0.08s ease-in';
                    strip.style.transform  = '';
                    if (!isReplay && !isRedSpin) Audio.play('reel_stop');
                    resolve();
                  }, 75);
                }, isRedSpin ? 55 : 105);

              }, SPIN + 25);
            });
          });
        }, DELAYS[col]);
      });
    });

    await Promise.all(promises);
    resizeCanvas();
  }

  async function showRedSpinPaylineFlash(paylineWins) {
    if (!paylineWins || paylineWins.length === 0) return;
    clearPaylines();
    for (var wi = 0; wi < paylineWins.length; wi++) {
      drawPayline(paylineWins[wi].lineIndex, paylineWins[wi].line, paylineWins[wi].isLetter);
      flashCells(paylineWins[wi].line, paylineWins[wi].count);
    }
    await delay(500);
    clearPaylines();
    clearHighlights();
  }

  function _skipRequested() {
    try { return typeof getSkipPaylineAnimations !== 'undefined' && getSkipPaylineAnimations(); }
    catch(e) { return false; }
  }

  async function showBaseWins(result, betPerLine, linesActive, isReplay, fast) {
    if (isReplay === undefined) isReplay = false;
    if (fast === undefined) fast = false;
    if (!isReplay && _skipRequested()) { clearPaylines(); clearHighlights(); return; }
    var wins = result.paylineWins || [];
    if (!wins.length && !result.scatterWin) return;

    // ── Phase 1: Show all wins simultaneously ────────────────────────
    if (!_skipRequested()) {
      for (var wi = 0; wi < wins.length; wi++) {
        drawPayline(wins[wi].lineIndex, wins[wi].line, wins[wi].isLetter);
        flashCells(wins[wi].line, wins[wi].count);
      }
      if (result.scatterWin) flashScatters();
      updateWinDisplay(result.totalWin);
      var p1 = fast ? 350 : isReplay ? 500 : 800;
      for (var i1 = 0; i1 < 4; i1++) {
        if (!isReplay && _skipRequested()) { clearPaylines(); clearHighlights(); return; }
        await delay(Math.ceil(p1 / 4));
      }
      clearPaylines(); clearHighlights();
    }

    if (fast || isReplay) {
      // Bonus triggered or replay — one-shot only, don't loop
      if (fast) return;
      // Replay: brief individual cycle
      var sortedR = wins.slice().sort(function(a, b) { return a.amount - b.amount; });
      for (var ri = 0; ri < sortedR.length; ri++) {
        var rw = sortedR[ri];
        if (_skipRequested()) { clearPaylines(); clearHighlights(); return; }
        drawPayline(rw.lineIndex, rw.line, rw.isLetter);
        flashCells(rw.line, rw.count);
        updateWinDisplay(rw.amount);
        for (var rj = 0; rj < 4; rj++) {
          if (_skipRequested()) break;
          await delay(100);
        }
        clearPaylines(); clearHighlights();
      }
      if (!_skipRequested()) updateWinDisplay(result.totalWin);
      return;
    }

    // ── Phase 2: LOOP — cycle through wins until player presses spin ─
    // v7.0.3: loops indefinitely so player sees their winning lines clearly.
    // Each iteration: all-at-once flash → cycle each win → repeat.
    // Broken immediately when _skipRequested() (spin button tap).
    var sortedWins = wins.slice().sort(function(a, b) { return a.amount - b.amount; });

    while (!_skipRequested()) {
      // All wins simultaneously (brief flash)
      for (var aw = 0; aw < wins.length; aw++) {
        drawPayline(wins[aw].lineIndex, wins[aw].line, wins[aw].isLetter);
        flashCells(wins[aw].line, wins[aw].count);
      }
      if (result.scatterWin) flashScatters();
      updateWinDisplay(result.totalWin);
      for (var af = 0; af < 4; af++) {
        if (_skipRequested()) break;
        await delay(130);
      }
      clearPaylines(); clearHighlights();
      if (_skipRequested()) break;

      // Cycle each win individually
      for (var si = 0; si < sortedWins.length; si++) {
        if (_skipRequested()) break;
        var win = sortedWins[si];
        drawPayline(win.lineIndex, win.line, win.isLetter);
        flashCells(win.line, win.count);
        updateWinDisplay(win.amount);
        for (var ii = 0; ii < 4; ii++) {
          if (_skipRequested()) break;
          await delay(110); // 440ms per win — responsive to skip tap
        }
        clearPaylines(); clearHighlights();
      }

      if (result.scatterWin && !_skipRequested()) {
        flashScatters();
        updateWinDisplay(result.scatterWin);
        for (var sf = 0; sf < 3; sf++) {
          if (_skipRequested()) break;
          await delay(130);
        }
        clearPaylines(); clearHighlights();
      }
    }

    clearPaylines(); clearHighlights();
    updateWinDisplay(result.totalWin);
  }

  function drawPayline(lineIndex, line, isLetter) {
    if (!paylineCtx || !line) return;
    resizeCanvas();
    if (!paylineCanvas || paylineCanvas.width === 0) return;

    // v7.0.2 FIX: use getBoundingClientRect on the actual sc-col-row cell elements
    // instead of arithmetic (frame.offsetWidth/5). The arithmetic ignored #reels
    // padding:4px and gap:3px between reels, causing lines to miss cell centers.
    // Canvas coordinate space matches clientWidth/clientHeight (after resizeCanvas fix),
    // so subtracting the canvas's own rect gives pixel-accurate canvas coordinates.
    var canvasRect = paylineCanvas.getBoundingClientRect();
    if (!canvasRect || canvasRect.width === 0) return;
    // Scale from CSS pixels to canvas element pixels (should be 1:1 after resizeCanvas fix)
    var scaleX = paylineCanvas.width  / canvasRect.width;
    var scaleY = paylineCanvas.height / canvasRect.height;

    paylineCtx.beginPath();
    var color = isLetter ? '#f5d878' : PAYLINE_COLORS[lineIndex % PAYLINE_COLORS.length];
    paylineCtx.strokeStyle = color;
    paylineCtx.lineWidth   = (isLetter ? 4 : 3) * Math.max(scaleX, scaleY);
    paylineCtx.shadowColor = color;
    paylineCtx.shadowBlur  = (isLetter ? 14 : 10) * Math.max(scaleX, scaleY);
    paylineCtx.lineCap = 'round'; paylineCtx.lineJoin = 'round';

    var firstPt = true;
    for (var col = 0; col < line.length; col++) {
      var row  = line[col];
      var cell = document.getElementById('sc-' + col + '-' + row);
      var x, y;
      if (cell) {
        var cr = cell.getBoundingClientRect();
        x = (cr.left + cr.width  * 0.5 - canvasRect.left) * scaleX;
        y = (cr.top  + cr.height * 0.5 - canvasRect.top)  * scaleY;
      } else {
        // Arithmetic fallback if cell element not found
        var cw = paylineCanvas.width  / 5;
        var ch = paylineCanvas.height / 3;
        x = col * cw + cw * 0.5;
        y = row * ch + ch * 0.5;
      }
      if (firstPt) { paylineCtx.moveTo(x, y); firstPt = false; }
      else          { paylineCtx.lineTo(x, y); }
    }
    paylineCtx.stroke();
    paylineCtx.shadowBlur = 0;
  }

  function flashCells(line, count) {
    for (var col = 0; col < count; col++) {
      var cell = $('sc-' + col + '-' + line[col]);
      if (cell) cell.classList.add('win-flash', 'highlight');
    }
  }

  function flashScatters() {
    var imgs = document.querySelectorAll('.symbol-cell img');
    for (var i = 0; i < imgs.length; i++) {
      if (imgs[i].src.indexOf('lipstick') >= 0) imgs[i].parentElement.classList.add('win-flash', 'highlight');
    }
  }

  var _paylineHighlightTimer = null;
  function showActivePaylines(linesCount) {
    if (_paylineHighlightTimer) { clearTimeout(_paylineHighlightTimer); _paylineHighlightTimer = null; }
    clearPaylines();
    if (!PAYLINES) return;
    var count = Math.min(linesCount, PAYLINES.length);
    for (var i = 0; i < count; i++) drawPayline(i, PAYLINES[i], false);
    _paylineHighlightTimer = setTimeout(function() { clearPaylines(); _paylineHighlightTimer = null; }, 2500);
  }

  function clearPaylines() {
    if (paylineCtx) paylineCtx.clearRect(0, 0, paylineCanvas ? paylineCanvas.width : 0, paylineCanvas ? paylineCanvas.height : 0);
  }

  function clearHighlights() {
    var cells = document.querySelectorAll('.symbol-cell');
    for (var i = 0; i < cells.length; i++) cells[i].classList.remove('win-flash', 'highlight');
  }

  function skipCreditAnimation() {
    _skipCreditAnim = true;
    isAnimatingCredits = false;
    var sb = $('spin-btn'); if (sb) sb.classList.remove('skip-mode');
  }

  async function animateCreditCountup(amount, isRedSpin) {
    if (isRedSpin === undefined) isRedSpin = false;
    if (!isRedSpin) {
      isAnimatingCredits = true;
      _skipCreditAnim = false;
      var sb = $('spin-btn'); if (sb) sb.classList.add('skip-mode');
    }
    var end      = GameState.balance;
    var start    = end - amount;
    var duration = Math.min(1600, Math.max(350, amount * 6));
    var startTime = Date.now();

    while (true) {
      if (!isRedSpin && _skipCreditAnim) { updateBalance(end); break; }
      var progress = Math.min((Date.now() - startTime) / duration, 1);
      var eased    = 1 - Math.pow(1 - progress, 3);
      updateBalance(start + (end - start) * eased);
      Audio.play('coin_drop');
      if (progress >= 1) break;
      await delay(40);
    }

    updateBalance(end);
    if (!isRedSpin) {
      isAnimatingCredits = false;
      _skipCreditAnim = false;
      var sb2 = $('spin-btn'); if (sb2) sb2.classList.remove('skip-mode');
    }
  }

  function updateBalance(val) {
    var el = $('balance-val');
    if (el) el.textContent = '$' + (parseFloat(val) || 0).toFixed(2);
    if ((parseFloat(val) || 0) > 0) _stopInsertCashTicker();
    else _startInsertCashTicker();
  }

  function updateWinDisplay(val, lineLabel) {
    if (lineLabel === undefined) lineLabel = null;
    var el = $('win-amount');
    if (!el) return;
    el.textContent = val > 0 ? '$' + val.toFixed(2) : '$0.00';
    var lblEl = $('win-line-label');
    if (lblEl) lblEl.textContent = lineLabel || '';
    if (val > 0) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  }

  function updateBetDisplay(val) {
    var el = $('bet-display');
    if (el) el.textContent = '$' + val.toFixed(2);
  }

  function updateJackpotMeters() {
    var keys = ['MINI','MINOR','MAJOR','GRAND'];
    for (var ji = 0; ji < keys.length; ji++) {
      var key = keys[ji];
      var val = '$' + GameState.jackpots[key].current.toLocaleString('en', {minimumFractionDigits:2, maximumFractionDigits:2});
      var k   = key.toLowerCase();
      var el  = document.querySelector('#jp-' + k + ' .jp-amount');
      if (el) el.textContent = val;
      var holdEl = $('hold-jp-' + k);
      if (holdEl) holdEl.textContent = val;
      var pickEl = $('pick-jp-' + k);
      if (pickEl) pickEl.textContent = val;
    }
  }

  async function showRedSpinEntry() {
    var overlay = $('red-reel-overlay');
    var frame   = $('reel-frame');
    if (overlay) overlay.classList.add('active');
    if (frame)   frame.classList.add('red-active');
    var btb = $('bonus-total-box'); if (btb) btb.classList.add('visible');
    var bta = $('bonus-total-amount'); if (bta) bta.textContent = '$0.00';
    setControlsEnabled(false);
    if (overlay) {
      for (var i = 0; i < 3; i++) {
        overlay.style.background = 'rgba(220,0,0,0.72)';
        await delay(100);
        overlay.style.background = '';
        await delay(100);
      }
    }
  }

  async function updateRedSpinWin(winAmount, bonusTotal, spinNum, isReplay) {
    if (isReplay === undefined) isReplay = false;
    updateWinDisplay(winAmount);
    var bt = $('bonus-total-amount');
    if (bt) bt.textContent = '$' + bonusTotal.toFixed(2);
    var btb = $('bonus-total-box'); if (btb) btb.classList.add('visible');
    await delay(isReplay ? 200 : 550);
  }

  async function endRedSpinBonus(total) {
    updateWinDisplay(total);
    updateBalance(GameState.balance);
    showToast('RED SPIN TOTAL: $' + total.toFixed(2), 2000);
    await delay(600);
    deactivateRedScreen();
  }

  function _fillHoldCell(cell, coin) {
    if (!coin) return;
    var displayType = coin.type;
    if (coin.type === 'jackpot' && coin.jackpotLevel) displayType = coin.jackpotLevel.toLowerCase();
    cell.className = 'hold-cell ' + displayType;
    var _jpSvg = {mini:'jp_mini', minor:'jp_minor', major:'jp_major', grand:'jp_grand'};
    if (displayType === 'cash') {
      var cashAmt = _formatCoinAmt(coin.value);
      cell.innerHTML = '<div class="hs-coin-wrap">' + _makeCoinSVG(cashAmt, null) + '</div>';
    } else {
      var coinSrc = _jpSvg[displayType]
        ? 'assets/symbols/' + _jpSvg[displayType] + '.svg'
        : 'assets/symbols/gold_coin.svg';
      var valAmt = coin.value != null ? '$' + Math.round(coin.value) : '';
      cell.innerHTML =
        '<div class="hs-coin-wrap">' +
          '<img src="' + coinSrc + '" class="hs-coin-img" draggable="false">' +
          '<div class="hs-coin-overlay">' +
            '<span class="hs-c-val hs-c-val-jp">' + valAmt + '</span>' +
          '</div>' +
        '</div>';
    }
  }

  async function showHoldSpinBoard(board, respins) {
    var screen = $('hold-screen');
    if (!screen) return;
    _lastRespinVal = respins;
    await triggerHoldSpinExplosion();
    screen.classList.add('active');
    updateJackpotMeters();
    _renderHoldBoard(board);
    updateRespinCounter(respins, true);
    updateHoldTotal(0);
    setControlsEnabled(false);
    await delay(300);
  }

  function _renderHoldBoard(board) {
    var holdBoard = $('hold-board');
    if (!holdBoard) return;
    holdBoard.innerHTML = '';
    for (var i = 0; i < board.length; i++) {
      var cell = document.createElement('div');
      cell.className = 'hold-cell';
      cell.id = 'hcell-' + i;
      if (board[i]) _fillHoldCell(cell, board[i]);
      holdBoard.appendChild(cell);
    }
  }

  async function triggerHoldSpinExplosion() {
    var frame = document.getElementById('reel-frame');
    if (!frame) return;
    frame.classList.add('hs-trigger-shake');
    setTimeout(function() { frame.classList.remove('hs-trigger-shake'); }, 700);
    var rect   = frame.getBoundingClientRect();
    var cx     = rect.left + rect.width  / 2;
    var cy     = rect.top  + rect.height / 2;
    var colors = ['#f5c518','#ffe060','#fff7a0','#d4af37','#ffcc00'];
    for (var pi = 0; pi < 40; pi++) {
      var p      = document.createElement('div');
      p.className = 'hs-burst-particle';
      var angle  = Math.random() * Math.PI * 2;
      var dist   = 60 + Math.random() * 140;
      var size   = 4 + Math.random() * 8;
      var dur    = 0.5 + Math.random() * 0.6;
      var color  = colors[Math.floor(Math.random() * colors.length)];
      p.style.cssText =
        'position:fixed;border-radius:50%;pointer-events:none;z-index:999;' +
        'width:' + size + 'px;height:' + size + 'px;' +
        'background:' + color + ';' +
        'box-shadow:0 0 6px ' + color + ';' +
        'left:' + cx + 'px;top:' + cy + 'px;' +
        'animation:hsBurstOut ' + dur.toFixed(2) + 's ease-out forwards;' +
        '--bx:' + (Math.cos(angle) * dist).toFixed(0) + 'px;' +
        '--by:' + (Math.sin(angle) * dist).toFixed(0) + 'px;';
      document.body.appendChild(p);
      (function(el, ms) { setTimeout(function() { if (el.parentNode) el.remove(); }, ms); })(p, dur * 1000 + 100);
    }
    var flash = document.createElement('div');
    flash.className = 'hs-trigger-flash';
    frame.appendChild(flash);
    setTimeout(function() { if (flash.parentNode) flash.remove(); }, 600);
    await delay(350);
  }

  /* pulseLockedCoins removed v6l52 — per owner: no glow animations in H&S */

  // v7.0.5 — Dynamic belt builder. Called once at H&S start per session.
  // entryJackpot: null | 'MINI'|'MINOR'|'MAJOR'|'GRAND' — awarded tier appears 3× in belt.
  // Other JP tiers appear 0–1× based on random weighted roll (not every session).
  // Belt: 18 slots per pass × 2 passes = 36 scrollable items.
  // JP coins are decorative — they spin past but only award via unified entry check.
  function _buildHSBelt(entryJackpot) {
    var JP_SRCS = {
      MINI:  'assets/symbols/jp_mini.svg',
      MINOR: 'assets/symbols/jp_minor.svg',
      MAJOR: 'assets/symbols/jp_major.svg',
      GRAND: 'assets/symbols/jp_grand.svg',
    };
    var CASH_SRC = 'assets/symbols/gold_coin.svg';
    var SLOTS = 18; // per pass

    // Decide which JP tiers appear in this session's belt (excluding the entry JP)
    // Each non-entry tier has a 25% chance of appearing once
    var guestJPs = [];
    var tiers = ['MINI','MINOR','MAJOR','GRAND'];
    for (var ti = 0; ti < tiers.length; ti++) {
      var t = tiers[ti];
      if (t === entryJackpot) continue; // handled separately
      if (Math.random() < 0.25) guestJPs.push(t);
    }

    // Build the coin list for one pass:
    // 6 CASH + entryJP×3 (if won) + guestJPs×1 each + fill rest with BLANKs
    var items = [];
    // Cash
    for (var c = 0; c < 6; c++) items.push({ type:'cash', src: CASH_SRC });
    // Entry JP — 3 copies if awarded
    if (entryJackpot && JP_SRCS[entryJackpot]) {
      for (var ej = 0; ej < 3; ej++) items.push({ type:'jp', level: entryJackpot, src: JP_SRCS[entryJackpot] });
    }
    // Guest JPs — 1 each
    for (var gi = 0; gi < guestJPs.length; gi++) {
      var gjp = guestJPs[gi];
      items.push({ type:'jp', level: gjp, src: JP_SRCS[gjp] });
    }
    // Fill remaining slots with blanks
    while (items.length < SLOTS) items.push(null);

    // Shuffle positions
    for (var si = items.length - 1; si > 0; si--) {
      var sj = Math.floor(Math.random() * (si + 1));
      var tmp = items[si]; items[si] = items[sj]; items[sj] = tmp;
    }

    return items; // 18 items, used for 2 passes in startHoldSpinning
  }

  // v7.0.5: accepts optional entryJackpot to build the dynamic belt
  function startHoldSpinning(board, respinDisplay, emptyCount, isLastThree, entryJackpot) {
    var isNearMiss = (respinDisplay === 1);
    var isAnticip  = (emptyCount != null && emptyCount <= 2);
    var lastThree  = !!isLastThree;

    // Build one shared belt for this respin (all cells use same composition)
    var beltItems = _buildHSBelt(entryJackpot || null);

    for (var i = 0; i < board.length; i++) {
      if (board[i] !== null) continue;
      var cell = $('hcell-' + i);
      if (!cell) continue;

      cell.innerHTML = '';
      cell.classList.remove('spinning-cell', 'near-miss', 'anticipation', 'last-three', 'decelerating');

      var strip = document.createElement('div');
      strip.className = 'hs-reel-strip';

      var baseDur = 2.4 + Math.random() * 0.8;
      var nmDur   = 4.5 + Math.random() * 1.5;
      var antDur  = 1.3 + Math.random() * 0.5;
      var ltDur   = 3.2 + Math.random() * 1.0;
      var offset  = -(Math.random() * baseDur);
      strip.style.setProperty('--reel-dur',     baseDur.toFixed(2) + 's');
      strip.style.setProperty('--reel-dur-nm',  nmDur.toFixed(2)   + 's');
      strip.style.setProperty('--reel-dur-ant', antDur.toFixed(2)  + 's');
      strip.style.setProperty('--reel-dur-lt',  ltDur.toFixed(2)   + 's');
      strip.style.setProperty('--reel-offset',  offset.toFixed(2)  + 's');

      if (lastThree)       strip.classList.add('last-three');
      else if (isAnticip)  strip.classList.add('anticipation');
      else if (isNearMiss) strip.classList.add('near-miss');

      // 2 passes of the 18-slot belt
      for (var pass = 0; pass < 2; pass++) {
        for (var ri = 0; ri < beltItems.length; ri++) {
          var def  = beltItems[ri];
          var disc = document.createElement('div');
          disc.className = def ? 'hs-reel-coin' : 'hs-reel-blank';
          if (def) {
            var img = document.createElement('img');
            img.src = def.src;
            img.className = 'hs-reel-coin-img';
            img.draggable = false;
            disc.appendChild(img);
          }
          strip.appendChild(disc);
        }
      }

      cell.appendChild(strip);
      cell.classList.add('spinning-cell');
      if (lastThree)       cell.classList.add('last-three');
      else if (isAnticip)  cell.classList.add('anticipation');
      else if (isNearMiss) cell.classList.add('near-miss');
    }
  }

  // v7.0.5: decelerate then stop — strips slow to near-halt over 500ms before being removed.
  // Replaces the instant clearHoldSpinning() wipe that made coins appear to drop after a dead stop.
  function decelerateHoldSpinning(onDecelerationComplete) {
    var strips = document.querySelectorAll('#hold-board .hold-cell.spinning-cell .hs-reel-strip');
    for (var i = 0; i < strips.length; i++) {
      strips[i].classList.add('decelerating');
    }
    setTimeout(function() {
      clearHoldSpinning();
      if (typeof onDecelerationComplete === 'function') onDecelerationComplete();
    }, 500);
  }

  function clearHoldSpinning() {
    var cells = document.querySelectorAll('#hold-board .hold-cell.spinning-cell');
    for (var i = 0; i < cells.length; i++) {
      cells[i].classList.remove('spinning-cell', 'near-miss', 'anticipation', 'last-three', 'decelerating');
      cells[i].innerHTML = '';
    }
  }

  async function animateHoldSpinning(board, durationMs, respinDisplay, emptyCount, isLastThree) {
    if (durationMs === undefined) durationMs = 480;
    startHoldSpinning(board, respinDisplay, emptyCount, isLastThree);
    await delay(durationMs);
    clearHoldSpinning();
  }

  async function animateCoinLand(pos, coin, isReplay, coinNumber, boardRunningTotal) {
    if (isReplay === undefined) isReplay = false;
    if (coinNumber === undefined) coinNumber = 0;
    var cell = $('hcell-' + pos);
    if (!cell) return;
    cell.classList.remove('spinning-cell', 'near-miss', 'anticipation', 'last-three', 'decelerating');

    if (isReplay) {
      _fillHoldCell(cell, coin);
      updateHoldTotal(_calcBoardTotal());
      return;
    }

    var isSixthCoin = (coinNumber === 6);
    var isHighValue = (!coin.isJackpotOrb && coin.value != null && coin.value >= 5);

    _fillHoldCell(cell, coin);

    // v7.0.5 FIX — double-rAF guarantees the browser paints the initial position
    // before the fall animation starts. await delay(30) was insufficient on Android.
    var coinWrap = cell.querySelector('.hs-coin-wrap');
    if (coinWrap) {
      coinWrap.style.transform = isSixthCoin
        ? 'translateY(-220px) rotateY(0deg) scale(0.4)'
        : 'translateY(-160px) rotateY(0deg) scale(0.5)';
      coinWrap.style.opacity   = '0';
      coinWrap.style.animation = 'none';
    }

    await new Promise(function(resolve) {
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          // Second rAF: browser has committed the start-position paint
          if (coinWrap) {
            coinWrap.style.transform = '';
            coinWrap.style.opacity   = '';
            coinWrap.style.animation = '';
          }
          if (isSixthCoin) cell.classList.add('coin-slamming');
          else             cell.classList.add('coin-dropping');
          resolve();
        });
      });
    });

    // v7.0.5 FIX — audio fires at CSS animation impact point, not at a fixed delay.
    // coinFall (600ms): impact at 55% = 330ms
    // coinSlam6 (880ms): impact at 58% = 510ms
    var impactMs = isSixthCoin ? 510 : 330;
    setTimeout(function() {
      if (typeof Audio !== 'undefined' && Audio.play) {
        if (isSixthCoin)                             Audio.play('hold_spin_coin_slam');
        else if (coinNumber >= 1 && coinNumber <= 5) Audio.play('hold_spin_coin_chime');
        else                                         Audio.play('hold_spin_land');
      }

      cell.classList.remove('coin-dropping', 'coin-slamming');
      cell.classList.add('coin-dropped');

      if (boardRunningTotal !== undefined) updateHoldTotal(boardRunningTotal);
      else                                updateHoldTotal(_calcBoardTotal());

      if (isSixthCoin) _spawnLightningBurst(cell);

      var angles  = isSixthCoin ? [0,40,80,120,160,200,240,280,320]
                  : isHighValue ? [0,45,90,135,180,225,270,315]
                  :               [0,60,120,180,240,300];
      var baseDist = isSixthCoin ? 28 : isHighValue ? 22 : 18;
      for (var ai = 0; ai < angles.length; ai++) {
        var spark = document.createElement('div');
        spark.className = 'coin-sparkle';
        if (isSixthCoin) spark.classList.add('spark-slam');
        var dist = baseDist + Math.random() * 12;
        var rad  = angles[ai] * Math.PI / 180;
        spark.style.setProperty('--sx', (Math.cos(rad) * dist) + 'px');
        spark.style.setProperty('--sy', (Math.sin(rad) * dist) + 'px');
        spark.style.left = '50%'; spark.style.top = '50%';
        spark.style.marginLeft = '-3px'; spark.style.marginTop = '-3px';
        cell.appendChild(spark);
        (function(el, ms) { setTimeout(function() { if (el.parentNode) el.remove(); }, ms); })(spark, isSixthCoin ? 650 : 400);
      }

      setTimeout(function() {
        cell.classList.remove('coin-dropped');
        var cw = cell.querySelector('.hs-coin-wrap');
        if (cw) cw.classList.add('idle-spin');
      }, 420);

    }, impactMs);

    await delay(isSixthCoin ? 1200 : 950);
  }

  function _spawnLightningBurst(cell) {
    var angles = [0,45,90,135,180,225,270,315];
    for (var i = 0; i < angles.length; i++) {
      var bolt = document.createElement('div');
      bolt.className = 'hs-lightning-bolt';
      bolt.style.setProperty('--angle', angles[i] + 'deg');
      cell.appendChild(bolt);
      (function(el) { setTimeout(function() { if (el.parentNode) el.remove(); }, 550); })(bolt);
    }
  }

  function _spawnCounterSparks(badge) {
    if (!badge) return;
    var rect = badge.getBoundingClientRect();
    var cx = rect.left + rect.width  / 2;
    var cy = rect.top  + rect.height / 2;
    for (var i = 0; i < 6; i++) {
      var spark = document.createElement('div');
      spark.className = 'counter-spark';
      var rad  = (i * 60) * Math.PI / 180;
      var dist = 28 + Math.random() * 10;
      spark.style.left = (cx + Math.cos(rad) * dist) + 'px';
      spark.style.top  = (cy + Math.sin(rad) * dist) + 'px';
      document.body.appendChild(spark);
      (function(el) { setTimeout(function() { if (el.parentNode) el.remove(); }, 420); })(spark);
    }
  }

  function _calcBoardTotal() {
    var total = 0;
    var cells = document.querySelectorAll('#hold-board .hold-cell');
    for (var i = 0; i < cells.length; i++) {
      var cv = cells[i].querySelector('.hs-c-val');
      var v  = parseFloat(cv ? (cv.textContent || '').replace('$', '') : '0');
      if (!isNaN(v)) total += v;
    }
    return total;
  }

  function updateHoldTotal(val) {
    var el = $('hold-total-val');
    if (el) {
      el.textContent = '$' + Math.round(val);
      el.classList.remove('val-pop');
      void el.offsetWidth;
      el.classList.add('val-pop');
    }
  }

  var _lastRespinVal = 3;
  async function updateRespinCounter(val, skipResetAnim) {
    var el = $('respin-counter');
    if (!el) return;
    var isReset = (!skipResetAnim && val === 3 && _lastRespinVal < 3);
    _lastRespinVal = val;

    var badge = $('respin-badge');
    var label = el.querySelector ? el.querySelector('.respin-label') : null;

    if (badge) {
      badge.textContent = val;
      if (isReset) {
        badge.classList.remove('lightning-reset');
        void badge.offsetWidth;
        badge.classList.add('lightning-reset');
        _spawnCounterSparks(badge);
      }
    }

    var labelText = val === 0 ? 'COLLECTING!' : val === 1 ? 'respin remaining' : 'respins remaining';
    if (label) label.textContent = labelText;
    else       el.textContent    = labelText;

    var col = val <= 1 ? '#ff4040' : val === 2 ? '#ff9900' : '#ffffff';
    el.style.color       = col;
    el.style.borderColor = val <= 1 ? '#ff4040' : val === 2 ? '#ff9900' : '#c8860a';
    if (badge) badge.style.color = col;
  }

  async function flashJackpotCoin(pos, level) {
    var lvl   = level.toLowerCase();
    var meter = document.querySelector('#hold-jp-bar .bonus-jp-meter.' + lvl) ||
                document.querySelector('.bonus-jp-meter.' + lvl);
    if (meter) {
      meter.classList.add('jp-meter-hit');
      setTimeout(function() { meter.classList.remove('jp-meter-hit'); }, 1200);
    }
    var cell = $('hcell-' + pos);
    if (cell) {
      cell.classList.add('jp-cell-flash');
      setTimeout(function() { cell.classList.remove('jp-cell-flash'); }, 800);
    }
    await delay(600);
  }

  async function _hsCollectCoins(board, runningTotal) {
    var total = runningTotal || 0;
    for (var i = 0; i < 15; i++) {
      var coin = board[i];
      if (!coin) continue;
      var cell    = $('hcell-' + i);
      if (!cell) continue;
      var totalEl = $('hold-total-val');
      if (totalEl && cell) {
        var cRect = cell.getBoundingClientRect();
        var tRect = totalEl.getBoundingClientRect();
        var trail = document.createElement('div');
        trail.className = 'hs-collect-trail';
        var cx = cRect.left + cRect.width  / 2;
        var cy = cRect.top  + cRect.height / 2;
        var tx = tRect.left + tRect.width  / 2;
        var ty = tRect.top  + tRect.height / 2;
        trail.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;--tx:' + (tx - cx) + 'px;--ty:' + (ty - cy) + 'px;';
        document.body.appendChild(trail);
        (function(el) { setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 700); })(trail);
      }
      cell.classList.add('coin-collected');
      var coinVal = (coin.value != null) ? coin.value : 0;
      total += coinVal;
      updateHoldTotal(total);
      await delay(320);
    }
    return total;
  }

  var _dismissHoldBonusWin = null;

  async function showHoldBonusWinScreen(totalWon) {
    var overlay = $('hs-bonus-win-overlay');
    if (!overlay) return;
    var amtEl = overlay.querySelector ? overlay.querySelector('#hs-bonus-win-amt') : null;
    if (amtEl) amtEl.textContent = '$' + totalWon.toFixed(2);
    var rain = $('hs-coin-rain');
    if (rain) {
      rain.innerHTML = '';
      for (var ci = 0; ci < 40; ci++) {
        var coinEl = document.createElement('div');
        coinEl.className = 'hs-rain-coin';
        coinEl.style.cssText =
          'left:' + (Math.random() * 100) + '%;' +
          'animation-delay:' + (Math.random() * 2.5) + 's;' +
          'animation-duration:' + (1.4 + Math.random() * 1.4) + 's;';
        rain.appendChild(coinEl);
      }
    }
    overlay.classList.add('active');
    await delay(200);
    await new Promise(function(resolve) {
      var done = false;
      function dismiss() { if (!done) { done = true; clearTimeout(timer); resolve(); } }
      var timer = setTimeout(dismiss, 4000);
      _dismissHoldBonusWin = dismiss;
      overlay.addEventListener('click', function handler() {
        dismiss();
        overlay.removeEventListener('click', handler);
      }, { once: true });
    });
    _dismissHoldBonusWin = null;
    overlay.classList.remove('active');
    if (rain) rain.innerHTML = '';
  }

  async function showRedSpinEndCelebration(bonusTotal, spinNum) {
    var overlay = document.getElementById('rs-bonus-win-overlay');
    if (!overlay) return;
    var amtEl = document.getElementById('rs-bonus-win-amt');
    if (amtEl) amtEl.textContent = '$' + bonusTotal.toFixed(2);
    var spinsEl = document.getElementById('rs-bonus-win-spins');
    if (spinsEl) spinsEl.textContent = spinNum + (spinNum === 1 ? ' SPIN' : ' SPINS');
    var rain = document.getElementById('rs-coin-rain');
    if (rain) {
      rain.innerHTML = '';
      for (var ci = 0; ci < 35; ci++) {
        var coinEl = document.createElement('div');
        coinEl.className = 'rs-rain-coin';
        coinEl.style.cssText =
          'left:' + (Math.random() * 100) + '%;' +
          'animation-delay:' + (Math.random() * 2.5) + 's;' +
          'animation-duration:' + (1.4 + Math.random() * 1.4) + 's;';
        rain.appendChild(coinEl);
      }
    }
    overlay.classList.add('active');
    await delay(200);
    await new Promise(function(resolve) {
      var done = false;
      var timer = setTimeout(function() { if (!done) { done = true; resolve(); } }, 4000);
      overlay.addEventListener('click', function handler() {
        if (!done) { done = true; clearTimeout(timer); resolve(); }
        overlay.removeEventListener('click', handler);
      }, { once: true });
    });
    overlay.classList.remove('active');
    if (rain) rain.innerHTML = '';
  }

  async function showBlackoutCelebration(amount, wasDouble) {
    if (wasDouble === undefined) wasDouble = false;
    var board = $('hold-board');
    if (board) {
      for (var i = 0; i < 8; i++) {
        board.style.filter = i % 2 === 0 ? 'brightness(2.5) saturate(1.5)' : 'brightness(1)';
        await delay(180);
      }
      board.style.filter = '';
    }
    showToast(wasDouble ? 'DOUBLE GRAND! FULL BOARD!' : 'BLACKOUT! GRAND JACKPOT!', 3000);
  }

  async function endHoldSpin(board, totalWon, isBlackout, restoreStops, restoreGrid) {
    _renderHoldBoard(board);
    updateHoldTotal(0);
    await delay(600);
    await _hsCollectCoins(board, 0);
    await delay(300);
    await showHoldBonusWinScreen(totalWon);
    var hs = $('hold-screen');
    if (hs) hs.classList.remove('active');
    if (restoreStops && restoreGrid) {
      await animateReelsStop(restoreStops, restoreGrid, false, false);
      var coinMap = {};
      for (var pos = 0; pos < 15; pos++) { if (board[pos]) coinMap[pos] = board[pos]; }
      overlayReelCoinValues(restoreGrid, coinMap);
      _showHoldWinBanner(totalWon);
    }
    updateWinDisplay(totalWon);
    await animateCreditCountup(totalWon, false);
    setControlsEnabled(true);
  }

  function _showHoldWinBanner(totalWon) {
    var frame = document.getElementById('reel-frame');
    if (!frame) return;
    var existing = frame.querySelector('.hs-win-banner');
    if (existing) existing.parentNode.removeChild(existing);
    var banner = document.createElement('div');
    banner.className = 'hs-win-banner';
    banner.innerHTML = '<span class="hs-win-banner-label">BONUS WIN</span><span class="hs-win-banner-amt">$' + totalWon.toFixed(2) + '</span>';
    frame.appendChild(banner);
    setTimeout(function() { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 6000);
  }

  function setPickTapCallback(cb) { pickTapCb = cb; }

  async function showPickChooseGrid(size, extraPicks) {
    if (extraPicks === undefined) extraPicks = 0;
    var screen = $('pick-screen');
    if (!screen) return;
    screen.classList.add('active');
    updateJackpotMeters();
    var grid = $('pick-grid');
    if (!grid) return;
    grid.innerHTML = '';
    var matchDiv = $('pick-matches');
    if (matchDiv) matchDiv.textContent = 'Match 3 symbols to win!';

    for (var i = 0; i < size; i++) {
      var tile = document.createElement('div');
      tile.className = 'pick-tile';
      tile.dataset.index = i;
      tile.style.pointerEvents = '';
      tile.style.cursor = '';
      tile.innerHTML = '<div class="tile-back">&#11088;</div><div class="tile-front"></div>';
      (function(t) {
        t.addEventListener('click', function() {
          if (pickTapCb && !t.classList.contains('revealed')) pickTapCb(parseInt(t.dataset.index));
        });
      })(tile);
      grid.appendChild(tile);
    }
    setControlsEnabled(false);
    await delay(300);
  }

  async function revealPickTile(index, prize, isReplay, showValue) {
    if (isReplay === undefined) isReplay = false;
    if (showValue === undefined) showValue = true;
    var tile = document.querySelector('.pick-tile[data-index="' + index + '"]');
    if (!tile) return;
    tile.classList.add('revealed');
    var front = tile.querySelector('.tile-front');
    if (front) {
      var icons  = {cash:'$', red_spin:'RS', hold_spin:'HS', mini:'MINI', minor:'MINOR', major:'MAJOR', grand:'GRAND'};
      var icon   = icons[prize.type] || '?';
      var label  = showValue && prize.type === 'cash' ? '$' + prize.value.toFixed(2) :
                   prize.type === 'cash'      ? '?' :
                   prize.type === 'red_spin'  ? 'RED SPIN' :
                   prize.type === 'hold_spin' ? 'HOLD SPIN' :
                   prize.type.toUpperCase() + ' JP';
      front.innerHTML = '<div style="font-size:17px">' + icon + '</div><div style="color:var(--gold-light);font-size:8px;margin-top:1px">' + label + '</div>';
      front.dataset.prizeType = prize.type;
    }
    await delay(isReplay ? 180 : 260);
  }

  function _lockAllPickTiles() {
    var tiles = document.querySelectorAll('.pick-tile');
    for (var i = 0; i < tiles.length; i++) {
      tiles[i].style.pointerEvents = 'none';
      tiles[i].style.cursor = 'default';
    }
  }

  function updatePickMatches(matchCounts) {
    var el = $('pick-matches');
    if (!el) return;
    var icons = {cash:'$', red_spin:'RS', hold_spin:'HS', mini:'MINI', minor:'MINOR', major:'MAJOR', grand:'GRAND'};
    var parts = [];
    var keys  = Object.keys(matchCounts);
    for (var ki = 0; ki < keys.length; ki++) {
      var type  = keys[ki];
      var count = matchCounts[type];
      if (count > 0) parts.push((icons[type] || type.toUpperCase()) + ' x' + count);
    }
    el.textContent = parts.length > 0 ? parts.join('  |  ') : 'Match 3 symbols to win!';
  }

  async function showPickChooseWin(matchedIndex, prize, totalWon, awardHoldSpin, awardRedSpin, matchCounts) {
    _lockAllPickTiles();
    var type      = prize.type;
    var matchFound = 0;
    var revealed  = document.querySelectorAll('.pick-tile.revealed');
    for (var i = 0; i < revealed.length; i++) {
      var front = revealed[i].querySelector('.tile-front');
      if (!front) continue;
      if (front.dataset.prizeType === type && matchFound < 3) {
        revealed[i].classList.add('match');
        if (type === 'cash' && totalWon > 0) {
          var valDiv = front.querySelectorAll('div')[1];
          if (valDiv) valDiv.textContent = '$' + Math.round(totalWon);
        }
        matchFound++;
      }
    }
    var winText = type === 'cash'      ? 'MATCH! WON $' + Math.round(totalWon) :
                  type === 'red_spin'  ? 'MATCH! RED SPIN BONUS!' :
                  type === 'hold_spin' ? 'MATCH! HOLD & SPIN BONUS!' :
                  'MATCH! ' + type.toUpperCase() + ' JACKPOT!';
    showToast(winText, 3000);
    await delay(2000);
  }

  async function endPickChoose(prize, totalWon, awardHoldSpin, awardRedSpin) {
    await delay(1500);
    var ps = $('pick-screen'); if (ps) ps.classList.remove('active');
    if (totalWon > 0) {
      updateWinDisplay(totalWon);
      await animateCreditCountup(totalWon, false);
    }
    setControlsEnabled(true);
  }

  // ── JACKPOT CELEBRATION — v6l97 redesign ────────────────────────────
  // Flash the relevant jackpot meter panel + ring bell simultaneously.
  // MAJOR/GRAND: also show Cash Out / Continue screen after the flash.
  // MINI/MINOR: meter flash + bell only, auto-dismiss after 3s.
  async function showJackpotCelebration(type, amount, context) {
    var colors = { MINI:'#a8d8ea', MINOR:'#c9f0a0', MAJOR:'#f5d878', GRAND:'#ff6b35' };
    var isMajorPlus = (type === 'MAJOR' || type === 'GRAND');
    var color = colors[type] || '#f5c518';

    // 1. Flash the jackpot meter panel for this tier
    var meterId = 'jp-' + type.toLowerCase();
    var meter   = $(meterId);
    if (meter) {
      meter.classList.add('jp-meter-hit');
      // Red flash: alternate border/background colour 4 times
      var flashCount = 0;
      var flashInterval = setInterval(function() {
        flashCount++;
        meter.style.background = (flashCount % 2 === 1) ? 'rgba(255,0,0,0.65)' : '';
        meter.style.boxShadow  = (flashCount % 2 === 1) ? '0 0 22px rgba(255,0,0,0.9)' : '';
        if (flashCount >= 8) {
          clearInterval(flashInterval);
          meter.style.background = '';
          meter.style.boxShadow  = '';
          meter.classList.remove('jp-meter-hit');
        }
      }, 160);
    }

    // Also flash the H&S / P&C bonus JP meters if visible
    var bonusMeterId = 'hold-jp-' + type.toLowerCase();
    var bonusMeter   = $(bonusMeterId);
    if (bonusMeter) { bonusMeter.classList.add('jp-meter-hit'); setTimeout(function() { bonusMeter.classList.remove('jp-meter-hit'); }, 1400); }

    // 2. Ring the bell — simultaneous with flash
    if (typeof Audio !== 'undefined') {
      Audio.startJackpotBells();
      Audio.play('jackpot_' + type.toLowerCase());
    }

    // 3. MINI/MINOR: auto-dismiss after 3s
    if (!isMajorPlus) {
      await delay(3000);
      if (typeof Audio !== 'undefined') Audio.stopJackpotBells();
      return { action: 'dismiss' };
    }

    // 4. MAJOR/GRAND: show Cash Out / Continue overlay after flash settles
    await delay(640); // let flash run first
    var overlay    = $('jackpot-overlay');
    var sistersImg = $('jackpot-sisters-img');
    var typeEl     = $('jackpot-type-text');
    var amtEl      = $('jackpot-amount-text');
    var actionsEl  = $('jackpot-actions');
    var tapEl      = $('jackpot-tap-hint');

    if (overlay) {
      if (typeEl) { typeEl.textContent = type + ' JACKPOT!'; typeEl.style.color = color; }
      if (amtEl)  amtEl.textContent = '$' + amount.toFixed(2);
      if (sistersImg) {
        sistersImg.src = 'assets/sisters_celebrate.png';
        sistersImg.style.display = 'block';
      }
      if (actionsEl) actionsEl.style.display = 'flex';
      if (tapEl)     tapEl.style.display = 'none';
      overlay.classList.add('active');
    }

    return new Promise(function(resolve) {
      var cashBtn = $('jackpot-cashout-btn');
      var contBtn = $('jackpot-continue-btn');
      function cleanup() {
        if (cashBtn) cashBtn.removeEventListener('click', onCash);
        if (contBtn) contBtn.removeEventListener('click', onCont);
        if (typeof Audio !== 'undefined') Audio.stopJackpotBells();
        if (overlay) overlay.classList.remove('active');
        if (sistersImg) sistersImg.style.display = 'none';
      }
      function onCash() {
        cleanup();
        if (typeof CashOut !== 'undefined' && CashOut.doCashOutAmount) CashOut.doCashOutAmount(amount, type + '_JACKPOT');
        resolve({ action: 'cashout' });
      }
      function onCont() { cleanup(); resolve({ action: 'continue' }); }
      if (cashBtn) cashBtn.addEventListener('click', onCash, { once: true });
      if (contBtn) contBtn.addEventListener('click', onCont, { once: true });
    });
  }

  var _orbTapCallback = null;
  function setOrbTapCallback(cb) { _orbTapCallback = cb; }

  async function showBonusLetterCelebration() {
    var cel = $('bonus-letter-celebrate');
    if (!cel) return;
    var spans = cel.querySelectorAll('.bonus-cel-letter');
    cel.style.display = 'flex';
    for (var li = 0; li < spans.length; li++) {
      spans[li].classList.add('letter-pop');
      Audio.play('reel_stop');
      await delay(220);
    }
    await delay(600);
    cel.classList.add('bonus-cel-pulse');
    await delay(900);
    cel.style.display = 'none';
    cel.classList.remove('bonus-cel-pulse');
    for (var lj = 0; lj < spans.length; lj++) spans[lj].classList.remove('letter-pop');
  }

  async function showBonusOrbScreen(prizes, winPosition) {
    var screen    = $('bonus-orb-screen');
    if (!screen) return;
    var container = $('bonus-orb-container');
    if (!container) return;
    container.innerHTML = '';
    var orbLabels = { red_spin:'RED SPIN', pick_choose:'PICK & CHOOSE', hold_spin:'HOLD & SPIN' };

    for (var i = 0; i < prizes.length; i++) {
      var orb = document.createElement('div');
      orb.className = 'bonus-orb';
      orb.id = 'orb-' + i;
      orb.innerHTML = '<div class="orb-glow"></div><div class="orb-inner"><div class="orb-icon">&#10024;</div><div class="orb-label">PICK ME</div></div>';
      (function(idx) {
        orb.addEventListener('click', function() {
          if (_orbTapCallback) { var cb = _orbTapCallback; _orbTapCallback = null; cb(idx); }
        });
      })(i);
      container.appendChild(orb);
      (function(el, ms) { setTimeout(function() { el.classList.add('orb-in'); }, ms); })(orb, i * 400);
    }

    screen.style.display = 'flex';
    setControlsEnabled(false);
    await delay(1600);
  }

  async function revealBonusOrbs(prizes, winPosition, chosenIdx) {
    var labels = { red_spin:'RED SPIN', pick_choose:'PICK & CHOOSE', hold_spin:'HOLD & SPIN' };
    var icons  = { red_spin:'RS', pick_choose:'PC', hold_spin:'HS' };
    for (var i = 0; i < prizes.length; i++) {
      var orb   = $('orb-' + i);
      if (!orb) continue;
      var icon  = orb.querySelector('.orb-icon');
      var label = orb.querySelector('.orb-label');
      if (icon)  icon.textContent  = icons[prizes[i]]  || '?';
      if (label) label.textContent = labels[prizes[i]] || prizes[i];
      if (i === winPosition) orb.classList.add('orb-winner');
      else                   orb.classList.add('orb-loser');
    }
    await delay(800);
  }

  async function endBonusOrbScreen(winPrize) {
    var labels = { red_spin:'RED SPIN!', pick_choose:'PICK & CHOOSE!', hold_spin:'HOLD & SPIN!' };
    showToast((labels[winPrize] || winPrize), 2500);
    Audio.play('win_big');
    await delay(1500);
    var screen = $('bonus-orb-screen');
    if (screen) screen.style.display = 'none';
    setControlsEnabled(true);
  }

  function showBonusLetterWin(count, amount, row) {
    if (row >= 0 && row <= 2) {
      var flashList = [];
      for (var col = 0; col < count; col++) {
        var cell = document.getElementById('sc-' + col + '-' + row);
        if (cell) {
          var img = cell.querySelector('img');
          var isLetter = img && (
            img.src.indexOf('letter_b') >= 0 || img.src.indexOf('letter_o') >= 0 ||
            img.src.indexOf('letter_n') >= 0 || img.src.indexOf('letter_u') >= 0 ||
            img.src.indexOf('letter_s') >= 0
          );
          if (isLetter) {
            cell.classList.add('win-flash', 'letter-win-flash');
            cell.style.outline = '3px solid #f5d878';
            cell.style.outlineOffset = '-2px';
            flashList.push(cell);
          }
        }
      }
      setTimeout(function() {
        for (var fi = 0; fi < flashList.length; fi++) {
          flashList[fi].classList.remove('win-flash', 'letter-win-flash');
          flashList[fi].style.outline = '';
          flashList[fi].style.outlineOffset = '';
        }
      }, 1500);
    }
  }

  // showAdditionalRedSpinsWon removed v6l106 — 0 callers, pendingRedSpins chain removed v6l97.


  function setControlsEnabled(enabled) {
    var ids = ['spin-btn','bet-up','bet-down','max-bet-btn','auto-btn'];
    for (var i = 0; i < ids.length; i++) {
      var el = $(ids[i]); if (el) el.disabled = !enabled;
    }
    var btns = document.querySelectorAll('.line-btn,.bet-btn');
    for (var j = 0; j < btns.length; j++) {
      btns[j].style.pointerEvents = enabled ? '' : 'none';
      btns[j].style.opacity       = enabled ? '' : '0.45';
    }
  }

  function showToast(msg, dur) {
    if (dur === undefined) dur = 2500;
    var t = $('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, dur);
  }

  function showMessage(msg) { showToast(msg); }

  function onSpinStart() {
    clearPaylines(); clearHighlights(); updateWinDisplay(0);
    updateBalance(GameState.balance);
    for (var i = 0; i < reelEls.length; i++) { if (reelEls[i]) reelEls[i].classList.remove('spinning'); }
    if (_dismissHoldBonusWin) { _dismissHoldBonusWin(); _dismissHoldBonusWin = null; }
    var hbwo = $('hs-bonus-win-overlay');
    if (hbwo) {
      hbwo.classList.remove('active');
      var rain = hbwo.querySelector ? hbwo.querySelector('#hs-coin-rain') : null;
      if (rain) rain.innerHTML = '';
    }
    clearReelCoinOverlay();
  }

  function onSpinComplete() {
    for (var i = 0; i < reelEls.length; i++) { if (reelEls[i]) reelEls[i].classList.remove('spinning'); }
    updateBalance(GameState.balance);
    updateJackpotMeters();
  }

  var _insertCashTickerInterval = null;

  function _startInsertCashTicker() {
    if (_insertCashTickerInterval) return;
    var el = $('reels-insert-msg');
    if (!el) return;
    function showMsg() {
      if (GameState.balance > 0) { _stopInsertCashTicker(); return; }
      el.classList.add('visible');
      setTimeout(function() { el.classList.remove('visible'); }, 2000);
    }
    showMsg();
    _insertCashTickerInterval = setInterval(showMsg, 5000);
  }

  function _stopInsertCashTicker() {
    if (_insertCashTickerInterval) { clearInterval(_insertCashTickerInterval); _insertCashTickerInterval = null; }
    var el = $('reels-insert-msg');
    if (el) el.classList.remove('visible');
  }

  function flashReelRed() { activateRedScreen(); }

  function activateRedScreen() {
    var frame   = $('reel-frame');
    var overlay = $('red-reel-overlay');
    if (frame)   frame.classList.add('red-active');
    if (overlay) overlay.classList.add('active');
    var btb = $('bonus-total-box'); if (btb) btb.classList.add('visible');
  }

  function deactivateRedScreen() {
    var rro = $('red-reel-overlay'); if (rro) rro.classList.remove('active');
    var rf  = $('reel-frame');       if (rf)  rf.classList.remove('red-active');
    var btb = $('bonus-total-box');  if (btb) btb.classList.remove('visible');
  }

  function endRedSpinImmediate() { deactivateRedScreen(); setControlsEnabled(true); }

  function delay(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

  return {
    init: init, renderGrid: renderGrid,
    setPendingCoinMap: setPendingCoinMap, overlayReelCoinValues: overlayReelCoinValues, clearReelCoinOverlay: clearReelCoinOverlay,
    animateReelsStop: animateReelsStop, showBaseWins: showBaseWins,
    triggerHoldSpinExplosion: triggerHoldSpinExplosion,
    updateBalance: updateBalance, updateWinDisplay: updateWinDisplay, updateBetDisplay: updateBetDisplay, updateJackpotMeters: updateJackpotMeters,
    startInsertCashTicker: _startInsertCashTicker, stopInsertCashTicker: _stopInsertCashTicker,
    animateCreditCountup: animateCreditCountup,
    get isAnimatingCredits() { return isAnimatingCredits; },
    skipCreditAnimation: skipCreditAnimation,
    showRedSpinEntry: showRedSpinEntry, updateRedSpinWin: updateRedSpinWin, showRedSpinPaylineFlash: showRedSpinPaylineFlash,
    endRedSpin: endRedSpinBonus, endRedSpinBonus: endRedSpinBonus,
    showHoldSpinBoard: showHoldSpinBoard, animateHoldSpinning: animateHoldSpinning,
    startHoldSpinning: startHoldSpinning, clearHoldSpinning: clearHoldSpinning,
    decelerateHoldSpinning: decelerateHoldSpinning, animateCoinLand: animateCoinLand,
    updateRespinCounter: updateRespinCounter, showBlackoutCelebration: showBlackoutCelebration,
    endHoldSpin: endHoldSpin, updateHoldTotal: updateHoldTotal,
    flashJackpotCoin: flashJackpotCoin, showHoldBonusWinScreen: showHoldBonusWinScreen,
    _spawnLightningBurst: _spawnLightningBurst, _spawnCounterSparks: _spawnCounterSparks,
    showPickChooseGrid: showPickChooseGrid, revealPickTile: revealPickTile, _lockAllPickTiles: _lockAllPickTiles,
    setPickTapCallback: setPickTapCallback, endPickChoose: endPickChoose, updatePickMatches: updatePickMatches, showPickChooseWin: showPickChooseWin,
    showJackpotCelebration: showJackpotCelebration, setControlsEnabled: setControlsEnabled,
    showBonusOrbScreen: showBonusOrbScreen, revealBonusOrbs: revealBonusOrbs, endBonusOrbScreen: endBonusOrbScreen, setOrbTapCallback: setOrbTapCallback,
    showBonusLetterWin: showBonusLetterWin,
    flashReelRed: flashReelRed, activateRedScreen: activateRedScreen, deactivateRedScreen: deactivateRedScreen, endRedSpinImmediate: endRedSpinImmediate,
    showRedSpinEndCelebration: showRedSpinEndCelebration,
    showToast: showToast, showMessage: showMessage, onSpinStart: onSpinStart, onSpinComplete: onSpinComplete,
    clearPaylines: clearPaylines, showActivePaylines: showActivePaylines,
  };
})();
