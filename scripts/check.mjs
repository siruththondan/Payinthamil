#!/usr/bin/env node
// Zero-dependency sanity checks. Run with: npm run check
//   1. node --check on every js/*.js
//   2. every ?v= version string (and the head script's V constant) is identical
//   3. every local src/href/import path referenced exists on disk
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => p.slice(ROOT.length + 1);
let failures = 0;
const fail = (msg) => { failures++; console.error('FAIL ' + msg); };

const jsDir = join(ROOT, 'js');
const jsFiles = readdirSync(jsDir).filter((f) => f.endsWith('.js')).sort().map((f) => join(jsDir, f));

// 1. syntax
for (const f of jsFiles) {
  const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
  if (r.status !== 0) fail(`${rel(f)}: syntax error\n${r.stderr}`);
}
console.log(`syntax: checked ${jsFiles.length} files`);

// 2. version strings
const versionFiles = [join(ROOT, 'index.html'), join(jsDir, 'practice.js'), join(jsDir, 'keyboard.js')];
const versions = []; // { v, file, line }
for (const f of versionFiles) {
  readFileSync(f, 'utf8').split('\n').forEach((text, i) => {
    for (const m of text.matchAll(/\?v=(\d{6,})/g)) versions.push({ v: m[1], file: f, line: i + 1 });
    const c = text.match(/\bV\s*=\s*'(\d{6,})'/);
    if (c) versions.push({ v: c[1], file: f, line: i + 1 });
  });
}
const distinct = [...new Set(versions.map((x) => x.v))];
if (distinct.length > 1) {
  const count = {};
  versions.forEach((x) => { count[x.v] = (count[x.v] || 0) + 1; });
  const common = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
  for (const x of versions) if (x.v !== common) fail(`${rel(x.file)}:${x.line}: version ${x.v} differs from ${common}`);
} else {
  console.log(`version: ${versions.length} references, all ${distinct[0]}`);
}

// 3. referenced paths
const isLocal = (p) => p && !/^([a-z][a-z0-9+.-]*:|\/\/|#|data:)/i.test(p);
const checkPath = (fromFile, line, ref) => {
  const clean = ref.split('?')[0].split('#')[0];
  if (!clean) return;
  const target = clean.startsWith('/') ? join(ROOT, clean) : resolve(dirname(fromFile), clean);
  if (!existsSync(target)) fail(`${rel(fromFile)}:${line}: missing file ${ref}`);
};

const html = join(ROOT, 'index.html');
readFileSync(html, 'utf8').split('\n').forEach((text, i) => {
  for (const m of text.matchAll(/\b(?:src|href)\s*=\s*"([^"]*)"/g)) if (isLocal(m[1])) checkPath(html, i + 1, m[1]);
  // import map values and the inline import('./js/...') call
  for (const m of text.matchAll(/"\.\/[^"]+"\s*:\s*"(\.\/[^"]+)"/g)) checkPath(html, i + 1, m[1]);
  for (const m of text.matchAll(/import\(\s*'([^']+)'\s*\)/g)) if (isLocal(m[1])) checkPath(html, i + 1, m[1]);
  // modules preloaded from the head script: 'js/' + m + '.js'
  const list = text.match(/\[((?:'[A-Za-z]+',?\s*)+)\]\.forEach/);
  if (list) for (const n of list[1].matchAll(/'([A-Za-z]+)'/g)) checkPath(html, i + 1, `js/${n[1]}.js`);
});

for (const f of jsFiles) {
  readFileSync(f, 'utf8').split('\n').forEach((text, i) => {
    for (const m of text.matchAll(/\bfrom\s+'([^']+)'/g)) if (isLocal(m[1])) checkPath(f, i + 1, m[1]);
    for (const m of text.matchAll(/\bimport\(\s*'([^']+)'/g)) if (isLocal(m[1])) checkPath(f, i + 1, m[1]);
    for (const m of text.matchAll(/^\s*import\s+'([^']+)'/g)) if (isLocal(m[1])) checkPath(f, i + 1, m[1]);
  });
}
console.log('paths: checked index.html and js/*.js references');

if (failures) {
  console.error(`\n${failures} problem(s) found`);
  process.exit(1);
}
console.log('\nall checks passed');
