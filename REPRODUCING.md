# Reproducing this analysis

Target: Chrome Web Store item `jjdemeiffadmmjhkbbpglgnlgeafomjo` ("Email Finder by ContactOut"), v5.18.3, CRX3, ~877 KB.

```bash
# 1. fetch + strip CRX3 header
python3 tools/download_crx.py jjdemeiffadmmjhkbbpglgnlgeafomjo contactout.crx

# 2. extract the zip payload
python3 -c "import zipfile; zipfile.ZipFile('contactout.crx').extractall('ext')"

# 3. sanity-check the surface
python3 -m json.tool ext/manifest.json | less
wc -c ext/app/*.js | sort -n

# 4. pull anchored context windows for any finding
python3 tools/grep_context.py ext \
    background.js,content_script.js \
    'li_at' 'UrlWatchers' 'phoneNumbers' 'profiles/upload' 'pv_rc'
```

## Method

1. **Surface triage** — manifest entry points, permissions, host grants → `docs/01`, `docs/02`.
2. **Symbol inventory** — the shared constants module (`keys`, `commands`, `cacheProfiles`) is duplicated in every bundle at a stable offset (~1.8–8 K); it doubles as a symbol table for the whole extension.
3. **Call-site audits** — for each sensitive primitive (`cookies.get`, `webRequest`, `tabs.create`, `sendMessage`) enumerate *all* call sites; classify payload provenance. This is how `li_at` non-exfiltration was established (`docs/03`).
4. **Router reconstruction** — the service-worker `switch (e.command)` block (`background.js` @94888) is the authoritative egress map (`docs/05`).
5. **Snippet anchoring** — every claim cites `file @byte-offset`; snippets in `evidence/snippets/` are reformatted only for line breaks, identifiers/literals untouched.

## Tooling notes

- Bundles are webpack ES5 with `__awaiter`/`__importDefault` noise; `n(0)` = constants, `n(7)` = chrome API wrappers in most files.
- `python3` only, no node_modules — scripts are dependency-free.
- Store-signed integrity: `_metadata/verified_contents.json` present in the artifact analyzed.

## Version drift

ContactOut ships frequent updates; offsets refer to 5.18.3. The *mechanisms* (server-gated upload, UrlWatchers, credit wallets) have been stable across versions historically, but re-verify offsets after any update before citing them.
