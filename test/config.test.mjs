import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { loadConfig, dumpConfig, isSecretName, maskSecret, parseEnv } from '../src/config.mjs';

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

test('masks a secret with the last four characters', () => {
  assert.equal(maskSecret('example_value_ABCD1234'), '****1234');
  assert.equal(maskSecret('12345678'), '****5678');
});

test('fully masks secret values shorter than eight characters', () => {
  assert.equal(maskSecret('hunter2'), '****');
  assert.equal(maskSecret('1234567'), '****');
});

test('redacted dump masks env and nested provider secrets only', () => {
  const plain = dumpConfig(loadConfig());
  const redacted = dumpConfig(loadConfig(), { redact: true });

  assert.deepEqual(
    redacted.split('\n').map((line) => line.slice(0, line.indexOf('='))),
    plain.split('\n').map((line) => line.slice(0, line.indexOf('='))),
  );
  assert.match(redacted, /^SUPABASE_SERVICE_KEY=\*{4}4pL8$/m);
  assert.match(redacted, /^STRIPE_PUBLISHABLE_KEY=\*{4}lo2C$/m);
  assert.match(redacted, /^MAIL_API_TOKEN=\*{4}w7Yd$/m);
  assert.match(redacted, /^DB_PASSWORD=\*{4}$/m);
  assert.match(redacted, /^providers\.stripe\.api_key=\*{4}1pZa$/m);
  assert.match(redacted, /^providers\.mail\.api_token=\*{4}m4Ta$/m);
  assert.match(redacted, /^REGION=eu-west-1$/m);
  assert.match(redacted, /^providers\.stripe\.mode=test$/m);
  assert.match(redacted, /^providers\.mail\.from=noreply@example\.com$/m);
});

test('dump --redact masks values from the CLI', () => {
  const out = execFileSync(process.execPath, ['src/cli.mjs', 'dump', '--redact'], {
    encoding: 'utf8',
  });
  assert.match(out, /^SUPABASE_SERVICE_KEY=\*{4}4pL8$/m);
  assert.doesNotMatch(out, /sk_live_7Q2ZxC9vB1nM4pL8/);
  assert.match(out, /^REGION=eu-west-1$/m);
});
