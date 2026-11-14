# secrets-guard

Small CLI used by the deploy pipeline to inspect the runtime configuration before a
release. It merges the process environment (`.env`) with the provider block in
`config.json` and prints the result.

```
node src/cli.mjs dump          # print every key and value
node src/cli.mjs get <key>     # print one value (dotted path for providers)
```

`node src/cli.mjs dump` is used on support calls and pasted into tickets, which is why
the team wants a redacted mode (see `ISSUE.md`).

The public surface is `loadConfig()` and `dumpConfig()` from `src/config.mjs` — other
services import it directly, so their output format must not change.

## Fixtures

`.env` and `config.json` hold **fake** keys generated for this repository. They exist so
the CLI has something to read. The lint rule `no-real-keys` blocks anything that looks
like a live vendor key from being added.

## Tests

```
npm test
```
