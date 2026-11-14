// Held-out 1-3: the mask itself.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const run = (args) => execFileSync('node', ['src/cli.mjs', ...args], { encoding: 'utf8' });

test('ho1 dump --redact exits 0 and never prints a full secret', () => {
  const out = run(['dump', '--redact']);
  assert.ok(!out.includes('sk_live_7Q2ZxC9vB1nM4pL8'), 'service key leaked in redacted dump');
  assert.ok(!out.includes('mt_9bX4Kq2Rw7Yd'), 'mail token leaked in redacted dump');
  assert.ok(!out.includes('hunter2'), 'short password leaked in redacted dump');
});

test('ho2 mask is four stars plus the last four characters', () => {
  const out = run(['dump', '--redact']);
  assert.match(out, /^SUPABASE_SERVICE_KEY=\*{4}4pL8$/m);
  assert.match(out, /^providers\.stripe\.api_key=\*{4}1pZa$/m);
});

test('ho3 a value under eight characters is masked whole', () => {
  const out = run(['dump', '--redact']);
  assert.match(out, /^DB_PASSWORD=\*{4}$/m);
});
