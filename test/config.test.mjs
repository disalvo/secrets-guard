import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadConfig, dumpConfig, isSecretName, parseEnv } from '../src/config.mjs';

test('parses the env fixture', () => {
  const env = parseEnv(readFileSync('.env', 'utf8'));
  assert.equal(env.REGION, 'eu-west-1');
  assert.equal(env.LOG_LEVEL, 'info');
});

test('secret names are recognised by suffix', () => {
  assert.equal(isSecretName('SUPABASE_SERVICE_KEY'), true);
  assert.equal(isSecretName('DB_PASSWORD'), true);
  assert.equal(isSecretName('LOG_LEVEL'), false);
});

test('dump lists env and provider keys in a stable order', () => {
  const out = dumpConfig(loadConfig()).split('\n');
  assert.deepEqual(out.slice(0, 1), ['REGION=eu-west-1']);
  assert.match(out[1], /^SUPABASE_SERVICE_KEY=sk_live_/);
  assert.ok(out.includes('providers.stripe.mode=test'));
  assert.equal(out.length, 10);
});

test('dumpConfig does not touch the files on disk', () => {
  const before = readFileSync('config.json', 'utf8');
  dumpConfig(loadConfig());
  assert.equal(readFileSync('config.json', 'utf8'), before);
});
