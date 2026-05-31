# Tools2Escape

Mobile-first Escape-Room-Tracker auf Basis der importierten Excel-Datei.

## Öffnen

`index.html` im Browser öffnen. Ohne Cloud-Konfiguration läuft die App lokal und speichert Änderungen im Browser unter `localStorage`.

## Online-Sync

Die App kann mit Supabase gemeinsam genutzt werden. Dafür gibt es:

- `database/supabase.sql` für die Datenbank, Rechte und den gemeinsamen Team-Code.
- `src/config.js` für die Supabase-Projekt-URL, den öffentlichen anon key und die Team-ID.

### 1. Supabase-Projekt anlegen

1. Auf https://supabase.com ein Projekt erstellen.
2. Unter Authentication -> Providers den Provider `Anonymous Sign-Ins` aktivieren.
3. Im Supabase Dashboard den SQL Editor öffnen.
4. `database/supabase.sql` öffnen.
5. Diese Stelle ersetzen:

```sql
crypt('BITTE-HIER-EUREN-TEAM-CODE-EINTRAGEN', gen_salt('bf')),
```

   Beispiel:

```sql
crypt('unser-geheimer-team-code', gen_salt('bf')),
```

6. Die komplette SQL-Datei in den Supabase SQL Editor einfügen und ausführen.

Die Tabelle `team_state` speichert den kompletten App-Datenstand als JSON. Row Level Security ist aktiv; lesen und schreiben dürfen nur Browser, die einmal per Team-Code der Tabelle `team_members` beigetreten sind.

### 2. App konfigurieren

In `src/config.js` die Werte eintragen:

```js
window.T2E_CONFIG = {
  supabaseUrl: "https://dein-projekt.supabase.co",
  supabaseAnonKey: "dein-public-anon-key",
  teamId: "ksch-spiele",
};
```

Die Werte findest du in Supabase unter Project Settings -> API.

### 3. Online deployen

Einfachster Weg:

1. Projekt in ein GitHub-Repository pushen.
2. Auf https://vercel.com ein neues Projekt aus dem Repository importieren.
3. Build Command leer lassen.
4. Output Directory leer lassen oder `.` verwenden.
5. Deploy starten.

Alternativ kann der Ordner auch bei Netlify oder Firebase Hosting als statische Website veroeffentlicht werden.

### 4. Erster Team-Code-Login

1. Die veroeffentlichte App-URL oeffnen.
2. Oben auf `Team-Code` klicken.
3. Euren gemeinsamen Code eingeben.
4. Beim ersten erfolgreichen Verbinden speichert die App den aktuellen lokalen Datenstand in Supabase.

Danach bleibt die Supabase-Session im Browser gespeichert. Man muss den Code nur erneut eingeben, wenn man sich abmeldet, Browserdaten loescht, den Inkognito-Modus nutzt oder ein neues Geraet verwendet.

### 5. Freunde einladen

Den Freunden nur zwei Dinge schicken:

- App-URL
- Team-Code

Wer den Team-Code kennt, kann die Daten bearbeiten. Den Code also nicht oeffentlich posten.

## Datengrundlage

- `src/seed-data.js` enthält den Import aus `Ksch Spiele.xlsx`.
- Sobald Supabase konfiguriert und ein Teammitglied angemeldet ist, werden Änderungen online gespeichert und per Realtime an andere offene Tabs verteilt.
- Der Importer kann erneut ausgeführt werden:

```powershell
C:\Users\konta\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\export-seed.mjs "C:\Users\konta\Downloads\Ksch Spiele.xlsx" src\seed-data.js
```
