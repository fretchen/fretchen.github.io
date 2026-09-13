# Bundestakt als Tool im Assistenten — KISS-Plan (Option B)

**Ziel:** `get_sitzungen` und `search_claims` als stille (nicht bestätigungspflichtige) Tools im
bestehenden `generate_image`-Loop.

**Nicht-Ziel:** MCP-Server, S3-Spiegel, x402-Bezahlung. Alles read-only, kostenlos, direkt gegen
`bundestakt.de`.

---

## 0. Die API — gemessen, nicht geraten

Am 2026-09-13 gegen die Live-API verifiziert. **Genau zwei Endpunkte, beide ohne jeden
Query-Parameter** — jede Filterung passiert clientseitig auf einem Volldump.

| Endpunkt | Größe | Einträge | Ø pro Eintrag |
| --- | --- | --- | --- |
| `GET /api/v1/sitzungen` | **71 KB** | 20 | 3,5 KB |
| `GET /api/v1/claims` | **912 KB** | 197 | 4,6 KB |

`access-control-allow-origin: *` bestätigt, CC BY 4.0, kein Key.

**Sitzung:** `slug`, `url`, `wahlperiode`, `sitzungNr`, `datum`, `dokumentnummer`, `kernthema`,
`in30Sekunden[{ text, titel }]`, `zahlen{ anzahlReden, anzahlZwischenrufe, abstimmungen[],
redezeitJeFraktion[{ fraktion, minuten, wortzahl, anzahlReden }] }`, `protokollPdf`.

**Claim:** `id`, `url`, `sitzungDatum`, `sprecher`, `fraktion`, `aussage`, `bewertung`,
`begruendung`, `geprueftAm`, `quellen[{ url, titel, herausgeber, istPrimaerquelle, abgerufenAm }]`.

### Drei Korrekturen gegenüber der ersten Skizze

1. **Die Bewertungsskala war bei 3 von 4 Werten falsch geraten.** Die API liefert sie selbst als
   Top-Level-Feld `bewertungsskala`:
   `belegt` · `teilweise` · `irrefuehrend` · `falsch` · `unbelegbar`
   (geraten war `wahr`/`falsch`/`teilweise`/`unbelegt` — `wahr` und `unbelegt` existieren nicht,
   `irrefuehrend` fehlte). Ein Enum mit den geratenen Werten hätte immer leer gefiltert.
2. **`quellen` heißt so — Plural, Array, camelCase-Felder.** Kein `quelle`. Claims haben ein
   eigenes `url` auf die Claim-Seite; das ist der Link, der gebraucht wird.
3. **Sitzungen haben `url` bereits als Feld.** Nicht aus dem slug zusammenbauen.

`fraktion` ist **kein sauberes Enum** — neben den Fraktionen stehen dort auch Amtsbezeichnungen
("Staatsminister beim Bundesminister des Auswärtigen"). Also freier String mit Beispielen in der
Beschreibung, plus Substring-Matching statt Gleichheit.

### Was die Größen bedeuten

`begruendung` (Ø 2,1 KB) und `quellen` (Ø 2,0 KB) machen zusammen 90 % eines Claims aus. Beide
müssen raus bzw. gekürzt werden — sonst sind 10 Treffer 46 KB. Gemessen: Projektion ohne `quellen`
mit auf 400 Zeichen gekürzter `begruendung` ergibt für 10 Claims **~6 KB**. Das ist das Budget.

---

## 1. Modul: `website/tools/bundestakt.ts`

Schemas und Fetch-Logik zusammen, getrennt von der Chat-Komponente. Zwei Tools, eins pro Endpunkt —
die API-Form wird 1:1 abgebildet, keine erfundene Abstraktion.

**`get_sitzungen({ slug?, von?, bis? })`** — mit `slug` den vollen Datensatz dieser einen Sitzung,
ohne `slug` die schlanke Liste. Beide Zugriffsmuster, ein Endpunkt, ein Tool, kein Extra-Hop.
Ein separates `get_sitzung` wäre ein drittes Tool ohne eigenen Endpunkt: derselbe Volldump, nur ein
`.find()` darüber — und jeder zusätzliche Hop ist eine separat bezahlte Completion.

**`search_claims({ query?, fraktion?, bewertung? })`** — projizierte Treffer, `limit` intern.

```ts
const BASE = "https://www.bundestakt.de/api/v1";
const MAX_CLAIMS = 10;
const MAX_BEGRUENDUNG_CHARS = 400;
```

### Kürzen nach Elementen, nicht nach Zeichen

Die erste Skizze hatte hier einen Absturz: `JSON.parse(truncate(x))`, wobei `truncate` den
serialisierten String mittendrin abschneidet und `…[gekürzt]` anhängt — `JSON.parse` darauf wirft
garantiert. Und da `entry.run(args)` in der Registry nicht in try/catch liegt, wäre der Fehler bis
in `sendMessage` geflogen und hätte die ganze Nachricht gekillt.

Stattdessen: `filtered.slice(0, MAX_CLAIMS)` plus ein Feld `weitereTreffer: n`. Immer valides JSON,
und das Modell erfährt, dass es mehr gibt.

### Projektionen

```ts
// Sitzungen-Liste: everything needed to pick one, nothing more.
{ slug, datum, kernthema, schlagzeilen: in30Sekunden.map(t => t.titel), url }

// Single Sitzung (slug given): the full record minus the PDF link.
{ ...sitzung }   // ~3.5 KB, fits comfortably

// Claims: drop `quellen` entirely (2 KB each) — the claim's own `url` carries them.
{ aussage, sprecher, fraktion, bewertung, sitzungDatum, url,
  begruendung: begruendung.slice(0, MAX_BEGRUENDUNG_CHARS) }
```

Jede Funktion gibt `{ status: "ok" | "not_found" | "fetch_failed", ... }` zurück und wirft nie —
der Loop soll weiterlaufen und das Modell soll den Fehlschlag erklären können.

**Ein Modul-Level-Cache pro Endpunkt** (Muster: `resetAcceptsCache` in `hooks/x402Discovery.ts`)
verhindert, dass zwei Tool-Calls im selben Zug denselben 912-KB-Dump zweimal ziehen. ~8 Zeilen,
inklusive Reset für die Tests.

> **Code und Tests auf Englisch**, auch wenn dieser Plan deutsch ist — Repo-Konvention. Die
> Tool-`description`-Strings bleiben deutsch, die sind Modell-Input, kein Code.

---

## 2. Registry statt implizitem Dispatch

`runToolCall` in `AssistantChat.tsx` prüft `call.function.name` **heute gar nicht** und geht direkt
in den Bild-Pfad. Ein Namens-Dispatch ist also nötig, sobald ein zweites Tool existiert — diese
Arbeit fällt bei einem wie bei zwei neuen Tools identisch an. Deshalb sind zwei Tools kaum teurer
als eins.

```ts
type ToolEntry = {
  definition: X402Tool;
  requiresConfirmation: boolean;
  run: (args: unknown) => Promise<{ result: object; imageUrl?: string }>;
};

const TOOL_REGISTRY: Record<string, ToolEntry> = {
  generate_image: { definition: generateImageTool, requiresConfirmation: true, run: runGenerateImageCall },
  get_sitzungen:  { definition: getSitzungenTool,  requiresConfirmation: false, run: async (a) => ({ result: await runGetSitzungen(a) }) },
  search_claims:  { definition: searchClaimsTool,  requiresConfirmation: false, run: async (a) => ({ result: await runSearchClaims(a) }) },
};
```

Der bestehende `waitForConfirmation`/Karten-Pfad bleibt für `generate_image` unangetastet.
Unbekannter Name → `{ status: "unknown_tool" }`, kein Crash.

### `toolFailed` muss pro Tool werden

Heute ist `toolFailed` eine einzelne Variable für den ganzen Zug. Das war korrekt, solange es ein
Tool gab. Mit dreien schaltet ein fehlgeschlagener Bundestakt-Call per `tool_choice: "none"` auch
`generate_image` für den Rest des Zuges ab — und umgekehrt. Aus dem Boolean wird ein
`Set<string>` der gescheiterten Namen; `tool_choice` bleibt `"auto"`, solange noch mindestens ein
Tool nutzbar ist, und die Definitionen der gescheiterten Tools werden im nächsten Hop nicht mehr
mitgeschickt.

---

## 3. Konstanten

- **`MAX_HOPS`**: `3` → **`4`**. Das längste realistische Muster ist Liste → Detail → Antwort, also
  drei Hops; die vier geben einen Puffer. (Die Drei-Tool-Variante hätte fünf gebraucht.)
- **`MAX_CLAIMS = 10`**, **`MAX_BEGRUENDUNG_CHARS = 400`** — aus der Messung oben.

---

## 4. Sichtbarkeit im Chat — Lizenzpflicht, nicht nur UX

CC BY 4.0 verlangt Quellenangabe und Verlinkung. Ein Inline-Hinweis im Verlauf, sobald ein
`role: "tool"`-Ergebnis für einen der beiden Namen gepusht wird („🔍 Bundestakt durchsucht"),
erfüllt das sichtbar und verhindert zugleich den falschen Eindruck, das Modell wisse das auswendig —
bei politischen Daten das entscheidende Signal. Keine eigene Karte, ein Chip im bestehenden
Message-Rendering reicht.

---

## 5. System-Prompt-Zusatz

```
Für Fragen zu Bundestagssitzungen, Redezeiten oder Faktenchecks von Aussagen stehen dir
get_sitzungen und search_claims zur Verfügung. Rufe get_sitzungen ohne slug auf, um die
passende Sitzung zu finden, und dann mit deren slug für die Details. Die Daten stammen von
bundestakt.de (KI-gestützte Analyse amtlicher Protokolle, nicht amtlich selbst). Verlinke in
deiner Antwort immer die `url` aus dem Tool-Ergebnis. Wenn etwas nicht im Ergebnis auftaucht,
sage das offen — rate nicht auf Basis von Trainingswissen.
```

---

## 6. Tests

Modul (ohne Chat, gegen gemockte `fetch`):

- `get_sitzungen` ohne `slug` → `status: "ok"`, nur projizierte Felder, kein `zahlen`/`protokollPdf`
- `get_sitzungen` mit unbekanntem `slug` → `status: "not_found"`
- `search_claims` mit `bewertung: "falsch"` → nur passende; **und ein Fall mit dem alten geratenen
  Wert `"wahr"`, der leer liefern muss** — das ist der Regressionsschutz für Korrektur 1
- `search_claims` liefert nie `quellen` und nie mehr als `MAX_CLAIMS`, `weitereTreffer` stimmt
- Mock-500 → `status: "fetch_failed"`, wirft nicht
- Sehr großer Mock → Kürzung greift, Ergebnis ist **parsebares JSON** (Regressionsschutz für den
  `JSON.parse`-Absturz)
- Zwei Calls im selben Zug → nur ein `fetch` (Cache)

Chat-Loop:

- Unbekannter Tool-Name → `unknown_tool`, Loop läuft weiter
- Stille Tools öffnen **keine** Bestätigungskarte; `generate_image` weiterhin schon
- Fehlgeschlagener Bundestakt-Call lässt `generate_image` im nächsten Hop **weiter angeboten**
  (Regressionsschutz für den `toolFailed`-Umbau)
- Zwei-Hop-Konversation läuft innerhalb `MAX_HOPS = 4` durch

Jeder neue Test muss vor dem Fix rot sein — wie im Rest des Repos.

---

## 7. PR-Schnitt: zwei reichen

**PR 1 — `website/tools/bundestakt.ts` + Tests.** Reines Modul, keine Chat-Änderung. Isoliert
testbar, null Risiko für den bestehenden Chat. Hier wird die Projektion gegen echte Antwortdaten
festgezurrt.

**PR 2 — Integration.** Registry-Dispatch, `toolFailed` → `Set`, `MAX_HOPS`, System-Prompt,
Sichtbarkeits-Chip, Loop-Tests.

Wer PR 2 kleiner will, kann den Registry-Umbau als reinen Refactor vorziehen (`generate_image`
unverändert, Tests beweisen identisches Verhalten) und die Tools danach anschließen — nötig ist das
nicht.

---

## 8. Kein Backend-Change nötig — nachgerechnet

`scw_js` ist tool-agnostisch: es validiert `tools`, leitet sie weiter (`FORWARDED_OWN_KEYS`) und
schaut nie auf Namen. Die beiden Grenzen in `llm_schemas.ts`:

| Grenze | Wert | Nach diesem Plan |
| --- | --- | --- |
| `MAX_TOOLS` | 8 | **3** |
| `MAX_TOOLS_BYTES` | 8192 | **2082** (gemessen: 700 + 724 + 654) |

`tool_choice` bleibt bei `"auto"`/`"none"`, `role: "tool"` und `tool_call_id` sind im
`LLMChatMessageSchema` bereits vorgesehen. Also: **kein Backend-PR.**

Zwei Dinge trotzdem wissen:

- **Der Mock nimmt `tools[0]`** (`buildMockUpstreamResponse` in `llm_service.ts`). Solange
  `generate_image` zuerst im Array steht, bleibt der Testnet-Pfad unverändert — die Bundestakt-Tools
  werden dort aber nie durchgespielt. Kein Problem, sie sind kostenlose Client-Fetches und über die
  Modul-Tests abgedeckt.
- **Input-Token zahlt der Betreiber.** `getSettleAmount` deckelt bei `USDC_MAX_PRICE_PER_MESSAGE`
  (~$0.009, aus 6000 Output-Token). Tool-Ergebnisse sind Input-Token in *jedem* weiteren Hop; ab
  grob 18 000 Prompt-Token frisst allein der Input den Deckel auf, und die Differenz wird als
  Unterfakturierung absorbiert. Genau deshalb sind die Projektionsgrenzen aus §0 kein Feinschliff,
  sondern der Kern des Plans.

---

## 9. Explizit außerhalb dieses Plans

- **MCP-Server**: eigenes Produkt für externe Agenten. `bundestakt.ts` ist so geschnitten, dass ein
  späterer MCP-Server ihn importieren kann, statt die Logik zu duplizieren.
- **S3-Spiegel**: nicht nötig, CORS ist offen. Erst relevant bei Downtime oder Rate-Limits.
- **x402-Bezahlung** für Bundestakt-Calls: die API ist kostenlos und CC BY.
- **Drittes Tool `get_sitzung`**: siehe §1 — kein eigener Endpunkt, ein bezahlter Hop extra.
