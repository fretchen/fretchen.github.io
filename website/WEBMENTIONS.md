# Webmention Automation

Dieses Projekt sendet automatisch Webmentions an Bridgy Publish, um Blog-Posts auf Mastodon, Bluesky und GitHub zu veröffentlichen.

## Setup

### 1. Bridgy Publish Links im HTML

Die `Post.tsx` Komponente enthält versteckte Links zu Bridgy Publish:

```tsx
<a className="u-bridgy-omit-link" href="https://brid.gy/publish/mastodon" style={{ display: "none" }} />
<a className="u-bridgy-omit-link" href="https://brid.gy/publish/bluesky" style={{ display: "none" }} />
<a className="u-bridgy-omit-link" href="https://brid.gy/publish/github" style={{ display: "none" }} />
```

Diese Links sind im statischen HTML vorhanden und erfüllen Bridgys Anforderung, dass die Target-URLs auf der Seite vorhanden sein müssen.

### 2. Webmention-Sender Script

Das `utils/sendWebmentions.ts` Script:
- Scannt das Build-Verzeichnis nach Blog-Posts
- Extrahiert Publishing-Datum aus dem HTML
- Sendet Webmentions an Bridgy Publish

## Verwendung

### Dry-Run (Standard)

```bash
# Alle Posts anzeigen
npm run send-webmentions

# Nur neueste Posts (letzte 7 Tage)
ONLY_RECENT=7 npm run send-webmentions

# Nur einen spezifischen Post
POST_ID=19 npm run send-webmentions
```

### Tatsächlich Senden

```bash
# Alle Posts
SEND_WEBMENTIONS=true npm run send-webmentions

# Nur neueste Posts
SEND_WEBMENTIONS=true ONLY_RECENT=7 npm run send-webmentions

# Nur einen Post
SEND_WEBMENTIONS=true POST_ID=19 npm run send-webmentions
```

## Workflow

### Für neue Blog-Posts:

1. **Build erstellen:**
   ```bash
   npm run build
   ```

2. **Webmentions senden (nur für neue Posts):**
   ```bash
   SEND_WEBMENTIONS=true ONLY_RECENT=1 npm run send-webmentions
   ```

3. **Deploy:**
   ```bash
   # Je nach Hosting-Plattform
   git push
   ```

### Für alle Posts (einmalig):

```bash
npm run build
SEND_WEBMENTIONS=true npm run send-webmentions
```

## Environment Variables

| Variable | Beschreibung | Standard | Beispiel |
|----------|--------------|----------|----------|
| `SEND_WEBMENTIONS` | Tatsächlich senden (nicht Dry-Run) | `false` | `true` |
| `ONLY_RECENT` | Nur Posts der letzten N Tage | Alle | `7` |
| `POST_ID` | Nur spezifischer Post | Alle | `19` |

## Bridgy Setup

### Voraussetzungen:

1. **Accounts verbinden:**
   - Gehe zu [brid.gy](https://brid.gy)
   - Verbinde Mastodon, Bluesky, GitHub Accounts

2. **Site verifizieren:**
   - Stelle sicher, dass `https://www.fretchen.eu` in deinen Profilen verlinkt ist
   - Bridgy braucht `rel="me"` Links (bereits im Footer vorhanden)

### Was Bridgy macht:

1. **Erhält Webmention** von unserem Script
2. **Crawlt die Seite** (`https://www.fretchen.eu/blog/19`)
3. **Prüft Microformats** (h-entry, p-name, e-content, etc.)
4. **Verifiziert Target-URLs** (die versteckten Links im HTML)
5. **Postet auf Social Media** (Mastodon, Bluesky, GitHub)

## Troubleshooting

### "No posts to process"

- **Ursache:** Kein Build vorhanden oder Filter zu restriktiv
- **Lösung:** `npm run build` ausführen

### "Build directory not found"

- **Ursache:** Build-Verzeichnis fehlt
- **Lösung:** `npm run build` ausführen

### Bridgy antwortet mit Fehler

- **Ursache:** URL nicht erreichbar, Microformats fehlen, Account nicht verbunden
- **Lösung:** 
  1. Prüfe, ob die URL öffentlich erreichbar ist
  2. Validiere Microformats mit [indiewebify.me](https://indiewebify.me)
  3. Prüfe Bridgy-Account-Verbindung auf [brid.gy](https://brid.gy)

## Automatisierung

### GitHub Actions (Optional)

Füge zu `.github/workflows/deploy.yml` hinzu:

```yaml
- name: Send Webmentions
  run: |
    cd website
    SEND_WEBMENTIONS=true ONLY_RECENT=7 npm run send-webmentions
  env:
    NODE_ENV: production
```

**Hinweis:** Nur nach erfolgreichem Deploy ausführen, damit Bridgy die Live-Site crawlen kann!

## Weitere Informationen

- [Bridgy Publish Dokumentation](https://brid.gy/about#publish)
- [Webmention-Spec](https://www.w3.org/TR/webmention/)
- [Microformats2](https://microformats.org/wiki/microformats2)
- [IndieWeb](https://indieweb.org/)
