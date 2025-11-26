# Webmention Automation

Dieses Projekt sendet automatisch Webmentions an:

- **Bridgy Publish**: Cross-Posting auf Mastodon und Bluesky
- **Bridgy Fed**: Federation in das Fediverse/Bluesky

## Unterschied: Bridgy Publish vs. Bridgy Fed

### Bridgy Publish

- **Zweck**: Cross-Posting auf deine eigenen Social Media Accounts
- **Targets**: `brid.gy/publish/mastodon`, `brid.gy/publish/bluesky`
- **Endpoint**: `https://brid.gy/publish/webmention`
- **Resultat**: Post erscheint auf deinen Mastodon/Bluesky Accounts

### Bridgy Fed

- **Zweck**: Federation - dein Blog wird selbst zu einem Fediverse/Bluesky Account
- **Target**: `https://fed.brid.gy/`
- **Endpoint**: `https://fed.brid.gy/`
- **Resultat**: Posts werden an deine Follower im Fediverse/Bluesky gefederated

## Setup

### 1. Links im HTML

Die `Post.tsx` Komponente enthält versteckte Links:

```tsx
{/* Bridgy Fed - für Federation */}
<a className="u-bridgy-fed" href="https://fed.brid.gy/" hidden={true} style={{ display: "none" }} />

{/* Bridgy Publish - für Cross-Posting */}
<a className="u-bridgy-omit-link" href="https://brid.gy/publish/mastodon" style={{ display: "none" }} />
<a className="u-bridgy-omit-link" href="https://brid.gy/publish/bluesky" style={{ display: "none" }} />
```

Diese Links sind im statischen HTML vorhanden und erfüllen die Anforderungen beider Services.

### 2. Webmention-Sender Script

Das `utils/sendWebmentions.ts` Script kann aus **zwei Quellen** lesen:

#### **Option A: Lokales Build-Directory** (Standard)

- Schnell
- Funktioniert offline
- Ideal für lokale Tests

#### **Option B: gh-pages Branch**

- Liest deployed Content
- Benötigt Git Worktree
- Stellt sicher, dass tatsächlich deployed wurde

Das Script erkennt automatisch die beste Quelle.

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

Sendet Webmentions an **beide Services** (Bridgy Publish + Bridgy Fed):

```bash
# Alle Posts (zu beiden Services)
SEND_WEBMENTIONS=true npm run send-webmentions

# Nur neueste Posts (zu beiden Services)
SEND_WEBMENTIONS=true ONLY_RECENT=7 npm run send-webmentions

# Nur einen Post (zu beiden Services)
SEND_WEBMENTIONS=true POST_ID=19 npm run send-webmentions
```

**Was passiert:**

- Post wird an Bridgy Publish gesendet → Cross-Posting auf Mastodon/Bluesky
- Post wird an Bridgy Fed gesendet → Federation an Follower im Fediverse/Bluesky

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

| Variable           | Beschreibung                       | Standard | Beispiel |
| ------------------ | ---------------------------------- | -------- | -------- |
| `SEND_WEBMENTIONS` | Tatsächlich senden (nicht Dry-Run) | `false`  | `true`   |
| `ONLY_RECENT`      | Nur Posts der letzten N Tage       | Alle     | `7`      |
| `POST_ID`          | Nur spezifischer Post              | Alle     | `19`     |

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
