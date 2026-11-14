# Python-Lernseite

So funktioniert es:
- `lektionen.json` enthält die Lektionen: Titel, Aufgabe, Hinweise, Tests und den Pfad zur Lösung.
- Der Ordner `python/` enthält die Musterlösungen. Sie werden erst nach 3 erfolglosen Prüfungen angezeigt.
- Der Lernende schreibt die Lösung im Editor selbst. Nichts wird vorgegeben.
- „Prüfen“ führt den Code mit den Tests aus. Jeder Test kann Eingaben, eine erwartete Ausgabe, verbotene Befehle oder Teiltexte enthalten.
- „Ausführen“ startet den Code frei (Pyodide, läuft im Browser). Ergebnisse erscheinen in der Ausgabe.
- „Hinweis anzeigen“ enthüllt die Hinweise nacheinander.
- Fortschritt und Entwürfe werden im Browser gespeichert (localStorage).

## Auf GitHub veröffentlichen
1. Den Inhalt dieses Ordners in dein Repository kopieren.
2. Im Repository: Settings → Pages → Branch `main` und Ordner `/`.
3. Die Seite ist danach unter `https://<dein-name>.github.io/<repo>/` erreichbar.

## Lokal testen
Nicht die Datei direkt öffnen (file://), sonst lädt die Seite die Dateien nicht. Stattdessen:
```bash
cd python-lernseite
python3 -m http.server 8000
```
Dann im Browser `http://localhost:8000` öffnen.

## Neue Lektion hinzufügen
1. Musterlösung als `python/09_thema.py` anlegen.
2. Eintrag in `lektionen.json` mit `id`, `titel`, `datei`, `aufgabe`, `hinweise` und `tests`.

Beispiel für einen Test:
```json
{ "zusatz": "print(meine_funktion(3))", "erwartet": ["9"] }
```
`zusatz` wird an den Code des Lernenden angehängt. `eingaben` füllt `input()` aus. `verboten` sperrt bestimmte Befehle, `enthaelt` prüft Teiltexte.

## PIN-Zugang
Die Startseite fragt einen PIN ab. Im Code steht nur der SHA-256-Hash des PIN, nicht der PIN selbst (`PIN_HASH` in `app.js`).

Aktueller PIN: **4827** (steht im Brief an Mattis).

PIN ändern:
```bash
printf 'NEUER_PIN' | sha256sum
```
Den ausgegebenen Hash in `app.js` bei `PIN_HASH` eintragen und den Brief entsprechend anpassen.

Wichtig: Das ist nur eine Hürde für Neugierige. Die Seite läuft vollständig im Browser, deshalb kann jemand mit Zugriff auf den Quelltext den Hash sehen und einen kurzen PIN durchprobieren. Für echten Schutz bräuchte man einen Server mit Anmeldung.
