# AGENTS.md

## Cursor Cloud specific instructions

Photon is a single, standalone Python 3 command-line OSINT web crawler. There is no
web server, database, or long-running background service — you invoke the CLI directly
and it writes results to a local output directory. End-to-end use requires outbound
internet access to reach the target site being crawled.

### Run
- Entry point: `python3 photon.py -u <url> [options]` (run with `-h` to see all options).
- Example crawl: `python3 photon.py -u https://example.com -l 2 -t 20 --export=json --output=results`
- Results are written to the `--output` directory (`internal.txt`, `external.txt`,
  `exported.json`, etc.). These output directories are NOT gitignored (`.gitignore`
  only ignores `*.pyc`), so delete any crawl output before committing.
- Optional plugins hit external services: `--wayback` (archive.org), `--dns`
  (dnsdumpster.com). They are not required and can be flaky/offline.

### Lint
Lint config lives in `.travis.yml` (there is no separate flake8 config file):
- Syntax/undefined-name gate (must pass): `python3 -m flake8 . --count --select=E901,E999,F821,F822,F823 --show-source --statistics`
- Style report (non-blocking, run with `--exit-zero`): `python3 -m flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics`

### Test
There is no unit-test suite (no pytest/unittest). The `.travis.yml` `script:` section
uses live `python3 photon.py ...` invocations as smoke tests, so "testing" means
running the crawler end-to-end against a reachable URL and inspecting the output files.

### Notes
- `flake8` binary installs to `~/.local/bin` (not on PATH); invoke it as
  `python3 -m flake8` instead.
- A harmless `SyntaxWarning: invalid escape sequence` is printed by `photon.py` on
  every run; it is cosmetic and does not affect functionality.
