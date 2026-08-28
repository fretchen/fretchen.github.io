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
- **Mermaid** (`components/MermaidDiagram.tsx`) wird in Stufe 2 ein `clientOnly()`-Kandidat.

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
sondern weil nichts mehr ein Gating braucht. Die `clientOnly`/`useHydrated`-Frage aus Stufe 2.1
bleibt damit vollständig offen für den (heute vermutlich leeren) Rest-Scope.

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

### 2.0 Spike zuerst — das ist die entscheidende offene Frage

Der naheliegende Weg ist `React.lazy` + `<Suspense>` statt `useEffect`, zusammen mit
`stream: { require: true, disable: true }` in `pages/+config.ts`. Streaming-SSR löst
`lazy` auf, und `disable: true` fasst den Stream zu einem vollständigen HTML-String
zusammen — genau das, was eine statische Datei braucht.

**Das Risiko:** React liefert spät aufgelösten Suspense-Inhalt als `<template>` am
Dokumentende plus ein Inline-Script, das ihn an die richtige Stelle schiebt. Der Text
*steht* dann im HTML — aber an der falschen Position, bis JS läuft. Für Bridgy Fed und
mf2-Parser, die rohes HTML lesen, wäre das kaum besser als heute. Und genau dieser
Konsument war der Anlass für den ganzen Umbau.

- [ ] **2.0** Einen Post prototypisch auf `lazy` + `Suspense` + `stream` umstellen, bauen, und
  im erzeugten `index.html` prüfen: steht der Artikeltext **innerhalb** von
  `<article class="h-entry">` in Dokumentreihenfolge — oder in einem `<template>` am Ende?

**Wenn in Dokumentreihenfolge:** Stufe 2 ist ein eigenständiges Ziel, weitermachen mit 2.1.
**Wenn im `<template>`:** Stufe 2 lässt sich mit dem `@id`-Catch-all nicht sauber lösen.
Dann ist Stufe 3 nicht optional, sondern der Weg dorthin — siehe die Begründung dort.

### 2.1 Widgets client-only machen

Statt den ganzen Post nachzuladen, nur die DOM-abhängigen Teile:

```tsx
import { clientOnly } from "vike-react/clientOnly";
const RiskReality = clientOnly(() => import("./RiskReality"));
```

Kandidaten: alles in `components/blog/` mit `ChartJS.register(...)`,
`components/MermaidDiagram.tsx`, alles mit Wallet-/Wagmi-Zugriff.

Anmerkung: `website/CLAUDE.md` verlangt „Client-only components need `{ ssr: false }`" —
diese Regel beschreibt derzeit keine gelebte Praxis, es gibt kein einziges Vorkommen im Repo.
Mit dieser Stufe wird sie erstmals wahr und sollte auf die tatsächliche API
(`clientOnly` / `<ClientOnly>`) präzisiert werden.

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

## Stufe 3 — Vike-Filesystem-Routing

**Ziel:** Vike übernimmt Routing, Code-Splitting und SSR pro Post; die handgebaute
Infrastruktur entfällt.

### Zur Frage „alte Links erhalten, per Frontmatter?"

**Links erhalten: ja, problemlos.** **Per Frontmatter: nein — das ist nicht der Hebel.**

Vike baut Routen aus dem **Dateisystem**, bevor irgendein MDX-Modul ausgewertet wird. Ein
`id:` im Frontmatter ist zur Routing-Zeit nicht sichtbar. Zwei Wege funktionieren wirklich:

**Variante 3a — Der Ordnername *ist* die URL**

```
pages/blog/3/+Page.mdx     →  /blog/3
```

Bit-identische URLs, **null** zusätzliche Dateien, reinstes Vike. Preis: `pages/blog/`
besteht dann aus `0/`, `1/`, … `35/` — die sprechenden Dateinamen (`ipfs.mdx`,
`vc_lessons.mdx`) gehen als Navigationshilfe verloren. Titel und Thema stehen nur noch im
Frontmatter.

**Variante 3b — Slug-Ordner plus gepinnte Route**

```
pages/blog/ipfs/+Page.mdx
pages/blog/ipfs/+route.ts   →  export default "/blog/3"
```

Lesbare Ordner, URLs identisch, und der spätere Wechsel auf `/blog/ipfs` ist eine
Einzeiler-Änderung plus Redirect. Preis: 34 zusätzliche Ein-Zeilen-Dateien.

**Anti-Muster:** eine Route-Funktion, die sich das `frontmatter` aus dem
Nachbar-`+Page.mdx` importiert, um daraus die numerische URL zu bauen. Technisch möglich,
aber sie zieht jedes Post-Modul in das Routing-Bundle und zerstört damit exakt das
Code-Splitting, das Stufe 3 gewinnen soll.

**Empfehlung: 3b.** Die 34 Einzeiler sind einmalig; opake Zahlenordner sind dauerhaft.

### Warum Stufe 3 evtl. nicht optional ist

Beim `@id`-Catch-all laufen alle Posts durch **ein** Seitenmodul. Vike kann daraus nur
einen Chunk bauen — das Splitting pro Post muss von Hand kommen (`lazyGlobRegistry.ts`),
und genau daraus folgt die Suspense-Problematik aus 2.0.

Mit einer Seite pro Post kennt Vike das Modul zur Buildzeit statisch. Dann ist der Post
gewöhnlicher synchroner SSR-Inhalt: **kein `lazy`, kein `Suspense`, kein `<template>`,
sauberes HTML** — und Code-Splitting bekommst du gratis, weil jede Seite ohnehin ihr
eigenes Bundle hat.

Falls Spike 2.0 negativ ausgeht, ist das der Grund, direkt hierher zu gehen.

### Umsetzung

- [ ] **3.1** Shell in `pages/blog/+Layout.tsx` ziehen: Titel, `MetadataLine`, ToC,
      `NFTFloatImage`, prev/next, `Webmentions`, `CommentsSection`.
- [ ] **3.2** Metadaten für die Shell: **ein** geerbtes `pages/blog/+data.ts` reicht — es
      bekommt `pageContext.urlPathname` und schlägt das Frontmatter über den Glob nach.
      Keine 34 einzelnen `+data.ts`.
      ⚠️ Das bestehende `pages/blog/+data.ts` (Übersichtsseite) wird an Kindseiten vererbt.
      Beide Fälle müssen darin sauber getrennt werden — hier lauert der Konflikt.
- [ ] **3.3** Posts nach `pages/blog/<slug>/+Page.mdx` verschieben, `+route.ts` je Post.
- [ ] **3.4** Löschen: `utils/lazyGlobRegistry.ts`, `ReactPostRenderer`
      (`components/Post.tsx:31-146`, ~110 Zeilen), `componentPath` aus `types/BlogPost.ts`,
      die `isSupportedDirectory`-Prüfung in `Post.tsx:52-56`.

### Was *nicht* verschwindet

`utils/blogLoader.ts` und `utils/globRegistry.ts` bleiben — die Übersichtsseite, die
prev/next-Navigation und der Frontmatter-Lookup brauchen weiter alle Metadaten. Der Glob
kann aber auf `{ import: 'frontmatter' }` schrumpfen und lädt dann keine Komponenten mehr.

### Scope-Grenze

**Nur `blog/`.** Die 33 Quantum-Vorlesungen in vier Ordnern nach demselben Muster
umzustellen hieße 33 weitere Verzeichnisse. Diese Entscheidung erst treffen, wenn Stufe 3
für den Blog steht und sich bewährt hat. Vorlesungen profitieren ohnehin fast nur von
Stufe 2 — sie sind reine Prosa ohne Widgets.

---

## Querschnitt

- [x] `CLAUDE.md` (Repo-Wurzel), Abschnitt *Blog Posts*: `.tsx` als Post-Format streichen (erledigt in Stufe 1, siehe oben)
- [ ] `website/CLAUDE.md`: die `{ ssr: false }`-Regel auf `clientOnly` / `<ClientOnly>` präzisieren
- [ ] `blog-planner`-Skill: falls dort TSX-Posts als Option auftauchen, entfernen
- [ ] `utils/checkChunkSizes.ts`: die Chunk-Erwartungen ändern sich in Stufe 2 und 3

## Abbruchpunkte

| Nach | Gewonnen | Aufgegeben |
|---|---|---|
| Stufe 1 | ein Format, ~60 Zeilen Sonderfälle weg, Stufe 2 wird möglich | nichts |
| Stufe 2 | Inhalt im HTML — Bridgy, SEO, LCP | nichts |
| Stufe 2.5 | URLs sind stabil gegen rückdatierte Posts | nichts |
| Stufe 3 | ~110 Zeilen Renderer + eine Registry weg, Splitting von Vike | 34 `+route.ts`-Einzeiler |

Kein Zwischenstand hinterlässt einen halben Umbau.
