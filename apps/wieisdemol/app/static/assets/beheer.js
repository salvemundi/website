"use strict";
/* Beheerpagina voor de spelleiding. De server bewaart alles; deze pagina leest en schrijft de hele spelstaat. */

const TOKEN_KEY = "molproef-token";
let S = null, status = null, token = lsGet(TOKEN_KEY);
const ui = {view:"overzicht", testId:"t1", step:null, showMol:false, editQ:null, editStd:null, loginErr:"", present:null};
let saveTimer = null, saving = false, again = false, saveState = "saved";

/* ---------- spelregels ---------- */
const T = id => S.tests.find(t => t.id === id);
const P = id => S.players.find(p => p.id === id);
const stdOf = key => S.std.find(s => s.key === key);
const testName = t => t.final ? "Finale" : `Test ${t.nr}`;
const activePlayers = () => S.players.filter(p => p.status === "actief");
function participants(t){ return S.players.filter(p => p.status === "actief" || (p.outNr != null && p.outNr >= t.nr)); }

const MOL_COUNT = 2;
const molIds = () => S.molIds || [];
const isMol = id => molIds().includes(id);
const molLabel = i => `Mol ${i + 1}`;
const molNames = () => molIds().map(id => P(id)?.name).filter(Boolean);
const molsReady = () => molIds().length === MOL_COUNT;
const asList = v => Array.isArray(v) ? v : v == null ? [] : [v];

function qView(t, q){
  if (q.kind === "mol") return {text:"Wie zijn de mollen?", options:null, mol:true};
  if (q.kind === "std") { const s = stdOf(q.stdKey); return {text:s ? s.text : "(verwijderde vraag)", options:s ? s.options : []}; }
  if (q.kind === "ref") {
    const rt = T(q.ref.test), rq = rt && rt.questions.find(x => x.id === q.ref.q);
    if (!rq) return {text:"(verwijderde vraag)", options:[]};
    const v = qView(rt, rq);
    return {text:`${rt.proef}: ${v.text}`, options:v.options, refTest:rt};
  }
  return {text:q.text, options:q.options};
}
/* De juiste antwoorden zijn wat de mol zelf heeft ingevuld (via de eigen mol-link).
   Een vraag uit een eerdere proef (finale) valt terug op wat de mol toen invulde. */
function keyOf(t, q, molId, depth = 0){
  const own = t.molKeys?.[molId]?.answers?.[q.id];
  if (own != null) return own;
  if (q.kind === "ref" && depth < 3) {
    const rt = T(q.ref.test), rq = rt && rt.questions.find(x => x.id === q.ref.q);
    return rq ? keyOf(rt, rq, molId, depth + 1) : null;
  }
  return null;
}
const molDone = (t, molId) => !!t.molKeys?.[molId];
const scoredQs = t => t.questions.filter(q => q.kind !== "mol");
/* Lijst van wat nog ontbreekt: per mol of die de test heeft ingevuld en welke vragen nog geen antwoord hebben. */
function missingAnswers(t){
  if (!molsReady()) return [{text:"Kies eerst beide mollen."}];
  const out = [];
  molIds().forEach((m, i) => {
    if (!molDone(t, m)) out.push({mol:i, text:`${molLabel(i)} heeft deze test nog niet ingevuld.`});
    else scoredQs(t).forEach(q => { if (keyOf(t, q, m) == null) out.push({mol:i, q, text:`${molLabel(i)} heeft geen antwoord op "${qView(t, q).text}".`}); });
  });
  return out;
}
const maxPoints = t => scoredQs(t).length * MOL_COUNT + (t.questions.some(q => q.kind === "mol") ? MOL_COUNT : 0);
function permutations(arr){
  if (arr.length <= 1) return [arr];
  return arr.flatMap((x, i) => permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map(r => [x, ...r]));
}
/* Kandidaten vullen elke vraag in voor 'Mol A' en 'Mol B'. Ze weten niet wie welke mol is,
   dus per test telt de koppeling (A=mol 1, B=mol 2 of andersom) die de meeste punten geeft. */
function scoreOf(t, pid){
  const a = t.attempts[pid], jokers = t.jokers[pid] || 0;
  if (!a) return {made:false, good:0, score:jokers, ms:Infinity, molGuess:[], molHits:0, jokers, asMol:molDone(t, pid)};
  const qs = scoredQs(t);
  let best = 0;
  for (const perm of permutations(molIds())) {
    let g = 0;
    qs.forEach(q => { const v = asList(a.answers[q.id]); perm.forEach((m, slot) => { const c = keyOf(t, q, m); if (c != null && v[slot] === c) g++; }); });
    best = Math.max(best, g);
  }
  const mq = t.questions.find(q => q.kind === "mol");
  const guess = mq ? [...new Set(asList(a.answers[mq.id]))] : [];
  const molHits = guess.filter(isMol).length;
  const good = best + molHits;
  return {made:true, good, score:good + jokers, ms:a.ms, molGuess:guess, molHits, jokers, asMol:molDone(t, pid)};
}
function ranking(t){
  return participants(t).map(p => ({p, ...scoreOf(t, p.id), isMol:isMol(p.id), exempt:!!t.exempt[p.id]}))
    .sort((a, b) => b.score - a.score || a.ms - b.ms);
}
function proposedOut(t){
  const pool = ranking(t).filter(r => !r.isMol && !r.exempt).sort((a, b) => a.score - b.score || b.ms - a.ms);
  return pool.slice(0, Math.max(0, Math.min(t.eliminate, pool.length - 1))).map(r => r.p.id);
}
const hasMade = (t, pid) => !!(t.attempts[pid] || t.molKeys?.[pid]);
const madeCount = t => participants(t).filter(p => hasMade(t, p.id)).length;
const revealDone = t => t.final ? !!(t.finaleShown?.winner && t.finaleShown?.mol) : participants(t).every(p => t.revealed[p.id]);

/* ---------- server ---------- */
function setToken(v){ token = v; lsSet(TOKEN_KEY, v); }
function normalize(st){
  st.tests.forEach(t => { t.jokers ||= {}; t.exempt ||= {}; t.revealed ||= {}; t.eliminated ||= []; t.finaleShown ||= {}; t.started ||= {}; t.molKeys ||= {}; });
  if (!Array.isArray(st.molIds)) st.molIds = st.molId ? [st.molId] : [];
  delete st.molId; delete st.molCodes; st.codes ||= {};
  return st;
}
async function loadState(){ S = normalize(await api("/api/admin/state", {token})); }
function save(){ saveState = "pending"; paintSave(); clearTimeout(saveTimer); saveTimer = setTimeout(flush, 350); }
async function flush(){
  clearTimeout(saveTimer); saveTimer = null;
  if (saving) { again = true; return; }
  saving = true; saveState = "saving"; paintSave();
  try { const r = await api("/api/admin/state", {method:"PUT", token, body:{state:S}}); S.rev = r.rev; saveState = "saved"; }
  catch (e) { saveState = "error"; if (e.status === 401) return loggedOut(); toast("Opslaan mislukt: " + e.message, true); }
  finally { saving = false; paintSave(); if (again) { again = false; flush(); } }
}
const busy = () => !!saveTimer || saving;
async function settled(){ if (saveTimer) await flush(); while (saving) await new Promise(r => setTimeout(r, 80)); }
async function refresh(){ await settled(); await loadState(); }
function paintSave(){
  const el = document.getElementById("savestate"); if (!el) return;
  const txt = {saved:"Alles opgeslagen", pending:"Wijzigingen…", saving:"Opslaan…", error:"Opslaan mislukt"}[saveState];
  el.className = "savestate" + (saveState === "error" ? " error" : "");
  el.innerHTML = `${ic(saveState === "error" ? "alert" : saveState === "saved" ? "check" : "clock")} ${txt}`;
}
function loggedOut(){ setToken(null); S = null; ui.present = null; render(); }

// Live meekijken: ingeleverde tests komen binnen terwijl de beheerpagina open staat.
setInterval(async () => {
  if (!S || !token || document.hidden || busy()) return;
  const a = document.activeElement;
  if (a && a.matches("input,textarea,select")) return;
  try {
    const rev = S.rev;
    const fresh = await api("/api/admin/state", {token});
    if (fresh.rev === rev || busy()) return;
    S = normalize(fresh);
    if (!ui.present && ["overzicht", "test", "kandidaten"].includes(ui.view)) render();
  } catch (e) { if (e.status === 401) loggedOut(); }
}, 4000);

/* ---------- render ---------- */
const app = document.getElementById("app"), presentEl = document.getElementById("present");
function render(){
  if (!status) { app.innerHTML = ""; return; }
  if (!status.setup) return renderSetup();
  if (!token || !S) return renderLogin();
  renderApp();
  renderPresent();
}

function renderSetup(){
  presentEl.innerHTML = "";
  app.innerHTML = `<div class="center-screen"><form class="lock enter stack" data-form="setup" style="max-width:440px;text-align:left">
    <img class="logo" src="/assets/logo.svg" alt="Salve Mundi" style="height:64px;margin:0 auto 6px"><h1 style="text-align:center">Wie is de mol?</h1>
    <p class="muted" style="text-align:center;margin-bottom:18px">Maak het spel aan. Er worden 40 kandidaten, 8 proeven en een finale klaargezet; alles is daarna aan te passen.</p>
    <label class="field"><span>Naam van het kamp</span><input type="text" id="s-camp" placeholder="Bijv. Zomerkamp 2026" autofocus></label>
    <label class="field"><span>Wachtwoord spelleiding (minimaal 12 tekens, met letters en cijfers)</span><input type="password" id="s-pin" autocomplete="new-password" minlength="12"></label>
    <label class="field"><span>Wachtwoord herhalen</span><input type="password" id="s-pin2" autocomplete="new-password" minlength="12"></label>
    <div class="err">${h(ui.loginErr)}</div>
    <button class="btn btn-primary btn-lg btn-block" type="submit">Spel aanmaken</button>
  </form></div>`;
  ui.loginErr = "";
}
function renderLogin(){
  presentEl.innerHTML = "";
  app.innerHTML = `<div class="center-screen"><form class="lock enter stack" data-form="login">
    <img class="logo" src="/assets/logo.svg" alt="Salve Mundi">
    <h1>Beheer</h1>
    <p class="muted" style="margin-bottom:14px">${h(status.camp)}. Alleen voor de spelleiding.</p>
    <input type="password" id="pin" autocomplete="current-password" autofocus aria-label="Wachtwoord" placeholder="Wachtwoord">
    <div class="err">${h(ui.loginErr)}</div>
    <button class="btn btn-primary btn-lg btn-block" type="submit">Inloggen</button>
    <p class="faint small">Kandidaat? Ga naar <a href="/invul" style="color:var(--accent)">de invulpagina</a>.</p>
  </form></div>`;
  ui.loginErr = "";
}

function navItem(view, icon, label, extra = ""){
  return `<button data-act="go" data-view="${view}" aria-current="${ui.view === view}">${ic(icon)}<span class="tt">${label}</span>${extra}</button>`;
}
function statusDot(t){ return `<i class="sd ${t.status === "open" ? "open" : t.status === "afgerond" ? "klaar" : t.status === "gesloten" ? "dicht" : ""}" title="${statusText(t)}"></i>`; }
function statusText(t){ return {open:"Open", gesloten:"Gesloten", afgerond:"Afgerond", concept:"Nog niet gestart"}[t.status] || t.status; }

function renderApp(){
  const main = ui.view === "test" ? viewTest() : ui.view === "kandidaten" ? viewPlayers() : ui.view === "mol" ? viewMol() : ui.view === "instellingen" ? viewSettings() : viewOverview();
  app.innerHTML = `<div class="layout">
    <aside class="side">
      <div class="brand"><img class="logo" src="/assets/logo.svg" alt="Salve Mundi"><b>Wie is de mol?</b><span>${h(S.camp)}</span></div>
      <nav class="nav" aria-label="Hoofdmenu">
        ${navItem("overzicht", "home", "Overzicht")}
        <div class="nav-h">Tests</div>
        ${S.tests.map(t => `<button data-act="go" data-view="test" data-test="${t.id}" aria-current="${ui.view === "test" && ui.testId === t.id}">
          <span class="tn">${t.final ? "F" : t.nr}</span><span class="tt">${h(t.proef)}</span>${statusDot(t)}</button>`).join("")}
        <div class="nav-h">Spel</div>
        ${navItem("kandidaten", "users", "Kandidaten", `<span class="cnt">${activePlayers().length}/${S.players.length}</span>`)}
        ${navItem("mol", "shield", "De mollen", molsReady() ? "" : `<i class="sd" style="background:var(--out)" title="Nog niet gekozen"></i>`)}
        ${navItem("instellingen", "settings", "Instellingen en back-up")}
      </nav>
      <div class="side-foot">
        <span id="savestate" class="savestate"></span>
        <button class="btn btn-ghost btn-sm" style="justify-content:flex-start" data-act="logout">${ic("logout")} Uitloggen</button>
      </div>
    </aside>
    <main class="main">${main}</main>
  </div>`;
  paintSave();
}

/* ---- overzicht ---- */
function invulUrl(){ return (status.publicUrl || location.origin) + "/invul"; }
/* Persoonlijke link: wie deze link opent, vult in als deze kandidaat (of, bij een mol, de juiste antwoorden). */
const personLink = id => S.codes?.[id] ? `${invulUrl()}?code=${encodeURIComponent(S.codes[id])}` : "";
function linkBox(){
  const local = !status.publicUrl && /^(localhost|127\.|\[::1\])/.test(location.hostname);
  return `<div class="notice">${ic("info")}<div>Iedereen vult de test in via een <b>persoonlijke link</b>, zodat zeker is dat de naam klopt. Je vindt de links bij <button class="btn btn-sm" data-act="go" data-view="kandidaten">${ic("users")} Kandidaten</button>. Stuur iedereen één keer de eigen link; die werkt voor alle tests. De mollen gebruiken ook gewoon hun eigen link: daarmee vullen ze automatisch de test over zichzelf in.</div></div>
    ${local ? `<p class="faint small" style="margin-top:10px;max-width:70ch">Andere apparaten kunnen <b>localhost</b> niet openen. Start de server met MOLPROEF_URL (bijvoorbeeld <b>http://192.168.1.20:8080</b>, te vinden met <b>ipconfig</b>), dan kloppen de links ook op telefoons.</p>` : ""}`;
}
function nextStep(){
  if (!molsReady()) return {title:"Kies de twee mollen", text:"Voordat er een test kan beginnen, moet je in het geheim beide mollen kiezen.", btn:"Naar De mollen", view:"mol"};
  const t = S.tests.find(x => x.status !== "afgerond");
  const prev = S.tests.filter(x => x.status === "afgerond" && !x.final).pop();
  if (prev && !revealDone(prev) && (!t || !Object.keys(t.attempts).length) && t?.status !== "open")
    return {title:`Onthulling van ${testName(prev)}`, text:"De uitslag staat vast. Laat de kandidaten hun groene of rode scherm zien.", btn:"Naar de onthulling", test:prev.id, step:"onthulling"};
  if (!t) { const f = S.tests.find(x => x.final); return revealDone(f) ? {title:"Het spel is afgelopen", text:"De winnaar en de mollen zijn bekend gemaakt."} : {title:"Finale-onthulling", text:"Maak de winnaar bekend en ontmasker de mollen.", btn:"Naar de onthulling", test:f.id, step:"onthulling"}; }
  const miss = missingAnswers(t).length, made = madeCount(t), n = participants(t).length;
  const molsLeft = molIds().filter(m => !molDone(t, m)).length;
  if (t.status === "open") return {title:`${testName(t)} loopt`, text:`${made} van ${n} kandidaten hebben ingeleverd.${molsLeft ? ` Nog ${plural(molsLeft, "mol moet", "mollen moeten")} via de eigen mol-link invullen.` : " Beide mollen hebben ingevuld."} Sluit de test als iedereen klaar is.`, btn:"Bekijk de voortgang", test:t.id, step:"afnemen"};
  if (made) return {title:`Uitslag van ${testName(t)}`, text:miss ? `Er ontbreken nog antwoorden van de mollen (${miss}). Zet de test opnieuw open zodat de mollen kunnen invullen.` : "Alle tests zijn binnen. Controleer de scores en zet de uitslag vast.", btn:miss ? "Bekijk wat ontbreekt" : "Naar de uitslag", test:t.id, step:miss ? "vragen" : "uitslag"};
  return {title:`${testName(t)} is klaar om te openen`, text:"Zet de test open zodra de proef voorbij is. Kandidaten vullen hem in op de invulpagina; de mollen vullen hem over zichzelf in via hun eigen mol-link. Hun antwoorden zijn de juiste antwoorden.", btn:"Naar afnemen", test:t.id, step:"afnemen"};
}
function viewOverview(){
  const n = nextStep(), open = S.tests.find(t => t.status === "open");
  return `<header class="ph"><div><h1>Overzicht</h1>
    <p>${activePlayers().length} van ${S.players.length} kandidaten nog in het spel.${open ? ` ${testName(open)} staat open.` : ""}</p></div></header>
  ${ui.weakPw ? `<div class="notice bad" style="margin-bottom:16px">${ic("alert")}<div><b>Het wachtwoord is te zwak.</b> Kies bij Instellingen en back-up een wachtwoord van minimaal 12 tekens met letters en cijfers. <button class="btn btn-sm" data-act="go" data-view="instellingen">Wachtwoord wijzigen</button></div></div>` : ""}
  <section class="panel next">
    <div style="flex:1;min-width:260px"><h2>${h(n.title)}</h2><p>${h(n.text)}</p></div>
    ${n.btn ? `<button class="btn btn-primary btn-lg" data-act="go" data-view="${n.view || "test"}" ${n.test ? `data-test="${n.test}" data-step="${n.step}"` : ""}>${h(n.btn)} ${ic("right")}</button>` : ""}
  </section>
  <section class="sec"><h2>Invulpagina voor kandidaten</h2>
    <p class="lead">Kandidaten openen hun persoonlijke link op een telefoon, tablet of laptop. Ze zien alleen de test die open staat.</p>
    ${linkBox()}</section>
  <section class="sec"><h2>Alle tests</h2>
    <div class="panel" style="overflow-x:auto"><table>
      <thead><tr><th>Test</th><th>Proef</th><th>Status</th><th class="num">Ingeleverd</th><th>Afgevallen</th></tr></thead>
      <tbody>${S.tests.map(t => {
        const out = t.eliminated.map(id => P(id)?.name).filter(Boolean);
        return `<tr class="clickable" data-act="go" data-view="test" data-test="${t.id}">
          <td><b class="serif" style="font-size:20px;font-weight:400">${testName(t)}</b></td>
          <td>${h(t.proef)}</td>
          <td><span class="row" style="gap:8px">${statusDot(t)} ${statusText(t)}</span></td>
          <td class="num">${t.status === "concept" ? `<span class="faint">–</span>` : `${madeCount(t)}<span class="faint"> / ${participants(t).length}</span>`}</td>
          <td class="small ${out.length ? "" : "faint"}">${out.length ? h(out.join(", ")) : t.final ? "" : "–"}</td></tr>`;
      }).join("")}</tbody>
    </table></div></section>`;
}

/* ---- test ---- */
function stepInfo(t){
  const miss = missingAnswers(t).length, made = madeCount(t), n = participants(t).length;
  return [
    {key:"vragen", label:"Vragen en antwoorden", sub:miss ? `Mollen: ${molIds().filter(m => molDone(t, m)).length} / ${MOL_COUNT} ingevuld` : `${t.questions.length} vragen, compleet`, done:!miss},
    {key:"afnemen", label:"Afnemen", sub:t.status === "open" ? `Open · ${made} / ${n}` : t.status === "concept" ? "Nog niet geopend" : `${made} / ${n} ingeleverd`, done:t.status === "gesloten" || t.status === "afgerond", live:t.status === "open"},
    {key:"uitslag", label:"Uitslag", sub:t.status === "afgerond" ? (t.final ? "Winnaar bekend" : `${t.eliminated.length} afgevallen`) : "Nog niet vastgezet", done:t.status === "afgerond"},
    {key:"onthulling", label:"Onthulling", sub:revealDone(t) ? "Getoond" : t.final ? "Winnaar en mol" : `${Object.keys(t.revealed).length} / ${n} getoond`, done:revealDone(t)}
  ];
}
function defaultStep(t){
  const steps = stepInfo(t);
  if (t.status === "open") return "afnemen";
  if (t.status === "afgerond") return "onthulling";
  if (t.status === "gesloten") return steps[0].done ? "uitslag" : "vragen";
  return "vragen";
}
function molStatusBox(t){
  if (!molsReady()) return `<div class="notice bad">${ic("alert")}<div>Kies eerst beide mollen bij De mollen.</div></div>`;
  return `<div class="chips">${molIds().map((m, i) => `<span class="chip ${molDone(t, m) ? "done" : ""}">${ic(molDone(t, m) ? "check" : "clock")} ${molLabel(i)}${ui.showMol ? ` (${h(P(m)?.name)})` : ""}: ${molDone(t, m) ? "ingevuld" : "nog niet ingevuld"}</span>`).join("")}</div>`;
}
function viewTest(){
  const t = T(ui.testId) || S.tests[0];
  const step = ui.step || defaultStep(t);
  const steps = stepInfo(t);
  const tag = t.status === "open" ? `<span class="tag go"><i class="dot"></i>Open voor kandidaten</span>` : t.status === "afgerond" ? `<span class="tag acc">${ic("check")} Afgerond</span>` : t.status === "gesloten" ? `<span class="tag">Gesloten</span>` : `<span class="tag">Nog niet gestart</span>`;
  const body = step === "vragen" ? stepVragen(t) : step === "afnemen" ? stepAfnemen(t) : step === "uitslag" ? stepUitslag(t) : stepOnthulling(t);
  return `<header class="ph"><div><h1>${testName(t)}: ${h(t.proef)}</h1>
      <p>${participants(t).length} kandidaten · ${t.questions.length} vragen${t.final ? " · niemand valt af, de hoogste score wint" : ` · ${t.eliminate} afvallers`}</p></div>
    <span class="spacer"></span>${tag}</header>
  <nav class="steps" aria-label="Stappen">${steps.map((s, i) => `<button data-act="step" data-v="${s.key}" aria-current="${step === s.key}" class="${s.done ? "done" : ""} ${s.live ? "live" : ""}">
      <span class="sn">${s.done ? ic("check") : i + 1}</span><span style="min-width:0"><b>${s.label}</b><small>${h(s.sub)}</small></span></button>`).join("")}</nav>
  <div style="margin-top:28px">${body}</div>`;
}

function stepVragen(t){
  const miss = missingAnswers(t).length, hasAtt = Object.keys(t.attempts).length > 0;
  const groups = [
    ["Over de mollen", "Standaardvragen", t.questions.filter(q => q.kind === "std")],
    ["Over de proeven", t.final ? "Vragen uit eerdere proeven en de finaleproef" : `Vragen over ${t.proef}`, t.questions.filter(q => q.kind === "proef" || q.kind === "ref")],
    ["Slotvraag", "Eén punt per goed geraden mol", t.questions.filter(q => q.kind === "mol")]
  ];
  let n = 0;
  const used = new Set(t.questions.filter(q => q.kind === "std").map(q => q.stdKey));
  const freeStd = S.std.filter(s => !used.has(s.key));
  const usedRef = new Set(t.questions.filter(q => q.kind === "ref").map(q => q.ref.q));
  const refOpts = t.final ? S.tests.filter(x => !x.final).flatMap(x => x.questions.filter(q => q.kind === "proef" && !usedRef.has(q.id)).map(q => ({x, q}))) : [];
  return `
  <div class="grid2" style="grid-template-columns:1.4fr 1fr;align-items:start">
    <div class="panel pad stack">
      <label class="field"><span>Naam van de proef</span><input type="text" value="${h(t.proef)}" data-bind="proef"></label>
      <label class="field"><span>Omschrijving (alleen voor de spelleiding)</span><textarea data-bind="desc" rows="3">${h(t.desc)}</textarea></label>
    </div>
    <div class="panel pad stack">
      ${t.final ? `<p class="small muted">In de finale valt niemand af. De finalist met de hoogste score wint; de mollen doen niet mee voor de winst.</p>`
        : `<label class="field"><span>Aantal afvallers na deze test</span><input type="number" min="0" max="39" value="${t.eliminate}" data-bind="eliminate" style="max-width:120px"></label>
           <p class="small faint">De mollen en kandidaten met een vrijstelling vallen nooit af.</p>`}
    </div>
  </div>
  <div style="margin-top:20px">${miss
    ? `<div class="notice warn">${ic("alert")}<div><b>De juiste antwoorden komen van de mollen.</b> Elke mol vult deze test over zichzelf in via de eigen mol-link (zie De mollen), terwijl de test open staat.
        <ul style="margin:8px 0 0 18px">${missingAnswers(t).slice(0, 6).map(x => `<li>${h(x.text)}</li>`).join("")}${miss > 6 ? `<li>en nog ${miss - 6}…</li>` : ""}</ul></div></div>`
    : `<div class="notice ok">${ic("check")}<div>Beide mollen hebben alle vragen ingevuld.</div></div>`}
    <div style="margin-top:10px">${molStatusBox(t)}</div>
    ${hasAtt || Object.keys(t.molKeys).length ? `<div class="notice" style="margin-top:10px">${ic("info")}<div>Er zijn al tests ingeleverd. Vragen toevoegen, verwijderen of wijzigen verandert de scores, en de mollen hebben de nieuwe vraag dan nog niet beantwoord.</div></div>` : ""}
  </div>
  ${groups.map(([title, sub, qs], gi) => `<section class="qgroup"><h3>${title} <span>${sub} · ${qs.length}</span></h3>
    ${qs.map(q => qRow(t, q, ++n)).join("")}
    ${gi === 0 ? `<div class="addbar"><select data-act-change="add-std" aria-label="Standaardvraag toevoegen"><option value="">+ Standaardvraag toevoegen</option>${freeStd.map(s => `<option value="${s.key}">${h(s.text)}</option>`).join("")}</select></div>` : ""}
    ${gi === 1 ? `<div class="addbar"><button class="btn btn-sm" data-act="add-q">${ic("plus")} Eigen vraag over de proef</button>
        ${t.final ? `<select data-act-change="add-ref" aria-label="Vraag uit eerdere proef"><option value="">+ Vraag uit een eerdere proef</option>${refOpts.map(({x, q}) => `<option value="${x.id}|${q.id}">${h(x.proef)}: ${h(q.text)}</option>`).join("")}</select>` : ""}</div>` : ""}
  </section>`).join("")}`;
}
function qRow(t, q, n){
  const v = qView(t, q);
  if (q.kind === "proef" && ui.editQ === q.id) return `<div class="qrow"><div class="qn">${n}</div><div class="stack">
      <input type="text" value="${h(q.text)}" data-qedit="text" data-q="${q.id}" aria-label="Vraag">
      <textarea rows="${Math.max(3, q.options.length)}" data-qedit="options" data-q="${q.id}" aria-label="Antwoordopties, één per regel">${h(q.options.join("\n"))}</textarea>
      <div class="row"><button class="btn btn-sm btn-primary" data-act="q-done">Klaar</button><span class="faint small">Eén antwoordoptie per regel.</span></div></div><div></div></div>`;
  let choices, note = "";
  if (v.mol) {
    choices = `<span class="choice ${molsReady() ? "sel" : ""}">${ic("shield")} ${molIds().length ? `<span class="blur-name ${ui.showMol ? "show" : ""}">${h(molNames().join(" en "))}</span>` : "Nog geen mollen gekozen"}</span>
      <button class="btn btn-ghost btn-sm" data-act="toggle-mol">${ic(ui.showMol ? "eyeoff" : "eye")} ${ui.showMol ? "Verberg" : "Toon"}</button>`;
    note = `<div class="qnote">Kandidaten kiezen twee namen uit iedereen die nog in het spel zit.</div>`;
  } else {
    const keys = molIds().map(m => keyOf(t, q, m)), open = keys.filter(c => c == null).length + (MOL_COUNT - molIds().length);
    choices = molIds().length
      ? molIds().map((m, i) => `<span class="choice ${keys[i] != null ? "sel" : "dim"}">${keys[i] != null ? ic("check") : ""}${molLabel(i)}: ${keys[i] != null ? h(v.options[keys[i]] ?? "?") : "nog niet ingevuld"}</span>`).join("")
      : `<span class="choice dim">Nog geen mollen gekozen</span>`;
    note = `<div class="qnote ${open ? "miss" : ""}">${open ? `${ic("alert")} Wacht op de antwoorden van de mollen · ` : ""}Opties: ${v.options.map(h).join(" · ")}</div>`;
  }
  const acts = q.kind === "mol" ? "" : `${q.kind === "proef" ? `<button class="btn btn-ghost btn-icon" title="Bewerken" aria-label="Vraag bewerken" data-act="q-edit" data-q="${q.id}">${ic("edit")}</button>` : ""}
    <button class="btn btn-ghost btn-icon" title="Verwijderen" aria-label="Vraag verwijderen" data-act="q-del" data-q="${q.id}">${ic("trash")}</button>`;
  return `<div class="qrow"><div class="qn">${n}</div><div><div class="qt">${h(v.text)}</div><div class="choices">${choices}</div>${note}</div><div class="qacts">${acts}</div></div>`;
}

function stepAfnemen(t){
  const parts = participants(t).sort(byName);
  const made = parts.filter(p => hasMade(t, p.id)), todo = parts.filter(p => !hasMade(t, p.id));
  const pct = parts.length ? Math.round(made.length / parts.length * 100) : 0;
  const other = S.tests.find(x => x.status === "open" && x.id !== t.id);
  let control;
  if (t.status === "afgerond") control = `<div class="notice ok">${ic("check")}<div>De uitslag van deze test staat vast. Afnemen kan niet meer.</div></div>`;
  else if (t.status === "open") control = `<div class="row"><span class="live-dot">Open, ververst vanzelf</span><span class="spacer"></span><button class="btn btn-primary" data-act="test-close">Test sluiten</button></div>`;
  else control = `<div class="stack">
      <p class="muted">Zet de test open zodra de proef voorbij is. Kandidaten vullen hem dan in op de invulpagina. Er staat altijd maar één test tegelijk open.</p>
      ${other ? `<div class="notice warn">${ic("alert")}<div>${testName(other)} staat nog open en wordt dan gesloten.</div></div>` : ""}
      ${!molsReady() ? `<div class="notice bad">${ic("alert")}<div>Kies eerst beide mollen.</div></div>` : ""}
      <div><button class="btn btn-primary btn-lg" data-act="test-open" ${molsReady() ? "" : "disabled"}>${ic("play")} ${made.length ? "Test opnieuw openzetten" : "Test openzetten"}</button></div></div>`;
  return `<div class="grid2" style="grid-template-columns:1fr 1.3fr;align-items:start">
    <div class="panel pad stack">
      <div class="big">${made.length}<span class="faint" style="font-size:28px"> / ${parts.length}</span></div>
      <p class="muted">kandidaten hebben ingeleverd</p>
      <div class="progress"><i style="width:${pct}%"></i></div>
      <div style="padding-top:10px">${control}</div>
    </div>
    <div class="stack">
      <div class="panel pad stack">
        <h3 class="serif" style="font-size:22px">Invulpagina</h3>
        ${linkBox()}
      </div>
      <div class="panel pad stack">
        <h3 class="serif" style="font-size:22px">Mollen</h3>
        <p class="muted small">De mollen vullen de test over zichzelf in via hun eigen mol-link (zie De mollen). Hun antwoorden zijn de juiste antwoorden.</p>
        ${molStatusBox(t)}
      </div>
    </div>
  </div>
  <section class="sec"><h2>Nog niet ingeleverd <span class="faint" style="font-size:18px;margin-left:6px">${todo.length}</span></h2>
    <div class="chips">${todo.map(p => `<span class="chip">${t.started?.[p.id] ? `<span class="dot" style="color:var(--go)" title="Is bezig"></span>` : ""}${h(p.name)}</span>`).join("") || `<span class="muted">Iedereen heeft ingeleverd.</span>`}</div>
    ${todo.some(p => t.started?.[p.id]) ? `<p class="faint small" style="margin-top:10px">Een groene stip betekent dat de kandidaat al bezig is.</p>` : ""}</section>
  <section class="sec"><h2>Ingeleverd <span class="faint" style="font-size:18px;margin-left:6px">${made.length}</span></h2>
    <div class="chips">${made.map(p => `<span class="chip done">${h(p.name)} <span class="faint">${t.attempts[p.id] ? fmtTime(t.attempts[p.id].ms) : ui.showMol ? "mol" : "–"}</span>
      ${t.status !== "afgerond" ? `<button title="Test van ${h(p.name)} wissen" aria-label="Test van ${h(p.name)} wissen" data-act="att-del" data-p="${p.id}">${ic("x")}</button>` : ""}</span>`).join("") || `<span class="muted">Nog niemand.</span>`}</div></section>`;
}

function stepUitslag(t){
  const rows = ranking(t), miss = missingAnswers(t), done = t.status === "afgerond";
  const outIds = done ? t.eliminated : proposedOut(t);
  const notMade = rows.filter(r => !r.made).length;
  const winner = t.final ? rows.find(r => !r.isMol) : null;
  const blockers = [];
  if (miss.length) blockers.push(`Er ontbreken nog antwoorden van de mollen: ${miss.slice(0, 3).map(x => x.text).join(" ")}${miss.length > 3 ? ` (en nog ${miss.length - 3})` : ""} Zet de test opnieuw open zodat de mollen kunnen invullen.`);
  if (t.status === "open") blockers.push("De test staat nog open. Sluit hem eerst bij Afnemen.");
  if (t.status === "concept") blockers.push("De test is nog niet afgenomen.");
  const statusOf = r => {
    if (r.isMol && ui.showMol) return `<span class="tag acc">${ic("shield")} Mol</span>`;
    if (t.final) return r === winner ? `<span class="tag go">${ic("star")} Winnaar</span>` : "";
    if (r.exempt) return `<span class="tag go">Vrijstelling</span>`;
    return outIds.includes(r.p.id) ? `<span class="tag out"><i class="dot"></i>Valt af</span>` : `<span class="tag go"><i class="dot"></i>Door</span>`;
  };
  const summary = t.final
    ? `<div class="panel pad row" style="gap:18px"><div style="flex:1;min-width:240px"><p class="muted small">${blockers.length ? "Voorlopige winnaar" : "Winnaar"}</p><p class="serif" style="font-size:34px;margin-top:4px">${winner ? h(winner.p.name) : "–"}</p></div>
        <button class="btn btn-primary btn-lg" data-act="step" data-v="onthulling" ${blockers.length ? "disabled" : ""}>Naar de onthulling ${ic("right")}</button></div>`
    : `<div class="panel pad stack">
        <p class="muted small">${done ? "Afgevallen na deze test" : `Valt af als je nu vastzet (${outIds.length})`}</p>
        <div class="chips">${outIds.map(id => `<span class="chip red">${h(P(id)?.name)}</span>`).join("") || `<span class="muted">Niemand</span>`}</div>
        <div class="row" style="padding-top:6px">${done
          ? `<button class="btn" data-act="undo-result">Uitslag terugdraaien</button><button class="btn btn-primary" data-act="step" data-v="onthulling">Naar de onthulling ${ic("right")}</button>`
          : `<button class="btn btn-primary btn-lg" data-act="lock-result" ${blockers.length ? "disabled" : ""}>${ic("check")} Uitslag vastzetten</button>`}</div>
      </div>`;
  return `${blockers.length && !done ? `<div class="notice bad" style="margin-bottom:14px">${ic("alert")}<div>${blockers.join(" ")}</div></div>` : ""}
  ${notMade && !done && t.status !== "concept" ? `<div class="notice warn" style="margin-bottom:14px">${ic("alert")}<div>${plural(notMade, "kandidaat heeft", "kandidaten hebben")} de test niet gemaakt en ${notMade === 1 ? "krijgt" : "krijgen"} alleen punten voor jokers.</div></div>` : ""}
  ${summary}
  <section class="sec"><div class="row" style="margin-bottom:12px"><h2 class="serif" style="font-size:26px">Scores</h2><span class="spacer"></span>
    <span class="faint small">Hoogste score bovenaan; bij gelijke score telt de snelste tijd. Per vraag 1 punt per mol; Mol A/B wordt gekoppeld op de manier die de kandidaat de meeste punten geeft.</span>
    <button class="btn btn-sm" data-act="toggle-mol">${ic(ui.showMol ? "eyeoff" : "eye")} ${ui.showMol ? "Verberg de mollen" : "Toon de mollen"}</button></div>
  <div class="panel" style="overflow-x:auto"><table>
    <thead><tr><th class="num">#</th><th>Kandidaat</th><th class="num">Goed</th><th>Jokers</th>${t.final ? "" : "<th>Vrijstelling</th>"}<th class="num">Score</th><th class="num">Tijd</th><th>Mollen geraden</th><th>Status</th></tr></thead>
    <tbody>${rows.map((r, i) => `<tr class="${!t.final && outIds.includes(r.p.id) ? "out" : ""}">
      <td class="num faint">${i + 1}</td>
      <td>${h(r.p.name)}</td>
      <td class="num">${r.made ? `${r.good}<span class="faint"> / ${maxPoints(t)}</span>` : r.asMol && ui.showMol ? `<span class="faint">vulde in als mol</span>` : `<span class="faint">geen test</span>`}</td>
      <td><span class="stepper"><button aria-label="Joker eraf" data-act="joker" data-p="${r.p.id}" data-v="-1" ${done || !r.jokers ? "disabled" : ""}>−</button><span>${r.jokers}</span><button aria-label="Joker erbij" data-act="joker" data-p="${r.p.id}" data-v="1" ${done ? "disabled" : ""}>+</button></span></td>
      ${t.final ? "" : `<td><input type="checkbox" aria-label="Vrijstelling voor ${h(r.p.name)}" data-act-change="exempt" data-p="${r.p.id}" ${r.exempt ? "checked" : ""} ${done || r.isMol ? "disabled" : ""}></td>`}
      <td class="num"><b>${r.score}</b></td>
      <td class="num muted">${fmtTime(r.ms)}</td>
      <td>${!r.molGuess.length ? `<span class="faint">–</span>` : r.molHits ? `<span class="row" style="color:var(--go-text);gap:4px">${ic("check")} ${r.molHits} / ${MOL_COUNT}</span>` : `<span class="row muted" style="gap:4px">${ic("x")} 0 / ${MOL_COUNT}</span>`}</td>
      <td>${statusOf(r)}</td></tr>`).join("")}</tbody>
  </table></div></section>`;
}

function stepOnthulling(t){
  if (t.final) {
    const ok = !missingAnswers(t).length && t.status !== "open" && t.status !== "concept";
    return `<div class="panel pad stack" style="max-width:720px">
      <h2 class="serif" style="font-size:28px">Finale-onthulling</h2>
      <p class="muted">Zet dit scherm op de beamer. Eerst maak je de winnaar bekend, daarna ontmasker je de mollen. Het scherm sluiten kan alleen met het wachtwoord.</p>
      ${ok ? "" : `<div class="notice bad">${ic("alert")}<div>Sluit eerst de finaletest en vul alle juiste antwoorden in.</div></div>`}
      <div><button class="btn btn-primary btn-lg" data-act="present" data-v="finale" ${ok ? "" : "disabled"}>${ic("play")} Finale-onthulling starten</button></div></div>`;
  }
  if (t.status !== "afgerond") return `<div class="notice">${ic("info")}<div>Zet eerst de uitslag vast. Daarna kun je hier de onthulling starten.</div></div>`;
  const parts = participants(t), shown = parts.filter(p => t.revealed[p.id]).length;
  return `<div class="panel pad stack" style="max-width:720px">
    <h2 class="serif" style="font-size:28px">Onthulling</h2>
    <p class="muted">Zet dit scherm op de beamer. Elke kandidaat klikt op de eigen naam: na een paar seconden wordt het scherm groen (door) of rood (af). Het scherm sluiten kan alleen met het wachtwoord.</p>
    <p>${shown} van ${parts.length} schermen getoond · ${t.eliminated.filter(id => t.revealed[id]).length} van ${t.eliminated.length} rode schermen</p>
    <div class="row"><button class="btn btn-primary btn-lg" data-act="present" data-v="reveal">${ic("play")} ${shown ? "Onthulling verder" : "Onthulling starten"}</button>
    ${shown ? `<button class="btn" data-act="reveal-reset">Opnieuw beginnen</button>` : ""}</div></div>`;
}

/* ---- kandidaten ---- */
function viewPlayers(){
  const locked = S.tests.some(t => Object.keys(t.attempts).length);
  return `<header class="ph"><div><h1>Kandidaten</h1>
    <p>${activePlayers().length} van ${S.players.length} nog in het spel. Pas namen direct in de lijst aan; wie afvalt, verdwijnt vanzelf uit de volgende tests.</p></div></header>
  <div class="notice" style="margin-bottom:16px">${ic("info")}<div>Stuur iedereen één keer de <b>eigen</b> link (bijvoorbeeld in een privébericht). Met die link vult die persoon alle tests in; kiezen wie je bent kan niet meer. Is een link bij de verkeerde persoon terechtgekomen, maak dan een nieuwe (${ic("refresh")}) en stuur die opnieuw.</div></div>
  <div class="grid2" style="grid-template-columns:1.5fr 1fr;align-items:start">
    <div class="panel" style="overflow-x:auto"><table>
      <thead><tr><th class="num">#</th><th>Naam</th><th>Status</th><th>Persoonlijke link</th><th></th></tr></thead>
      <tbody>${S.players.map((p, i) => `<tr>
        <td class="num faint">${i + 1}</td>
        <td><input type="text" value="${h(p.name)}" data-pname="${p.id}" aria-label="Naam kandidaat ${i + 1}"></td>
        <td>${p.status === "actief" ? `<span class="tag go"><i class="dot"></i>In het spel</span>` : `<span class="tag out">Af na ${p.outNr === 9 ? "finale" : "test " + p.outNr}</span>`}</td>
        <td><span class="row" style="gap:4px;flex-wrap:nowrap">${personLink(p.id)
          ? `<button class="btn btn-sm" data-act="copy-person" data-p="${p.id}" title="${h(personLink(p.id))}">${ic("copy")} Kopieer link</button>
             <button class="btn btn-ghost btn-icon btn-sm" title="Nieuwe link maken (de oude werkt dan niet meer)" aria-label="Nieuwe link voor ${h(p.name)}" data-act="new-code" data-p="${p.id}">${ic("refresh")}</button>`
          : `<span class="faint small">wordt aangemaakt…</span>`}</span></td>
        <td class="num"><button class="btn btn-ghost btn-icon" title="Verwijderen" aria-label="${h(p.name)} verwijderen" data-act="p-del" data-p="${p.id}">${ic("trash")}</button></td></tr>`).join("")}</tbody>
    </table></div>
    <div class="panel pad stack" style="position:sticky;top:24px">
      <h3 class="serif" style="font-size:24px">Namen plakken</h3>
      <p class="muted small">Eén naam per regel, bijvoorbeeld uit een Excel-lijst.</p>
      <textarea id="bulk" rows="10" placeholder="Sanne&#10;Daan&#10;Noor&#10;…"></textarea>
      <div class="row"><button class="btn btn-primary" data-act="bulk-replace" ${locked ? "disabled" : ""}>Vervang de lijst</button><button class="btn" data-act="bulk-add">Voeg toe</button></div>
      ${locked ? `<p class="faint small">Vervangen kan niet meer: er zijn al tests ingeleverd.</p>` : ""}
      <div style="border-top:1px solid var(--line);padding-top:14px"><button class="btn btn-sm" data-act="p-add">${ic("plus")} Eén kandidaat toevoegen</button></div>
    </div>
  </div>`;
}

/* ---- mol ---- */
function viewMol(){
  const veil = inner => `<div class="veil ${ui.showMol ? "" : "closed"}"><div class="veil-in">${inner}</div>${ui.showMol ? "" : `<div class="veil-cover"><button class="btn btn-lg" data-act="toggle-mol">${ic("eye")} Toon de mollen</button></div>`}</div>`;
  const sorted = [...S.players].sort(byName);
  const slot = i => {
    const id = molIds()[i], other = molIds()[1 - i];
    return `<div class="panel pad stack">
      <p class="faint small">${molLabel(i)}</p>
      <p class="display" style="font-size:44px">${id ? h(P(id)?.name) : "nog niemand"}</p>
      <label class="field"><span>${molLabel(i)} kiezen</span><select data-act-change="mol" data-slot="${i}"><option value="">Kies een kandidaat</option>
        ${sorted.filter(p => p.id !== other).map(p => `<option value="${p.id}" ${p.id === id ? "selected" : ""}>${h(p.name)}</option>`).join("")}</select></label>
    </div>`;
  };
  return `<header class="ph"><div><h1>De mollen</h1>
    <p>Kies in het geheim de twee mollen. Na elke proef vult elke mol via de eigen persoonlijke link de test over zichzelf in; die antwoorden zijn de juiste antwoorden voor alle kandidaten. Alles blijft verborgen tot je op Toon klikt.</p></div>
    <span class="spacer"></span>${ui.showMol ? `<button class="btn" data-act="toggle-mol">${ic("eyeoff")} Verbergen</button>` : ""}</header>
  ${veil(`<div class="grid2">${slot(0)}${slot(1)}</div>
    <div class="notice" style="margin-top:14px">${ic("info")}<div>De mollen krijgen dezelfde soort persoonlijke link als iedereen (zie Kandidaten). Opent een mol die link, dan vult die automatisch de test over zichzelf in. Vertel de mollen dat ze hun antwoorden zorgvuldig invullen, want daarmee worden alle kandidaten nagekeken.</div></div>`)}
  <section class="sec"><h2>Standaardvragen</h2><p class="lead">Deze vragen over de mollen komen in de tests terug. Kandidaten beantwoorden elke vraag voor Mol A en Mol B; de mollen beantwoorden hem over zichzelf.</p>
    <div class="panel pad"><div class="kv">${S.std.map(s => stdRow(s)).join("")}</div></div></section>`;
}
function stdRow(s){
  if (ui.editStd === s.key) return `<div class="stack" style="grid-column:1/-1;padding:12px 0">
    <input type="text" value="${h(s.text)}" data-stdedit="text" data-k="${s.key}" aria-label="Vraag">
    <textarea rows="${Math.max(3, s.options.length)}" data-stdedit="options" data-k="${s.key}" aria-label="Opties, één per regel">${h(s.options.join("\n"))}</textarea>
    <div class="row"><button class="btn btn-sm btn-primary" data-act="std-done">Klaar</button><span class="faint small">Eén optie per regel. Wijzig geen opties meer als er al tests zijn ingeleverd.</span></div></div>`;
  return `<div class="k"><button class="btn btn-ghost btn-icon btn-sm" title="Bewerken" aria-label="Vraag bewerken" data-act="std-edit" data-k="${s.key}">${ic("edit")}</button><span>${h(s.text)}</span></div>
    <div class="v"><div class="choices" style="margin:0;justify-content:flex-end">${s.options.map(o => `<span class="choice">${h(o)}</span>`).join("")}</div></div>`;
}

/* ---- instellingen ---- */
function viewSettings(){
  return `<header class="ph"><div><h1>Instellingen en back-up</h1>
    <p>Alles staat op de server in de Docker-container (in de map data). Maak toch na elke test een back-up op een USB-stick. Let op: de back-up bevat ook alle persoonlijke links.</p></div></header>
  <section class="sec" style="margin-top:0"><h2>Invulpagina</h2>${linkBox()}</section>
  <section class="sec"><h2>Back-up</h2>
    <div class="grid2">
      <div class="panel pad stack"><h3 class="serif" style="font-size:22px">Back-up downloaden</h3><p class="muted small">Eén bestand met kandidaten, de mollen, alle vragen en alle ingeleverde tests.</p><div><button class="btn btn-primary" data-act="export">${ic("download")} Downloaden</button></div></div>
      <div class="panel pad stack"><h3 class="serif" style="font-size:22px">Back-up terugzetten</h3><p class="muted small">Vervangt het hele spel door de inhoud van het bestand. Het wachtwoord blijft hetzelfde.</p><div><button class="btn" data-act="import">${ic("upload")} Bestand kiezen</button></div></div>
    </div></section>
  <section class="sec"><h2>Beveiliging</h2>
    <div class="grid2">
      <form class="panel pad stack" data-form="pin"><h3 class="serif" style="font-size:22px">Wachtwoord wijzigen</h3>
        <p class="muted small">Minimaal 12 tekens, met minstens één letter en één cijfer.</p>
        <input type="password" id="newpin" placeholder="Nieuw wachtwoord" autocomplete="new-password" minlength="12" aria-label="Nieuw wachtwoord">
        <input type="password" id="newpin2" placeholder="Nieuw wachtwoord herhalen" autocomplete="new-password" minlength="12" aria-label="Nieuw wachtwoord herhalen">
        <div><button class="btn" type="submit">Wachtwoord opslaan</button></div></form>
      <div class="panel pad stack"><h3 class="serif" style="font-size:22px">Opnieuw beginnen</h3><p class="muted small">Wist het hele spel. De server bewaart nog een kopie in de map data, maar via deze pagina is het niet terug te halen.</p><div><button class="btn btn-danger" data-act="reset">${ic("trash")} Alles wissen</button></div></div>
    </div></section>`;
}

/* ---- presentatie (beamer) ---- */
function renderPresent(){
  const pr = ui.present;
  if (!pr) { presentEl.innerHTML = ""; document.body.style.overflow = ""; return; }
  document.body.style.overflow = "hidden";
  const t = T(pr.test);
  let inner, stage = "";
  if (pr.kind === "reveal") {
    const parts = participants(t).sort(byName), left = parts.filter(p => !t.revealed[p.id]).length;
    inner = `<div class="present-top"><b>Onthulling</b><span class="faint">${testName(t)} · ${h(t.proef)}</span><span class="spacer"></span>
        <span class="muted">${t.eliminated.filter(id => t.revealed[id]).length} van ${t.eliminated.length} rode schermen getoond</span></div>
      <div class="present-main"><h1 class="display enter">${left ? "Wie is de volgende?" : "Iedereen weet het"}</h1>
        <p class="muted" style="font-size:18px;margin-top:14px">${left ? `Nog ${plural(left, "kandidaat", "kandidaten")}. Klik op je naam: groen is door, rood is einde spel.` : "Alle schermen zijn getoond."}</p>
        <div class="names" style="margin-top:26px">${parts.map(p => { const d = !!t.revealed[p.id], r = t.eliminated.includes(p.id);
          return `<button class="${d ? "done" : ""} ${d && r ? "r" : ""}" data-act="rv-pick" data-p="${p.id}">${h(p.name)}</button>`; }).join("")}</div></div>`;
    if (pr.pid) stage = stageHtml(P(pr.pid).name, t.eliminated.includes(pr.pid) ? "out" : "go", "");
  } else {
    const rows = ranking(t), winner = rows.find(r => !r.isMol), fs = t.finaleShown;
    inner = `<div class="present-top"><b>Finale</b><span class="faint">${h(S.camp)}</span></div>
      <div class="present-main" style="min-height:calc(100vh - 90px);display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center">
        <h1 class="display enter">Het einde van het spel</h1>
        <p class="muted" style="font-size:18px;margin-top:16px;max-width:52ch">Eerst wie het gewonnen heeft. Daarna wie al die tijd de mollen waren.</p>
        <div class="row" style="justify-content:center;margin-top:34px">
          <button class="btn btn-lg ${fs.winner ? "" : "btn-primary"}" data-act="fin-show" data-v="winner">${ic("star")} ${fs.winner ? "Winnaar nog eens" : "Toon de winnaar"}</button>
          <button class="btn btn-lg ${fs.winner && !fs.mol ? "btn-primary" : ""}" data-act="fin-show" data-v="mol">${ic("shield")} ${fs.mol ? "Mollen nog eens" : "Ontmasker de mollen"}</button></div>
        ${fs.winner && fs.mol ? `<p class="faint" style="margin-top:30px">Gefeliciteerd ${h(winner?.p.name)}. En ${h(molNames().join(" en "))}: goed gespeeld.</p>` : ""}</div>`;
    if (pr.fin) stage = pr.fin === "mol" ? stageHtml(molNames().join(" en "), "unmask", "De mollen zijn") : stageHtml(winner?.p.name ?? "Niemand", "go", "De winnaar is");
  }
  presentEl.innerHTML = `<div class="present" role="dialog" aria-label="Presentatie">${inner}</div>
    <div class="corner"><button class="btn btn-ghost btn-sm" data-act="present-exit">${ic("lock")} Spelleiding</button></div>
    ${stage}
    ${pr.unlock ? `<div class="pinbox"><form class="lock stack" data-form="present-unlock">${ic("lock")}<h1>Sluiten</h1><p class="muted">Voer het wachtwoord in om terug te gaan naar het beheer.</p>
      <input type="password" id="ppin" autocomplete="off" aria-label="Wachtwoord" placeholder="Wachtwoord"><div class="err">${h(pr.err || "")}</div>
      <div class="row" style="justify-content:center"><button class="btn btn-primary" type="submit">Sluiten</button><button class="btn btn-ghost" type="button" data-act="present-stay">Annuleren</button></div></form></div>` : ""}`;
  if (pr.unlock) document.getElementById("ppin").focus();
  if (stage) runStage(pr.fin === "mol" ? 6000 : pr.fin ? 5200 : 4600);
}

/* ---- onthulling: vingerafdrukscanner ----
   Elke naam krijgt een eigen vingerafdruk (altijd dezelfde voor dezelfde naam), opgebouwd uit
   gebroken ruggen zoals de kampachtergrond. De ruggen tekenen zich, een scanlijn gaat op en neer,
   en daarna kleurt alles groen (door), rood (af) of salie (ontmaskerd). */
function fingerprintSvg(seed){
  let x = 2166136261;
  for (const c of String(seed)) x = Math.imul(x ^ c.charCodeAt(0), 16777619) >>> 0;
  const rnd = () => (x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296;
  const cx = 100 + (rnd() - .5) * 10, cy = 116 + (rnd() - .5) * 12, paths = [];
  const tilt = (rnd() - .5) * .18, wob = 1 + rnd() * 1.6, phase = rnd() * 6.28;
  for (let i = 0; i < 20; i++) {
    // Kringen in eivorm (bovenkant hoger dan onderkant), zoals een 'kringpatroon'-vingerafdruk.
    const rx = 4 + i * 5, ryTop = 6 + i * 6, ryBot = 4 + i * 4.6, a0 = rnd() * Math.PI * 2;
    const steps = 30 + i * 6, pts = [];
    for (let s = 0; s <= steps; s++) {
      const a = a0 + Math.PI * 2 * s / steps, sin = Math.sin(a);
      pts.push([cx + rx * Math.cos(a), cy - (sin > 0 ? ryTop : ryBot) * sin]);
    }
    const warp = ([px, py]) => {
      const dy = py - cy, w = Math.sin(py / 13 + phase + i * .4) * wob;
      return [px + dy * tilt + w, py + Math.sin(px / 17 + phase) * wob * .6];
    };
    // In stukken knippen met kleine onderbrekingen, zoals echte ruggen.
    let seg = [], left = 18 + rnd() * 70;
    for (let k = 0; k < pts.length; k++) {
      const p = warp(pts[k]);
      if (seg.length) { const q = seg[seg.length - 1]; left -= Math.hypot(p[0] - q[0], p[1] - q[1]); }
      seg.push(p);
      if (left <= 0 || k === pts.length - 1) {
        if (seg.length > 1) paths.push({d:"M" + seg.map(([a, b]) => a.toFixed(1) + " " + b.toFixed(1)).join("L"), i});
        k += rnd() < .5 ? 1 : 0;
        seg = []; left = 18 + rnd() * 70;
      }
    }
  }
  return `<svg class="fp" viewBox="0 0 200 240" aria-hidden="true">
    <defs><clipPath id="fp-tip"><ellipse cx="100" cy="122" rx="84" ry="110"/></clipPath></defs>
    <g clip-path="url(#fp-tip)">${paths.map(p => `<path d="${p.d}" pathLength="1" style="--dl:${(p.i * 45 + rnd() * 160) | 0}ms"/>`).join("")}</g></svg>`;
}
function stageHtml(name, kind, lead){
  const verdict = {go: lead ? "Gefeliciteerd!" : "Je bent door", out: "Einde spel", unmask: "Ontmaskerd"}[kind];
  return `<div class="stage ${kind}" id="stage" data-act="stage-close" role="dialog" aria-label="Onthulling">
    <div class="fill"></div>
    <div class="stage-in">
      ${lead ? `<p class="stage-lead">${lead}</p>` : ""}
      <div class="display stage-name ${lead ? "hide-name" : ""}">${h(name)}</div>
      <div class="scanner"><i class="corner-tl"></i><i class="corner-tr"></i><i class="corner-bl"></i><i class="corner-br"></i>
        ${fingerprintSvg(name)}<div class="beam"></div><span class="ring"></span><span class="ring r2"></span></div>
      <p class="stage-status"><span id="stage-status">Vingerafdruk scannen…</span> <b id="stage-pct">0%</b></p>
      <p class="verdict">${verdict}</p>
    </div>
    <div class="hint" id="stage-hint">Even geduld…</div></div>`;
}
function runStage(wait){
  const st = document.getElementById("stage");
  const pctEl = document.getElementById("stage-pct");
  clearInterval(runStage._iv); clearTimeout(runStage._t);
  if (ui.present.ready) { st.classList.add("wait", "shown", "instant"); pctEl.textContent = "100%"; document.getElementById("stage-hint").textContent = "Klik om verder te gaan"; return; }
  st.style.setProperty("--wait", wait + "ms");
  requestAnimationFrame(() => requestAnimationFrame(() => st.classList.add("wait")));
  const steps = [[0, "Vingerafdruk scannen…"], [.35, "Vergelijken met het dossier…"], [.7, "Identiteit bevestigen…"], [.92, "Bijna…"]];
  const t0 = Date.now();
  clearInterval(runStage._iv);
  const tick = () => {
    const f = Math.max(0, Math.min(1, (Date.now() - t0) / wait)), eased = 1 - Math.pow(1 - f, 2.2);
    const p = document.getElementById("stage-pct"), s = document.getElementById("stage-status");
    if (!p || !s) return clearInterval(runStage._iv);
    p.textContent = Math.round(eased * 100) + "%";
    s.textContent = steps.filter(x => f >= x[0]).pop()[1];
    if (f >= 1) clearInterval(runStage._iv);
  };
  tick(); runStage._iv = setInterval(tick, 80);
  runStage._t = setTimeout(() => {
    if (!ui.present) return;
    ui.present.ready = true;
    const s = document.getElementById("stage"); if (!s) return;
    s.classList.add("shown");
    document.getElementById("stage-status").textContent = "Match gevonden";
    document.getElementById("stage-hint").textContent = "Klik om verder te gaan";
  }, wait);
}

/* ---------- acties ---------- */
const actions = {
  go(el){
    ui.view = el.dataset.view; ui.editQ = null; ui.editStd = null;
    if (el.dataset.test) { ui.testId = el.dataset.test; ui.step = el.dataset.step || null; }
    render(); window.scrollTo(0, 0);
  },
  step(el){ ui.step = el.dataset.v; ui.editQ = null; render(); },
  "toggle-mol"(){ ui.showMol = !ui.showMol; render(); },
  async logout(){ await settled(); try { await api("/api/logout", {method:"POST", token, body:{}}); } catch {} loggedOut(); },

  "q-edit"(el){ ui.editQ = ui.editQ === el.dataset.q ? null : el.dataset.q; render(); },
  "q-done"(){ ui.editQ = null; render(); },
  "q-del"(el){
    const t = T(ui.testId), q = t.questions.find(x => x.id === el.dataset.q);
    if (!confirm(`Vraag "${qView(t, q).text}" verwijderen?`)) return;
    t.questions = t.questions.filter(x => x !== q); save(); render();
  },
  "add-q"(){
    const t = T(ui.testId), q = {id:uid(), kind:"proef", text:"Nieuwe vraag over de mol", options:["Ja", "Nee"]};
    t.questions.splice(t.questions.findIndex(x => x.kind === "mol"), 0, q); ui.editQ = q.id; save(); render();
  },
  "std-edit"(el){ ui.editStd = el.dataset.k; render(); },
  "std-done"(){ ui.editStd = null; render(); },
  "copy-person"(el){
    const p = P(el.dataset.p), link = personLink(p.id);
    navigator.clipboard?.writeText(link).then(() => toast(`Link van ${p.name} gekopieerd. Stuur hem alleen naar ${p.name}.`), () => { prompt(`Link van ${p.name}:`, link); });
  },
  async "new-code"(el){
    const p = P(el.dataset.p);
    if (!confirm(`Nieuwe link maken voor ${p.name}? De oude link werkt daarna niet meer; stuur ${p.name} de nieuwe.`)) return;
    await settled();
    try { S = normalize(await api("/api/admin/new-code", {method:"POST", token, body:{player:p.id}})); render(); toast(`Nieuwe link voor ${p.name} gemaakt.`); }
    catch (e) { toast(e.message, true); }
  },

  async "test-open"(){
    const t = T(ui.testId);
    const earlier = S.tests.find(x => x.nr < t.nr && x.status !== "afgerond");
    if (earlier && !confirm(`${testName(earlier)} heeft nog geen vastgezette uitslag. Toch ${testName(t)} openzetten?`)) return;
    S.tests.forEach(x => { if (x.status === "open") x.status = "gesloten"; });
    t.status = "open"; save(); await settled(); render(); toast(`${testName(t)} staat open op de invulpagina.`);
  },
  async "test-close"(){ T(ui.testId).status = "gesloten"; save(); await refresh(); render(); toast("Test gesloten."); },
  async "att-del"(el){
    const t = T(ui.testId), p = P(el.dataset.p);
    if (!confirm(`De test van ${p.name} wissen? ${p.name} kan hem daarna opnieuw maken.`)) return;
    await settled();
    try { S = normalize(await api("/api/admin/attempt-delete", {method:"POST", token, body:{test:t.id, player:p.id}})); render(); }
    catch (e) { toast(e.message, true); }
  },
  joker(el){ const t = T(ui.testId), id = el.dataset.p; t.jokers[id] = Math.max(0, (t.jokers[id] || 0) + Number(el.dataset.v)); save(); render(); },
  async "lock-result"(){
    await refresh();
    const t = T(ui.testId), out = proposedOut(t);
    if (!confirm(`Uitslag van ${testName(t)} vastzetten? Deze ${out.length} kandidaten vallen af:\n\n${out.map(id => P(id).name).join("\n")}`)) return render();
    t.eliminated = out; t.revealed = {}; t.status = "afgerond";
    out.forEach(id => { const p = P(id); p.status = "af"; p.outNr = t.nr; });
    save(); await settled(); ui.step = "onthulling"; render(); toast("Uitslag vastgezet.");
  },
  "undo-result"(){
    const t = T(ui.testId);
    if (S.tests.some(x => x.nr > t.nr && Object.keys(x.attempts).length)) return toast("Er zijn al latere tests gemaakt; terugdraaien kan niet meer.", true);
    if (!confirm("Uitslag terugdraaien? De afvallers komen terug in het spel.")) return;
    S.players.forEach(p => { if (p.outNr === t.nr) { p.status = "actief"; p.outNr = null; } });
    t.eliminated = []; t.revealed = {}; t.status = "gesloten"; ui.step = "uitslag"; save(); render();
  },
  "reveal-reset"(){ if (!confirm("Alle getoonde schermen weer verbergen?")) return; T(ui.testId).revealed = {}; save(); render(); },
  present(el){
    const t = T(ui.testId);
    if (el.dataset.v === "finale") { t.status = "afgerond"; save(); }
    ui.present = {kind:el.dataset.v, test:t.id};
    document.documentElement.requestFullscreen?.().catch(() => {});
    render();
  },
  "rv-pick"(el){ Object.assign(ui.present, {pid:el.dataset.p, ready:false}); renderPresent(); },
  "fin-show"(el){ const t = T(ui.present.test); t.finaleShown[el.dataset.v] = true; save(); Object.assign(ui.present, {fin:el.dataset.v, ready:false}); renderPresent(); },
  "stage-close"(){
    const pr = ui.present; if (!pr || !pr.ready) return;
    if (pr.pid) { T(pr.test).revealed[pr.pid] = true; save(); }
    pr.pid = null; pr.fin = null; pr.ready = false; renderPresent();
  },
  "present-exit"(){ ui.present.unlock = true; ui.present.err = ""; renderPresent(); },
  "present-stay"(){ ui.present.unlock = false; renderPresent(); },

  "p-del"(el){
    const p = P(el.dataset.p);
    if (S.tests.some(t => t.attempts[p.id])) return toast(`${p.name} heeft al een test gemaakt en kan niet meer worden verwijderd.`, true);
    if (!confirm(`${p.name} verwijderen?`)) return;
    S.players = S.players.filter(x => x !== p); S.molIds = molIds().filter(id => id !== p.id); save(); render();
  },
  async "p-add"(){ S.players.push({id:uid(), name:`Kandidaat ${String(S.players.length + 1).padStart(2, "0")}`, status:"actief", outNr:null}); save(); await refresh(); render(); },
  async "bulk-replace"(){
    const names = bulkNames(); if (!names) return;
    if (!confirm(`De lijst vervangen door deze ${names.length} namen? De gekozen mollen worden ook gewist.`)) return;
    S.players = names.map(n => ({id:uid(), name:n, status:"actief", outNr:null})); S.molIds = []; save(); await refresh(); render(); toast(`${names.length} kandidaten opgeslagen.`);
  },
  async "bulk-add"(){ const names = bulkNames(); if (!names) return; names.forEach(n => S.players.push({id:uid(), name:n, status:"actief", outNr:null})); save(); await refresh(); render(); toast(`${names.length} kandidaten toegevoegd.`); },

  async export(){
    await refresh();
    const blob = new Blob([JSON.stringify(S, null, 2)], {type:"application/json"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `molproef-backup-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  import(){ document.getElementById("file").click(); },
  async reset(){
    if (prompt("Typ WISSEN om het hele spel te verwijderen.") !== "WISSEN") return;
    await settled();
    try { await api("/api/admin/reset", {method:"POST", token, body:{}}); } catch (e) { return toast(e.message, true); }
    setToken(null); S = null; status = await api("/api/status"); render();
  }
};
function bulkNames(){
  const names = document.getElementById("bulk").value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (!names.length) { toast("Plak eerst één of meer namen.", true); return null; }
  return names;
}

const changeActions = {
  "add-std"(el){ if (!el.value) return; const t = T(ui.testId); const i = t.questions.map(q => q.kind).lastIndexOf("std"); t.questions.splice(i + 1, 0, {id:uid(), kind:"std", stdKey:el.value, correct:null}); save(); render(); },
  "add-ref"(el){ if (!el.value) return; const [test, q] = el.value.split("|"); const t = T(ui.testId); t.questions.splice(t.questions.findIndex(x => x.kind === "mol"), 0, {id:uid(), kind:"ref", ref:{test, q}}); save(); render(); },
  exempt(el){ const t = T(ui.testId); if (el.checked) t.exempt[el.dataset.p] = true; else delete t.exempt[el.dataset.p]; save(); render(); },
  async mol(el){
    const ids = [...molIds()], slot = Number(el.dataset.slot);
    while (ids.length < MOL_COUNT) ids.push(null);
    ids[slot] = el.value || null;
    S.molIds = ids.filter(Boolean);
    save(); await refresh(); render(); // de server maakt de geheime mol-links aan
    toast(el.value ? `${molLabel(slot)} opgeslagen.` : `${molLabel(slot)} gewist.`);
  }
};

/* ---------- events ---------- */
document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]");
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el); }
});
document.addEventListener("change", e => {
  const el = e.target;
  if (el.dataset.actChange) return changeActions[el.dataset.actChange]?.(el);
  if (el.dataset.bind) {
    const t = T(ui.testId), k = el.dataset.bind;
    if (k === "eliminate") t.eliminate = Math.max(0, Math.min(99, parseInt(el.value, 10) || 0)); else t[k] = el.value;
    save(); if (k !== "desc") render(); return;
  }
  if (el.dataset.pname) { const p = P(el.dataset.pname); p.name = el.value.trim() || p.name; save(); return; }
  if (el.dataset.qedit) {
    const q = T(ui.testId).questions.find(x => x.id === el.dataset.q);
    if (el.dataset.qedit === "text") q.text = el.value.trim() || q.text;
    else { const o = el.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean); if (o.length >= 2) q.options = o; else toast("Geef minimaal twee antwoordopties.", true); if (q.correct != null && q.correct >= q.options.length) q.correct = null; }
    save(); return;
  }
  if (el.dataset.stdedit) {
    const s = stdOf(el.dataset.k);
    if (el.dataset.stdedit === "text") s.text = el.value.trim() || s.text;
    else { const o = el.value.split(/\r?\n/).map(x => x.trim()).filter(Boolean); if (o.length >= 2) s.options = o; else toast("Geef minimaal twee opties.", true); }
    save();
  }
});
document.addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target.dataset.form;
  if (form === "setup") {
    const pin = document.getElementById("s-pin").value, pin2 = document.getElementById("s-pin2").value;
    if (pin !== pin2) { ui.loginErr = "De twee wachtwoorden zijn niet gelijk."; return render(); }
    try {
      const r = await api("/api/setup", {method:"POST", body:{camp:document.getElementById("s-camp").value, pin}});
      setToken(r.token); status = await api("/api/status"); await loadState(); ui.view = "kandidaten"; render();
    } catch (err) { ui.loginErr = err.message; render(); }
  } else if (form === "login") {
    try { const r = await api("/api/login", {method:"POST", body:{pin:document.getElementById("pin").value}}); setToken(r.token); ui.weakPw = !!r.weak; await loadState(); render(); }
    catch (err) { ui.loginErr = err.message; render(); }
  } else if (form === "present-unlock") {
    try {
      const r = await api("/api/login", {method:"POST", body:{pin:document.getElementById("ppin").value}});
      setToken(r.token); ui.present = null; document.fullscreenElement && document.exitFullscreen?.().catch(() => {}); await settled(); render();
    } catch (err) { ui.present.err = err.message; renderPresent(); }
  } else if (form === "pin") {
    const pin = document.getElementById("newpin").value, pin2 = document.getElementById("newpin2").value;
    if (pin !== pin2) return toast("De twee wachtwoorden zijn niet gelijk.", true);
    try { await api("/api/admin/pin", {method:"POST", token, body:{pin}}); ui.weakPw = false; toast("Wachtwoord gewijzigd."); render(); }
    catch (err) { toast(err.message, true); }
  }
});
document.addEventListener("keydown", e => {
  if (ui.present && (ui.present.pid || ui.present.fin) && ["Enter", " ", "Escape"].includes(e.key)) { e.preventDefault(); actions["stage-close"](); }
});
document.getElementById("file").addEventListener("change", async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  let data;
  try { data = JSON.parse(await f.text()); } catch { return toast("Dit bestand is geen geldige Molproef-back-up.", true); }
  if (!data || !Array.isArray(data.players) || !Array.isArray(data.tests)) return toast("Dit bestand is geen geldige Molproef-back-up.", true);
  if (!confirm(`Back-up van "${data.camp}" terugzetten? Het huidige spel wordt vervangen.`)) return;
  await settled();
  try { S = normalize(await api("/api/admin/import", {method:"POST", token, body:{state:data}})); render(); toast("Back-up teruggezet."); }
  catch (err) { toast(err.message, true); }
});
window.addEventListener("beforeunload", e => { if (busy()) { flush(); e.preventDefault(); e.returnValue = ""; } });

(async () => {
  try { status = await api("/api/status"); }
  catch { app.innerHTML = `<div class="center-screen"><div class="lock"><h1>Geen verbinding</h1><p class="muted">De Molproef-server is niet bereikbaar. Draait de Docker-container?</p></div></div>`; return; }
  if (status.setup && token) { try { await loadState(); } catch { setToken(null); } }
  render();
})();
