import { loadConfig, dumpConfig } from './config.mjs';

const [, , cmd, ...args] = process.argv;
const cfg = loadConfig();

if (cmd === 'dump') {
  console.log(dumpConfig(cfg, { redact: args.includes('--redact') }));
} else if (cmd === 'get') {
  const key = args[0];
  const rows = new Map(Object.entries(cfg.env));
  for (const [name, block] of Object.entries(cfg.providers)) {
    for (const [field, value] of Object.entries(block)) rows.set(`providers.${name}.${field}`, value);
  }
  if (!rows.has(key)) {
    console.error(`unknown key: ${key}`);
    process.exit(1);
  }
  console.log(rows.get(key));
} else {
  console.error('usage: cli.mjs dump [--redact] | cli.mjs get <key>');
  process.exit(2);
}
