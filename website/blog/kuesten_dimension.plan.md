# Blog Post Plan: Wie lang ist die Küste der Bretagne?

## Target Audience

**Primär: mathematikinteressierte Kinder, etwa 10 bis 12 Jahre.** Das ist eine
*vierte* Zielgruppe, die es auf diesem Blog bisher nicht gibt — bewusst
gewählt, nicht "Kinder und Erwachsene gleichzeitig". Sekundär dürfen Erwachsene
mitlesen, aber kein einziger Satz wird für sie kalibriert.

**Nicht persönlich.** Der Post ist für Kinder in diesem Alter allgemein
geschrieben, nicht für bestimmte Kinder. Keine Namen, keine
Familien-Anspielungen, kein "erinnert ihr euch". Ein Kind, das die Bretagne nie
gesehen hat, muss vom ersten Satz an genauso mitkommen. Die Bretagne ist das
*Beispiel*, nicht die gemeinsame Erinnerung.

**Was sie können:**

- Multiplizieren, Dividieren, Bruchteile, Prozente
- Flächen (Quadrat, Rechteck), Umfang
- Koordinaten, Maßstab auf einer Karte
- Zählen, Schätzen, Vergleichen — und sie machen das gerne

**Was sie NICHT können (harte Grenze):**

- **Logarithmen** — kommen erst in Klasse 9/10. Das ist die zentrale
  Konsequenz für diesen Post: `d = log N(ε) / log(1/ε)` darf **nicht** im
  Haupttext stehen.
- Potenzen mit gebrochenen Exponenten
- Steigung einer Regressionsgerade, log-log-Achsen

**Was sie lernen sollen:**

- Dass "Länge" bei einer zerklüfteten Küste keine feste Zahl ist, sondern vom
  Messstab abhängt
- Dass man Zerklüftetheit *messen* kann — mit einer Zahl zwischen 1 und 2
- Dass diese Zahl "Dimension" heißt und dass es Dinge gibt, die weder Linie
  noch Fläche sind

## Core Thesis

**Wenn du deine Kästchen halb so groß machst, brauchst du bei einer geraden
Linie doppelt so viele, bei einer vollen Fläche viermal so viele — und bei
einer echten Küste irgendwas dazwischen. Genau diese Zahl dazwischen ist ihre
Dimension.**

Warum das zählt: Dimension kennt man als 1, 2 oder 3 — Linie, Fläche, Raum.
Hier darf sie plötzlich 1,26 sein. Das ist der Moment, den der Post verkauft.

## Der Verdopplungs-Trick (Kernentscheidung, ersetzt den Log-Log-Plot)

Statt Steigung im Log-Log-Plot: **Halbierungsspiel.**

| Was | Kästchen halbiert → so viel mehr gebraucht | Dimension |
|---|---|---|
| Gerade Linie | 2× | 1 |
| Kreis(-linie) | 2× | 1 |
| Volles Quadrat | 4× | 2 |
| Küste Bretagne | ca. 2,4× | ca. 1,3 |

Die Zahlen der letzten Zeile sind **Platzhalter zur Illustration** — der
tatsächliche Wert steht erst nach Schritt 7 fest.

Das Widget zeigt genau diesen einen Faktor als große Zahl. Der Weg von "2,4×"
zur Dimension "1,3" läuft über eine **visuelle Skala** (ein Zifferblatt/Balken
von 2 bis 4, beschriftet 1 bis 2) — kein Logarithmus, aber mathematisch
ehrlich, weil es genau `log₂` ist.

Die Formel kommt in ein `<Foldable>` mit dem Titel *"Für Papa und die Großen"*.
Dort darf der Log-Log-Plot und `d = log N / log(1/ε)` stehen. Das ist der
einzige Ort im Post mit Notation.

## Outline

Zielumfang: **900–1200 Wörter Deutsch**, 4 Abschnitte. Nicht mehr.

1. **Stell dir vor, du wanderst an der Küste der Bretagne** (~150 W)
   Konkrete Szene, aber unpersönlich erzählt: eine Bucht, die von oben auf der
   Karte winzig aussieht — und die zu Fuß ewig dauert, weil sie voller kleiner
   Buchten in der Bucht steckt. Frage an den Leser: Wie lang ist die Küste
   eigentlich? Antwort: Kommt drauf an, wie genau man hinschaut. Funktioniert
   für jedes Kind, das die Bretagne noch nie gesehen hat — das Foto liefert
   das Bild, der Text braucht keine gemeinsame Erinnerung vorauszusetzen.
   *[TODO: Fred — welches Foto aus deinem Fundus zeigt eine Bucht mit
   erkennbar zerklüfteter Küstenlinie? Das ist wichtiger als ein "schönes"
   Bild.]*

2. **Das Kästchenspiel** (~250 W) → **Widget 1: `KaestchenSpiel`**
   Erst raten lassen, dann zählen. Gerade Linie, Kreis, volles Quadrat.
   Schieberegler halbiert die Kästchen, das Widget zeigt den Faktor.
   Ergebnis: Linie und Kreis → 2×, Quadrat → 4×.

3. **Und jetzt eine echte Küste** (~300 W) → **Widget 2: `KuestenSpiel`**
   Dieselbe Mechanik auf der Bretagne-Küste. Faktor liegt dazwischen.
   Umschalten auf die Normandie: derselbe Regler, viel kleinerer Faktor.
   Kernsatz: Die Küste ist "mehr als eine Linie, aber weniger als eine Fläche".
   Einordnung: Mandelbrot hat das 1967 für Großbritannien gemacht, D ≈ 1,25.

   **Framing-Regel: "zerklüftet vs. glatt", nicht "Fels vs. Sand".** Die
   Normandie-Kontrastküste ist Kreidefels und trotzdem fast gerade — eine
   Material-Erklärung wäre also schlicht falsch und bricht am ersten
   Gegenbeispiel. Der Post beobachtet die Form, er erklärt keine Geologie.
   Spart nebenbei Wörter.

4. **Selber malen** (~150 W) → **Widget 3 (Teil von Widget 1): Finger-Modus**
   Sie zeichnen mit dem Finger auf dem iPad eine eigene Kurve und bekommen
   deren Dimension. Glatter Bogen → nahe 1. Wildes Gekritzel → deutlich höher.
   Das ist der Abschluss, nicht ein Fazit-Absatz.

Plus: `<Foldable>` "Für Papa und die Großen" mit der Formel und dem Log-Log-Plot.

## Interactive Elements

**Architekturentscheidung: kein Leaflet, keine Kartentiles.** Begründung unten
unter "Mobile". Alles läuft auf *einem* Canvas-Widget mit austauschbarem Inhalt.

**Dateiformat: `.mdx` mit importierten Komponenten**, nicht `.tsx` wie
`tragedy_of_commons_fishing.tsx`. Der Post-Text lebt als Markdown in
`kuesten_dimension.mdx`, die Widgets sind eigenständige Komponenten unter
`components/blog/`, die per `import` eingebunden werden — exakt das Muster von
`housing_risk_portfolio.mdx` (`ShockCalculator`, `RiskReality`) und
`etf_diversification_interactive.mdx`.

```
website/components/blog/box-dimension/
  boxCounting.ts       # reine Logik: countCells(points, cellSizePx) -> N
  BoxCanvas.tsx        # Canvas: zeichnet Kurve + Gitter, hebt Trefferzellen hervor
  KaestchenSpiel.tsx   # Widget 1: Linie/Kreis/Quadrat/Finger-Modus
  KuestenSpiel.tsx     # Widget 2: Bretagne vs. glatte Küste, gleicher BoxCanvas
  DimensionSkala.tsx   # der Balken 2×…4× -> 1…2, ersetzt den Log-Log-Plot
  shapes.ts            # Linie, Kreis, Quadrat als Punktlisten
  coasts.ts            # vorverarbeitete Küstenumrisse, INLINE als Punktarrays

website/blog/kuesten_dimension.mdx
  # Frontmatter + Fließtext + vier import-Zeilen für KaestchenSpiel,
  # KuestenSpiel, MyFigure, Foldable — kein export const meta, normales
  # YAML-Frontmatter wie bei allen anderen .mdx-Posts
```

**Wiederverwendung aus dem Repo (nichts davon neu bauen):**

- `components/Foldable.tsx` — für den Erwachsenen-Exkurs
- `components/MarkdownWithLatex.tsx` + KaTeX — für die Formel im Foldable
- `react-chartjs-2` / `chart.js` (bereits Abhängigkeit, siehe
  `DiversificationRandomWalk.tsx`) — für den Log-Log-Plot im Foldable.
  **Kein eigenes `LogLogPlot.tsx` bauen.**
- `components/blog/palette.ts` — Farbtokens, Panda-Regel 1 beachten
- `components/MyFigure.tsx` — Aufmacherfoto mit Bildunterschrift. Bilddatei
  nach `website/public/blog/`, Referenz als `/blog/<name>.jpg` (Muster:
  `collect_imagegen.mdx`). Fürs iPhone vorher auf ~1200 px Breite runterrechnen.

## Mobile (iPad / iPhone — Hauptplattform)

Das war im ersten Plan gar nicht adressiert und kippt die größte Entscheidung:

- **Leaflet fällt raus.** Eine pan-/zoombare Karte auf dem iPhone frisst
  Scroll-Gesten — der Leser bleibt in der Karte hängen statt weiterzulesen.
  Dazu: `moveend`/`zoomend`-getriggertes Neuzeichnen des Gitters, ein Slider
  direkt neben einer schwenkbaren Karte auf 390 px Breite, plus
  `leaflet` + `react-leaflet` (~150 KB) und Tile-Requests. Für null
  didaktischen Mehrwert — die Kinder brauchen keine zoombare Weltkarte, sie
  brauchen *einen* Küstenumriss.
  Ersatz: fester Umriss auf Canvas, daneben ein statisches Kartenbild zur
  Wiedererkennung ("das ist die Bretagne").
- **Alles vertikal stapeln.** Canvas oben, Regler darunter, Ergebniszahl
  darunter. Kein Nebeneinander von Canvas und Plot.
- **Touch first:** Regler mit ≥44 px Trefferfläche; der Finger-Modus in
  Abschnitt 4 ist bewusst ein Touch-Feature, kein Maus-Feature. `touch-action`
  auf dem Zeichen-Canvas setzen, sonst scrollt die Seite beim Malen.
- **Canvas mit `devicePixelRatio` skalieren**, sonst ist das Gitter auf dem
  Retina-Display matschig — und ein matschiges Gitter ist hier der Inhalt.
- **Budget: < 100 KB** für alle Küstendaten zusammen (nicht "einige hundert KB
  pro Region" wie im ersten Plan). Umrisse als Punktarrays direkt in
  `coasts.ts` inlinen, kein Fetch aus `public/`.

## Datenaufbereitung

1. GSHHG holen (public domain), Level 1 Küste
2. Auf Bounding Box zuschneiden — Bretagne grob 47,2–48,9 °N / −5,2–−1,0 °E
3. Kontrastregion Normandie zuschneiden (siehe unten)
4. Vereinfachen (Douglas-Peucker) — **so wenig wie möglich**, denn genau die
   kleinen Zacken sind das Messobjekt. Die Vereinfachung muss feiner sein als
   das kleinste Kästchen, sonst misst das Widget die Vereinfachung statt die
   Küste.
5. Auf feste Canvas-Koordinaten projizieren und als Punktarray exportieren

### Kontrastregion: Normandie

Gewählt: **Ouistreham bis Le Tréport**, grob 49,2–50,1 °N / −0,3–1,4 °E.

Begründung — der springende Punkt ist nicht "glatter", sondern **vergleichbarer
Maßstab**: Box-Dimensionen sind nur fair vergleichbar, wenn beide Küsten über
denselben Bereich von Kästchengrößen gemessen werden. Die Normandie-Strecke
ist mit ~200 km ähnlich lang wie die Bretagne-Küste, liegt am selben Meer, hat
dieselben Gezeiten und dieselbe Kartenprojektion. Die einzige Variable, die
sich ändert, ist die Form. Beide liegen zudem auf derselben Frankreichkarte —
für die Kinder unmittelbar einordenbar.

**Cotentin muss draußen bleiben.** Die Halbinsel (Cap de la Hague) ist selbst
zerklüftet und würde den Kontrast auffressen. Deshalb der Zuschnitt östlich der
Baie des Veys.

*Verworfene Alternative Usedom:* Außenküste nur ~40 km — bei gleichen
Kästchengrößen würde man einen anderen Größenordnungsbereich messen als bei der
Bretagne. Zweite Falle: die Achterwasser-Seite ist stark verästelt, der
Gesamtumriss der Insel liefert einen *höheren* Wert als erwartet und hätte im
Widget das Gegenteil der Aussage gezeigt.

**Validierungsschritt vor dem Schreiben (fehlte im ersten Plan):** erst messen,
was die Pipeline tatsächlich ausspuckt, dann den Text schreiben. Über nur ~1,5
Größenordnungen und mit vereinfachten Daten kommt sehr wahrscheinlich *nicht*
exakt 1,25 heraus. Der Text darf deshalb keine Zahl versprechen, die das Widget
nicht liefert. Formulierung im Post: "ungefähr", plus ein ehrlicher Satz, dass
Mandelbrots Zahl mit besseren Daten gemessen wurde.

## Tone & Style

**Kinderton, kein Adressaten-Ton.** Vorbild: "Sendung mit der Maus" /
"Wissen macht Ah!" — die Du-Form bleibt, aber sie meint "du, die Leserin, der
Leser da draußen", nicht bestimmte Kinder mit Namen. Kein "ihr zwei", keine
Familienreferenz.

- **Deutsch, Du-Form, aber generisch** — "du" als Ansprache an jeden Leser,
  keine Namen, keine private Anekdote.
- Kurze Sätze. Kurze Absätze. Fragen statt Behauptungen.
- Erst raten lassen, dann auflösen — das ist das didaktische Rückgrat und der
  Grund, warum die Widgets einen "Erst schätzen"-Schritt bekommen.
- Erklärstimme wie bei einem guten Erklärvideo: neugierig, nie belehrend,
  gerne kleine Ausrufe ("Überraschung: ...", "Und jetzt kommt der Clou.").
- Keine Notation außerhalb des `<Foldable>`. "Kästchengröße", nicht "ε".
  "Wie viel mehr", nicht "Skalierungsverhalten".
- Fachwörter genau zwei: **Dimension** und **Fraktal**. Beide beim ersten
  Auftreten in einem Satz erklärt.

## Sources & Research

- Mandelbrot, *How Long Is the Coast of Britain? Statistical Self-Similarity
  and Fractional Dimension*, Science 156 (1967) — Westküste GB D ≈ 1,25,
  Südafrika D ≈ 1,02 als glatter Gegenpol
- Richardson (posthum, 1961) — die Originalmessungen dahinter
- GSHHG, Wessel & Smith — Küstendaten, public domain
- *[TODO: source]* Ein publizierter D-Wert speziell für die Bretagne. Falls
  keiner auffindbar: keine Zahl behaupten, nur den selbst gemessenen Wert des
  Widgets zeigen und als "unsere Messung" kennzeichnen.

## Consistency Notes

**Sprache: geklärt, Deutsch ist etabliert.** `sprit_national.mdx` (2026-05-28,
`tokenID: 197`) ist vollständig auf Deutsch, inklusive deutscher
SEO-Description. Kein Bruch, kein `lang`-Feld nötig — dem Muster dort folgen:
deutscher Titel, deutsche Description, normale `tokenID`.

**Verwandte Posts (Struktur übernommen):**

- `housing_risk_portfolio.mdx` und `etf_diversification_interactive.mdx` —
  das `.mdx`-Format mit importierten Widget-Komponenten aus
  `components/blog/`. Dieser Post folgt diesem Muster, **nicht** dem
  `.tsx`-Format von `tragedy_of_commons_fishing.tsx` /
  `prisoners_dilemma_interactive.tsx` (Widget und Text in einer Datei,
  `export const meta` statt YAML-Frontmatter). Der `.mdx`-Weg hält den
  Post-Text als reines Markdown lesbar und die Widgets unabhängig testbar —
  passt außerdem besser zum Zielumfang von 900–1200 Wörtern, da die
  `.tsx`-Beispiele mit 1600–2000 Zeilen zeigen, wie leicht das Format zum
  Anwachsen einlädt.
- `cosmopol_democracy.mdx` (Prolog) und `housing_risk_portfolio.mdx`
  (Abendessen-Szene) — beide öffnen mit einer konkreten Szene statt mit dem
  Konzept. Abschnitt 1 macht dasselbe mit der Bretagne-Wanderung.
- Die Schreibprinzipien für das Nicht-STEM-Publikum (natürliche Sprache statt
  Notation, konkretes Beispiel vor Verallgemeinerung) gelten hier verschärft.

**Panda-Regeln** aus `website/CLAUDE.md` beachten — insbesondere Regel 1
(keine JS-Variablen in `css({})`), relevant weil Canvas-Farben in JS *und* CSS
gebraucht werden → über `token()` aus `palette.ts`.

## Getroffene Entscheidungen

1. **Sprache:** Deutsch, öffentlicher Blogpost mit `tokenID`, analog
   `sprit_national.mdx`.
2. **Kontrastregion: Normandie** (Ouistreham bis Le Tréport). Siehe
   "Kontrastregion" oben — Begründung ist der vergleichbare Maßstab, nicht nur
   die Glattheit.
3. **Aufmacher: eigenes Foto** der Bretagne-Küste über `<MyFigure>`. Kein
   Kartenbild nötig — das Widget zeigt den Umriss selbst herausgezoomt.
4. **Finger-Modus: ja.** Die Kinder sind Touch gewohnt; das wird der stärkste
   Abschnitt des Posts.

## Offene Punkte

- Der gemessene Zahlenwert für beide Küsten steht erst nach Schritt 7 fest.
  Bis dahin keine Zahl im Text festschreiben.
- `[TODO: source]` für einen publizierten D-Wert der Bretagne (siehe Sources).

## Implementierungsschritte

- [ ] **1** `boxCounting.ts` — reine Zählfunktion + Unit-Tests
- [ ] **2** `shapes.ts` — Linie, Kreis, Quadrat als Punktlisten
- [ ] **3** `BoxCanvas.tsx` — Canvas mit devicePixelRatio, Gitter, Trefferzellen
- [ ] **4** `DimensionSkala.tsx` — Faktor 2…4 → Dimension 1…2
- [ ] **5** `KaestchenSpiel.tsx` — Widget 1 inkl. "Erst schätzen"-Schritt
- [ ] **6** GSHHG holen, Bretagne + Normandie zuschneiden, vereinfachen, nach
      `coasts.ts` inlinen
- [ ] **7** **Messen und validieren** — welche Zahlen liefert das Widget
      wirklich für Bretagne und Normandie? Ist der Unterschied auf einem
      iPhone-Screen auf einen Blick sichtbar? Wenn nein: Zuschnitt nachjustieren,
      nicht den Text schönen.
- [ ] **8** `KuestenSpiel.tsx` — Widget 2, Umschalter Bretagne/Normandie
- [ ] **9** Finger-Modus
- [ ] **10** `<Foldable>`-Exkurs mit Log-Log-Plot via `react-chartjs-2`
- [ ] **11** Post-Text schreiben, auf dem iPhone gegenlesen
- [ ] **12** Quellenangaben (Mandelbrot, GSHHG), `styleConventions.test.ts` grün
- [ ] **13** Nach Veröffentlichung: diese Plandatei löschen

## Lizenz/Attribution

- GSHHG: public domain (WVS/WDBII), Quellenangabe trotzdem fair
- OSM/CARTO-Attribution entfällt vollständig, weil keine Tiles und kein
  Kartenbild mehr geladen werden — Nebeneffekt der Leaflet-Entscheidung
- Aufmacherfoto: eigenes Bild, keine Lizenzfrage
