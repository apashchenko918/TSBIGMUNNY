'use strict';
/**
 * state.js — The Turrelle Sisters Big Munny
 * Manages all game state and localStorage persistence.
 * Every balance change, jackpot change, and spin result is saved immediately.
 */

const STATE_KEY   = 'turrelleSisters_v1';
const HISTORY_KEY = 'turrelle_game_history'; // Phase L — persistent spin history
const HISTORY_MAX = 10000;                   // max records; fails gracefully if storage full

// ═══════════════════════════════════════════════════════════════════════
// GAME STATE — single source of truth for all mutable game data
// ═══════════════════════════════════════════════════════════════════════
const GameState = {

  // ── Player ────────────────────────────────────────────────────────
  balance:         DEFAULT_BALANCE,
  lastBet:         DEFAULT_BET,
  lastLines:       DEFAULT_LINES,
  lastDenom:       0.05,   // last selected denomination
  lastCreditsPerLine: 1,   // last selected credits per line

  // ── Session flags ─────────────────────────────────────────────────
  spinInProgress:  false,
  activeBonus:     null,   // null | 'RED_SPIN' | 'HOLD_SPIN' | 'PICK_CHOOSE'
  bonusState:      null,   // serialized bonus for resume on reload
  replayMode:      false,

  // ── Progressive jackpots ──────────────────────────────────────────
  jackpots: {
    MINI:  { current: JACKPOT_CONFIG.MINI.seed,  seed: JACKPOT_CONFIG.MINI.seed,  mustHitBy: JACKPOT_CONFIG.MINI.seed  * (JACKPOT_MHB_MULTIPLIERS ? JACKPOT_MHB_MULTIPLIERS.MINI  : 3) },
    MINOR: { current: JACKPOT_CONFIG.MINOR.seed, seed: JACKPOT_CONFIG.MINOR.seed, mustHitBy: JACKPOT_CONFIG.MINOR.seed * (JACKPOT_MHB_MULTIPLIERS ? JACKPOT_MHB_MULTIPLIERS.MINOR : 4) },
    MAJOR: { current: JACKPOT_CONFIG.MAJOR.seed, seed: JACKPOT_CONFIG.MAJOR.seed, mustHitBy: JACKPOT_CONFIG.MAJOR.seed * (JACKPOT_MHB_MULTIPLIERS ? JACKPOT_MHB_MULTIPLIERS.MAJOR : 5) },
    GRAND: { current: JACKPOT_CONFIG.GRAND.seed, seed: JACKPOT_CONFIG.GRAND.seed, mustHitBy: JACKPOT_CONFIG.GRAND.seed * (JACKPOT_MHB_MULTIPLIERS ? JACKPOT_MHB_MULTIPLIERS.GRAND : 6) },
  },

  // ── Session statistics (for live RTP tracker) ─────────────────────
  stats: {
    totalWagered:      0,
    totalWon:          0,
    totalSpins:        0,
    biggestWin:        0,
    biggestWinDetail:  null,
    redSpinCount:      0,
    holdSpinCount:     0,
    pickChooseCount:   0,
    bonusFeatureCount: 0,
    jackpotWins:       { MINI:0, MINOR:0, MAJOR:0, GRAND:0 },
    sessionStart:      Date.now(),
  },

  // ── Operator settings (persist across sessions) ───────────────────
  operator: {
    targetRTP:                TARGET_RTP_DEFAULT,
    holdPercentage:           100 - TARGET_RTP_DEFAULT,
    jackpotContribution:      JACKPOT_CONTRIBUTION_RATE_DEFAULT,
    bonusFrequencyMultiplier: 1.0,
    redSpinContinuance:       RED_SPIN_CONTINUANCE_DEFAULT,
    redSpinFrequency:         RED_SPIN_FREQUENCY_DEFAULT,
    bonusFeatureFrequency:    (typeof BONUS_FEATURE_FREQ_DEFAULT !== 'undefined' ? BONUS_FEATURE_FREQ_DEFAULT : 0.0067),
    maxWinPerSpin:            0,      // 0 = no cap
    startingBalance:          DEFAULT_BALANCE,
    panelOpen:                false,
    comboArmed:               false,
    comboBonus:               'hold_spin',
    comboJP:                  'MINI',
    // Force triggers (reset after use)
    forceFreeSpins:           false,
    forceBonusGame:           false,
    forceBonusFeature:        false,  // Force BONUS letter feature
    forceRedSpin:             false,
    forceJackpot:             'none', // 'none'|'MINI'|'MINOR'|'MAJOR'|'GRAND'
    forceJackpotContext:      'bonus', // 'bonus'|'base'
    forceReelStops:           [null, null, null, null, null],
    disablePickChooseInRedSpin: true,   // P&C cannot trigger during Red Spin (owner-confirmed 2026-05-19)
    disableHoldSpinInRedSpin:   true,   // H&S cannot trigger during Red Spin (owner-confirmed 2026-05-19)
  },

  // ── Event log & replay ────────────────────────────────────────────
  eventLog: {
    allEvents:   [],   // Rolling — max 500 events (FIFO)
    games:       [],   // Last 10 complete games (newest first)
    currentGame: null, // Game being built during active spin
    gameCounter: 0,    // Monotonic game ID counter
  },

  // ── Persistent spin history (Phase L) ─────────────────────────────
  // Stored separately in HISTORY_KEY — survives sessions, up to HISTORY_MAX records
  spinHistory: [],
};

// ═══════════════════════════════════════════════════════════════════════
// PERSISTENCE
// ═══════════════════════════════════════════════════════════════════════

function saveState() {
  try {
    const payload = {
      balance:    GameState.balance,
      lastBet:            GameState.lastBet,
      lastLines:          GameState.lastLines,
      lastDenom:          GameState.lastDenom,
      lastCreditsPerLine: GameState.lastCreditsPerLine,
      jackpots:   GameState.jackpots,
      stats:      GameState.stats,
      operator:   Object.assign({}, GameState.operator, { panelOpen: false }), // Never save panel as open
      eventLog: {
        allEvents:   GameState.eventLog.allEvents,
        games:       GameState.eventLog.games,
        gameCounter: GameState.eventLog.gameCounter,
      },
    };
    localStorage.setItem(STATE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('State save failed:', e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);

    // Restore player state
    if (saved.balance   !== undefined) GameState.balance   = saved.balance;
    if (saved.lastBet            !== undefined) GameState.lastBet            = saved.lastBet;
    if (saved.lastLines          !== undefined) GameState.lastLines          = saved.lastLines;
    if (saved.lastDenom          !== undefined) GameState.lastDenom          = saved.lastDenom;
    if (saved.lastCreditsPerLine !== undefined) GameState.lastCreditsPerLine = saved.lastCreditsPerLine;

    // Restore jackpots (critical — must survive reload)
    // Note: seeds are re-applied from denom table after load in initGame()
    if (saved.jackpots) {
      Object.keys(GameState.jackpots).forEach(function(key) {
        if (saved.jackpots[key]) {
          GameState.jackpots[key].current    = saved.jackpots[key].current;
          GameState.jackpots[key].seed       = saved.jackpots[key].seed;
          // Restore mustHitBy if saved; otherwise recalc from seed
          if (saved.jackpots[key].mustHitBy != null) {
            GameState.jackpots[key].mustHitBy = saved.jackpots[key].mustHitBy;
          } else {
            var mhbMult = JACKPOT_MHB_MULTIPLIERS ? (JACKPOT_MHB_MULTIPLIERS[key] || 4) : 4;
            GameState.jackpots[key].mustHitBy = GameState.jackpots[key].seed * mhbMult;
          }
        }
      });
    }

    // Restore stats
    if (saved.stats) Object.assign(GameState.stats, saved.stats);

    // Restore operator settings
    if (saved.operator) Object.assign(GameState.operator, saved.operator);

    // Restore event log
    if (saved.eventLog) {
      if (saved.eventLog.allEvents)   GameState.eventLog.allEvents   = saved.eventLog.allEvents;
      if (saved.eventLog.games)       GameState.eventLog.games       = saved.eventLog.games;
      if (saved.eventLog.gameCounter) GameState.eventLog.gameCounter = saved.eventLog.gameCounter;
    }

    loadSpinHistory(); // Phase L — load persistent spin history separately
    GameState.stats.sessionStart = Date.now(); // Always reset session timer on page load
    console.log('[State] Restored — Balance: $' + GameState.balance.toFixed(2));
    return true;
  } catch (e) {
    console.warn('State load failed:', e);
    return false;
  }
}

function resetState(options) {
  if (options === undefined) options = {};
  var keepJackpots = (options.keepJackpots !== undefined) ? options.keepJackpots : false;
  var keepStats    = (options.keepStats    !== undefined) ? options.keepStats    : false;
  var keepOperator = (options.keepOperator !== undefined) ? options.keepOperator : true;
  var newBalance   = (options.newBalance   !== undefined) ? options.newBalance   : GameState.operator.startingBalance;

  GameState.balance   = newBalance;
  GameState.lastBet   = DEFAULT_BET;
  GameState.lastLines = DEFAULT_LINES;
  GameState.spinInProgress = false;
  GameState.activeBonus    = null;
  GameState.bonusState     = null;

  if (!keepJackpots) {
    Object.keys(GameState.jackpots).forEach(function(key) {
      GameState.jackpots[key].current = GameState.jackpots[key].seed;
    });
  }

  if (!keepStats) {
    GameState.stats = {
      totalWagered: 0, totalWon: 0, totalSpins: 0,
      biggestWin: 0, biggestWinDetail: null,
      redSpinCount: 0, holdSpinCount: 0, pickChooseCount: 0, bonusFeatureCount: 0,
      jackpotWins: { MINI:0, MINOR:0, MAJOR:0, GRAND:0 },
      sessionStart: Date.now(),
    };
    clearSpinHistory(); // Full reset also clears audit history
  }

  GameState.eventLog = {
    allEvents: [], games: [],
    currentGame: null, gameCounter: 0,
  };

  if (!keepOperator) {
    GameState.operator.targetRTP = TARGET_RTP_DEFAULT;
    GameState.operator.holdPercentage = 100 - TARGET_RTP_DEFAULT;
    GameState.operator.jackpotContribution = JACKPOT_CONTRIBUTION_RATE_DEFAULT;
    GameState.operator.bonusFrequencyMultiplier = 1.0;
    GameState.operator.redSpinContinuance = RED_SPIN_CONTINUANCE_DEFAULT;
    GameState.operator.maxWinPerSpin = 0;
  }

  saveState();
}

// Reset only jackpots (operator panel action)
function resetJackpotValues() {
  Object.keys(GameState.jackpots).forEach(function(key) {
    GameState.jackpots[key].current = GameState.jackpots[key].seed;
  });
  saveState();
}

function resetSingleJackpot(key) {
  if (GameState.jackpots[key]) {
    GameState.jackpots[key].current = GameState.jackpots[key].seed;
    saveState();
  }
}

// ═══════════════════════════════════════════════════════════════════════
// JACKPOT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

function contributeToJackpots(totalBet) {
  const rate = GameState.operator.jackpotContribution;
  const pool = totalBet * rate;
  Object.keys(GameState.jackpots).forEach(function(key) {
    GameState.jackpots[key].current += pool * JACKPOT_SPLIT[key];
  });
  saveState();
}

function awardJackpot(key) {
  const amount = GameState.jackpots[key].current;
  GameState.balance += amount;
  // NOTE: do NOT add to stats.totalWon here — recordSpin() is the single point of truth.
  // Adding here AND in recordSpin caused every jackpot to be double-counted in RTP stats.
  GameState.stats.jackpotWins[key]++;
  resetSingleJackpot(key);
  saveState();
  return amount;
}

// ═══════════════════════════════════════════════════════════════════════
// EVENT LOGGING
// ═══════════════════════════════════════════════════════════════════════

function formatTimestamp(ts) {
  const d = new Date(ts);
  return d.toLocaleString('en-US', {
    month:'2-digit', day:'2-digit', year:'2-digit',
    hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false,
  });
}

function startGameRecord(bet) {
  const g = GameState.eventLog;
  g.gameCounter++;
  g.currentGame = {
    gameId:        'game_' + String(g.gameCounter).padStart(4,'0'),
    gameNumber:    g.gameCounter,
    timestamp:     Date.now(),
    timeFormatted: formatTimestamp(Date.now()),
    bet:           { perLine: bet.perLine, lines: bet.lines, total: bet.total },
    reelStops:     null,
    grid:          null,
    baseResult:    null,
    bonuses:       [],
    summary:       null,
  };
}

function logEvent(type, data) {
  if (data === undefined) data = {};
  var g   = GameState.eventLog;
  var now = Date.now();
  var evt = {
    id:            'evt_' + now + '_' + g.allEvents.length,
    type:          type,
    timestamp:     now,
    timeFormatted: formatTimestamp(now),
    gameId:        (g.currentGame && g.currentGame.gameId) ? g.currentGame.gameId : 'system',
  };
  Object.assign(evt, data);

  g.allEvents.push(evt);
  if (g.allEvents.length > 500) g.allEvents.shift();

  return evt;
}

function finalizeGameRecord(summary) {
  const g    = GameState.eventLog;
  const game = g.currentGame;
  if (!game) return;

  game.summary = summary;
  g.games.unshift(game);          // Newest first
  if (g.games.length > 10) g.games.pop();  // Keep last 10 only
  g.currentGame = null;

  // Phase L — persist to long-term history (separate key, up to 10,000 records)
  recordSpinHistory(game);

  saveState();
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE L — PERSISTENT SPIN HISTORY
// Stored in separate localStorage key (HISTORY_KEY) — never mixed with STATE_KEY.
// recordSpinHistory() is called from finalizeGameRecord() automatically.
// ═══════════════════════════════════════════════════════════════════════

function loadSpinHistory() {
  try {
    var raw = localStorage.getItem(HISTORY_KEY);
    GameState.spinHistory = raw ? JSON.parse(raw) : [];
  } catch(e) {
    console.warn('[History] Load failed:', e);
    GameState.spinHistory = [];
  }
}

function recordSpinHistory(gameRecord) {
  if (!Array.isArray(GameState.spinHistory)) GameState.spinHistory = [];
  GameState.spinHistory.unshift(gameRecord); // newest first
  if (GameState.spinHistory.length > HISTORY_MAX) {
    GameState.spinHistory = GameState.spinHistory.slice(0, HISTORY_MAX);
  }
  // Graceful storage failure — trim until it fits
  var saved = false;
  while (!saved && GameState.spinHistory.length > 0) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(GameState.spinHistory));
      saved = true;
    } catch(e) {
      GameState.spinHistory.pop(); // remove oldest until it fits
    }
  }
}

function clearSpinHistory() {
  GameState.spinHistory = [];
  try { localStorage.removeItem(HISTORY_KEY); } catch(e) {}
}

function exportHistoryCSV() {
  var headers = ['spin','timestamp','denom','cpl','lines','total_bet',
    'center_row','reel_stops','base_win','bonuses','bonus_win',
    'jackpot_type','jackpot_amt','balance_before','balance_after','net'].join(',');
  var rows = (GameState.spinHistory || []).map(function(g) {
    var s  = g.summary || {};
    var br = g.baseResult || {};
    var bonusTypes = (g.bonuses || []).map(function(b){return b.type;}).join('|');
    var bonusWin   = (s.totalWon || 0) - (br.totalWin || 0);
    return [
      g.gameNumber || '',
      g.timeFormatted || '',
      g.denom || '',
      g.creditsPerLine || '',
      (g.bet && g.bet.lines) || '20',
      (g.bet && g.bet.total != null) ? g.bet.total.toFixed(2) : '',
      (g.centerRow || []).join('-'),
      (g.reelStops || []).join('-'),
      (br.totalWin != null) ? br.totalWin.toFixed(2) : '0',
      bonusTypes || 'none',
      bonusWin.toFixed(2),
      g.jackpotType || '',
      (g.jackpotAmt != null) ? g.jackpotAmt.toFixed(2) : '',
      (s.balanceBefore != null) ? s.balanceBefore.toFixed(2) : '',
      (s.balanceAfter != null) ? s.balanceAfter.toFixed(2) : '',
      (s.netResult != null) ? s.netResult.toFixed(2) : ''
    ].map(function(v){ return '"' + String(v).replace(/"/g,'""') + '"'; }).join(',');
  });
  _downloadFile(
    'turrelle_history_' + Date.now() + '.csv',
    [headers].concat(rows).join('\n'),
    'text/csv'
  );
}

function exportHistoryJSON() {
  var data = {
    exportedAt:  formatTimestamp(Date.now()),
    version:     '2.0',
    totalRecords: (GameState.spinHistory || []).length,
    stats:       GameState.stats,
    history:     GameState.spinHistory || [],
  };
  _downloadFile(
    'turrelle_history_' + Date.now() + '.json',
    JSON.stringify(data, null, 2),
    'application/json'
  );
}

// ═══════════════════════════════════════════════════════════════════════
// STATS HELPERS
// ═══════════════════════════════════════════════════════════════════════

function recordSpin(totalBet, totalWon) {
  const s = GameState.stats;
  s.totalSpins++;
  s.totalWagered += totalBet;
  s.totalWon     += totalWon;
  if (totalWon > s.biggestWin) s.biggestWin = totalWon;
  if (!s.sessionStart) s.sessionStart = Date.now();
}

function getActualRTP() {
  const s = GameState.stats;
  if (s.totalWagered === 0) return 0;
  return (s.totalWon / s.totalWagered) * 100;
}

function getSessionDuration() {
  if (!GameState.stats.sessionStart) return '00:00:00';
  const ms   = Date.now() - GameState.stats.sessionStart;
  const h    = Math.floor(ms / 3600000);
  const m    = Math.floor((ms % 3600000) / 60000);
  const sec  = Math.floor((ms % 60000) / 1000);
  return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORT LOG AS FILE
// ═══════════════════════════════════════════════════════════════════════

function exportLogAsCSV() {
  var headers = ['EventID','Type','Timestamp','GameID','BetTotal','TotalWin','NetResult','BalanceAfter','BonusType'];
  var rows = GameState.eventLog.allEvents.map(function(e) {
    var betTotal    = (e.bet && e.bet.total != null) ? e.bet.total : '';
    var totalWin    = (e.totalWin   != null) ? e.totalWin   : '';
    var netResult   = (e.netResult  != null) ? e.netResult  : '';
    var balAfter    = (e.balanceAfter != null) ? e.balanceAfter : '';
    var bonusType   = (e.bonusType  != null) ? e.bonusType  : '';
    return [e.id, e.type, e.timeFormatted, e.gameId, betTotal, totalWin, netResult, balAfter, bonusType]
      .map(function(v) { return '"' + v + '"'; }).join(',');
  });
  _downloadFile('turrelle_log_' + Date.now() + '.csv', [headers.join(',')].concat(rows).join('\n'), 'text/csv');
}

function exportLogAsJSON() {
  var data = {
    exportedAt:  formatTimestamp(Date.now()),
    version:     '1.0',
    stats:       GameState.stats,
    last10Games: GameState.eventLog.games,
    allEvents:   GameState.eventLog.allEvents,
  };
  _downloadFile('turrelle_log_' + Date.now() + '.json', JSON.stringify(data, null, 2), 'application/json');
}

function _downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
