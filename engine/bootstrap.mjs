import {attachRacerSession} from './session.mjs';
import {buildId} from './build-id.mjs';

let shellOrigin;
try { shellOrigin = new URL(document.referrer).origin; } catch {}
if (parent !== window && /^https:\/\/(?:[a-z0-9-]+\.)?bt-vocabulary-platform-staging\.pages\.dev$/.test(shellOrigin)) {
  attachRacerSession({engine: window.BTRacer, policy: {shellOrigin, engineOrigin:location.origin, buildId}});
} else {
  document.body.textContent = 'Open Racer through the shared staging vocabulary picker.';
}
