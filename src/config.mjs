import { readFileSync } from 'node:fs';

const SECRET_NAME = /(_KEY|_SECRET|_TOKEN|PASSWORD)$/i;

export function parseEnv(text) {
  const out = {};
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return out;
}

export function isSecretName(name) {
  return SECRET_NAME.test(name);
}

export function maskSecret(value) {
  const text = String(value);
  if (text.length < 8) return '****';
  return `****${text.slice(-4)}`;
}

export function loadConfig(envPath = '.env', configPath = 'config.json') {
  return {
    env: parseEnv(readFileSync(envPath, 'utf8')),
    providers: JSON.parse(readFileSync(configPath, 'utf8')).providers ?? {},
  };
}

// Flat dotted view: env keys keep their name, provider fields become providers.<p>.<f>.
export function flatten(cfg) {
  const rows = Object.entries(cfg.env).map(([k, v]) => [k, v]);
  for (const [name, block] of Object.entries(cfg.providers)) {
    for (const [field, value] of Object.entries(block)) {
      rows.push([`providers.${name}.${field}`, value]);
    }
  }
  return rows;
}

export function dumpConfig(cfg, { redact = false } = {}) {
  return flatten(cfg)
    .map(([name, value]) => `${name}=${redact && isSecretName(name) ? maskSecret(value) : value}`)
    .join('\n');
}
