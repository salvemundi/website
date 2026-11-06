#!/usr/bin/env python3
"""Molproef-server: beheerpagina voor de spelleiding, invulpagina voor kandidaten.

Alleen de standaardbibliotheek. Alle gegevens staan in één JSON-bestand in MOLPROEF_DATA.
De invulpagina krijgt nooit de juiste antwoorden of de naam van de mol te zien.
"""
import hashlib
import json
import mimetypes
import os
import re
import secrets
import shutil
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
STATIC = os.path.join(ROOT, "static")
DATA = os.environ.get("MOLPROEF_DATA", os.path.join(ROOT, "data"))
STATE_FILE = os.path.join(DATA, "state.json")
PORT = int(os.environ.get("PORT", "8080"))
PUBLIC_URL = os.environ.get("MOLPROEF_URL", "").rstrip("/")
# Achter een reverse proxy (bijv. wieisdemol.salvemundi.nl): vertrouw X-Forwarded-For voor het IP-adres,
# anders delen alle bezoekers het proxy-adres en blokkeert 5 foute pincodes iedereen.
TRUST_PROXY = os.environ.get("TRUST_PROXY", "") in ("1", "true", "yes")
MAX_BODY = 5 * 1024 * 1024
TOKEN_TTL = 12 * 3600
PAGES = {"/": "index.html", "/beheer": "beheer.html", "/invul": "invul.html"}

mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("text/javascript", ".js")

lock = threading.RLock()
tokens = {}  # token -> verloopt-op
fails = {}   # ip -> [aantal, geblokkeerd-tot]
state = None


class ApiError(Exception):
    def __init__(self, code, msg):
        super().__init__(msg)
        self.code = code


def now_ms():
    return int(time.time() * 1000)


def uid():
    return secrets.token_hex(4)


def load_state():
    try:
        with open(STATE_FILE, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return None


def backup_on_start(keep=10):
    """Kopieer state.json bij het opstarten naar DATA/backups en bewaar de laatste `keep` kopieen."""
    if not os.path.exists(STATE_FILE):
        return
    folder = os.path.join(DATA, "backups")
    os.makedirs(folder, exist_ok=True)
    shutil.copy2(STATE_FILE, os.path.join(folder, f"state-{time.strftime('%Y%m%d-%H%M%S')}.json"))
    for old in sorted(os.listdir(folder))[:-keep]:
        os.remove(os.path.join(folder, old))


def save_state():
    os.makedirs(DATA, exist_ok=True)
    state["rev"] = state.get("rev", 0) + 1
    tmp = STATE_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False)
    os.replace(tmp, STATE_FILE)


def hash_pin(pin, salt):
    return hashlib.pbkdf2_hmac("sha256", pin.encode(), bytes.fromhex(salt), 120_000).hex()


def set_pin(st, pin):
    salt = secrets.token_hex(16)
    st["auth"] = {"salt": salt, "hash": hash_pin(pin, salt)}


def check_pin_format(pin):
    if not isinstance(pin, str) or not re.fullmatch(r"\d{4,12}", pin):
        raise ApiError(400, "De pincode moet uit 4 tot 12 cijfers bestaan.")


def new_state(camp, pin):
    with open(os.path.join(STATIC, "assets", "standaard.json"), encoding="utf-8") as f:
        tpl = json.load(f)

    def std_q(key):
        return {"id": uid(), "kind": "std", "stdKey": key, "correct": None}

    def proef_q(text, options):
        return {"id": uid(), "kind": "proef", "text": text, "options": list(options), "correct": None}

    def mol_q():
        return {"id": uid(), "kind": "mol"}

    def test(nr, final, proef, questions, eliminate):
        return {"id": "finale" if final else f"t{nr}", "nr": nr, "final": final,
                "proef": proef["naam"], "desc": proef["omschrijving"], "eliminate": eliminate,
                "status": "concept", "questions": questions, "attempts": {}, "started": {},
                "jokers": {}, "exempt": {}, "eliminated": [], "revealed": {}, "finaleShown": {}}

    fixed, per_test = tpl["vastePool"], tpl["perTestPool"]
    tests = []
    for k, p in enumerate(tpl["proeven"]):
        qs = [std_q("geslacht")]
        qs += [std_q(fixed[(k * 3 + i) % len(fixed)]) for i in range(3)]
        qs.append(std_q(per_test[k % len(per_test)]))
        qs += [proef_q(t, o) for t, o in p["vragen"]]
        qs.append(mol_q())
        tests.append(test(k + 1, False, p, qs, tpl["afvallers"]))

    fq = [std_q(key) for key in tpl["finaleStandaard"]]
    for t in tests:
        first = next(q for q in t["questions"] if q["kind"] == "proef")
        fq.append({"id": uid(), "kind": "ref", "ref": {"test": t["id"], "q": first["id"]}})
    fq += [proef_q(t, o) for t, o in tpl["finale"]["vragen"]]
    fq.append(mol_q())
    tests.append(test(len(tests) + 1, True, tpl["finale"], fq, 0))

    players = [{"id": uid(), "name": f"Kandidaat {i + 1:02d}", "status": "actief", "outNr": None}
               for i in range(tpl["aantalKandidaten"])]
    st = {"version": 2, "rev": 0, "camp": camp, "players": players, "molId": None, "profile": {},
          "std": tpl["standaardvragen"], "tests": tests}
    set_pin(st, pin)
    return st


def public_state():
    return {k: v for k, v in state.items() if k != "auth"}


def find_test(test_id):
    return next((t for t in state["tests"] if t["id"] == test_id), None)


def participants(t):
    return [p for p in state["players"]
            if p["status"] == "actief" or (p.get("outNr") is not None and p["outNr"] >= t["nr"])]


def q_view(t, q, depth=0):
    """Vraagtekst en opties zoals de kandidaat ze ziet, zonder juist antwoord."""
    kind = q.get("kind")
    if kind == "mol":
        return {"id": q["id"], "text": "Wie is de mol?", "mol": True}
    if kind == "std":
        s = next((s for s in state["std"] if s["key"] == q.get("stdKey")), None)
        return {"id": q["id"], "text": s["text"] if s else "", "options": s["options"] if s else []}
    if kind == "ref" and depth < 3:
        rt = find_test(q["ref"]["test"])
        rq = rt and next((x for x in rt["questions"] if x["id"] == q["ref"]["q"]), None)
        if not rq:
            return {"id": q["id"], "text": "", "options": []}
        v = q_view(rt, rq, depth + 1)
        return {"id": q["id"], "text": f"{rt['proef']}: {v['text']}", "options": v.get("options", [])}
    return {"id": q["id"], "text": q.get("text", ""), "options": q.get("options", [])}


def open_test():
    return next((t for t in sorted(state["tests"], key=lambda t: t["nr"]) if t["status"] == "open"), None)


def require_open(test_id, player_id):
    t = open_test()
    if not t or t["id"] != test_id:
        raise ApiError(409, "Deze test is gesloten. Vraag de spelleiding wat je moet doen.")
    part = {p["id"] for p in participants(t)}
    if player_id not in part:
        raise ApiError(403, "Je naam staat niet op de lijst voor deze test.")
    if player_id in t["attempts"]:
        raise ApiError(409, "Deze test is voor jou al ingeleverd.")
    return t, part


# ---------------------------------------------------------------- api

def api_status(_h, _b):
    return {"setup": state is not None, "camp": state["camp"] if state else None, "publicUrl": PUBLIC_URL}


def api_setup(_h, b):
    global state
    if state is not None:
        raise ApiError(409, "Er bestaat al een spel.")
    pin = b.get("pin")
    check_pin_format(pin)
    camp = str(b.get("camp") or "Kamp").strip()[:80] or "Kamp"
    state = new_state(camp, pin)
    save_state()
    return {"token": issue_token()}


def issue_token():
    tok = secrets.token_urlsafe(24)
    tokens[tok] = time.time() + TOKEN_TTL
    return tok


def api_login(h, b):
    if state is None:
        raise ApiError(409, "Er is nog geen spel aangemaakt.")
    ip = h.client_ip()
    count, until = fails.get(ip, [0, 0])
    if until > time.time():
        raise ApiError(429, f"Te vaak een foute pincode. Probeer het over {int(until - time.time()) + 1} seconden opnieuw.")
    pin = str(b.get("pin") or "")
    a = state["auth"]
    if not secrets.compare_digest(hash_pin(pin, a["salt"]), a["hash"]):
        count += 1
        fails[ip] = [0, time.time() + 60] if count >= 5 else [count, 0]
        raise ApiError(401, "Onjuiste pincode.")
    fails.pop(ip, None)
    return {"token": issue_token()}


def api_logout(h, _b):
    tokens.pop(h.token(), None)
    return {"ok": True}


def api_get_state(_h, _b):
    return public_state()


def api_put_state(_h, b):
    global state
    inc = b.get("state")
    if not isinstance(inc, dict) or not isinstance(inc.get("players"), list) or not isinstance(inc.get("tests"), list):
        raise ApiError(400, "Ongeldige gegevens.")
    # Ingeleverde tests zijn van de server: de beheerpagina kan ze niet overschrijven.
    for t in inc["tests"]:
        cur = find_test(t.get("id"))
        t["attempts"] = cur["attempts"] if cur else {}
        t["started"] = cur.get("started", {}) if cur else {}
    inc["auth"] = state["auth"]
    inc["rev"] = state.get("rev", 0)
    inc.pop("mode", None)
    state = inc
    save_state()
    return {"rev": state["rev"]}


def api_attempt_delete(_h, b):
    t = find_test(b.get("test"))
    if not t:
        raise ApiError(404, "Test niet gevonden.")
    t["attempts"].pop(b.get("player"), None)
    t.get("started", {}).pop(b.get("player"), None)
    save_state()
    return public_state()


def api_import(_h, b):
    global state
    inc = b.get("state")
    if not isinstance(inc, dict) or not isinstance(inc.get("players"), list) or not isinstance(inc.get("tests"), list):
        raise ApiError(400, "Dit bestand is geen geldige Molproef-back-up.")
    for t in inc["tests"]:
        t.setdefault("attempts", {})
        t.setdefault("started", {})
    inc["auth"] = state["auth"]
    inc["rev"] = state.get("rev", 0)
    inc.pop("mode", None)
    state = inc
    save_state()
    return public_state()


def api_reset(_h, _b):
    global state
    if os.path.exists(STATE_FILE):
        os.replace(STATE_FILE, os.path.join(DATA, f"state.gewist-{time.strftime('%Y%m%d-%H%M%S')}.json"))
    state = None
    tokens.clear()
    return {"ok": True}


def api_pin(_h, b):
    pin = b.get("pin")
    check_pin_format(pin)
    set_pin(state, pin)
    save_state()
    return {"ok": True}


def api_invul(_h, _b):
    if state is None:
        return {"ready": False}
    t = open_test()
    if not t:
        return {"ready": True, "camp": state["camp"], "test": None}
    cands = sorted(({"id": p["id"], "name": p["name"], "done": p["id"] in t["attempts"]} for p in participants(t)),
                   key=lambda c: c["name"].lower())
    return {"ready": True, "camp": state["camp"],
            "test": {"id": t["id"], "nr": t["nr"], "final": t["final"],
                     "questions": [q_view(t, q) for q in t["questions"]]},
            "candidates": cands, "now": now_ms()}


def api_start(_h, b):
    t, _ = require_open(b.get("test"), b.get("player"))
    started = t.setdefault("started", {})
    if b.get("player") not in started:
        started[b["player"]] = now_ms()
        save_state()
    return {"startedAt": started[b["player"]], "now": now_ms()}


def api_submit(_h, b):
    pid = b.get("player")
    t, part = require_open(b.get("test"), pid)
    raw = b.get("answers") if isinstance(b.get("answers"), dict) else {}
    clean = {}
    for q in t["questions"]:
        v = raw.get(q["id"])
        if q.get("kind") == "mol":
            if isinstance(v, str) and v in part and v != pid:
                clean[q["id"]] = v
        else:
            n = len(q_view(t, q).get("options", []))
            if isinstance(v, int) and not isinstance(v, bool) and 0 <= v < n:
                clean[q["id"]] = v
    start = t.get("started", {}).get(pid)
    now = now_ms()
    t["attempts"][pid] = {"answers": clean, "ms": now - start if start else 0, "at": now}
    save_state()
    return {"ok": True}


ROUTES = {
    ("GET", "/api/status"): (api_status, False),
    ("POST", "/api/setup"): (api_setup, False),
    ("POST", "/api/login"): (api_login, False),
    ("POST", "/api/logout"): (api_logout, True),
    ("GET", "/api/admin/state"): (api_get_state, True),
    ("PUT", "/api/admin/state"): (api_put_state, True),
    ("POST", "/api/admin/attempt-delete"): (api_attempt_delete, True),
    ("POST", "/api/admin/import"): (api_import, True),
    ("POST", "/api/admin/reset"): (api_reset, True),
    ("POST", "/api/admin/pin"): (api_pin, True),
    ("GET", "/api/invul"): (api_invul, False),
    ("POST", "/api/invul/start"): (api_start, False),
    ("POST", "/api/invul/submit"): (api_submit, False),
}


class Handler(BaseHTTPRequestHandler):
    server_version = "Molproef"
    sys_version = ""

    def log_message(self, fmt, *args):
        if args and str(args[1] if len(args) > 1 else "").startswith("5"):
            super().log_message(fmt, *args)

    def client_ip(self):
        if TRUST_PROXY:
            # De rechtse waarde is door onze eigen proxy toegevoegd; de linkse kan de client zelf opgeven.
            fwd = self.headers.get("X-Forwarded-For", "").split(",")[-1].strip()
            if fwd:
                return fwd
        return self.client_address[0]

    def token(self):
        a = self.headers.get("Authorization", "")
        return a[7:] if a.startswith("Bearer ") else ""

    def authed(self):
        exp = tokens.get(self.token())
        return bool(exp and exp > time.time())

    def send(self, code, body, ctype, extra=None):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def send_json(self, code, obj):
        self.send(code, json.dumps(obj, ensure_ascii=False).encode(), "application/json; charset=utf-8",
                  {"Cache-Control": "no-store"})

    def handle_any(self):
        path = urlparse(self.path).path
        if path == "/healthz":
            return self.send(200, b"ok", "text/plain; charset=utf-8", {"Cache-Control": "no-store"})
        if path.startswith("/api/"):
            return self.handle_api(path)
        if self.command not in ("GET", "HEAD"):
            return self.send_json(405, {"error": "Niet toegestaan."})
        self.handle_static(path)

    do_GET = do_POST = do_PUT = do_HEAD = handle_any

    def handle_api(self, path):
        route = ROUTES.get((self.command, path))
        if not route:
            return self.send_json(404, {"error": "Onbekend adres."})
        fn, needs_auth = route
        if needs_auth and not self.authed():
            return self.send_json(401, {"error": "Log opnieuw in met de pincode."})
        try:
            body = {}
            if self.command in ("POST", "PUT"):
                n = int(self.headers.get("Content-Length") or 0)
                if n > MAX_BODY:
                    raise ApiError(413, "Te veel gegevens.")
                body = json.loads(self.rfile.read(n) or b"{}") if n else {}
                if not isinstance(body, dict):
                    raise ApiError(400, "Ongeldige gegevens.")
            with lock:
                if needs_auth and state is None and fn is not api_reset:
                    raise ApiError(409, "Er is nog geen spel aangemaakt.")
                result = fn(self, body)
            self.send_json(200, result)
        except ApiError as e:
            self.send_json(e.code, {"error": str(e)})
        except (ValueError, KeyError, TypeError):
            self.send_json(400, {"error": "Ongeldige gegevens."})

    def handle_static(self, path):
        rel = PAGES.get(path.rstrip("/") or "/")
        if rel is None and path.startswith("/assets/"):
            rel = path.lstrip("/")
        full = os.path.realpath(os.path.join(STATIC, rel)) if rel else None
        if not full or not full.startswith(os.path.realpath(STATIC) + os.sep) or not os.path.isfile(full):
            return self.send(404, "Niet gevonden".encode(), "text/plain; charset=utf-8")
        with open(full, "rb") as f:
            body = f.read()
        ctype = mimetypes.guess_type(full)[0] or "application/octet-stream"
        if ctype.startswith("text/") or ctype in ("application/json",):
            ctype += "; charset=utf-8"
        extra = {"Cache-Control": "no-cache"}
        if full.endswith(".html"):
            extra["X-Frame-Options"] = "DENY"
        self.send(200, body, ctype, extra)


def main():
    global state
    state = load_state()
    backup_on_start()
    srv = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"Molproef draait op poort {PORT}. Beheer: /beheer  Invullen: /invul", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
