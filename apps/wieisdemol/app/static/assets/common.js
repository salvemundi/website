"use strict";
/* Gedeeld door beheer.js en invul.js */

const IC = {
  lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  play:'<path d="M7 4.5v15l12-7.5z"/>',
  left:'<path d="M15 18l-6-6 6-6"/>',
  right:'<path d="M9 18l6-6-6-6"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  x:'<path d="M18 6L6 18M6 6l12 12"/>',
  check:'<path d="M20 6L9 17l-5-5"/>',
  eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff:'<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.1 3.9M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  download:'<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
  upload:'<path d="M12 20V8M7 13l5-5 5 5M5 4h14"/>',
  alert:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
  star:'<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  edit:'<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  copy:'<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  phone:'<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
  wifi:'<path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'
};
const ic = (n, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[n]}</svg>`;

const h = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const byName = (a, b) => a.name.localeCompare(b.name, "nl");
const fmtTime = ms => { if (!isFinite(ms)) return "–"; const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function lsGet(k){ try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k, v){ try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} }

function toast(msg, bad = false){
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg; t.className = "toast on" + (bad ? " bad" : "");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.className = "toast" + (bad ? " bad" : ""), 3000);
}

async function api(path, {method = "GET", body, token} = {}){
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = "Bearer " + token;
  let r;
  try { r = await fetch(path, {method, headers, body: body !== undefined ? JSON.stringify(body) : undefined}); }
  catch { const e = new Error("Geen verbinding met de server."); e.status = 0; throw e; }
  let data = {};
  try { data = await r.json(); } catch {}
  if (!r.ok) { const e = new Error(data.error || `Serverfout (${r.status})`); e.status = r.status; throw e; }
  return data;
}
