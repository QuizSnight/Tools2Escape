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

## Datengrundlage

- `src/seed-data.js` enthält den Import aus `Ksch Spiele.xlsx`.
- Sobald Supabase konfiguriert ist, werden Änderungen online gespeichert und per Realtime an andere offene Tabs verteilt.
- Der Importer kann erneut ausgeführt werden:

```powershell
C:\Users\konta\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\export-seed.mjs "C:\Users\konta\Downloads\Ksch Spiele.xlsx" src\seed-data.js
```
