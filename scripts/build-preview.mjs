import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const out = new URL('dist-preview/', root);
const baseline = {
  desktop: '6411d51e5db21803459980a0c50db5e1907735e8',
  mobile: '1435a7a9a450ee7e798b18e68ea88c2d4ec8315a',
};
const pages = await Promise.all(Object.entries(baseline).map(async ([device, expected]) => {
  const bytes = await readFile(new URL(`baseline/${device}.html.txt`, root));
  const hash = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  if (hash !== expected) throw new Error(`Pinned ${device} source mismatch: ${hash}`);
  return [device, bytes];
}));

await rm(out, { recursive: true, force: true });
await mkdir(out);
for (const [device, bytes] of pages) await writeFile(new URL(`${device}.html`, out), bytes);
for (const file of ['index.html', 'launcher.js']) {
  await copyFile(new URL(`preview/${file}`, root), new URL(file, out));
}
await writeFile(new URL('_headers', out), `/*
  Content-Security-Policy: default-src 'none'; script-src 'self' 'unsafe-inline' https://447ea3a9.bt-vocabulary-platform-staging.pages.dev/platform/; style-src 'unsafe-inline'; frame-src 'self'; frame-ancestors 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Cache-Control: no-store
`);
await writeFile(new URL('version.json', out), JSON.stringify({
  environment: 'staging',
  sourceCommit: process.env.CF_PAGES_COMMIT_SHA ?? 'local',
  baselineCommit: 'd80b5081ffca50755366d7ad6436310c9f12e5bc',
  baseline,
}, null, 2) + '\n');

const engineFiles = ['adapter.js', 'bootstrap.mjs', 'session.mjs', 'layout.css'];
const [adapter, bootstrap, session, layout] = await Promise.all(engineFiles.map(file =>
  readFile(new URL(`engine/${file}`, root), 'utf8')));
const variants = pages.map(([device, bytes]) => {
  const html = bytes.toString('utf8')
    .replace('Word Racer — stripped engine test', 'Vocabulary Racer')
    .replace('<div class="logo">WORD RACER</div>', '')
    .replace('</head>', '<style>'+layout+'</style></head>')
    .replace('W=Math.max(320,r.width);H=Math.max(350,r.height)', 'W=Math.max(1,wrap.clientWidth);H=Math.max(1,wrap.clientHeight)')
    .replace('W=Math.max(1,r.width);H=Math.max(1,r.height)', 'W=Math.max(1,wrap.clientWidth);H=Math.max(1,wrap.clientHeight)')
    .replace(/function speak\(t\).*\nfunction stopPronunciation\(\).*\n/, '')
    .replace('setTimeout(function(){speak(t)},130)', 'clearTimeout(speechTimer);speechTimer=setTimeout(function(){speak(t)},130)')
    .replace('E("target").innerHTML="FIND: <b>"+current.prompt.toUpperCase()+"</b>"', 'E("target").textContent="FIND: "+current.prompt.toUpperCase()')
    .replace('if(running)raf=requestAnimationFrame(loop)}', 'if(running)raf=requestAnimationFrame(loop);else emitState()}')
    .replace('if(k==="p"&&!e.repeat)pause();', 'if(k==="p"&&!e.repeat)setPaused(!paused);')
    .replace('current=queue.shift();hud()}', 'current=queue.shift();hud();emitState()}')
    .replace(/window.addEventListener\("message"[\s\S]*?<\/script>/, `${adapter}\n})();</script><script type="module" src="./bootstrap.mjs"></script>`);
  return [device, html];
});
const buildId = createHash('sha1').update(JSON.stringify([variants, bootstrap, session])).digest('hex');
await writeFile(new URL('build-id.mjs', out), `export const buildId = '${buildId}';\n`);
await writeFile(new URL('session.mjs', out), session);
await writeFile(new URL('bootstrap.mjs', out), bootstrap);
for (const [device, html] of variants) await writeFile(new URL(`engine-${device}.html`, out), html);
await writeFile(new URL('racer.html', out), '<!doctype html><meta charset="utf-8"><script src="./device.js"></script>');
await writeFile(new URL('device.js', out), `location.replace(matchMedia('(pointer: coarse) and (max-width: 760px) and (orientation: portrait)').matches ? './engine-mobile.html' : './engine-desktop.html');`);
const headers = new URL('_headers', out);
await writeFile(headers, (await readFile(headers, 'utf8')).replace("frame-ancestors 'self'", "frame-ancestors 'self' https://bt-vocabulary-platform-staging.pages.dev https://*.bt-vocabulary-platform-staging.pages.dev"));
console.log(buildId);
