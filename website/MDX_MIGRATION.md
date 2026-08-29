# Blog-Stack: Migration nach MDX und Vike-nativem Rendering

Arbeitsplan in drei Stufen. Jede Stufe ist einzeln lieferbar und einzeln wertvoll —
nach jeder kann abgebrochen werden, ohne dass ein halber Umbau liegen bleibt.

---

## Ausgangslage

Verifiziert am Stand `coast_post` (2026-08-23):

| Fakt | Beleg |
|---|---|
| 29 MDX-Posts, 5 TSX-Posts im Blog | `ls blog/` |
| 33 MDX-Vorlesungen in 4 `quantum/`-Ordnern | `quantum/{amo,basics,hardware,qml}` |
| **34 von 36** prerenderten Seiten enthalten als Artikeltext nur `🔄 Lade interaktive Komponente...` | `grep -rl` über `build/blog/*/index.html` |
| Betroffen sind auch reine Prosa-Posts ohne jede Interaktivität | `blog/ipfs.mdx` (4.773 B Markdown, 0 Imports) → 477 Zeichen sichtbarer Text im HTML, davon der Großteil Navigation |
| `prerender: true` ist aktiv — Prerendering läuft, der Blog-Inhalt entwischt ihm | `pages/+config.ts:24` |
| Ursache: `ReactPostRenderer` lädt den Post in einem `useEffect`, der in Node nie feuert | `components/Post.tsx:41-85` |
| `vike-react` bietet `clientOnly()` und `<ClientOnly>` — im Repo **nirgends** benutzt | `node_modules/vike-react/dist/helpers/clientOnly.d.ts` |
| Vike akzeptiert `.mdx` als vollwertige `+Page`-Endung | `node_modules/vike/dist/utils/isScriptFile.js` → `extTemplates` enthält `'mdx'` |
| `stream: { require: true, disable: true }` — SSR per Stream, Ergebnis wird zu einem String zusammengefasst | `node_modules/vike-react/dist/types/Config.d.ts:158-182` |

### Latenter Bug, unabhängig von allem anderen

Die URL eines Posts ist sein **Index im nach `publishing_date` sortierten Array**
(`utils/blogLoader.ts:137-144`, `pages/blog/@id/+onBeforePrerenderStart.js`). Der Kommentar
im Code („oldest first to keep stable URLs") schützt nur davor, dass *neuere* Posts die
alten verschieben. Ein Post mit **rückdatiertem** `publishing_date` verschiebt jede URL
danach um eins — und bricht damit Links, Webmentions und die NFT-Zuordnung.

Stufe 2.5 unten behebt das. Es lohnt sich auch dann, wenn Stufe 3 nie kommt.

---

## Stufe 1 — TSX-Posts nach MDX konvertieren

**Ziel:** Prosa wird Markdown, Widgets werden benannte Komponenten in `components/blog/`.
**Wert für sich allein:** Wartbarkeit, ein Dateiformat, ~60 Zeilen Sonderbehandlung weniger.
**Der eigentliche Wert:** ohne diese Trennung ist Stufe 2 unmöglich (siehe unten).

### Warum das die Bedingung für Stufe 2 ist

In `blog/prisoners_dilemma_interactive.tsx:17` läuft `ChartJS.register(...)` auf Modulebene.
Das Modul zu importieren zieht Chart.js in den Node-Build — und Chart.js braucht ein DOM.
Solange Prosa und Chart im selben Modul liegen, gibt es keine Granularität: entweder der
ganze Post rendert in Node oder gar keiner. Aktuell: gar keiner, für **alle** Posts.

MDX zerlegt das. Vorbild ist `blog/etf_diversification_interactive.mdx` — Prosa als
Markdown, Widgets als Imports aus `components/blog/`. Das Muster existiert bereits und
funktioniert.

### Reihenfolge

Aufsteigend nach Schwierigkeit, nicht nach Größe.

- [x] **1.1 `budget_gridlock_interactive.tsx`** (669 Z., 262 Z. Prosa in Template-Strings, chart.js)
  Pilot. Höchster Prosa-Anteil, der bereits als Markdown vorliegt.
- [x] **1.2 `tragedy_of_commons_fishing.tsx`** (2025 Z., 140 Z. Markdown-Strings)
- [x] **1.3 `prisoners_dilemma_interactive.tsx`** (1606 Z., 190 Z. Strings + 18 `<p>` in JSX, chart.js)
- [x] **1.4 `merkle_ai_batching.tsx`** (381 Z., reine JSX-Prosa, 23 `<p>`, Mermaid) —
  Callout-Boxen und der eingefärbte Link wurden beim Umbau auf Blockquote/Liste/Standardlink
  vereinfacht statt als neue `components/blog/`-Komponenten portiert (Analyse gegen
  `IDENTITY.md`: keiner der 31 bestehenden MDX-Posts nutzt `<div>`/`className`).
- [x] **1.5 `merkle_ai_batching_fundamentals.tsx`** (1243 Z., reine JSX-Prosa, 21 `<p>`, Mermaid)

1.1–1.3 sind weitgehend mechanisch: die Prosa liegt dort schon als Markdown vor und wird
heute nur **zur Laufzeit im Browser** von `react-markdown` geparst statt zur Buildzeit von
MDX. Das ist eine echte Dopplung der Pipeline.

1.4/1.5 sind Handarbeit: Prosa ist mit Panda-`css()` in JSX verwoben.

### Pro Datei

1. Widgets nach `components/blog/<Name>.tsx` extrahieren, Default-Export.
2. Prosa nach Markdown; `<MarkdownWithLatex>{\`...\`}</MarkdownWithLatex>` → Fließtext.
3. `export const meta = {…}` → Frontmatter. Mapping ist 1:1:
   `title`, `publishing_date`, `tokenID`, `description`, `category`, `secondaryCategory`, `order`.
4. `publishing_date` **unverändert** übernehmen — davon hängt die URL ab.

### Fallen

- **`publishing_date` ändern verschiebt URLs.** Siehe latenter Bug oben.
- **Code-Blöcke laufen ab jetzt durch `MdxPre`** (`components/Post.tsx:143`). TSX-Posts
  haben den `components`-Prop ignoriert, MDX nicht. Optische Änderung möglich, prüfen.
- **LaTeX:** MDX schützt `$$…$$` über `remark-math` (`vite.config.ts`). Der klassische
  Bruch sind Unterstriche in Formeln, die sonst zu `<em>` werden. Jede Formel nach der
  Konvertierung im Browser ansehen.
- **Panda:** die inline-`css()`-Boxen aus 1.4/1.5 müssen entweder eigene Komponenten
  werden oder in Markdown aufgehen. Kein `css()` mit JS-Variablen — siehe `CLAUDE.md` Regel 1.
- **Mermaid** (`components/MermaidDiagram.tsx`) galt als `clientOnly()`-Kandidat für Stufe 2 —
  hinfällig, siehe Stufe 2.1: `clientOnly` ist inzwischen ganz aus dem Repo verschwunden.

### Aufräumen, wenn alle fünf durch sind

- [x] `utils/blogLoader.ts` — TSX-Zweig und zweite Fallback-Titel-Regel entfernt
- [x] `utils/globRegistry.ts` + `utils/lazyGlobRegistry.ts` — 10× `*.{tsx,mdx}` → `*.mdx`
- [x] `types/BlogPost.ts` — `BlogPostMeta` gelöscht
- [x] `types/BlogPost.ts` — `PostType` entfernt, dazu das tote `type`-Feld auf
  `BlogPost`/`PostProps` und `type={blog.type}` in allen fünf `+Page.tsx` (blog + 4×
  quantum) — beim Aufräumen zusätzlich gefunden, nicht Teil der ursprünglichen Liste
- [x] `components/MarkdownWithLatex.tsx` gelöscht (`react-markdown` bleibt als Dependency
  für `AssistantChat.tsx`)
- [x] Tests: `blogLoader.unit.test.ts`, `blogLoader.test.ts`, `blogLoader.integration.test.ts`,
  `blogLoader.nft.test.ts` — plus (breiterer Kreis als ursprünglich vermutet)
  `Post.integration.test.tsx`, `Post.microformats.test.tsx`, `Post.chunkFailure.test.tsx`,
  `EntryList.integration.test.tsx`, die alle noch `type: "react"`-Requisiten oder
  `.tsx`-Filter enthielten
- [x] Root `CLAUDE.md` → Abschnitt *Blog Posts*: `.tsx` als Format gestrichen

### Abnahme

```
npm run build
```

Dann `build/blog/*/index.html` vorher/nachher vergleichen: **die Menge der URLs und die
Titel-zu-URL-Zuordnung muss identisch sein.** Alles andere ist ein Bug, kein Fortschritt.
Zusätzlich `npm test`, `npm run typecheck`, `npm run lint`.

---

## Stufe 1.6 — Schwere Widget-Dependencies entfernen ("Posts aufräumen")

**Anlass:** Die Suche nach einem nicht-deprecateten Ersatz für `clientOnly()` (Stufe 2.1)
zeigte, dass zwei der drei schweren Dependencies, die es gating-mäßig verstecken sollte,
gar nicht nötig waren — nicht nur später ladbar, sondern komplett entfernbar. chart.js war
reine Dekoration, die an anderer Stelle in genau diesem Repo bereits von Hand als SVG
gebaut wird; der Merkle-Tree-Post ließ sich um ~85 % verkleinern, indem `viem` (ohnehin
Dependency) statt des vollen `@openzeppelin/merkle-tree`-Pakets verwendet wird. Diese
Arbeit ist orthogonal zum Render-Mechanismus aus Stufe 2 — sie rührt `Post.tsx`,
`postModuleCache.ts` und die Render-Hooks nicht an, nur `components/blog/*.tsx` und
`package.json`. Sie ist deshalb in einem eigenen Branch/PR gelandet, **vor** der
Rückkehr zur `clientOnly`-Frage.

### Teil A — Chart.js → handgebautes SVG (2 Posts, 3 Dateien, keine Textänderung)

- `ExpectedUtilityPlot.tsx`, `GameSimulation.tsx` (`prisoners_dilemma_interactive`) und
  die Line-Chart-Hälfte von `DiversificationRandomWalk.tsx` (`etf_diversification_interactive`)
  nutzen jetzt `components/blog/SvgLineChart.tsx` — ein gemeinsames, handgebautes
  SVG-Linienchart (Legende, Achsentitel/-ticks, optionale gestrichelte Marker-Linie) statt
  `react-chartjs-2`.
- `chart.js`, `react-chartjs-2`, `chartjs-plugin-annotation` aus `package.json` entfernt.
- Bewusst weggelassen: Hover-Tooltips (gab es vorher per chart.js gratis; kein bestehendes
  SVG-Widget im Repo hat das Muster, und die Kurvenform/Kreuzungspunkte tragen die
  didaktische Aussage bereits über Labels/Marker-Linie).

### Teil B — Merkle-Tree → minimaler Wrapper (1 Post, 2 Dateien, MIT Text-Hinweis)

- `utils/minimalMerkleTree.ts` — eine minimale Neuimplementierung von
  `StandardMerkleTree` (`.of()`, `.root`, `.getProof()`, `.leafHash()`, `.entries()`,
  `.verify()`) auf Basis von `encodeAbiParameters`/`keccak256` aus `viem`. Repliziert
  OpenZeppelins Algorithmus exakt (doppeltes Leaf-Hashing, sortiertes Pair-Hashing für
  interne Knoten) — keine vereinfachte Variante.
- `@openzeppelin/merkle-tree` ist jetzt **nur noch devDependency**, verwendet einzig in
  `test/minimalMerkleTree.test.ts` als permanente Regressionsprüfung: beide Implementierungen
  laufen über dieselben Fixture-Daten, `.root`/`.getProof()`/`.leafHash()`/`.verify()` müssen
  exakt übereinstimmen (inkl. Edge Cases: ungerade Blattzahl, ein einzelnes Blatt).
- `components/blog/BatchCreator.tsx` und `ProofDemo.tsx` importieren jetzt aus
  `utils/minimalMerkleTree.ts` statt aus dem OpenZeppelin-Paket.
- `blog/merkle_ai_batching_fundamentals.mdx` hat einen neuen Abschnitt *"A note on the demos
  above"* (vor dem Schlussabschnitt), der offenlegt, dass die Demos eine minimale, gegen das
  Original getestete Neuimplementierung nutzen statt der vollen Bibliothek.

### Ergebnis für die `clientOnly`-Frage

Nach Teil A und B wurden die Gzip-Größen der drei betroffenen Post-eigenen Chunks frisch
gemessen (`rm -rf build && npm run build`, dann `gzip -c <chunk> | wc -c`):

| Post | Chunk-Größe (gzip) |
| --- | --- |
| `etf_diversification_interactive` | ~11.3 KB |
| `prisoners_dilemma_interactive` | ~12.6 KB |
| `merkle_ai_batching_fundamentals` | ~9.2 KB |

Das liegt in derselben Größenordnung wie andere, nie gegatete Widgets im Repo — und weit
unter dem, was die vorherigen schweren Dependencies gebraucht hätten. **Ergebnis: `clientOnly`
wird für keinen der drei Posts mehr gebraucht.** Es verschwindet nicht, weil es ersetzt wurde,
sondern weil nichts mehr ein Gating braucht.

**Update, nach Merge in `spike/stufe-2.0`:** Die drei `clientOnly()`-Stellen wurden entfernt
(zurück auf normale `import`s, wie jedes andere Widget in `components/blog/`). Vorher/Nachher
gemessen (Gzip, `rm -rf build && npm run build`):

| Post | Mit `clientOnly` (Post-Chunk + separate(r) Widget-Chunk(s)) | Ohne Gating (ein Chunk) |
| --- | --- | --- |
| `etf_diversification_interactive` | 8.2 KB + 3.0 KB = 11.1 KB, 2 Requests | 11.3 KB, 1 Request |
| `prisoners_dilemma_interactive` | 12.1 KB + 1.4 KB + 2.4 KB = 15.9 KB, 3 Requests | 14.2 KB, 1 Request |
| `merkle_ai_batching_fundamentals` | 4.7 KB + 2.8 KB + 2.6 KB = 10.2 KB, 3 Requests | 9.2 KB, 1 Request |

`clientOnly` war zu diesem Zeitpunkt auf jeder Achse schlechter: mehr Bytes insgesamt (der
Modul-Wrapper pro Chunk kostet etwas), mehr Requests, und kein echter UX-Vorteil — es lädt
sofort beim Client-Mount, nicht erst bei Sichtbarkeit/Interaktion, verzögert also nichts
Sinnvolles. `clientOnly` wurde außerdem **ausschließlich** in diesen drei `.mdx`-Dateien
verwendet (`grep -rln clientOnly` im ganzen Repo) — mit der Entfernung ist die deprecated API
vollständig aus dem Code verschwunden, ohne dass der zuvor entworfene `useHydrated` +
`lazy` + `Suspense`-Ersatz gebraucht wurde. Die `clientOnly`/`useHydrated`-Frage aus
Stufe 2.1 ist damit geschlossen.

### Abnahme

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` (Chart.js/react-chartjs-2/
chartjs-plugin-annotation und `@openzeppelin/merkle-tree` dürfen in keinem Build-Chunk mehr
auftauchen — per `grep -rl` geprüft), visueller Check beider Posts (Slider/Buttons steuern
die Charts weiterhin korrekt, Legenden/Achsentitel vorhanden, Proof-Demo generiert/validiert
weiterhin).

---

## Stufe 2 — Inhalt ins HTML bringen

**Ziel:** Der Artikeltext steht in der Datei, nicht im JavaScript.
**Wert:** Bridgy Fed / Webmentions bekommen echten Inhalt statt `🔄 Lade interaktive
Komponente...` (siehe die Klage in `components/Post.tsx:136-140`), SEO, LCP, ToC ohne JS.
**Betrifft alle 36 Seiten**, nicht nur die fünf aus Stufe 1.

### 2.0 Spike — erledigt, Ergebnis: Ansatz B, kein `<template>`, `stream` bleibt unangetastet

Der ursprünglich hier notierte Weg (`React.lazy` + `<Suspense>` + `stream: { require: true,
disable: true }`) wurde **nicht gebraucht**. Beim Lesen der installierten `vike-react`-Quelle
zeigte sich ein dritter, einfacherer Mechanismus:

**Ansatz B — Modul vorab auflösen, dann synchron rendern.** `+onBeforeRenderHtml.ts`
(Server) und `+onBeforeRenderClient.ts` (Client) werden von vike-react **awaited**, bevor
`renderToString`/`renderToStream` bzw. `hydrateRoot` laufen. Dort wird das Post-Modul per
`import()` aufgelöst und in einem modul-scope Cache (`utils/postModuleCache.ts`) abgelegt;
`components/Post.tsx` liest den Cache dann **synchron** und rendert die Komponente direkt —
kein `lazy`, kein `Suspense`, keine `<template>`-Möglichkeit, weil gar keine
Suspense-Boundary im SSR-Baum existiert. Code-Splitting bleibt erhalten, weil der Import
weiterhin über `utils/lazyGlobRegistry.ts` läuft.

Gemessen auf `spike/stufe-2.0` (Details und Rohdaten im dortigen Plan-Verlauf):

- **Q1 (die Weiche):** `/blog/3` (`ipfs.mdx`) — Ladetext weg, Artikeltext 477 → 4582 Zeichen,
  **null** `<template>`-Tags. Text steht in Dokumentreihenfolge in `<article class="h-entry">`.
- **Q3 (Widget-Posts):** `/blog/23` mit einem auf `clientOnly()` umgestellten Widget — Build
  grün, Prosa im HTML, Widget-eigene UI-Strings **fehlen** im HTML (Server-Fallback greift),
  Widget-Chunk bleibt klein (23 KB) und getrennt von den großen Vendor-Chunks.
- **Q2 (Hydration/Splitting):** `npm test`/`typecheck`/`lint` grün, `[ChunkSizes]` unauffällig,
  keine Server-Fehler im Dev-Log. **Offen:** ein Mensch muss noch in der Browser-Konsole auf
  eine Hydration-Mismatch-Warnung prüfen — das konnte diese Session nicht headless verifizieren.

**Ein echter Bug wurde dabei gefunden und behoben**, nicht im Framework, sondern im
Spike-Code selbst: `React.useState(cachedComponent ?? null)` — eine Funktion direkt als
Initialwert an `useState` übergeben, wird von React als Lazy-Initializer **aufgerufen**.
Die Komponentenfunktion wurde dadurch durch ihr eigenes Render-Ergebnis ersetzt. Fix:
`useState(() => cachedComponent ?? null)`.

**Konsequenz:** Stufe 3 ist **nicht** der erzwungene Weg. Sie bleibt optional, wie ursprünglich
vorgesehen. `stream` wird nie angefasst.

### 2.1 Widgets client-only machen — erledigt, Ergebnis: nicht gebraucht

Ursprüngliche Idee: statt den ganzen Post nachzuladen, nur die DOM-abhängigen Teile per
`clientOnly()` gating — für `ExpectedUtilityPlot`/`GameSimulation`/`DiversificationRandomWalk`
(chart.js) und `BatchCreator`/`ProofDemo` (`@openzeppelin/merkle-tree`), die drei Posts mit
messbar schweren Widget-Dependencies. Das wurde im Spike (2.0, Q3) auch nachweislich korrekt
umgesetzt: Server liefert nur den Fallback, Widget bleibt aus dem HTML draußen, eigener
kleiner Chunk bleibt erhalten.

`clientOnly()` ist aber deprecated (`assertWarning` in `vike-react/dist/helpers/clientOnly.js`,
verweist auf `<ClientOnly>`). Stufe 1.6 (siehe oben) hat die eigentliche Ursache behoben, statt
die deprecated API zu ersetzen: chart.js wurde durch handgebautes SVG ersetzt, das
`@openzeppelin/merkle-tree`-Paket durch einen minimalen, gegengetesteten Wrapper auf `viem`.
Danach war in keinem der drei Posts noch etwas übrig, das ein Gating gerechtfertigt hätte
(gemessen, siehe „Ergebnis für die `clientOnly`-Frage" oben) — die drei `clientOnly()`-Stellen
wurden entfernt, zurück auf normale `import`s wie jedes andere Widget in `components/blog/`.

`clientOnly` wurde ausschließlich in diesen drei `.mdx`-Dateien verwendet — mit der Entfernung
ist die deprecated API vollständig aus dem Code verschwunden. Damit bleibt auch die Notiz in
`website/CLAUDE.md` („Client-only components need `{ ssr: false }`") weiterhin ohne gelebtes
Vorkommen im Repo — unverändert korrekt, aber ungenutzt.

### 2.2 `ReactPostRenderer` umbauen

`components/Post.tsx:31-146`. Der `useState`/`useEffect`/`loading`/`error`-Apparat entfällt.
Beachten: `onReady` treibt heute die ToC (`contentReady`, `Post.tsx:167-169`) — wenn der
Inhalt schon beim ersten Render da ist, wird die Bereitschaftslogik einfacher, muss aber
bei Post-zu-Post-Navigation weiter funktionieren.

Die `e-content`-Klasse muss auf dem Element mit dem echten Artikel landen (der Kommentar
bei `Post.tsx:136-140` erklärt, warum das nicht egal ist).

### 2.3 Abnahme

```
npm run build
grep -c "Lade interaktive Komponente" build/blog/*/index.html   # muss 0 sein
```

Und stichprobenartig: steht der Fließtext von `blog/ipfs.mdx` im HTML? Heute sind es
477 Zeichen sichtbarer Text bei 4.773 Byte Quelltext.

### 2.4 Optional

`rehype-katex` in `vite.config.ts` ergänzen, dann ist auch Mathe statisch im HTML und
`hooks/useKaTeXRenderer.ts` kann verschwinden. Der Kommentar in `vite.config.ts` erklärt,
warum das bisher bewusst client-seitig war — die Entscheidung ist nach Stufe 2 neu zu treffen.

---

## Stufe 2.5 — Explizite IDs im Frontmatter (klein, unabhängig, lohnend)

Behebt den latenten Bug von oben und ist die Vorarbeit für Stufe 3.

- [ ] In jeden Post `id: <aktueller Index>` ins Frontmatter schreiben — die Werte einmalig
      aus dem aktuellen Build ablesen, damit keine URL sich ändert.
- [ ] `pages/blog/@id/+data.ts` und `+onBeforePrerenderStart.js` auf Lookup nach `id`
      umstellen statt Array-Index.
- [ ] Testen: ein Post mit rückdatiertem `publishing_date` darf keine fremde URL mehr verschieben.
- [ ] Sortierung für die Übersichtsseite bleibt `publishing_date` — nur die URL wird entkoppelt.

Danach ist die URL eine bewusst vergebene, dauerhafte Eigenschaft des Posts statt eines
Nebenprodukts der Sortierung.

---

## Stufe 3 — Eine Vike-Seite pro Post, über `+pages`

**Ziel:** Vike kennt das Modul jedes Posts zur Buildzeit statisch. Damit wird der Post
gewöhnlicher synchroner SSR-Inhalt, Code-Splitting kommt gratis, und die in Stufe 2
handgebaute Priming-Infrastruktur wird **löschbar statt ersetzbar**.

**Randbedingung (gesetzt):** kein Unterordner pro Post, und `blog/` und `quantum/` bleiben,
wo sie sind. Explizite IDs sind ok.

### Warum die alten Varianten 3a/3b gestorben sind

Beide (`pages/blog/3/+Page.mdx` bzw. Slug-Ordner + `+route.ts`) verlangen **einen Ordner pro
Post** und das Verschieben der Inhalte nach `pages/`. Das ist kein Schönheitsfehler des
Plans, sondern Vikes Routing-Modell: eine Seite *ist* ein Verzeichnis mit einer
`+Page`-Datei. Flache Datei-Routen gibt es nicht. Damit fallen 3a und 3b unter der
Randbedingung aus.

Zur Einordnung — das ist eine anerkannte, offene Schwäche, keine Geschmacksfrage:
[#1322](https://github.com/vikejs/vike/issues/1322) („the file name … is much more
significant than the folder it is in", offen seit Dez 2023) — brillout schlägt dort flache
`pages/about+Page.js`-Syntax vor, nennt sie *"functional"*, später *"Neat ideas, I like
them … we're going in the right direction 👀"*. Seit über zwei Jahren nicht umgesetzt.

### Der Mechanismus: `+pages` (verifiziert)

Vike kann Seiten **programmatisch aus einer einzigen globalen Datei** definieren. Verifiziert
per Wegwerf-Spike in diesem Repo (vike 0.4.262):

```ts
// pages/+pages.ts  — der Default-Export IST das Array
import BlogStack from "../blog/blog_stack.mdx";     // Inhalt bleibt in blog/
import BlogUpdates from "../blog/blog_updates.mdx";

const ordered = [BlogStack, BlogUpdates];
export default ordered.map((Page, i) => ({ route: `/blog/${i}`, Page }));
```

Gemessen:

- ✅ Baut und prerendert — echter Fließtext im statischen HTML
- ✅ **Kein Ordner pro Post**, Inhalte bleiben in `blog/` / `quantum/`
- ✅ **Echtes Code-Splitting pro Seite**, nachgewiesen: Seite A referenziert nur A's Chunk,
  nicht B's, und umgekehrt. Vike wandelt `.mdx`-Importe in Config-Dateien automatisch in
  *Pointer Imports* um (alles, was kein „plain script file" ist) und splittet selbst.
- ✅ Das Array darf **generiert** werden (`.map()`), es müssen nur die `import`-Zeilen
  literal sein.

Zwei Stolpersteine aus dem Spike: `+pages` ist ein **globaler** Config (muss nach
`pages/+pages.ts`, nicht `pages/blog/`), und der Default-Export ist das Array selbst, nicht
`{ pages: [...] }`.

### Wie experimentell ist das?

Als `@experimental` markiert und die Doku-Seite `vike.dev/pages` ist noch 404 — das heißt hier
aber „neu, Doku ausstehend, Feature-Ausbau geplant", nicht „instabil":

- Ausgeliefert in 0.4.259 via [PR #3356](https://github.com/vikejs/vike/pull/3356) (wir sind
  auf **0.4.262**), schließt [#1691](https://github.com/vikejs/vike/issues/1691) (2024) und
  entsperrt [#341](https://github.com/vikejs/vike/issues/341) „Single Route File" — **offen
  seit 2022**.
- brillout: *"Programmatic at config time is easy and **definitely on the radar** (I'll
  actually personally need it for a couple of things I want to implement)."* Der schwierige
  Teil (Runtime/CMS) wurde bewusst nach [#3359](https://github.com/vikejs/vike/issues/3359)
  abgespalten — wir brauchen nur den ausgelieferten Config-Time-Teil.
- Es ist **tragend**, kein Nebenexperiment: laut PR das „registration primitive" für
  First-Party-Extensions (`vike-authjs`, `vike-better-auth`) und Page-Variants.
- Dünne Implementierung: jeder Eintrag wird zu einem synthetischen `+config.js` an einer
  namespaced `locationId` und läuft „through the **existing** config-resolution pipeline
  unchanged, with no duplicated logic".

**Bekannte Limitierungen** (Liste des Maintainers), soweit für uns relevant:

| # | Limitierung | Bedeutung für uns |
|---|---|---|
| 2 | Nur Route-**Strings**, Route-Funktionen werden abgewiesen | egal — wir wollen literale `/blog/3` |
| 4 | Identität ist **positionell**: Einfügen/Umsortieren ändert `pageId`s und **Client-Chunk-Dateinamen** späterer Einträge. **URLs und prerendertes HTML bleiben unberührt** | harmlos: Cache-Busting später Posts beim Einfügen |
| 6 | Config-Time kann das Frontmatter eines Pointer-Imports **nicht** lesen | ⇒ **Reihenfolge muss explizit sein** (genau das, wofür Stufe 2.5 die IDs vergibt) |
| 7 | `Page` muss ein Pointer Import sein (non-plain-script) | `.mdx` ✅ erfüllt, im Spike bewiesen |
| — | `+pages` ist global ⇒ Einträge erben die **Root**-Config, nicht `pages/blog/` | Shell (`Layout`/`title`/`Head`/`data`) muss **pro Eintrag** gesetzt werden; Hooks aus `.ts` brauchen explizit `with { type: 'vike:pointer' }` |

### Warum Route-Funktionen das *nicht* lösen

Eine Route Function beantwortet „passt diese Seite auf diese URL, und was sind die Params?" —
sie **wählt niemals ein Modul aus**. Ein Seitenverzeichnis = ein `Page`-Modul. `@id` plus
Route Function schickt also weiterhin alle Posts durch *ein* Seitenmodul; Vike kann das
`.mdx` nach wie vor nicht statisch kennen, und `lazyGlobRegistry.ts` + `postModuleCache.ts` +
beide Render-Hooks bleiben.

Route-Funktionen konsolidieren nur die fünf duplizierten `@id`-Ordner zu einem:
**Datei-Ersparnis, keine Maschinerie-Ersparnis.** (Bleibt als Fallback-Option, falls `+pages`
enttäuscht.)

### Umsetzung

- [ ] **3.1** `pages/+pages.ts` anlegen: 35 literale `.mdx`-Importe für `blog/`, dazu die
      explizit geordnete Liste. Die Array-Position bzw. der `route`-String pinnt die URL
      dauerhaft — Stufe 2.5 liefert die Werte.
- [ ] **3.2** Shell pro Eintrag setzen (`Layout`/`title`/`Head`/`data`). ⚠️ Hauptarbeit:
      wegen der globalen Platzierung erben die Einträge die Root-Config, **nicht**
      `pages/blog/+config`. Hook-Configs aus `.ts` brauchen `with { type: 'vike:pointer' }`.
- [ ] **3.3** `pages/blog/@id/` löschen (7 Dateien).
- [ ] **3.4** Löschen: `utils/postModuleCache.ts`, `utils/lazyGlobRegistry.ts`,
      `pages/+onBeforeRenderHtml.ts`, `pages/+onBeforeRenderClient.ts` (zusammen **193
      Zeilen**), dazu `ReactPostRenderer` samt Fehler-UI in `components/Post.tsx` und
      `componentPath` aus `types/BlogPost.ts`.
- [ ] **3.5** Abnahme: URL-Menge und Titel-zu-URL-Zuordnung **identisch** zu vorher
      (`build/blog/*/index.html` vorher/nachher), Fließtext weiterhin im HTML, pro Post ein
      eigener Chunk (`grep` der Chunk-Referenzen in zwei Post-HTMLs — sie dürfen sich nicht
      überschneiden), dazu `npm test` / `typecheck` / `lint`.

### Was *nicht* verschwindet

`utils/blogLoader.ts` und `utils/globRegistry.ts` bleiben — Übersichtsseite, prev/next und
Frontmatter-Lookup brauchen weiter alle Metadaten. Der Glob kann aber auf
`{ import: 'frontmatter' }` schrumpfen und lädt dann keine Komponenten mehr. Das ist auch
inhaltlich fällig: `vike.dev/markdown` rät ausdrücklich davon ab, alle Markdown-Dateien per
`import.meta.glob()` zu laden — genau das tut `globRegistry.ts` heute mit `eager: true` über
alle 68 Dateien.

### Scope-Grenze

**Erst nur `blog/` (35 Posts).** Die 33 Quantum-Vorlesungen bleiben zunächst auf `@id` — als
laufende Referenz, falls `+pages` doch Probleme macht. Erst übertragen, wenn Stufe 3 für den
Blog steht und sich bewährt hat.

### Rückfallebene

Sollte `+pages` enttäuschen (API-Änderung beim vike-Upgrade), gibt es zwei Ausstiege, beide
mechanisch: die Route-Function-Konsolidierung (oben) oder Variante 3a/3b — letztere ist der
von `vike.dev/markdown` dokumentierte Mainstream-Weg (`/pages/blog/<slug>/+Page.md`) und
völlig risikofrei, kostet aber genau die beiden Dinge, die die Randbedingung ausschließt.
vike-Version deshalb pinnen und die Umstellung auf einem Branch verifizieren.

---

## Querschnitt

- [x] `CLAUDE.md` (Repo-Wurzel), Abschnitt *Blog Posts*: `.tsx` als Post-Format streichen (erledigt in Stufe 1, siehe oben)
- [x] `website/CLAUDE.md`: die `{ ssr: false }`-Regel auf `clientOnly` / `<ClientOnly>`
  präzisieren — erübrigt sich: `clientOnly()` wurde in Stufe 2.1 eingeführt und noch in
  derselben Stufe wieder vollständig entfernt (siehe dort), die Regel bleibt weiterhin ohne
  gelebtes Vorkommen im Repo
- [ ] `blog-planner`-Skill: falls dort TSX-Posts als Option auftauchen, entfernen
- [ ] `utils/checkChunkSizes.ts`: die Chunk-Erwartungen ändern sich in Stufe 2 und 3

## Abbruchpunkte

| Nach | Gewonnen | Aufgegeben |
|---|---|---|
| Stufe 1 | ein Format, ~60 Zeilen Sonderfälle weg, Stufe 2 wird möglich | nichts |
| Stufe 2 | Inhalt im HTML — Bridgy, SEO, LCP | nichts |
| Stufe 2.5 | URLs sind stabil gegen rückdatierte Posts | nichts |
| Stufe 3 | 193 Zeilen Priming-Maschinerie + `ReactPostRenderer` + 7 `@id`-Dateien weg, Splitting von Vike | eine `+pages.ts` mit 35 Import-Zeilen; Abhängigkeit von einem `@experimental` Config |

Kein Zwischenstand hinterlässt einen halben Umbau.
