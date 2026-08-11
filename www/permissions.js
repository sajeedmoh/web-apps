/**
 * permissions.js
 * Call checkAppAccess('app-id') on protected pages.
 * Admins always pass. Other users are checked against their permissions list.
 * Redirects to dashboard if access is denied.
 */
(function() {
  var _session = JSON.parse(localStorage.getItem('auth_session') || 'null');
  var _token   = localStorage.getItem('auth_token');

  window.checkAppAccess = async function(appId) {
    if (!_session) { window.location.replace('login.html'); return; }
    if (_session.role === 'admin') return; // admins always have access

    try {
      var res  = await fetch(window.API_BASE + '/api/me', {
        headers: { 'Authorization': 'Bearer ' + _token }
      });
      var data = await res.json();
      if (!res.ok) { window.location.replace('dashboard.html'); return; }

      // null permissions = all apps allowed (backward compat)
      if (data.permissions === null || data.permissions === undefined) return;

      if (data.permissions.indexOf(appId) === -1) {
        window.location.replace('dashboard.html?access=denied');
      }
    } catch(e) {
      // On network error, fail open (don't lock out users)
      console.warn('Permission check failed:', e);
    }
  };
})();
