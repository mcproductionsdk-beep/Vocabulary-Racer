const pairs = [
  ['piano', 'piano'],
  ['guitar', 'guitarra'],
  ['violin', 'violín'],
  ['trumpet', 'trompeta'],
  ['flute', 'flauta'],
];
const frame = document.getElementById('engine');
const status = document.getElementById('status');
const requested = new URLSearchParams(location.search).get('device');
const portraitTouch = matchMedia('(pointer: coarse) and (max-width: 760px) and (orientation: portrait)').matches;
const device = requested === 'desktop' || requested === 'mobile' ? requested : portraitTouch ? 'mobile' : 'desktop';
let starting = false;
let started = false;
const timeout = setTimeout(() => {
  status.textContent = 'Racer did not start. Reload to retry.';
}, 10000);

addEventListener('message', ({ origin, source, data }) => {
  if (origin !== location.origin || source !== frame.contentWindow) return;
  if (data?.type === 'BT_RACER_READY' && !starting) {
    starting = true;
    source.postMessage({ type: 'BT_RACER_START', pairs, language: 'es-ES' }, origin);
  }
  if (data?.type === 'BT_RACER_STARTED' || data?.type === 'BT_RACER_START_FAILED') {
    clearTimeout(timeout);
    started = data.type === 'BT_RACER_STARTED';
    status.textContent = started ? `Playing ${device} baseline` : 'Racer rejected the fixture.';
    if (started) frame.focus();
  }
  if (started && data?.type === 'BT_RACER_SPEAK') {
    status.textContent = `Pronunciation requested: ${data.text} (${data.language})`;
  }
  if (started && data?.type === 'BT_RACER_CANCEL_SPEECH') {
    status.textContent = `Playing ${device} baseline`;
  }
});
frame.src = `./${device}.html`;
