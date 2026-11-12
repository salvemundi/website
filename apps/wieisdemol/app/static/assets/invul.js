"use strict";
/* Invulpagina: kandidaten kiezen hun naam en maken de open test. */

const DRAFT = "molproef-concept";
let D = null;            // antwoord van /api/invul
let offline = false;
const k = {step:"laden", pid:null, qi:0, answers:{}, startedAt:0, offset:0, filter:"", error:"", animQ:null};
let tick = null;
const app = document.getElementById("app");

const cand = id => D && D.candidates.find(c => c.id === id);
const questions = () => D.test.questions;

function saveDraft(){ lsSet(DRAFT, JSON.stringify({test:D.test.id, pid:k.pid, answers:k.answers, qi:k.qi})); }
function clearDraft(){ lsSet(DRAFT, null); }

async function load(){
  try { D = await api("/api/invul"); offline = false; }
  catch { offline = true; }
}

function reset(){
  Object.assign(k, {step:"kies", pid:null, qi:0, answers:{}, startedAt:0, filter:"", error:""});
}

function settle(){
  // Bepaal het scherm op basis van wat de server zegt.
  if (k.step === "vraag" || k.step === "controle" || k.step === "versturen") return;
  if (!D || D.ready === false) { k.step = "niet-klaar"; return; }
  if (!D.test) { k.step = "wacht"; return; }
  if (k.step === "klaar" || k.step === "fout") return;
  if (k.step === "bevestig" && cand(k.pid) && !cand(k.pid).done) return;
  if (k.step !== "kies") reset();
}

function render(){
  clearInterval(tick); tick = null;
  const t = D && D.test;
  const title = t ? (t.final ? "Finaletest" : `Test ${t.nr}`) : "Molproef";
  const top = `<header class="top"><b>${title}</b><span class="camp">${h(D && D.camp || "")}</span><span class="spacer"></span>
    ${k.step === "vraag" ? `<span class="timer">${ic("clock")}<span id="timer">${fmtTime(Date.now() + k.offset - k.startedAt)}</span></span>` : ""}</header>`;
  let main = "", mid = true;

  if (k.step === "laden") main = `<p class="muted">Laden…</p>`;
  else if (k.step === "niet-klaar") main = `<h1 class="display enter">Nog even geduld</h1><p class="lead">De spelleiding is het spel nog aan het klaarzetten.</p>`;
  else if (k.step === "wacht") main = `<h1 class="display enter">Er is nu geen test</h1>
      <p class="lead">Zodra de spelleiding de volgende test openzet, verschijnt hij hier vanzelf.</p>
      <p class="row muted" style="margin-top:28px"><span class="pulse"></span> Wachten op de spelleiding</p>`;
  else if (k.step === "kies") {
    mid = false;
    const open = D.candidates.filter(c => !c.done);
    const f = k.filter.trim().toLowerCase();
    main = open.length === 0
      ? `<div class="wrap mid" style="padding:0"><h1 class="display enter">Iedereen is klaar</h1><p class="lead">Alle ${D.candidates.length} kandidaten hebben de test ingeleverd.</p></div>`
      : `<h1 class="display enter">Wie ben jij?</h1>
         <div class="search"><input type="search" id="filter" value="${h(k.filter)}" placeholder="Zoek je naam" aria-label="Zoek je naam" autocomplete="off"></div>
         <div class="names" id="names">${open.map(c => `<button data-act="pick" data-p="${c.id}" ${f && !c.name.toLowerCase().includes(f) ? "hidden" : ""}>${h(c.name)}</button>`).join("")}</div>
         <p class="faint" style="margin-top:20px">Nog ${open.length} van ${D.candidates.length} kandidaten. Kies alleen je eigen naam.</p>`;
  }
  else if (k.step === "bevestig") main = `<p class="muted" style="font-size:18px;margin-bottom:10px">Klopt dit?</p>
      <h1 class="display enter">${h(cand(k.pid).name)}</h1>
      <p class="lead">Je krijgt ${plural(questions().length, "vraag", "vragen")} over de mol. De tijd loopt vanaf nu; bij een gelijke score wint de snelste. Je kunt de test maar één keer inleveren.</p>
      <div class="foot"><button class="btn btn-primary btn-lg" data-act="start">${ic("play")} Start de test</button><button class="btn btn-lg btn-ghost" data-act="back">Dit ben ik niet</button></div>`;
  else if (k.step === "vraag") {
    mid = false;
    const qs = questions(), q = qs[k.qi], cur = k.answers[q.id];
    const anim = k.animQ !== q.id; k.animQ = q.id;
    const opts = q.mol
      ? `<div class="names" style="margin-top:28px">${D.candidates.filter(c => c.id !== k.pid).map(c => `<button data-act="ans" data-v="${c.id}" aria-pressed="${cur === c.id}">${h(c.name)}</button>`).join("")}</div>`
      : `<div class="options">${q.options.map((o, i) => `<button class="opt" data-act="ans" data-v="${i}" aria-pressed="${cur === i}"><kbd>${i + 1}</kbd>${h(o)}</button>`).join("")}</div>`;
    const last = k.qi === qs.length - 1;
    main = `<div class="qhead"><span>Vraag ${k.qi + 1} van ${qs.length}</span></div>
      <div class="qbar">${qs.map((x, i) => `<i class="${i === k.qi ? "cur" : k.answers[x.id] != null ? "on" : ""}"></i>`).join("")}</div>
      <h1 class="qtitle ${anim ? "enter" : ""}">${h(q.text)}</h1>
      ${opts}
      <div class="foot">
        <button class="btn btn-lg btn-ghost" data-act="prev" ${k.qi === 0 ? "disabled" : ""}>${ic("left")} Vorige</button>
        <button class="btn btn-lg btn-primary" data-act="next" ${cur == null ? "disabled" : ""}>${last ? "Controleren" : "Volgende"} ${ic("right")}</button>
        ${q.mol ? "" : `<span class="keys">Toets 1–${q.options.length} en Enter</span>`}
      </div>`;
  }
  else if (k.step === "controle" || k.step === "versturen") {
    const qs = questions(), open = qs.filter(q => k.answers[q.id] == null).length;
    main = `<h1 class="display enter">Inleveren?</h1>
      <p class="lead">${open ? `Je hebt nog ${plural(open, "vraag", "vragen")} open gelaten.` : `Je hebt alle ${qs.length} vragen beantwoord.`} Na het inleveren kun je niets meer veranderen.</p>
      <div class="foot"><button class="btn btn-primary btn-lg" data-act="submit" ${k.step === "versturen" ? "disabled" : ""}>${ic("check")} ${k.step === "versturen" ? "Bezig met inleveren…" : "Test inleveren"}</button>
      <button class="btn btn-lg btn-ghost" data-act="review" ${k.step === "versturen" ? "disabled" : ""}>${ic("left")} Terug naar de vragen</button></div>`;
  }
  else if (k.step === "klaar") main = `<h1 class="display enter">Ingeleverd</h1>
      <p class="lead">Dank je, ${h(k.name)}. Vertel niemand wat je hebt ingevuld. Gebruik je een gedeeld apparaat? Geef het dan door aan de volgende kandidaat.</p>
      <div class="foot"><button class="btn btn-primary btn-lg" data-act="again">Volgende kandidaat</button></div>`;
  else if (k.step === "fout") main = `<h1 class="display enter">Dat ging mis</h1><p class="lead">${h(k.error)}</p>
      <div class="foot"><button class="btn btn-lg" data-act="again">Terug naar het begin</button></div>`;

  app.innerHTML = `${top}<main class="wrap ${mid ? "mid" : ""}">${offline ? `<div class="notice warn" style="margin-bottom:20px">${ic("wifi")}<div>Geen verbinding met de server. Je antwoorden blijven bewaard; we proberen het opnieuw.</div></div>` : ""}${main}</main>`;
  if (k.step === "vraag") tick = setInterval(() => { const el = document.getElementById("timer"); if (el) el.textContent = fmtTime(Date.now() + k.offset - k.startedAt); }, 1000);
  if (k.step === "kies" && window.matchMedia("(hover: hover)").matches) { const f = document.getElementById("filter"); if (f) { f.focus(); f.setSelectionRange(f.value.length, f.value.length); } }
}

const actions = {
  pick(el){ k.pid = el.dataset.p; k.step = "bevestig"; render(); },
  back(){ reset(); render(); },
  async start(){
    try {
      const r = await api("/api/invul/start", {method:"POST", body:{test:D.test.id, player:k.pid}});
      k.startedAt = r.startedAt; k.offset = r.now - Date.now();
      k.step = "vraag"; k.qi = 0; k.answers = {}; saveDraft(); render();
    } catch (e) { toast(e.message, true); await load(); settle(); render(); }
  },
  ans(el){
    const q = questions()[k.qi];
    k.answers[q.id] = q.mol ? el.dataset.v : Number(el.dataset.v); saveDraft(); render();
  },
  prev(){ if (k.qi > 0) { k.qi--; saveDraft(); render(); } },
  next(){
    const qs = questions();
    if (k.answers[qs[k.qi].id] == null) return;
    if (k.qi < qs.length - 1) k.qi++; else k.step = "controle";
    saveDraft(); render(); window.scrollTo(0, 0);
  },
  review(){ k.step = "vraag"; render(); },
  async submit(){
    k.step = "versturen"; render();
    try {
      await api("/api/invul/submit", {method:"POST", body:{test:D.test.id, player:k.pid, answers:k.answers}});
      k.name = cand(k.pid)?.name || ""; clearDraft(); k.step = "klaar";
    } catch (e) {
      if (e.status === 0) { toast("Geen verbinding. Probeer het zo opnieuw.", true); k.step = "controle"; }
      else { clearDraft(); k.error = e.message; k.step = "fout"; }
    }
    render();
  },
  async again(){ reset(); await load(); settle(); render(); }
};

document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]");
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el); }
});
document.addEventListener("input", e => {
  if (e.target.id !== "filter") return;
  k.filter = e.target.value;
  const f = k.filter.trim().toLowerCase();
  document.querySelectorAll("#names button").forEach(b => b.hidden = !!f && !b.textContent.toLowerCase().includes(f));
});
document.addEventListener("keydown", e => {
  if (k.step === "vraag" && !e.target.matches("input,textarea")) {
    const q = questions()[k.qi], n = parseInt(e.key, 10);
    if (!q.mol && n >= 1 && n <= q.options.length) { k.answers[q.id] = n - 1; saveDraft(); render(); }
    else if (e.key === "Enter") { e.preventDefault(); actions.next(); }
    else if (e.key === "ArrowLeft") actions.prev();
  } else if (k.step === "kies" && e.key === "Enter") {
    const first = document.querySelector("#names button:not([hidden])"); if (first) first.click();
  }
});
window.addEventListener("beforeunload", e => { if (k.step === "vraag" || k.step === "controle") { e.preventDefault(); e.returnValue = ""; } });

// Wachtschermen verversen zichzelf; tijdens het invullen niet.
setInterval(async () => {
  if (!["wacht", "kies", "niet-klaar", "laden"].includes(k.step) || document.hidden) return;
  const before = JSON.stringify(D), wasOffline = offline;
  await load();
  if (JSON.stringify(D) === before && wasOffline === offline) return;
  const active = document.activeElement && document.activeElement.id === "filter";
  settle(); render();
  if (active) { const f = document.getElementById("filter"); if (f) { f.focus(); f.setSelectionRange(f.value.length, f.value.length); } }
}, 5000);

(async () => {
  await load();
  settle();
  // Halverwege herladen? Ga verder waar je was.
  try {
    const d = JSON.parse(lsGet(DRAFT) || "null");
    if (d && D && D.test && D.test.id === d.test && cand(d.pid) && !cand(d.pid).done) {
      const r = await api("/api/invul/start", {method:"POST", body:{test:d.test, player:d.pid}});
      Object.assign(k, {step:"vraag", pid:d.pid, answers:d.answers || {}, qi:Math.min(d.qi || 0, questions().length - 1), startedAt:r.startedAt, offset:r.now - Date.now()});
    } else if (d) clearDraft();
  } catch { clearDraft(); }
  render();
})();
