# 05 — Network endpoints (egress map)

All product traffic goes to `https://contactout.com/*` (the `contactout.com` bridge script shares the same API). Telemetry to GA4 / Mixpanel / Sentry. Nothing else — no third-party data brokers contacted client-side.

## Data-plane endpoints (relative to `https://contactout.com/`)

| Endpoint | Direction | Payload | Notes |
|---|---|---|---|
| `linkedin/profile/secr` | POST | `{t:"pc", p:url}` → **returns 1/0** | Server-gated "do you want this page?"; also per-URL pageview ping (`t:"pc"` = page check) |
| `linkedin/profile/pre` | POST | cached profile / page payloads, typed `j_*`, `l_*`, `pv*` | Fallback upload when `secr` declines; full page HTML (`pv_rc`, zipped) and JSON profiles (`json_reg_pro_full`/`_mini`) |
| `linkedin/profiles/upload` | POST | batched profile JSON | Bulk upload (connections walker output) |
| `linkedin/profile/update` | POST | profile deltas | gated by remote flag `O.r1` |
| `extension/lid` | POST | `{event:"logout"}` or `{pageContent, url, event:"logout_url"}` | Session-state telemetry; **page HTML on logout-url events** (see [03](03-credential-handling.md)) |
| `/api/auth/token` | POST | OAuth callback exchange | `auth_callback.js` on `contactout.com/login/callback` |
| `statistics/engage`, `statistics/user` | POST | feature usage | Product analytics |
| `extension/app`, `/extension/uninstall_survey` | GET | — | Navigation |
| `api/broadcasting/auth` | POST | Pusher/Echo auth (`channels.echo.key: 21acc97810f61bea78b3`) | realtime notifications |

## Inbound (extension → LinkedIn, first-party as you)

- Background-tab navigations to profile/connections URLs (Stage C, [04](04-data-collection-pipeline.md)) — plain navigations, no API spoofing observed client-side.
- In-page XHR hooks observe (never modify) `voyager/sales/talent` responses.

## Telemetry

| Sink | Evidence |
|---|---|
| Google Analytics 4 MP | `measurementProtocolUrl: https://www.google-analytics.com/mp/collect`, `measurementId: G-GYCQBP66WD`, API secret in bundle |
| Mixpanel | `mp.js` + `POST_TO_MIXPANEL`; events e.g. `contactout_anywhere_toggle` |
| Sentry | DSN `df650867098340f0a604b46b1dba4b45@o949158.ingest.sentry.io/4505185660370944`; `REPORT_DEBUG_HTML` can send page HTML in crash reports |

⚠️ `REPORT_DEBUG_HTML` — debug flow can upload arbitrary page HTML to ContactOut (error-report path). Bounded to their own domain, but worth noting as an HTML-exfil primitive gated by debug flags.

## Identity keys

Uploaded records are keyed by LinkedIn identity so the server can merge across users:
`objectUrn` (from `bpr-guid` JSON), member ID (`getMemberIdFromProfileDetails` — filters `com.linkedin.voyager.dash.identity.profile.Profile`), vanity URL (`getVanity`), normalized name (`normalizeLiName`).
