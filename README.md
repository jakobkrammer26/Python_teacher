# Python-Lernseite

So funktioniert es:
- `lektionen.json` enthält die Lektionen (Titel, Aufgabe, Pfad zum Unterrichtscode).
- Der Ordner `python/` enthält den Unterrichtscode. Die Pfade in `lektionen.json` müssen dazu passen.
- Auf der Seite sieht der Lernende die Aufgabe, den Unterrichtscode zum Abtippen und einen Editor.
- „Ausführen“ startet den Code direkt im Browser (Pyodide). Ergebnisse werden wie in der Shell angezeigt.
- „Prüfen“ vergleicht den eigenen Code mit dem Unterrichtscode und zeigt die erste abweichende Zeile.
- Fortschritt und Entwürfe werden im Browser gespeichert (localStorage).

## Auf GitHub veröffentlichen
1. Den Inhalt dieses Ordners in dein Repository kopieren (z. B. in einen Ordner `python-lernseite/` oder in den Root).
2. Im Repository: Settings → Pages → Branch `main` und Ordner `/` (oder der Ordner, in dem die Dateien liegen).
3. Nach kurzer Zeit ist die Seite unter `https://<dein-name>.github.io/<repo>/` erreichbar.

## Lokal testen
Nicht die Datei direkt öffnen (file://), sonst lädt die Seite die Dateien nicht. Stattdessen:
```bash
cd python-lernseite
python3 -m http.server 8000
```
Dann im Browser `http://localhost:8000` öffnen.

## Neue Lektion hinzufügen
1. Datei `python/09_thema.py` mit dem Unterrichtscode anlegen.
2. Eintrag in `lektionen.json` ergänzen (eindeutige `id`, `titel`, `datei`, `aufgabe`).
