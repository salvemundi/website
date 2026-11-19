"use strict";
/* Invulpagina. Iedereen opent deze pagina via een persoonlijke link (/invul?code=...), zodat vaststaat wie er invult.
   Er zijn twee mollen. Kandidaten beantwoorden elke vraag voor 'Mol A' en 'Mol B'.
   Opent een mol de eigen link, dan beantwoordt die elke vraag over zichzelf; dat zijn de juiste antwoorden. */

const CODE_KEY = "molproef-code";
const params = new URLSearchParams(location.search);
let CODE = params.get("code") || params.get("mol") || lsGet(CODE_KEY) || "";
if (CODE) lsSet(CODE_KEY, CODE);
const DRAFT = "molproef-concept";
const SLOT_NAMES = ["Mol A", "Mol B"];
let D = null;            // antwoord van /api/invul
let offline = false;
const k = {step:"laden", qi:0, answers:{}, startedAt:0, offset:0, error:"", animQ:null};
let tick = null;
const app = document.getElementById("app");

const molMode = () => !!(D && D.molMode);
const slots = () => (D && D.slots) || 2;
const questions = () => D.test.questions;
const myName = () => (D && D.me && D.me.name) || "";

/* Is deze vraag helemaal beantwoord? */
function complete(q){
  const v = k.answers[q.id];
  if (molMode()) return v != null;
  if (!Array.isArray(v)) return false;
  return q.mol ? v.length === slots() : v.length === slots() && v.every(x => x != null);
}

function saveDraft(){ lsSet(DRAFT, JSON.stringify({v:3, code:CODE, test:D.test.id, answers:k.answers, qi:k.qi})); }
function clearDraft(){ lsSet(DRAFT, null); }

async function load(){
  try { D = await api("/api/invul" + (CODE ? `?code=${encodeURIComponent(CODE)}` : "")); offline = false; }
  catch (e) {
    if (e.status === 403) { D = null; offline = false; lsSet(CODE_KEY, null); k.error = e.message; k.step = "fout"; return; }
    offline = true;
  }
}

function reset(){ Object.assign(k, {step:"start", qi:0, answers:{}, startedAt:0, error:""}); }

function settle(){
  // Bepaal het scherm op basis van wat de server zegt.
  if (k.step === "vraag" || k.step === "controle" || k.step === "versturen") return;
  if (k.step === "fout" && !D) return;
  if (!D || D.ready === false) { k.step = "niet-klaar"; return; }
  if (D.needLink) { k.step = "geen-link"; return; }
  if (D.out) { k.step = "uit"; return; }
  if (!D.test) { k.step = "wacht"; return; }
  if (k.step === "klaar") return;
  if (D.done) { k.step = "al-klaar"; return; }
  if (k.step !== "start") reset();
}

function optionButtons(q, slot){
  const v = k.answers[q.id], cur = slot == null ? v : (Array.isArray(v) ? v[slot] : null);
  return `<div class="options">${q.options.map((o, i) => `<button class="opt" data-act="ans" data-slot="${slot ?? ""}" data-v="${i}" aria-pressed="${cur === i}"><kbd>${i + 1}</kbd>${h(o)}</button>`).join("")}</div>`;
}

function render(){
  clearInterval(tick); tick = null;
  const t = D && D.test;
  const title = t ? (t.final ? "Finaletest" : `Test ${t.nr}`) : "Wie is de mol?";
  const who = myName() ? `<span class="who-chip">${ic("user")} ${h(myName())}</span>` : "";
  const top = `<header class="top"><img class="logo" src="/assets/logo.svg" alt="Salve Mundi"><b>${title}</b><span class="spacer"></span>
    ${k.step === "vraag" ? `<span class="timer">${ic("clock")}<span id="timer">${fmtTime(Date.now() + k.offset - k.startedAt)}</span></span>` : who}</header>`;
  let main = "", mid = true;

  if (k.step === "laden") main = `<p class="muted">Laden…</p>`;
  else if (k.step === "niet-klaar") main = `<h1 class="display enter">Nog even geduld</h1><p class="lead">De spelleiding is het spel nog aan het klaarzetten.</p>`;
  else if (k.step === "geen-link") main = `<h1 class="display enter">Gebruik je eigen link</h1>
      <p class="lead">Iedereen heeft van de spelleiding een persoonlijke link gekregen. Open die link om de test te maken. Geen link ontvangen of kwijt? Vraag de spelleiding.</p>`;
  else if (k.step === "uit") main = `<h1 class="display enter">Je bent uit het spel</h1>
      <p class="lead">${h(myName())}, je doet niet meer mee aan de tests. Bedankt voor het spelen!</p>`;
  else if (k.step === "wacht") main = `<p class="hello">Hoi ${h(myName())}</p><h1 class="display enter">Er is nu geen test</h1>
      <p class="lead">Zodra de spelleiding de volgende test openzet, verschijnt hij hier vanzelf. Houd deze pagina open of open later je link opnieuw.</p>
      <p class="row muted" style="margin-top:28px"><span class="pulse"></span> Wachten op de spelleiding</p>`;
  else if (k.step === "al-klaar") main = `<p class="hello">Hoi ${h(myName())}</p><h1 class="display enter">Al ingeleverd</h1>
      <p class="lead">Je hebt deze test al ingeleverd. Bij de volgende test kun je via dezelfde link weer invullen.</p>`;
  else if (k.step === "start") main = molMode()
    ? `<p class="hello">Je vult in als mol</p>
      <h1 class="display enter">${h(myName())}</h1>
      <p class="lead">Beantwoord alle ${plural(questions().length, "vraag", "vragen")} over <b>jezelf</b>. Jouw antwoorden zijn de juiste antwoorden waarmee de kandidaten worden nagekeken, dus vul ze zorgvuldig in. Je kunt maar één keer inleveren.</p>
      <div class="foot"><button class="btn btn-primary btn-lg" data-act="start">${ic("play")} Start</button></div>`
    : `<p class="hello">Hoi</p>
      <h1 class="display enter">${h(myName())}</h1>
      <p class="lead">Er zijn twee mollen. Je krijgt ${plural(questions().length, "vraag", "vragen")} en beantwoordt elke vraag voor <b>Mol A</b> en voor <b>Mol B</b>. Jij bepaalt wie A en wie B is; houd dat de hele test hetzelfde. De tijd loopt vanaf de start; bij een gelijke score wint de snelste. Je kunt de test maar één keer inleveren.</p>
      <div class="foot"><button class="btn btn-primary btn-lg" data-act="start">${ic("play")} Start de test</button></div>
      <p class="faint small" style="margin-top:18px">Ben jij niet ${h(myName())}? Sluit deze pagina en open je eigen link.</p>`;
  else if (k.step === "vraag") {
    mid = false;
    const qs = questions(), q = qs[k.qi], cur = k.answers[q.id];
    const anim = k.animQ !== q.id; k.animQ = q.id;
    let opts;
    if (q.mol) {
      const picks = Array.isArray(cur) ? cur : [];
      opts = `<p class="lead" style="margin-top:14px">Kies ${slots()} namen. ${picks.length}/${slots()} gekozen.</p>
        <div class="names" style="margin-top:18px">${D.candidates.map(c => `<button data-act="ans-mol" data-v="${c.id}" aria-pressed="${picks.includes(c.id)}">${h(c.name)}</button>`).join("")}</div>`;
    } else if (molMode()) {
      opts = optionButtons(q, null);
    } else {
      opts = SLOT_NAMES.slice(0, slots()).map((name, s) => `<h2 class="slot">${name}</h2>${optionButtons(q, s)}`).join("");
    }
    const last = k.qi === qs.length - 1;
    main = `<div class="qhead"><span>Vraag ${k.qi + 1} van ${qs.length}</span></div>
      <div class="qbar">${qs.map((x, i) => `<i class="${i === k.qi ? "cur" : complete(x) ? "on" : ""}"></i>`).join("")}</div>
      <h1 class="qtitle ${anim ? "enter" : ""}">${h(molMode() ? q.text + " (over jezelf)" : q.text)}</h1>
      ${opts}
      <div class="foot">
        <button class="btn btn-lg btn-ghost" data-act="prev" ${k.qi === 0 ? "disabled" : ""}>${ic("left")} Vorige</button>
        <button class="btn btn-lg btn-primary" data-act="next" ${complete(q) ? "" : "disabled"}>${last ? "Controleren" : "Volgende"} ${ic("right")}</button>
        ${q.mol ? "" : `<span class="keys">Toets 1–${q.options.length}${molMode() ? "" : " (eerst Mol A, dan Mol B)"} en Enter</span>`}
      </div>`;
  }
  else if (k.step === "controle" || k.step === "versturen") {
    const qs = questions(), open = qs.filter(q => !complete(q)).length;
    main = `<h1 class="display enter">Inleveren?</h1>
      <p class="lead">${open ? `Je hebt nog ${plural(open, "vraag", "vragen")} niet helemaal beantwoord.` : `Je hebt alle ${qs.length} vragen beantwoord.`} Na het inleveren kun je niets meer veranderen.</p>
      <div class="foot"><button class="btn btn-primary btn-lg" data-act="submit" ${k.step === "versturen" || (molMode() && open) ? "disabled" : ""}>${ic("check")} ${k.step === "versturen" ? "Bezig met inleveren…" : "Test inleveren"}</button>
      <button class="btn btn-lg btn-ghost" data-act="review" ${k.step === "versturen" ? "disabled" : ""}>${ic("left")} Terug naar de vragen</button></div>`;
  }
  else if (k.step === "klaar") main = `<h1 class="display enter">Ingeleverd</h1>
      <p class="lead">${molMode() ? `Dank je, ${h(myName())}. Jouw antwoorden zijn opgeslagen als juiste antwoorden.` : `Dank je, ${h(myName())}.`} Vertel niemand wat je hebt ingevuld.</p>`;
  else if (k.step === "fout") main = `<h1 class="display enter">Dat ging mis</h1><p class="lead">${h(k.error)}</p>
      ${D ? `<div class="foot"><button class="btn btn-lg" data-act="again">Opnieuw laden</button></div>` : ""}`;

  app.innerHTML = `${top}<main class="wrap ${mid ? "mid" : ""}">${offline ? `<div class="notice warn" style="margin-bottom:20px">${ic("wifi")}<div>Geen verbinding met de server. Je antwoorden blijven bewaard; we proberen het opnieuw.</div></div>` : ""}${main}</main>`;
  if (k.step === "vraag") tick = setInterval(() => { const el = document.getElementById("timer"); if (el) el.textContent = fmtTime(Date.now() + k.offset - k.startedAt); }, 1000);
}

function setAnswer(q, slot, value){
  if (molMode()) k.answers[q.id] = value;
  else {
    const arr = Array.isArray(k.answers[q.id]) ? [...k.answers[q.id]] : [];
    while (arr.length < slots()) arr.push(null);
    arr[slot] = value;
    k.answers[q.id] = arr;
  }
  saveDraft(); render();
}

const actions = {
  async start(){
    try {
      const r = await api("/api/invul/start", {method:"POST", body:{test:D.test.id, code:CODE}});
      k.startedAt = r.startedAt; k.offset = r.now - Date.now();
      k.step = "vraag"; k.qi = 0; k.answers = {}; saveDraft(); render();
    } catch (e) { toast(e.message, true); await load(); settle(); render(); }
  },
  ans(el){
    const q = questions()[k.qi];
    setAnswer(q, el.dataset.slot === "" ? null : Number(el.dataset.slot), Number(el.dataset.v));
  },
  "ans-mol"(el){
    const q = questions()[k.qi], id = el.dataset.v;
    let picks = Array.isArray(k.answers[q.id]) ? [...k.answers[q.id]] : [];
    if (picks.includes(id)) picks = picks.filter(x => x !== id);
    else if (picks.length < slots()) picks.push(id);
    else { toast(`Je kunt maar ${slots()} namen kiezen. Klik eerst een gekozen naam weg.`, true); return; }
    k.answers[q.id] = picks; saveDraft(); render();
  },
  prev(){ if (k.qi > 0) { k.qi--; saveDraft(); render(); } },
  next(){
    const qs = questions();
    if (!complete(qs[k.qi])) return;
    if (k.qi < qs.length - 1) k.qi++; else k.step = "controle";
    saveDraft(); render(); window.scrollTo(0, 0);
  },
  review(){ k.step = "vraag"; render(); },
  async submit(){
    k.step = "versturen"; render();
    try {
      await api("/api/invul/submit", {method:"POST", body:{test:D.test.id, code:CODE, answers:k.answers}});
      clearDraft(); k.step = "klaar";
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
document.addEventListener("keydown", e => {
  if (k.step !== "vraag" || e.target.matches("input,textarea")) return;
  const q = questions()[k.qi], n = parseInt(e.key, 10);
  if (!q.mol && n >= 1 && n <= q.options.length) {
    if (molMode()) setAnswer(q, null, n - 1);
    else {
      // Eerst Mol A, daarna Mol B; zijn beide ingevuld, dan verandert de toets Mol B.
      const v = Array.isArray(k.answers[q.id]) ? k.answers[q.id] : [];
      setAnswer(q, v[0] == null ? 0 : 1, n - 1);
    }
  }
  else if (e.key === "Enter") { e.preventDefault(); actions.next(); }
  else if (e.key === "ArrowLeft") actions.prev();
});
window.addEventListener("beforeunload", e => { if (k.step === "vraag" || k.step === "controle") { e.preventDefault(); e.returnValue = ""; } });

// Wachtschermen verversen zichzelf; tijdens het invullen niet.
setInterval(async () => {
  if (!["wacht", "start", "niet-klaar", "laden", "al-klaar", "uit"].includes(k.step) || document.hidden) return;
  const before = JSON.stringify(D), wasOffline = offline;
  await load();
  if (JSON.stringify(D) === before && wasOffline === offline) return;
  settle(); render();
}, 5000);

(async () => {
  // Haal de code uit de adresbalk, zodat hij niet zichtbaar blijft als iemand meekijkt of een schermafbeelding maakt.
  if (params.has("code") || params.has("mol")) history.replaceState(null, "", location.pathname);
  await load();
  settle();
  // Halverwege herladen? Ga verder waar je was.
  try {
    const d = JSON.parse(lsGet(DRAFT) || "null");
    if (d && d.v === 3 && d.code === CODE && D && D.test && D.test.id === d.test && !D.done) {
      const r = await api("/api/invul/start", {method:"POST", body:{test:d.test, code:CODE}});
      Object.assign(k, {step:"vraag", answers:d.answers || {}, qi:Math.min(d.qi || 0, questions().length - 1), startedAt:r.startedAt, offset:r.now - Date.now()});
    } else if (d) clearDraft();
  } catch { clearDraft(); }
  render();
})();
