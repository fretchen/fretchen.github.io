# Performance Plan: Website — Growth-Prewarm & NFT-Ladepfad

## Übersicht

Gemessene Ausgangslage (2026-07-06):

- **Growth-UI:** Die Scaleway Function `growthapi` braucht kalt 7,2 s (warm 140 ms, `minScale: 0` bleibt bewusst). Der erste authentifizierte Request der UI trifft praktisch immer einen kalten Container — dabei vergehen zwischen Seitenaufruf und erstem API-Call ohnehin Sekunden (Wallet-Connect + Signatur), die man zum Vorwärmen nutzen kann.
- **Imagegen-Galerie:** wagmi v3 hat Multicall-Batching per Default an, aber nur mit `wait: 0` (Koaleszenz im selben Tick). Die `NFTCard`-Komponenten mounten verteilt, daher geht weiterhin ein `eth_call` pro Karte raus statt einem gebündelten multicall3-Aufruf.

Zwei Phasen = zwei unabhängige PRs (kein Zusammenhang, jederzeit parallel möglich):

| Phase | PR-Branch | Inhalt |
| --- | --- | --- |
| 4 | `perf/growth-prewarm` | Fire-and-forget-Prewarm der Growth-API beim Seitenmount |
| 5 | `perf/wagmi-batch` | Multicall-Koaleszenzfenster auf einen Frame verbreitern |

Das serverseitige Gegenstück (Bundle-Diät, aws4fetch, Cache-Header) steht in `scw_js/PERFORMANCE_PLAN.md`.

---

## Phase 4: Growth-API-Prewarm (PR `perf/growth-prewarm`)

**Idee:** Beim Mount der `/growth`-Seite sofort einen auth-freien `OPTIONS`-Request an die Function schicken. Der Cold-Start läuft dann parallel zu Wallet-Connect und Signatur ab; der erste echte `GET /drafts` landet warm. `OPTIONS` beantwortet der Handler vor jeder Auth-Prüfung mit 200 (CORS-Preflight-Pfad in `scw_js/growth_api.ts`).

### 4.1 Prewarm-Funktion

**Datei:** `website/hooks/useGrowthApi.ts` (neben `API_BASE`, Z. 9–11)

- [ ] Export ergänzen:

```ts
/** Fire-and-forget cold-start prewarm. OPTIONS returns 200 without auth. */
export function prewarmGrowthApi(): void {
  fetch(`${API_BASE}/drafts`, { method: "OPTIONS" }).catch(() => {});
}
```

### 4.2 Aufruf beim Seitenmount

**Datei:** `website/pages/growth/+Page.tsx`

- [ ] `useEffect` importieren, `prewarmGrowthApi` aus dem Hook-Import ergänzen
- [ ] In `Page()` (nach ~Z. 574): `useEffect(() => { prewarmGrowthApi(); }, []);`
- Bewusst **nicht** auf `isOwner` gegated: Die Function soll booten, während der Owner Wallet verbindet und signiert; Besuche von Nicht-Ownern wärmen nur eine idle Function (`maxScale: 1` deckelt Kosten). `useEffect` läuft nie im SSR — kein Gating nötig.

### 4.3 Tests

- [ ] `website/test/GrowthPage.test.tsx` (Mock-Factory Z. 19–31): **Pflicht** — `prewarmGrowthApi: vi.fn()` in die `vi.mock("../hooks/useGrowthApi")`-Factory aufnehmen, sonst crasht jeder Test des Files am fehlenden Export. Plus Assertion: Render → prewarm wurde aufgerufen
- [ ] `website/test/useGrowthApi.test.ts` (fetch global gestubbt, Z. 14):
  - [ ] `prewarmGrowthApi()` ruft fetch genau einmal mit `method: "OPTIONS"` und URL unter `API_BASE` auf — und triggert **keine** Signatur (`mockSignMessageAsync` nicht gerufen)
  - [ ] fetch-Rejection wird geschluckt (kein Throw, keine unhandled rejection)

### 4.4 Verifikation

- [ ] `npm test` grün
- [ ] Deployed: `/growth` öffnen → Network-Tab zeigt den `OPTIONS`-Request beim Mount (200); nach Wallet-Connect landet das erste `GET /drafts` in Warm-Latenz (~140 ms Serverzeit statt Sekunden)

---

## Phase 5: wagmi Multicall-Fenster (PR `perf/wagmi-batch`)

**Idee:** `readContract`-Aufrufe (tokenURI, ownerOf, isListed …) aus vielen gleichzeitig mountenden `NFTCard`s über ein 16-ms-Fenster sammeln und als einen `multicall3.aggregate3`-Call absetzen.

### 5.1 Config-Änderung

**Datei:** `website/wagmi.config.ts`

- [ ] In `createConfig` als Top-Level-Property ergänzen:

```ts
batch: { multicall: { wait: 16 } },
```

- Hintergrund: wagmi v3 defaultet bereits `batch: { multicall: true }`, aber mit viems `wait: 0` (nur selber Tick). `createConfig` reicht die Property an viems `createClient` pro Chain durch (in installierter Quelle verifiziert). Alle sechs konfigurierten Chains haben multicall3-Deployments. Transports bleiben unverändert; **kein** JSON-RPC-Batching (`http(..., { batch: true })`) — öffentliche RPC-Endpoints drosseln teils gebatchte Payloads (Follow-up, falls nötig).

### 5.2 Tests & Verifikation

- [ ] `npm test` grün (keine Änderungen erwartet — Tests mocken wagmi-Hooks, nicht den Transport)
- [ ] Browser, Imagegen-Galerie: Network-Tab zeigt, dass die RPC-POSTs zu wenigen `eth_call`s an multicall3 (`0xcA11bde05977b3631167028862bE2a173976CA11`) kollabieren statt ein Call pro Karte
- [ ] Sichtprüfung: Karten laden inkl. einem Fehlerfall (z. B. Testnet-Token) — per-Call-Fehler betreffen weiterhin nur die jeweilige Karte

---

## Follow-ups (out of scope)

- JSON-RPC-Transport-Batching (`http(undefined, { batch: { batchSize: 10, wait: 16 } })`) und/oder dedizierte RPC-URLs, falls der Network-Tab weiter chattert.
- Serverseite: siehe `scw_js/PERFORMANCE_PLAN.md` (Bundle-Diät, aws4fetch-Migration, Cache-Header + Backfill).
