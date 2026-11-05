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
  Content-Security-Policy: default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; frame-src 'self'; frame-ancestors 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'
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
