const { createPronunciationService } = await import('https://447ea3a9.bt-vocabulary-platform-staging.pages.dev/platform/voice.mjs').catch(() => ({}));

const pairs = [
  ['piano', 'piano'],
  ['guitar', 'guitarra'],
  ['violin', 'violín'],
  ['trumpet', 'trompeta'],
  ['flute', 'flauta'],
];
const frame = document.getElementById('engine');
const status = document.getElementById('status');
const language = 'es-ES';
const voice = createPronunciationService?.({
  onStatus(state) {
    if (state === 'started') status.textContent = 'Speaking Spanish…';
    if (state === 'unavailable' || state === 'error') status.textContent = 'Pronunciation unavailable on this device.';
    if (state === 'ended' || state === 'cancelled') status.textContent = `Playing ${device} baseline`;
  },
});
document.getElementById('test-voice').addEventListener('click', () => {
  void voice?.speak('guitarra', language);
  if (!voice) status.textContent = "Shared pronunciation module unavailable."; 
  if (started) frame.focus();
});
addEventListener('pagehide', () => voice?.cancel());
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
    source.postMessage({ type: 'BT_RACER_START', pairs, language }, origin);
  }
  if (data?.type === 'BT_RACER_STARTED' || data?.type === 'BT_RACER_START_FAILED') {
    clearTimeout(timeout);
    started = data.type === 'BT_RACER_STARTED';
    status.textContent = started ? `Playing ${device} baseline` : 'Racer rejected the fixture.';
    if (started) frame.focus();
  }
  if (started && data?.type === 'BT_RACER_SPEAK' && data.language === language && pairs.some(([, target]) => target === data.text)) {
    void voice?.speak(data.text, language);
  }
  if (started && (data?.type === 'BT_RACER_CANCEL_SPEECH' || data?.type === 'BT_RACER_MENU')) {
    voice?.cancel();
  }
});
frame.src = `./${device}.html`;
