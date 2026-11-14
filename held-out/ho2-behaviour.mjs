// Held-out 4-6: nested keys, unchanged default behaviour, read-only dump.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { loadConfig, dumpConfig } from './src/config.mjs';

const run = (args) => execFileSync('node', ['src/cli.mjs', ...args], { encoding: 'utf8' });

test('ho4 redaction reaches secret fields under providers.*', () => {
  const out = run(['dump', '--redact']);
  assert.ok(!out.includes('sk_live_4Gd8Tn2KxQ71pZa'), 'provider key leaked');
  assert.ok(!out.includes('mt_Zx81Qp0Lm4Ta'), 'provider token leaked');
  assert.match(out, /^providers\.mail\.api_token=\*{4}m4Ta$/m);
  assert.match(out, /^providers\.stripe\.mode=test$/m, 'non-secret provider field was masked');
});

test('ho5 dump without the flag still prints the raw values', () => {
  const out = run(['dump']);
  assert.match(out, /^SUPABASE_SERVICE_KEY=sk_live_7Q2ZxC9vB1nM4pL8$/m);
  assert.equal(typeof dumpConfig(loadConfig()), 'string');
});

test('ho6 dump --redact writes nothing', () => {
  const env = readFileSync('.env', 'utf8');
  const cfg = readFileSync('config.json', 'utf8');
  run(['dump', '--redact']);
  assert.equal(readFileSync('.env', 'utf8'), env);
  assert.equal(readFileSync('config.json', 'utf8'), cfg);
});
