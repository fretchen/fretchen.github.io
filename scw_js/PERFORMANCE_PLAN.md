# Performance Plan: scw_js Cold-Start & S3-Caching

## Übersicht

Gemessene Ausgangslage (2026-07-06):

- Function `growthapi` kalt: **7,2 s** TTFB (warm: 140 ms). `minScale: 0` bleibt bewusst bestehen.
- Ursache 1: `dist/growth_api.js` ist 2,9 MB — `noExternal: [/.*/]` in `tsup.config.js` bündelt den kompletten AWS-SDK-Baum inkl. nie genutzter STS/SSO/credential-provider-Module (Credentials werden immer explizit übergeben).
- Ursache 2: 4,8 MB Sourcemaps landen im Deploy-Artefakt (`package.patterns` umfasst `dist/**`).
- S3-Objekte (`images/`, `metadata/`) haben keinen `Cache-Control`-Header, obwohl sie unveränderlich sind (Zufalls-Suffix im Dateinamen) — Browser dürfen nichts cachen, jeder Galerie-Load zahlt 300–600 ms TTFB pro Objekt.

Drei Phasen = drei PRs, sequenziell, jeweils mit Cold-Start-Messpunkt nach dem Deploy:

| Phase | PR-Branch | Inhalt | Charakter |
| --- | --- | --- | --- |
| 1 | `perf/build-diet` | Sourcemap-Ausschluss + Minify | 2 Zeilen Config |
| 2 | `perf/s3-aws4fetch` | AWS SDK → aws4fetch, alle 4 Services | Reiner Refactor, verhaltensgleich |
| 3 | `perf/cache-headers` | Cache-Header + Backfill-Skript | Erste Verhaltensänderung |

Cold-Start-Messung (nach Scale-to-zero, ~15 min Idle):

```bash
curl -s -o /dev/null -w "total:%{time_total}\n" -X OPTIONS \
  https://mypersonaljscloudivnad9dy-growthapi.functions.fnc.fr-par.scw.cloud/
```

---

## Phase 1: Build-Diät (PR `perf/build-diet`)

### 1.1 Sourcemaps vom Deploy ausschließen

**Datei:** `scw_js/serverless.yml`

Node lädt `.map`-Dateien zur Laufzeit nur mit `--enable-source-maps` — Scaleway setzt das nicht. Die Maps sind reiner Ballast im Deploy-Archiv, das bei jedem Cold-Start geholt und entpackt wird. Lokale Maps in `dist/` bleiben erhalten (`sourcemap: true` in tsup unverändert).

- [ ] Unter `package.patterns` ergänzen: `- "!dist/**/*.map"`

### 1.2 Minify aktivieren

**Datei:** `scw_js/tsup.config.js` (Zeile 13)

`minify: false` war eine bewusste Entscheidung („Keep readable for debugging") — bei Server-Code fehlt der klassische Minify-Nutzen (Netz-Transfer zum Browser). Bei Scale-to-zero zahlt man die Bundle-Größe aber in Cold-Start-Parse-Zeit; die Abwägung kippt. Debugging: Produktions-Stacktraces lassen sich lokal gegen die Sourcemap desselben Builds halten.

- [ ] `minify: false` → `minify: true`, Kommentar anpassen
- [ ] Sicherheitscheck: `NotFoundError`/`AuthError` setzen `this.name` explizit — minifizierte Klassennamen sind unkritisch (verifiziert)

### 1.3 Verifikation

- [ ] `npm run check` grün
- [ ] `ls -la dist/` vor/nach dokumentieren (Erwartung: ~2,9 MB → ~1,2 MB pro großem Bundle)
- [ ] Deploy, Cold-Start messen → **Checkpoint 1** in PR-Beschreibung (Baseline: 7,2 s)

---

## Phase 2: aws4fetch-Migration (PR `perf/s3-aws4fetch`)

**Ziel:** Ein S3-Stack statt zwei. `@aws-sdk/client-s3` (Framework mit Middleware-Stack, Credential-Ketten, XML-Parser) wird durch `aws4fetch` ersetzt (~6 kB, signiert Requests mit SigV4 und nutzt Node-22-`fetch` + WebCrypto). Die gesamte S3-Oberfläche von scw_js ist GET/PUT mit expliziten Keys — nichts braucht das große SDK.

**Verhaltensgleicher Refactor:** Keine Signatur-, ACL- oder Header-Änderung nach außen. Cache-Header kommen erst in Phase 3.

### 2.1 Neues Modul `s3_utils.ts`

**Datei:** `scw_js/s3_utils.ts` (neu)

- [ ] `npm i aws4fetch` (Runtime-Dependency)
- [ ] `@aws-sdk/client-s3` nach `devDependencies` verschieben (nur noch vom Backfill-Skript in Phase 3 genutzt; ohne Import landet es nicht im Bundle)
- [ ] Client-Fabrik: prüft `SCW_ACCESS_KEY`/`SCW_SECRET_KEY` (bestehenden Fehlertext übernehmen), `new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "nl-ams" })`
- [ ] `getS3Object(key): Promise<string | null>` — GET auf `https://my-imagestore.s3.nl-ams.scw.cloud/<key>`; `404` → `null`; sonstiges `!res.ok` → throw mit Status
- [ ] `putS3Object(key, body: string | Uint8Array, opts: { contentType: string; acl?: "public-read"; cacheControl?: string })` — `acl` → Header `x-amz-acl`, `cacheControl` → Header `Cache-Control`; `!res.ok` → throw
- [ ] aws4fetch-Retry-Default belassen

### 2.2 Services umstellen

- [ ] **`growth_service.ts`** (Z. 87–137): `readJsonFromS3`/`writeJsonToS3` intern auf die Helfer; Präfix `growth-agent/` bleibt dort; Signaturen unverändert → `growth_api.ts` und Business-Logik unberührt. `NoSuchKey`-Handling wird 404→null. Kein ACL, kein Cache-Header (mutabler privater State). Lokales `streamToString` (Z. 100–109) löschen.
- [ ] **`image_service.ts`** (Z. 48–93): `uploadToS3` intern auf `putS3Object` mit `acl: "public-read"` — **noch ohne** `cacheControl`. Rückgabe `JSON_BASE_PATH + fileName` bleibt.
- [ ] **`llm_service.ts`**: 4 Client-Konstruktionen (Z. 155/216/253/341), alle GETs/PUTs auf die Helfer; `streamToString` (Z. 301) löschen. **Kein ACL, kein Cache-Header** — Merkle-Daten müssen privat bleiben.
- [ ] **`leaf_history.ts`** (Z. 97–109): GET auf `getS3Object`; lokales `streamToString` (Z. 32) löschen.

### 2.3 Tests: Mock-Tausch (einheitliches Muster)

```ts
const mockS3Fetch = vi.fn();
vi.mock("aws4fetch", () => ({ AwsClient: class { fetch = mockS3Fetch; } }));
// Read:  mockResolvedValueOnce(new Response(JSON.stringify(data), { status: 200 }))
// 404:   new Response("NoSuchKey", { status: 404 })
// Write: new Response("", { status: 200 })
```

- [ ] `test/growth_api.test.ts`: Mock-Schicht (Z. 5–16), Helfer (Z. 124–137), Reset (Z. 146) tauschen; alle Assertions gegen `handle()`-HTTP-Antworten bleiben gültig. Neu: „S3 liefert 500 → Handler antwortet 500"
- [ ] `test/image_service.test.ts` (ab Z. 57): Assertions auf `mockS3Fetch.mock.calls` (`[url, init]`): Key in URL, `x-amz-acl: public-read`, korrekter Content-Type
- [ ] `test/llm_service.test.ts` (Z. 167): Guard „merkle data must not be public-read" portieren → PUT-Calls der Merkle-Writes enthalten **keinen** `x-amz-acl`-Header (Invariante bleibt erhalten, wird nicht gelöscht)
- [ ] `test/leaf_history.test.ts`: GET-Mock analog
- [ ] Neu: Unit-Tests für `s3_utils.ts` (404→null, Fehler-Throw, Header-Mapping)

### 2.4 Verifikation

- [ ] `npm run check` grün
- [ ] `ls -la dist/` — Erwartung: alle vier Bundles schrumpfen um ~2 MB (einige 100 kB Endgröße)
- [ ] Deploy
- [ ] **Funktions-Smoke aller vier Services** (der Integrationspfad signierter Requests gegen echtes Scaleway-S3, den die Mocks nicht abdecken):
  - [ ] Growth-UI: authentifiziertes GET /drafts + ein Approve-Roundtrip
  - [ ] Eine Bildgenerierung Ende-zu-Ende (Upload + Metadaten öffentlich lesbar)
  - [ ] LLM-Endpoint einmal aufrufen (Merkle-Write)
  - [ ] leaf-history-Endpoint einmal aufrufen (GET)
- [ ] Cold-Start messen → **Checkpoint 2** in PR-Beschreibung (Ziel: ~1–2 s)

**Rollback:** Service-Dateien revert + Redeploy (SDK bleibt als devDependency verfügbar).

---

## Phase 3: Cache-Header + Backfill (PR `perf/cache-headers`)

**Ziel:** Unveränderliche öffentliche Objekte (Bilder, NFT-Metadaten) dürfen der Browser dauerhaft cachen. Erste Verhaltensänderung der Serie.

### 3.1 Neu-Uploads

**Datei:** `scw_js/image_service.ts`

- [ ] `uploadToS3`: `cacheControl: "public, max-age=31536000, immutable"` an `putS3Object` übergeben. Betrifft beide Call-Sites (JPEG ~Z. 264, Metadaten-JSON ~Z. 279) — beide korrekt, da Dateinamen Zufalls-Suffix tragen und nie überschrieben werden
- [ ] **Nicht** anfassen: `growth_service`-Writes und `llm_service`-Merkle-Writes (mutabel bzw. privat)
- [ ] `test/image_service.test.ts`: Header-Assertion `Cache-Control: public, max-age=31536000, immutable` ergänzen

### 3.2 Backfill-Skript für Bestandsobjekte

**Datei:** `scw_js/scripts/backfill_cache_control.ts` (neu), Ausführung: `npx tsx scripts/backfill_cache_control.ts`

Nutzt `@aws-sdk/client-s3` (devDependency — ListObjectsV2 mit SDK ist fürs einmalige Skript pragmatischer als XML-Parsing). Credentials via dotenv-Muster wie in `image_service.ts` Z. 1–10.

- [ ] Präfixe `images/` und `metadata/` per `ListObjectsV2Command` paginieren
- [ ] Pro Key `HeadObjectCommand`: `ContentType` merken; **skip wenn `CacheControl` bereits gesetzt** (macht Re-Runs idempotent)
- [ ] In-place-Copy pro Key:

```ts
new CopyObjectCommand({
  Bucket: "my-imagestore",
  Key: key,
  CopySource: encodeURI(`my-imagestore/${key}`),
  MetadataDirective: "REPLACE",
  ContentType: head.ContentType, // REPLACE resettet ihn sonst
  CacheControl: "public, max-age=31536000, immutable",
  ACL: "public-read", // KRITISCH: Copy resettet die ACL auf privat
})
```

- [ ] Log pro Key + Summary; ~5 Requests parallel; Fail-fast mit Ausgabe des fehlgeschlagenen Keys

### 3.3 Verifikation

- [ ] `curl -I https://my-imagestore.s3.nl-ams.scw.cloud/metadata/<bestands-key>.json` → `Cache-Control` vorhanden, `Content-Type` erhalten, **anonym Status 200** (beweist re-applizierte ACL — der wichtigste Check)
- [ ] Eine neue Bildgenerierung → neues Objekt trägt den Header ebenfalls
- [ ] Browser: zweiter Galerie-Load zeigt „from disk cache" im Network-Tab

---

## Risiken

- **SigV4-Edge-Cases aws4fetch↔Scaleway** (Signatur, Payload-Hash): durch den Funktions-Smoke in Phase 2.4 gegated; Rollback trivial.
- **Backfill-Footgun:** `CopyObject` mit `MetadataDirective: REPLACE` resettet ACL **und** ContentType — beides wird explizit neu gesetzt und per curl verifiziert.
- **Minify:** Stacktraces in Scaleway-Logs werden kryptisch; lokale Sourcemaps in `dist/` bleiben zum Korrelieren.

## Follow-ups (out of scope)

- Bucket-ACL auf privat (anonymes ListBucket unterbinden) — siehe Security-Notiz in `SECURITY.md` (eigener PR `security/bucket-listing`).
- JSON-RPC-Transport-Batching / dedizierte RPC-URLs (website).
- CDN (Scaleway Edge / Bunny) nur falls der Erstbesuch nach dem Cache-Fix noch stört. Achtung: On-chain-`tokenURI`s zeigen fest auf die S3-Domain — ein CDN unter neuer Domain wirkt nur für neue Uploads.
