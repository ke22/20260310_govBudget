import { spawnSync } from 'node:child_process';

function hasK6() {
  const res = spawnSync('k6', ['version'], { stdio: 'ignore' });
  return res.status === 0;
}

if (!hasK6()) {
  // eslint-disable-next-line no-console
  console.error(
    [
      '[stress] k6 is not installed.',
      '',
      'Install k6, then rerun:',
      '  - macOS (Homebrew): brew install k6',
      '  - see: https://grafana.com/docs/k6/latest/set-up/install-k6/',
      '',
      'Then run:',
      '  BASE_URL=http://127.0.0.1:4173 k6 run tests/load/stress.js'
    ].join('\n')
  );
  process.exit(1);
}

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173';
const res = spawnSync('k6', ['run', 'tests/load/stress.js'], {
  stdio: 'inherit',
  env: { ...process.env, BASE_URL: baseUrl }
});

process.exit(res.status ?? 1);

