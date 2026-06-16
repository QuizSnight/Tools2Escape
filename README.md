# Tools2Escape

Mobile-first Escape-Room-Tracker auf Basis der importierten Excel-Datei.

## Öffnen

`index.html` im Browser öffnen. Ohne Cloud-Konfiguration läuft die App lokal und speichert Änderungen im Browser unter `localStorage`.

## Auf dem Handy installieren

Die App ist als Progressive Web App vorbereitet. Nach dem Online-Deploy kann sie vom Browser aus auf dem Homescreen installiert werden.

Android/Chrome:

1. Veröffentlichte App-URL öffnen.
2. Browsermenü öffnen.
3. `App installieren` oder `Zum Startbildschirm hinzufügen` wählen.

iPhone/Safari:

1. Veröffentlichte App-URL in Safari öffnen.
2. Teilen-Menü öffnen.
3. `Zum Home-Bildschirm` wählen.

Danach startet die App über ein eigenes Icon und wirkt wie eine normale App. Technisch bleibt sie trotzdem eine Website mit Online-Sync.

## Online-Sync ohne Login

Die App kann mit Supabase gemeinsam genutzt werden. Es gibt bewusst keinen Team-Code und keine Anmeldung: Wer die veröffentlichte App-URL kennt, kann die Daten lesen und bearbeiten.

Dafür gibt es:

- `database/supabase.sql` für den gemeinsamen Online-Datensatz und die öffentlichen Lese-/Schreibrechte.
- `src/config.js` für die Supabase-Projekt-URL, den Publishable Key und die Team-ID.

### 1. Supabase-Projekt vorbereiten

1. Auf https://supabase.com ein Projekt erstellen.
2. Im Supabase Dashboard den SQL Editor öffnen.
3. `database/supabase.sql` öffnen.
4. Die komplette SQL-Datei in den Supabase SQL Editor einfügen und ausführen.

Die Tabelle `team_state` speichert den kompletten App-Datenstand als JSON. Row Level Security bleibt aktiv, erlaubt aber für den Datensatz `ksch-spiele` öffentlichen Zugriff über den Supabase Publishable Key.

### 2. App konfigurieren

In `src/config.js` die Werte eintragen:

```js
window.T2E_CONFIG = {
  supabaseUrl: "https://dein-projekt.supabase.co",
  supabaseAnonKey: "dein-publishable-key",
  teamId: "ksch-spiele",
  googleSheetsWebhookUrl: "",
};
```

Die URL setzt sich aus der Supabase Project ID zusammen:

```txt
https://PROJECT-ID.supabase.co
```

Den Publishable Key findest du in Supabase unter Project Settings -> API Keys -> Publishable key.

### 3. Online deployen

Einfachster Weg:

1. Projekt in ein GitHub-Repository pushen.
2. Auf https://vercel.com ein neues Projekt aus dem Repository importieren.
3. Build Command leer lassen.
4. Output Directory leer lassen oder `.` verwenden.
5. Deploy starten.

Alternativ kann der Ordner auch bei Netlify oder Firebase Hosting als statische Website veroeffentlicht werden.

### 4. Freunde einladen

Den Freunden nur die App-URL schicken. Die App verbindet sich beim Öffnen automatisch mit Supabase. Änderungen werden online gespeichert und an andere offene Tabs verteilt.

Wichtig: Ohne Login ist die URL praktisch der Zugang. Poste den Link also nicht öffentlich.

### Supabase-Ping

Der GitHub-Workflow `.github/workflows/supabase-ping.yml` pingt Supabase täglich. Er versucht zuerst, den `team_state`-Datensatz per REST zu lesen. Falls Supabase diesen Datensatz in der REST-Schema-Ansicht nicht freigibt, nutzt er stattdessen Auth-/Storage-API-Pings. In beiden Fällen werden keine App-Daten verändert.

Testen kannst du ihn in GitHub unter `Actions -> Supabase Ping -> Run workflow`. Standardmäßig nutzt der Workflow die Werte aus `src/config.js`. Optional können stattdessen Repository-Secrets mit den Namen `SUPABASE_URL`, `SUPABASE_ANON_KEY` und `SUPABASE_TEAM_ID` gesetzt werden.

## Google-Sheets-Sync

Die App kann nach jedem Speichern zusätzlich eine Google-Sheets-Datei im alten Tabellenformat aktualisieren. Änderungen in Google Sheets können über einen installierbaren Trigger zurück in die App/Supabase synchronisiert werden.

1. In Google Sheets die Ziel-Tabelle öffnen und die Spreadsheet-ID aus der URL kopieren.
2. Unter `Erweiterungen -> Apps Script` ein neues Script öffnen.
3. `integrations/google-sheets-sync.gs` einfügen.
4. `SPREADSHEET_ID` im Script ersetzen, falls eine andere Tabelle genutzt wird.
5. `Bereitstellen -> Neue Bereitstellung -> Web-App` wählen.
6. Zugriff auf `Jeder` setzen und bereitstellen.
7. Die Web-App-URL in `src/config.js` bei `googleSheetsWebhookUrl` eintragen.
8. In Apps Script oben in der Funktionsauswahl `installEditTrigger` wählen und einmal ausführen.
9. Die angefragten Berechtigungen bestätigen.

Danach schreibt die App bei jeder Änderung alle Tabs neu in die Google-Tabelle. Umgekehrt schreibt jede manuelle Änderung in Google Sheets den Datenstand zurück in Supabase; offene Apps bekommen die Änderung per Realtime-Sync.

Die Tabellen werden automatisch nach denselben Regionen wie in der App aufgeteilt. Die Blatt-Reihenfolge ist `Welt`, `Up Next`, danach alphabetisch: `Anderes`, `Athen`, `BeNeLux`, `DE`, `Finnland`, `Frankreich`, `Hamburg (HH)`, `Irland`, `Italien`, `Kroatien`, `NRW`, `Polen`, `Portugal`, `Spanien`, `Tschechien`, `UK`, `Ungarn`.

Neue Orte werden automatisch geocodiert. Dadurch können App und Google-Sheets-Sync auch Städte zuordnen, die noch nicht in den bisherigen Stadtlisten stehen; für Deutschland wird zusätzlich NRW bzw. Hamburg (HH) erkannt, wenn der Geocoder das Bundesland liefert.

## Datengrundlage

- `src/seed-data.js` enthält den Import aus `Ksch Spiele.xlsx`.
- Sobald Supabase konfiguriert ist, werden Änderungen online gespeichert und per Realtime an andere offene Tabs verteilt.
- Der Importer kann erneut ausgeführt werden:

```powershell
C:\Users\konta\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\export-seed.mjs "C:\Users\konta\Downloads\Ksch Spiele.xlsx" src\seed-data.js
```
