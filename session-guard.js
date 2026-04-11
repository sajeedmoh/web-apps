/**
 * session-guard.js
 * Auto-logout after 15 minutes of inactivity.
 * Shows a 2-minute warning modal before logging out.
 *
 * Uses localStorage to track last activity time so the timeout
 * works correctly even when the browser throttles background timers.
 * Include on all protected pages.
 */
(function () {
  const INACTIVITY_MS    = 15 * 60 * 1000;   // 15 min total
  const WARNING_MS       =  2 * 60 * 1000;   // 2 min warning before logout
  const WARN_AT_MS       = INACTIVITY_MS - WARNING_MS; // show warning at 13 min
  const CHECK_INTERVAL   = 20 * 1000;         // check every 20 s
  const STORAGE_KEY      = 'last_activity';

  let checkTimer         = null;
  let countdownInterval  = null;
  let warningVisible     = false;

  /* ── Inject modal HTML + styles ─────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    #sg-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      z-index: 9999;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #sg-backdrop.visible { display: flex; }
    #sg-modal {
      background: #1a1d27;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 32px 28px;
      max-width: 360px;
      width: 90%;
      text-align: center;
      box-shadow: 0 24px 60px rgba(0,0,0,0.6);
      color: #f0f0f0;
    }
    #sg-icon { font-size: 2.2rem; margin-bottom: 14px; }
    #sg-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.01em;
    }
    #sg-body {
      font-size: 0.88rem;
      color: rgba(240,240,240,0.55);
      margin-bottom: 20px;
      line-height: 1.5;
    }
    #sg-countdown {
      font-size: 2.4rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: #f59e0b;
      letter-spacing: -0.03em;
      margin-bottom: 24px;
    }
    #sg-btns { display: flex; gap: 10px; }
    .sg-btn {
      flex: 1;
      padding: 11px 16px;
      border-radius: 9px;
      border: none;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: filter 0.15s;
      font-family: inherit;
    }
    .sg-btn:hover { filter: brightness(1.1); }
    #sg-btn-stay   { background: #4f8ef7; color: #fff; }
    #sg-btn-logout { background: rgba(255,255,255,0.07); color: rgba(240,240,240,0.6); border: 1px solid rgba(255,255,255,0.1); }
  `;
  document.head.appendChild(style);

  const backdrop = document.createElement('div');
  backdrop.id = 'sg-backdrop';
  backdrop.innerHTML = `
    <div id="sg-modal">
      <div id="sg-icon">⏱️</div>
      <div id="sg-title">Still there?</div>
      <div id="sg-body">You'll be logged out due to inactivity in</div>
      <div id="sg-countdown">2:00</div>
      <div id="sg-btns">
        <button class="sg-btn" id="sg-btn-stay"   onclick="sessionGuard.stay()">Stay logged in</button>
        <button class="sg-btn" id="sg-btn-logout" onclick="sessionGuard.logout()">Log out now</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  /* ── Activity tracking (via localStorage) ───────────────────────── */
  function recordActivity() {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  }

  function inactiveMs() {
    const last = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
    return last > 0 ? Date.now() - last : 0;
  }

  /* ── Countdown display ──────────────────────────────────────────── */
  function setCountdown(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    document.getElementById('sg-countdown').textContent =
      m + ':' + String(s).padStart(2, '0');
  }

  /* ── Show warning modal ─────────────────────────────────────────── */
  function showWarning(secondsLeft) {
    if (warningVisible) return;
    warningVisible = true;
    clearInterval(checkTimer);
    backdrop.classList.add('visible');
    setCountdown(secondsLeft);

    countdownInterval = setInterval(function () {
      secondsLeft--;
      if (secondsLeft <= 0) {
        clearInterval(countdownInterval);
        doLogout();
      } else {
        setCountdown(secondsLeft);
      }
    }, 1000);
  }

  /* ── Check inactivity (called on interval + tab focus) ──────────── */
  function checkInactivity() {
    if (warningVisible) return;
    const idle = inactiveMs();
    if (idle >= INACTIVITY_MS) {
      doLogout();
    } else if (idle >= WARN_AT_MS) {
      showWarning(Math.round((INACTIVITY_MS - idle) / 1000));
    }
  }

  /* ── Start polling timer ────────────────────────────────────────── */
  function startCheckTimer() {
    clearInterval(checkTimer);
    checkTimer = setInterval(checkInactivity, CHECK_INTERVAL);
  }

  /* ── Stay logged in ─────────────────────────────────────────────── */
  function stay() {
    clearInterval(countdownInterval);
    backdrop.classList.remove('visible');
    warningVisible = false;
    recordActivity();
    startCheckTimer();
  }

  /* ── Logout ─────────────────────────────────────────────────────── */
  function doLogout() {
    clearInterval(checkTimer);
    clearInterval(countdownInterval);
    localStorage.removeItem('auth_session');
    localStorage.removeItem('auth_token');
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = 'login.html?reason=timeout';
  }

  /* ── Listen for user activity ───────────────────────────────────── */
  ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach(function (evt) {
    document.addEventListener(evt, recordActivity, { passive: true });
  });

  /* ── Check immediately when tab becomes visible again ───────────── */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      checkInactivity();
    }
  });

  /* ── Expose to global scope (for onclick handlers) ──────────────── */
  window.sessionGuard = { stay: stay, logout: doLogout };

  /* ── Start ──────────────────────────────────────────────────────── */
  recordActivity();
  startCheckTimer();
})();
