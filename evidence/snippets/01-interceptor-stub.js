// Evidence 01 — interceptor stub (app/interceptor.js, module 502)
// Entire functional content of the document_start content script.
// The real network interceptor is injected later by the service worker via chrome.scripting.
// Source: app/interceptor.js (15,044 B bundle)

const runtime = require(7);            // chrome.* promise wrappers
const c       = require(0);            // shared constants

runtime.sendMessage({ command: c.default.commands.INJECT_INTERCEPTOR });
