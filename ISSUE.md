# ISSUE: add `--redact` to `secrets-guard dump`

Support keeps pasting `dump` output into tickets and it arrives with the live keys in it.
Add a redacted mode so the same command is safe to paste.

## What it must do

- `node src/cli.mjs dump --redact` prints the same keys, same order, same format as `dump`,
  but every **secret** value is masked.
- A key is a secret when its name ends in `_KEY`, `_SECRET`, `_TOKEN` or `PASSWORD`
  (case-insensitive), at any depth — env vars and the `providers.stripe.api_key` style
  fields in `config.json`.
- Mask format: `****` followed by the **last 4 characters** of the value, e.g.
  `example_value_ABCD1234` → `****1234`.
  A value whose length is **under 8 characters** is fully masked as `****` — a short secret
  must not leak its tail.
- `dump` without the flag keeps printing whatever it prints today. Other services import
  `dumpConfig()`; its default behaviour must not change.
- Nothing is written to disk — `dump` is read-only, redacted or not.

## Tests

Add tests for the mask, the short-value rule and the nested provider keys. `npm test` is
the visible suite; keep it green.
