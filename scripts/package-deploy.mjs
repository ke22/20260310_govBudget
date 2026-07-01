import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const deployDir = path.join(repoRoot, 'deploy');
const zipPath = path.join(repoRoot, 'deploy-m2.zip');

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyFile(src, dest) {
  mkdirp(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(srcDir, destDir) {
  mkdirp(destDir);
  fs.cpSync(srcDir, destDir, { recursive: true });
}

function listFiles(dir) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

function hasCommand(cmd) {
  const res = spawnSync(cmd, ['-h'], { stdio: 'ignore' });
  return res.status === 0;
}

function convertJpgToWebp(srcJpg, outWebp) {
  mkdirp(path.dirname(outWebp));

  // macOS built-in converter.
  // sips supports: sips -s format webp input --out output.webp
  const res = spawnSync('sips', ['-s', 'format', 'webp', srcJpg, '--out', outWebp], { stdio: 'ignore' });
  return res.status === 0;
}

function safeNameToFilename(name) {
  return String(name || '').trim();
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function zipDeploy() {
  rmrf(zipPath);

  // Prefer macOS `ditto` for zip.
  const ditto = spawnSync('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', 'deploy', zipPath], {
    cwd: repoRoot,
    stdio: 'inherit'
  });
  if (ditto.status === 0) return;

  // Fallback to `zip` if present.
  const zip = spawnSync('zip', ['-r', zipPath, 'deploy'], { cwd: repoRoot, stdio: 'inherit' });
  if (zip.status !== 0) {
    throw new Error('Failed to create zip (ditto/zip not available).');
  }
}

// 1) Recreate deploy directory
rmrf(deployDir);
mkdirp(deployDir);

// 2) Copy site files
for (const f of ['index.html', 'budget.html', 'legislators.html', 'other.html', 'main_vs.js', 'styles_vs.css']) {
  copyFile(path.join(repoRoot, f), path.join(deployDir, f));
}

for (const f of ['data_page_a.json', 'data_page_b.json', 'data_page_c.json', 'data_page_d.json']) {
  copyFile(path.join(repoRoot, f), path.join(deployDir, f));
}

copyDir(path.join(repoRoot, 'vs-modules'), path.join(deployDir, 'vs-modules'));
copyDir(path.join(repoRoot, 'img'), path.join(deployDir, 'img'));

// 3) Ensure portraits exist as /photos/<name>.jpg (and optional .webp) for every legislator in data_page_c.json
const dataC = readJson(path.join(repoRoot, 'data_page_c.json'));
const names = Array.from(new Set(dataC.map(r => safeNameToFilename(r['委員姓名'])).filter(Boolean)));

const srcPhotosDir = path.join(repoRoot, 'photos'); // source jpgs live here
const outPhotosDir = path.join(deployDir, 'photos');
mkdirp(outPhotosDir);

// Copy any existing jpg/webp from source photos folder
for (const fn of listFiles(srcPhotosDir)) {
  const lower = fn.toLowerCase();
  if (lower.endsWith('.webp') || lower.endsWith('.jpg')) {
    copyFile(path.join(srcPhotosDir, fn), path.join(outPhotosDir, fn));
  }
}

// Convert missing webp from jpg
if (!hasCommand('sips')) {
  // eslint-disable-next-line no-console
  console.warn('[deploy] sips not available; skipping jpg->webp conversion.');
} else {
  for (const name of names) {
    // Skip caucuses: code renders party icon / generated avatar.
    if (name.includes('黨團')) continue;

    const wantWebp = path.join(outPhotosDir, `${name}.webp`);
    if (fs.existsSync(wantWebp)) continue;

    const srcJpg = path.join(srcPhotosDir, `${name}.jpg`);
    if (!fs.existsSync(srcJpg)) continue;

    const ok = convertJpgToWebp(srcJpg, wantWebp);
    if (!ok) {
      // eslint-disable-next-line no-console
      console.warn(`[deploy] failed to convert: ${name}.jpg -> .webp`);
    }
  }
}

// 4) Emit a short coverage report
const missing = [];
for (const name of names) {
  if (name.includes('黨團')) continue;
  const wantJpg = path.join(outPhotosDir, `${name}.jpg`);
  if (!fs.existsSync(wantJpg)) missing.push(name);
}

// eslint-disable-next-line no-console
console.log(`[deploy] legislators=${names.length} (excluding caucus=${names.filter(n => n.includes('黨團')).length}), missing_jpg=${missing.length}`);
if (missing.length) {
  // eslint-disable-next-line no-console
  console.log('[deploy] missing webp names:\n' + missing.join('\n'));
}

// 5) Create zip
zipDeploy();
// eslint-disable-next-line no-console
console.log(`[deploy] wrote ${zipPath}`);

