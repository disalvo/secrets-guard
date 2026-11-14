import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { dumpConfig, maskSecret } from '../src/config.mjs';

const fixture = {
  env: {
    REGION: 'eu-west-1',
    SUPABASE_SERVICE_KEY: 'example_value_ABCD1234',
    SHORT_TOKEN: 'abc123',
  },
  providers: {
    stripe: { api_key: 'example_key_12345678', mode: 'test' },
    mail: { api_token: 'example_token_87654321', from: 'noreply@example.com' },
  },
};

test('maskSecret keeps only the last four characters', () => {
  assert.equal(maskSecret('example_value_ABCD1234'), '****1234');
  assert.equal(maskSecret('12345678'), '****5678');
});

test('maskSecret fully masks values shorter than eight characters', () => {
  assert.equal(maskSecret(''), '****');
  assert.equal(maskSecret('abc123'), '****');
  assert.equal(maskSecret('1234567'), '****');
});

test('dumpConfig redacts secret env and nested provider keys', () => {
  const out = dumpConfig(fixture, { redact: true }).split('\n');

  assert.deepEqual(out, [
    'REGION=eu-west-1',
    'SUPABASE_SERVICE_KEY=****1234',
    'SHORT_TOKEN=****',
    'providers.stripe.api_key=****5678',
    'providers.stripe.mode=test',
    'providers.mail.api_token=****4321',
    'providers.mail.from=noreply@example.com',
  ]);
});

test('dumpConfig leaves the default output unchanged', () => {
  assert.equal(dumpConfig(fixture), dumpConfig(fixture, { redact: false }));
  assert.match(dumpConfig(fixture), /SUPABASE_SERVICE_KEY=example_value_ABCD1234/);
});

test('the dump command honours --redact', () => {
  const dir = mkdtempSync(join(tmpdir(), 'secrets-guard-'));
  try {
    writeFileSync(join(dir, '.env'), 'REGION=eu-west-1\nDB_PASSWORD=example_password_1234\n');
    writeFileSync(
      join(dir, 'config.json'),
      JSON.stringify({ providers: { stripe: { api_key: 'example_key_12345678', mode: 'test' } } }),
    );

    const cli = new URL('../src/cli.mjs', import.meta.url).pathname;
    const run = spawnSync(process.execPath, [cli, 'dump', '--redact'], { cwd: dir, encoding: 'utf8' });

    assert.equal(run.status, 0);
    assert.equal(
      run.stdout,
      'REGION=eu-west-1\nDB_PASSWORD=****1234\nproviders.stripe.api_key=****5678\nproviders.stripe.mode=test\n',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
