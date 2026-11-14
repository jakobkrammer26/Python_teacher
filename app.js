// Python-Lernseite: Lektionen laden, Code schreiben, ausführen, testen.

const PRELUDE = `
import ast, builtins, contextlib, io, json, random
from js import prompt

def _eingabe(frage=""):
    antwort = prompt(str(frage))
    return "" if antwort is None else str(antwort)

builtins.input = _eingabe

def _run(code, env=None):
    if env is None:
        env = globals()
    baum = ast.parse(code)
    for knoten in baum.body:
        if isinstance(knoten, ast.Expr):
            wert = eval(compile(ast.Expression(knoten.value), "<lektion>", "eval"), env)
            if wert is not None:
                print(repr(wert))
        else:
            modul = ast.Module(body=[knoten], type_ignores=[])
            exec(compile(modul, "<lektion>", "exec"), env)

def _pruefe_einmal(code, test):
    for verboten in test.get("verboten", []):
        if verboten in code:
            return "Verwende nicht: " + verboten
    eingaben = list(test.get("eingaben", []))
    def falsche_eingabe(frage=""):
        return eingaben.pop(0) if eingaben else ""
    env = {"__name__": "test"}
    puffer = io.StringIO()
    original_input = builtins.input
    original_randint = random.randint
    builtins.input = falsche_eingabe
    try:
        if test.get("vorher"):
            exec(test["vorher"], env)
        with contextlib.redirect_stdout(puffer):
            exec(compile(code + "\\n" + test.get("zusatz", ""), "<deine_datei>", "exec"), env)
    except Exception as fehler:
        return "Fehler beim Ausführen: " + type(fehler).__name__ + ": " + str(fehler)
    finally:
        builtins.input = original_input
        random.randint = original_randint
    ausgabe = puffer.getvalue()
    zeilen = [z.rstrip() for z in ausgabe.split("\\n") if z.strip() != ""]
    if "erwartet" in test and zeilen != test["erwartet"]:
        return "Erwartet: " + " | ".join(test["erwartet"]) + "\\nDeine Ausgabe: " + (" | ".join(zeilen) or "(keine)")
    for teil in test.get("enthaelt", []):
        if teil.lower() not in ausgabe.lower():
            return "Deine Ausgabe sollte '" + teil + "' enthalten."
    return None

def _pruefe_alle(code, tests_json):
    meldungen = []
    for nr, test in enumerate(json.loads(tests_json), start=1):
        fehler = _pruefe_einmal(code, test)
        if fehler:
            meldungen.append("Test " + str(nr) + ": " + fehler)
    return "\\n".join(meldungen)
`;

const SCHWELLE_LOESUNG = 3;
// SHA-256 des PIN (nicht der PIN selbst im Klartext). Ändern: README beachten.
const PIN_HASH = "f16592d12000ffca0f1159286959f4c2470c82a7b48940020b1323a6d49abe27";

let lektionen = [];
let fortschritt = JSON.parse(localStorage.getItem("py-fortschritt") || "[]");
let aktuelle = -1;
let hinweisStand = 0;
let versuche = 0;
let pyodidePromise = null;

const $ = (id) => document.getElementById(id);

async function ladeLektionen() {
  const antwort = await fetch("lektionen.json");
  lektionen = await antwort.json();
  zeigeListe();
}

function speichereFortschritt() {
  localStorage.setItem("py-fortschritt", JSON.stringify(fortschritt));
}

function istFrei(i) {
  return i === 0 || fortschritt.includes(lektionen[i - 1].id);
}

function zeigeListe() {
  aktuelle = -1;
  $("lektion").hidden = true;
  $("liste").hidden = false;
  const liste = $("liste");
  liste.innerHTML = "";
  lektionen.forEach((l, i) => {
    const btn = document.createElement("button");
    btn.className = "lektion-btn";
    const erledigt = fortschritt.includes(l.id);
    const frei = istFrei(i);
    btn.textContent = (erledigt ? "✅ " : frei ? "▶ " : "🔒 ") + l.titel;
    btn.disabled = !frei;
    btn.onclick = () => oeffne(i);
    liste.appendChild(btn);
  });
  $("fortschritt").textContent = `${fortschritt.length} von ${lektionen.length} geschafft`;
}

function oeffne(i) {
  aktuelle = i;
  const l = lektionen[i];
  $("liste").hidden = true;
  $("lektion").hidden = false;
  $("titel").textContent = l.titel;
  $("aufgabe").textContent = l.aufgabe;
  $("editor").value = localStorage.getItem("py-code-" + l.id) || "";
  $("ausgabe").textContent = "";
  $("pruefung").textContent = "";
  $("pruefung").className = "";
  $("loesung").hidden = true;
  $("loesung").textContent = "";
  hinweisStand = 0;
  versuche = parseInt(localStorage.getItem("py-versuche-" + l.id) || "0", 10);
  zeigeHinweise();
  aktualisiereLoesungsKnopf();
}

function zeigeHinweise() {
  const l = lektionen[aktuelle];
  const box = $("hinweise");
  box.innerHTML = "";
  for (let k = 0; k < hinweisStand; k++) {
    const p = document.createElement("p");
    p.className = "hinweis";
    p.textContent = `Hinweis ${k + 1}: ${l.hinweise[k]}`;
    box.appendChild(p);
  }
  const knopf = $("hinweis-knopf");
  knopf.disabled = hinweisStand >= l.hinweise.length;
  knopf.textContent = `Hinweis anzeigen (${hinweisStand}/${l.hinweise.length})`;
}

function aktualisiereLoesungsKnopf() {
  $("loesung-knopf").disabled = versuche < SCHWELLE_LOESUNG;
  $("loesung-knopf").textContent = versuche < SCHWELLE_LOESUNG
    ? `Lösung (nach ${SCHWELLE_LOESUNG} Versuchen)`
    : "Lösung anzeigen";
}

function ausgabeAnhaengen(text) {
  $("ausgabe").textContent += text;
}

function ladePyodide() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const py = await loadPyodide();
      py.setStdout({ batched: (s) => ausgabeAnhaengen(s + "\n") });
      await py.runPythonAsync(PRELUDE);
      return py;
    })();
  }
  return pyodidePromise;
}

async function ausfuehren() {
  $("ausgabe").textContent = pyodidePromise ? "" : "Python wird geladen (beim ersten Mal dauert das etwas) ...\n";
  const py = await ladePyodide();
  $("ausgabe").textContent = "";
  const runFn = py.globals.get("_run");
  try {
    runFn($("editor").value);
  } catch (e) {
    const zeilen = String(e.message || e).trim().split("\n");
    ausgabeAnhaengen("Fehler: " + zeilen[zeilen.length - 1] + "\n");
  } finally {
    runFn.destroy();
  }
}

async function pruefen() {
  const l = lektionen[aktuelle];
  const box = $("pruefung");
  box.className = "";
  box.textContent = pyodidePromise ? "Prüfe ..." : "Python wird geladen ...";
  const py = await ladePyodide();
  const pruefeFn = py.globals.get("_pruefe_alle");
  const meldung = pruefeFn($("editor").value, JSON.stringify(l.tests));
  pruefeFn.destroy();

  if (!meldung) {
    box.className = "ok";
    box.textContent = "✅ Alle Tests bestanden!";
    if (!fortschritt.includes(l.id)) {
      fortschritt.push(l.id);
      speichereFortschritt();
    }
    return;
  }
  versuche += 1;
  localStorage.setItem("py-versuche-" + l.id, String(versuche));
  box.className = "fehler";
  box.textContent = "❌ Noch nicht ganz.\n" + meldung;
  aktualisiereLoesungsKnopf();
}

async function zeigeLoesung() {
  const l = lektionen[aktuelle];
  const box = $("loesung");
  box.hidden = false;
  box.textContent = "Lade Lösung ...";
  try {
    const antwort = await fetch(l.datei);
    if (!antwort.ok) throw new Error(antwort.status);
    box.textContent = await antwort.text();
  } catch (e) {
    box.textContent = `Die Lösung konnte nicht geladen werden (${l.datei}).`;
  }
}

$("editor").addEventListener("input", (e) => {
  if (aktuelle >= 0) {
    localStorage.setItem("py-code-" + lektionen[aktuelle].id, e.target.value);
  }
});

$("editor").addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    const t = e.target;
    const s = t.selectionStart;
    t.value = t.value.slice(0, s) + "    " + t.value.slice(t.selectionEnd);
    t.selectionStart = t.selectionEnd = s + 4;
  }
});

$("run").onclick = ausfuehren;
$("check").onclick = pruefen;
$("hinweis-knopf").onclick = () => {
  hinweisStand += 1;
  zeigeHinweise();
};
$("loesung-knopf").onclick = zeigeLoesung;
$("reset").onclick = () => {
  if (confirm("Deinen Code in diesem Kapitel wirklich löschen?")) {
    $("editor").value = "";
    localStorage.removeItem("py-code-" + lektionen[aktuelle].id);
  }
};
$("zurueck").onclick = zeigeListe;

async function sha256(text) {
  const daten = new TextEncoder().encode(text);
  const puffer = await crypto.subtle.digest("SHA-256", daten);
  return [...new Uint8Array(puffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function pruefePin() {
  const eingabe = $("pin").value.trim();
  if ((await sha256(eingabe)) === PIN_HASH) {
    localStorage.setItem("py-freigabe", PIN_HASH);
    zeigeAnwendung();
  } else {
    $("pin-fehler").textContent = "Der PIN ist nicht richtig.";
    $("pin").value = "";
    $("pin").focus();
  }
}

function zeigeAnwendung() {
  $("anmeldung").hidden = true;
  $("app").hidden = false;
  ladeLektionen();
}

$("pin-knopf").onclick = pruefePin;
$("pin").addEventListener("keydown", (e) => {
  if (e.key === "Enter") pruefePin();
});

if (localStorage.getItem("py-freigabe") === PIN_HASH) {
  zeigeAnwendung();
} else {
  $("anmeldung").hidden = false;
  $("pin").focus();
}
