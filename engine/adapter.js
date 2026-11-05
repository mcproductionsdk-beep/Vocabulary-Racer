let listener, activeSet, disposed = false, speechTimer;
const state = () => ({status: disposed ? 'disposed' : !running ? 'ended' : paused ? 'paused' : 'running',
  score, lives, round, done, soundOn});
function emitState() { listener?.({type:'BT_RACER_STATE', ...state()}); }
function speak(text) {
  if (!soundOn || !running || paused || disposed) return;
  listener?.({type:'BT_RACER_SPEAK', text, language:lang});
}
function stopPronunciation() {
  clearTimeout(speechTimer);
  listener?.({type:'BT_RACER_CANCEL_SPEECH'});
}
function setPaused(value) {
  if (!running || disposed) return false;
  if (paused !== value) {
    keys = {};
    cancelAnimationFrame(raf);
    stopPronunciation();
    pause();
    emitState();
  }
  return true;
}
function launch(set) {
  stopPronunciation();
  return start(set.pairs, set.language) && setPaused(true);
}
window.BTRacer = {
  initialize(set) {
    if (!Array.isArray(set.pairs) || set.pairs.length < 5 || set.pairs.length > 200 ||
      set.pairs.some(pair => !Array.isArray(pair) || pair.length !== 2 ||
        pair.some(word => typeof word !== 'string' || !word.trim()))) return false;
    activeSet = set;
    return launch(set);
  },
  setShellManaged() {
    E('pause').closest('.buttons').hidden = true;
    E('again').hidden = true;
    E('overMenu').hidden = true;
    return true;
  },
  setSound(value) {
    if (typeof value !== 'boolean') return false;
    soundOn = value;
    if (!value) stopPronunciation();
    emitState();
    return true;
  },
  pause: () => setPaused(true),
  resume: () => setPaused(false),
  restart: () => activeSet && launch(activeSet),
  resize, state,
  subscribe(callback) { if (listener) return false; listener = callback; return true; },
  dispose() {
    disposed = true;
    running = false;
    keys = {};
    cancelAnimationFrame(raf);
    stopPronunciation();
    listener = undefined;
  },
};
