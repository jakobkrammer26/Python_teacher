// Python-Lernseite: Lektionen laden, Code abtippen, ausführen und prüfen.

const PRELUDE = `
import ast, builtins
from js import prompt

def _eingabe(frage=""):
    antwort = prompt(str(frage))
    return "" if antwort is None else str(antwort)

builtins.input = _eingabe

def _run(code):
    baum = ast.parse(code)
    for knoten in baum.body:
        if isinstance(knoten, ast.Expr):
            wert = eval(compile(ast.Expression(knoten.value), "<lektion>", "eval"), globals())
            if wert is not None:
                print(repr(wert))
        else:
            modul = ast.Module(body=[knoten], type_ignores=[])
            exec(compile(modul, "<lektion>", "exec"), globals())
`;

let lektionen = [];
let fortschritt = JSON.parse(localStorage.getItem("py-fortschritt") || "[]");
let aktuelle = -1;
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

async function oeffne(i) {
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
  $("vorlage").textContent = "Lade Unterrichtscode ...";
  try {
    const antwort = await fetch(l.datei);
    if (!antwort.ok) throw new Error(antwort.status);
    $("vorlage").textContent = await antwort.text();
  } catch (e) {
    $("vorlage").textContent = `Der Unterrichtscode konnte nicht geladen werden (${l.datei}).`;
  }
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

function normalisiere(text) {
  return text
    .split("\n")
    .map((z) => z.trimEnd())
    .filter((z) => z.trim() !== "")
    .join("\n");
}

function pruefen() {
  const l = lektionen[aktuelle];
  const box = $("pruefung");
  const vorlage = normalisiere($("vorlage").textContent).split("\n");
  const eingabe = normalisiere($("editor").value).split("\n");

  if (vorlage.join("\n") === eingabe.join("\n")) {
    box.className = "ok";
    box.textContent = "✅ Stimmt! Dein Code entspricht dem Unterrichtscode.";
    if (!fortschritt.includes(l.id)) {
      fortschritt.push(l.id);
      speichereFortschritt();
    }
    return;
  }

  let zeile = 0;
  while (zeile < Math.max(vorlage.length, eingabe.length) && vorlage[zeile] === eingabe[zeile]) {
    zeile++;
  }
  box.className = "fehler";
  box.textContent =
    `❌ Noch nicht identisch. Der erste Unterschied ist in Zeile ${zeile + 1}.\n` +
    `Unterrichtscode: ${vorlage[zeile] ?? "(fehlt)"}\n` +
    `Dein Code:       ${eingabe[zeile] ?? "(fehlt)"}`;
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
$("reset").onclick = () => {
  if (confirm("Deinen Code in diesem Kapitel wirklich löschen?")) {
    $("editor").value = "";
    localStorage.removeItem("py-code-" + lektionen[aktuelle].id);
  }
};
$("zurueck").onclick = zeigeListe;

ladeLektionen();
