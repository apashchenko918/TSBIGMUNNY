'use strict';
/**
 * cashout.js — The Turrelle Sisters Big Munny
 * Cash Out / Insert Cash voucher system.
 * Vouchers are stored in localStorage and the event log.
 * NOT redeemable for real cash — entertainment purposes only.
 */

const CashOut = (() => {
  const CASINO_NAME   = 'Lucky Bitches Casino';
  const VOUCHER_KEY   = 'turrelleSisters_vouchers_v1';
  const VOUCHER_PREFIX= 'LBC';

  // These MUST be declared — strict mode throws ReferenceError on undeclared assignment
  let insertCashFlashInterval = null;
  let insertCashFlashTimer    = null;



  // ── VOUCHER STORAGE ────────────────────────────────────────────────
  function loadVouchers() {
    try {
      const raw = localStorage.getItem(VOUCHER_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  }

  function saveVouchers(vouchers) {
    try { localStorage.setItem(VOUCHER_KEY, JSON.stringify(vouchers)); }
    catch(e) { console.warn('[CashOut] Save failed:', e); }
  }

  function generateVoucherId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = VOUCHER_PREFIX + '-';
    for (let i = 0; i < 8; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
      if (i === 3) id += '-';
    }
    return id;
  }

  function formatTimestamp(ts) {
    const d = new Date(ts);
    const pad = n => String(n).padStart(2,'0');
    return `${pad(d.getMonth()+1)}/${pad(d.getDate())}/${String(d.getFullYear()).slice(-2)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  // ── CASH OUT ───────────────────────────────────────────────────────
  function doCashOut() {
    if (GameState.spinInProgress || GameState.activeBonus) {
      UI.showToast('Finish current game before cashing out.');
      return;
    }
    const amount = GameState.balance;
    if (amount <= 0) {
      UI.showToast('No credits to cash out.');
      return;
    }

    // Create voucher
    const voucher = {
      id:        generateVoucherId(),
      serialNumber: typeof _currentSpinSerial !== 'undefined' ? _currentSpinSerial : generateSerialNumber(),
      amount:    Math.round(amount * 100) / 100,
      issuedAt:  Date.now(),
      issuedStr: formatTimestamp(Date.now()),
      status:    'active',
    };

    // Save voucher
    const vouchers = loadVouchers();
    vouchers.unshift(voucher);
    saveVouchers(vouchers);

    // Reset balance
    GameState.balance = 0;
    saveState();

    // Log event
    logEvent('CASH_OUT', {
      bonusType:    'CASH_OUT',
      voucherId:    voucher.id,
      serialNumber: voucher.serialNumber,
      amount:       voucher.amount,
      issuedStr:    voucher.issuedStr,
      balanceAfter: 0,
    });

    if (typeof UI !== 'undefined') UI.updateBalance(0);

    // Show voucher
    showVoucherModal(voucher);

    Audio && Audio.play('credit_sweep');
    // ticker auto-starts via UI.updateBalance(0) above
  }

  // ── CREATE CUSTOM VOUCHER ─────────────────────────────────────────
  function doCreateVoucher() {
    hideWalletModal(); // Close wallet first to avoid z-index stacking
    setTimeout(showCreateVoucherModal, 150); // Brief delay for smooth transition
  }

  function showCreateVoucherModal() {
    const modal = document.getElementById('create-voucher-modal');
    if (modal) modal.classList.add('active');
  }

  function hideCreateVoucherModal() {
    const modal = document.getElementById('create-voucher-modal');
    if (modal) modal.classList.remove('active');
    const input = document.getElementById('cv-amount-input');
    if (input) input.value = '';
  }

  function confirmCreateVoucher() {
    const input = document.getElementById('cv-amount-input');
    if (!input) return;
    const amount = parseFloat(input.value);
    if (isNaN(amount) || amount <= 0) {
      const err = document.getElementById('cv-error');
      if (err) { err.textContent = 'Please enter a valid amount'; err.style.display = 'block'; }
      return;
    }
    const voucher = {
      id:        generateVoucherId(),
      amount:    Math.round(amount * 100) / 100,
      issuedAt:  Date.now(),
      issuedStr: formatTimestamp(Date.now()),
      status:    'active',
    };
    const vouchers = loadVouchers();
    vouchers.unshift(voucher);
    saveVouchers(vouchers);
    logEvent('VOUCHER_CREATED', {
      bonusType: 'VOUCHER_CREATED',
      voucherId: voucher.id,
      amount:    voucher.amount,
    });
    hideCreateVoucherModal();
    // Reopen wallet immediately so player sees and can use the new voucher
    setTimeout(function() {
      var active = loadVouchers().filter(function(v) { return v.status === 'active'; });
      showWalletModal(active);
    }, 180);
    if (typeof UI !== 'undefined') UI.showToast('Voucher $' + voucher.amount.toFixed(2) + ' ready!', 2000);
  }

  // ── JACKPOT CASH OUT ─────────────────────────────────────────────────
  // Called when player taps Cash Out on Major/Grand jackpot lock screen
  function doCashOutAmount(amount, label) {
    var voucher = {
      id:        generateVoucherId(),
      amount:    Math.round(amount * 100) / 100,
      issuedAt:  Date.now(),
      issuedStr: formatTimestamp(Date.now()),
      label:     label || 'JACKPOT',
      status:    'active',
    };
    var vouchers = loadVouchers();
    vouchers.unshift(voucher);
    saveVouchers(vouchers);
    logEvent('JACKPOT_CASHOUT', {
      bonusType:  'JACKPOT_CASHOUT',
      voucherId:  voucher.id,
      amount:     voucher.amount,
      label:      voucher.label,
    });
    if (typeof UI !== 'undefined') UI.showToast('Jackpot voucher $' + voucher.amount.toFixed(2) + ' saved!', 3000);
  }

  // ── INSERT CASH ────────────────────────────────────────────────────
  function doInsertCash() {
    const vouchers = loadVouchers().filter(v => v.status === 'active');
    showWalletModal(vouchers);
  }

  function redeemVoucher(voucherId) {
    const vouchers = loadVouchers();
    const idx = vouchers.findIndex(v => v.id === voucherId && v.status === 'active');
    if (idx < 0) { UI.showToast('Voucher not found or already used.'); return; }

    const voucher = vouchers[idx];
    voucher.status    = 'redeemed';
    voucher.redeemedAt = Date.now();
    saveVouchers(vouchers);

    // Add to balance
    GameState.balance += voucher.amount;
    saveState();

    // Log event
    logEvent('CASH_IN', {
      bonusType:    'CASH_IN',
      voucherId:    voucher.id,
      amount:       voucher.amount,
      redeemedStr:  formatTimestamp(Date.now()),
      balanceAfter: GameState.balance,
    });

    if (typeof UI !== 'undefined') UI.updateBalance(GameState.balance);

    hideWalletModal();
    if (typeof UI !== 'undefined') UI.stopInsertCashTicker();

    UI.showToast(`💳 $${voucher.amount.toFixed(2)} loaded — Good Luck!`, 2500);
    Audio && Audio.play('win_small');
  }

  // ── ZERO BALANCE FLASH ─────────────────────────────────────────────
  function startZeroBalanceFlash() {
    stopZeroBalanceFlash();
    _flashMessage();
    insertCashFlashInterval = setInterval(() => {
      if (GameState.balance <= 0) _flashMessage();
      else stopZeroBalanceFlash();
    }, 5000);
  }

  function _flashMessage() {
    const el = document.getElementById('zero-balance-msg');
    if (!el) return;
    el.classList.add('visible');
    clearTimeout(insertCashFlashTimer);
    insertCashFlashTimer = setTimeout(() => el.classList.remove('visible'), 2500);
  }

  function stopZeroBalanceFlash() {
    clearInterval(insertCashFlashInterval);
    clearTimeout(insertCashFlashTimer);
    const el = document.getElementById('zero-balance-msg');
    if (el) el.classList.remove('visible');
  }

  function checkZeroBalance() {
    if (GameState.balance <= 0) startZeroBalanceFlash();
    else stopZeroBalanceFlash();
  }

  // ── VOUCHER MODAL ──────────────────────────────────────────────────
  function showVoucherModal(voucher) {
    const modal = document.getElementById('voucher-modal');
    if (!modal) return;

    document.getElementById('vm-casino').textContent   = CASINO_NAME;
    document.getElementById('vm-amount').textContent   = '$' + voucher.amount.toFixed(2);
    document.getElementById('vm-id').textContent       = voucher.id;
    document.getElementById('vm-issued').textContent   = voucher.issuedStr;
    const serialEl = document.getElementById('vm-serial');
    if (serialEl) serialEl.textContent = voucher.serialNumber || '---';

    // Generate simple barcode-style visual
    const bars = document.getElementById('vm-barcode');
    if (bars) {
      bars.innerHTML = '';
      const seed = voucher.id.split('').reduce((a,c) => a + c.charCodeAt(0), 0);
      for (let i = 0; i < 40; i++) {
        const bar = document.createElement('div');
        const w = ((seed * (i+7) * 13) % 3) + 1;
        bar.style.cssText = `display:inline-block;width:${w}px;height:40px;background:#000;margin:0 0.5px;vertical-align:top;`;
        bars.appendChild(bar);
      }
    }

    modal.classList.add('active');
  }

  function hideVoucherModal() {
    document.getElementById('voucher-modal')?.classList.remove('active');
  }

  // ── WALLET MODAL ───────────────────────────────────────────────────
  function showWalletModal(vouchers) {
    const modal   = document.getElementById('wallet-modal');
    const listEl  = document.getElementById('wallet-list');
    if (!modal || !listEl) return;

    listEl.innerHTML = '';

    if (vouchers.length === 0) {
      listEl.innerHTML = '<div class="wallet-empty">No vouchers in wallet.<br><span>Cash out during a session to create vouchers.</span></div>';
    } else {
      vouchers.forEach(v => {
        const row = document.createElement('div');
        row.className = 'wallet-row';
        row.innerHTML = `
          <div class="wallet-info">
            <div class="wallet-id">${v.id}</div>
            <div class="wallet-date">${v.issuedStr}</div>
          </div>
          <div class="wallet-amount">$${v.amount.toFixed(2)}</div>
          <button class="wallet-use-btn" onclick="CashOut.redeemVoucher('${v.id}')">INSERT</button>
        `;
        listEl.appendChild(row);
      });
    }

    modal.classList.add('active');
  }

  function hideWalletModal() {
    document.getElementById('wallet-modal')?.classList.remove('active');
  }

  // ── INIT ───────────────────────────────────────────────────────────
  function init() {
    // Wire Cash Out button
    document.getElementById('cashout-btn')?.addEventListener('click', doCashOut);

    // Wire Insert Cash button
    document.getElementById('insertcash-btn')?.addEventListener('click', doInsertCash);

    // Wire Create Voucher button
    document.getElementById('create-voucher-btn')?.addEventListener('click', doCreateVoucher);

    // Wire Create Voucher modal
    document.getElementById('cv-confirm')?.addEventListener('click', confirmCreateVoucher);
    document.getElementById('cv-cancel')?.addEventListener('click',  hideCreateVoucherModal);

    // Wire voucher modal close
    document.getElementById('vm-close')?.addEventListener('click', hideVoucherModal);
    document.getElementById('vm-print')?.addEventListener('click', () => {
      hideVoucherModal();
      UI.showToast('Voucher saved to wallet ✓', 2000);
    });

    // Wire wallet modal close
    document.getElementById('wallet-close')?.addEventListener('click', hideWalletModal);

    // Clear ALL stale overlay/modal states from previous session
    // This prevents any full-screen overlay from blocking the game on reload
    const staleOverlays = [
      'voucher-modal', 'wallet-modal', 'jackpot-overlay',
      'hold-screen', 'pick-screen', 'op-overlay', 'pin-overlay', 'log-screen',
    ];
    staleOverlays.forEach(id => document.getElementById(id)?.classList.remove('active'));
  }

  return {
    init,
    doCashOut,
    doCreateVoucher,
    doCashOutAmount,
    doInsertCash,
    redeemVoucher,
    checkZeroBalance,
    startZeroBalanceFlash,
    stopZeroBalanceFlash,
    loadVouchers,
  };
})();
