/**
 * permissions.js
 * Call checkAppAccess('app-id') on protected pages.
 * Admins always pass. Other users are checked against their permissions list.
 * Apps in RESTRICTED_BY_DEFAULT are OFF for users with no explicit permissions set.
 * Redirects to dashboard if access is denied.
 */
(function() {
  var _session = JSON.parse(localStorage.getItem('auth_session') || 'null');
  var _token   = localStorage.getItem('auth_token');

  // These apps are OFF by default — admin must explicitly grant access
  var RESTRICTED_BY_DEFAULT = ['zehra-daily-routine'];

  window.checkAppAccess = async function(appId) {
    if (!_session) { window.location.replace('login.html'); return; }
    if (_session.role === 'admin') return; // admins always have access

    try {
      var res  = await fetch(window.API_BASE + '/api/me', {
        headers: { 'Authorization': 'Bearer ' + _token }
      });
      var data = await res.json();
      if (!res.ok) { window.location.replace('dashboard.html'); return; }

      if (!Array.isArray(data.permissions)) {
        // No explicit permissions set — block restricted apps, allow everything else
        if (RESTRICTED_BY_DEFAULT.indexOf(appId) !== -1) {
          window.location.replace('dashboard.html?access=denied');
        }
        return;
      }

      if (data.permissions.indexOf(appId) === -1) {
        window.location.replace('dashboard.html?access=denied');
      }
    } catch(e) {
      // On network error, fail open (don't lock out users)
      console.warn('Permission check failed:', e);
    }
  };
})();
