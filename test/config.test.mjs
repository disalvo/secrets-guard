import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadConfig, dumpConfig, isSecretName, maskValue, parseEnv } from '../src/config.mjs';

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

test('mask keeps only the last four characters of a secret value', () => {
  assert.equal(maskValue('example_value_ABCD1234'), '****1234');
  assert.equal(maskValue('12345678'), '****5678');
});

test('short secret values are fully masked', () => {
  assert.equal(maskValue('short'), '****');
  assert.equal(maskValue('1234567'), '****');
});

test('dumpConfig does not redact by default', () => {
  const cfg = { env: { API_TOKEN: 'example_value_ABCD1234' }, providers: {} };
  assert.equal(dumpConfig(cfg), 'API_TOKEN=example_value_ABCD1234');
});

test('dumpConfig redacts env secrets when requested', () => {
  const cfg = {
    env: { API_TOKEN: 'example_value_ABCD1234', LOG_LEVEL: 'info' },
    providers: {},
  };
  assert.equal(dumpConfig(cfg, { redact: true }), 'API_TOKEN=****1234\nLOG_LEVEL=info');
});

test('dumpConfig redacts nested provider secrets when requested', () => {
  const cfg = loadConfig();
  const out = dumpConfig(cfg, { redact: true });
  assert.match(out, /^providers\.stripe\.api_key=\*{4}[^*]{4}$/m);
  assert.ok(!out.includes(cfg.providers.stripe.api_key));
  assert.ok(!out.includes(cfg.providers.mail.api_token));
  assert.match(out, /^providers\.stripe\.mode=test$/m);
  assert.match(out, /^providers\.mail\.from=noreply@example\.com$/m);
});
