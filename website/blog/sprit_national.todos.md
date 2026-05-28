# Critique: Wie rational ist das Wählen von Protektionismus wirklich?

**Target audience:** Politically curious East Germans, 30–60, who feel sympathetic to Uwe's problem but are skeptical of the AfD — they know fuel prices and Polish competition firsthand, but have no game theory or EU regulatory background.

**Plan file:** Found at `website/blog/spediteur_national.plan.md`. The post diverges from the approved plan in nearly every structural dimension — narrative, characters, widgets, tone, and the no-moralizing rule. See Critical Issues.

**Overall impression:** The data work is thorough and the cost analysis is genuinely useful. But the post that was written is a policy analyst's think-tank paper; the post that was planned was a garage conversation between two small business owners that lets the math do the persuading. The target audience will bounce off the current version within two paragraphs. The plan's central insight — that the reader needs to *run the numbers themselves* to believe the tipping point — is entirely absent.

---

## Critical Issues

- [ ] **[§ Gesamtstruktur]** The post ignores the entire narrative structure approved in the plan. The plan calls for a dialogue between Uwe (trucker, 55, AfD-open) and Thomas (garage owner, POV character) with interactive widgets at the moment of understanding. The delivered post is a policy essay. The target audience — who "don't want to hear: every AfD voter is stupid" and need "an honest engagement" — requires the narrative arc to trust the author. A think-tank paper signals exactly the wrong register.

- [ ] **[§ Figuren fehlen]** Uwe and Thomas are entirely absent. The plan built the whole logic around them: Uwe's problem is the hook, Thomas is the reader-identification figure who "can't say Uwe is wrong — because Uwe isn't wrong." Without them, the post talks *at* the audience rather than *with* them, and the persuasion mechanism (empathy first, then math) collapses.

- [ ] **[§ Widgets fehlen]** The IHK/Kammer calculator widget(s) are completely missing. The plan identified these as the pedagogical core — the tipping-point moment where Uwe and the reader *discover* together that protection can be a net loss depending on export share. Without the widget, the post asserts the conclusion; the plan was designed so readers would reach it themselves.

- [ ] **[§ Was die Parteien anbieten]** This section directly contradicts the plan's hardest rule: "kein Moralisieren — die Rechnung spricht für sich." Ranking all parties and recommending a "SPD + Volt + grünes Förderprogramm" combination is exactly what the target audience "doesn't want to hear." They will disengage. The plan says: "Thomas belehrt nicht." This section is Thomas giving a voting lecture.

- [ ] **[§ Modellierung des Entscheidungsprozesses]** The formal model ($\text{Gewinn} = \text{Preis} - \text{Kosten}$, variables $a$, $k$, $K_{DE}$, $K_{PL}$) is presented in running prose in the main text. The plan explicitly said game theory goes in a `<details>` block. For the target audience — who "don't know game theory" by definition — equations in running prose are a stop signal, not an explanation.

- [ ] **[§ Einleitung]** "Wie üblich hatte ich wenig Mitleid mit Menschen, die noch Fossile fahren und sich über hohe Preise beklagen." This sentence signals the exact tone the plan warned against: the author positions themselves as morally superior before the first argument. A reader who drives a diesel and is worried about Polish competition will stop here. The plan's tone note is "nüchtern, kein Kommentar."

---

## Suggestions

- [ ] **[§ Durchsetzungslücke]** This section uses institutional shorthand (BAG, IMI-System, A1-Bescheinigung, Smart Tachograph) without explanation. The target audience doesn't know what any of these are. Either add a one-sentence gloss inline or move the detail to a `<details>` block. Right now it reads as expertise signalling, not explanation.

- [ ] **[§ Pacing / Backup-Abschnitt]** The full methodology section ("Backup / Ablage", detailed cost tables, wage data, legal notes) is exposed at the main reading level, roughly doubling the post's length. It should be wrapped in `<details>` blocks so data-curious readers can access it without breaking the flow for general readers — as the plan's reference to `prisoners_dilemma_interactive` and `housing_risk_portfolio` patterns implies.

- [ ] **[§ Gefangenendilemma-Versprechen]** The introduction promises the decision process "hat durchaus Ähnlichkeiten mit dem Gefangenendilemma." The model section doesn't deliver on this — it never names the Nash equilibrium, never shows the payoff matrix, and the connection stays abstract. Either pay off the analogy concretely (ideally in a `<details>` block for interested readers) or remove the promise from the intro.

- [ ] **[§ Variable naming inconsistency]** The "Modellierung" section uses $C_{DE}$ and $C_{PL}$, but the "Realistische Alternativen" section switches to $K_{DE}$ and $K_{PL}$. This inconsistency is confusing even for a reader who follows the math.

- [ ] **[§ Einleitung / Hook]** The current opening is passive anecdote. The plan called for a specific, visual scene: Thomas hears a news item about fuel prices and thinks of Uwe, who is coming in today to pick up his truck. That cinematic opening grounds the abstract argument in a physical world the target audience recognises. The current opening could belong to any op-ed.

---

## Nitpicks

- [ ] **[§ Frontmatter]** `category: "other"` should be `category: "others"` — all other non-blockchain posts in this blog use `"others"` (e.g., `cosmopol_democracy.md`, `buying_a_house_is_a_mistake.md`).

- [ ] **[§ Dateiname]** The plan targets `website/blog/spediteur_national.mdx` (MDX for React widget support). The file was written as `sprit_national.md`. Once widgets are added this will need to be `.mdx`; the filename mismatch also disconnects the plan file from the post.

- [ ] **[§ Übersetzungsqualität]** Several phrasings are slightly awkward translated German. "Ich fand eine Studie von Kotsios & Folinas" reads like translated English — a native author would write "Aufschlussreich war eine 2020er-Studie von Kotsios & Folinas." Worth one pass by a native speaker once the structural issues are resolved.

- [ ] **[§ Realistische Alternativen / Elektro-Lkw]** "Das klingt paradox" is undersold — the claim that electric trucks are already cost-competitive in high-utilisation scenarios will surprise Uwe-type readers who see EV as a green luxury. One concrete number (e.g., cost-per-km comparison) would make this credible rather than assertive.

---

## Zielgruppen-Konsistenzanalyse: Stark, löschen, schärfen

*Ergänzende Analyse aus Sicht der Zielgruppe: ostdeutsche Kleinunternehmer, AfD-skeptisch, kein Fachwissen über Spieltheorie oder EU-Regulierung.*

### Was funktioniert — starke Passagen

**Stärke 1: Die Kostentabelle (§ Daten)**
Die Kerneinsicht der Tabelle ist stark: Maut und Kraftstoff sind auf deutschen Straßen für alle gleich — der einzige verbleibende Hebel ist der Lohn des Fahrers. Das „12 % auf deutschen Strecken vs. 31 % auf polnischen Strecken" ist ein überraschender, konkreter Befund. Die Zielgruppe versteht Rechnungen. Diese funktioniert.

**Stärke 2: „Das Problem ist Durchsetzung, nicht das Gesetz" (§ Durchsetzungslücke)**
Der Kernsatz — „die Regeln existieren bereits; das Problem ist die Durchsetzung" — ist das stärkste Argument im gesamten Post. Er nimmt Uwes Frust ernst, ohne zu sagen „du liegst falsch." Er sagt stattdessen: „Du hast recht, und die Lösung ist schon beschlossen — sie wird nur nicht angewendet." Das ist für die Zielgruppe ehrlicher als jedes politische Versprechen.

**Stärke 3: Die Lohn-Konvergenzzahl (§ Durchsetzungslücke)**
Das Verhältnis 1:2,8 (2018) → 1:1,8 (heute) ist gut gewählt: Es zeigt Bewegung in die richtige Richtung ohne falsche Beruhigung. Das gibt der Zielgruppe ein Gefühl für Tempo und Realismus.

**Stärke 4: „Die Fabrik zieht um" (§ Realistische Alternativen)**
Das Argument, dass Protektionismus Kunden zur Verlagerung treibt, ist das entscheidende Gegenargument — und es ist konkret genug für die Zielgruppe. Für Uwe-Typen ist „der Auftraggeber zieht weg" greifbarer als „Nash-Gleichgewicht."

**Stärke 5: Smart Tachograph 2 (§ Durchsetzungslücke)**
Das ist das konkreteste politische Instrument im gesamten Post — eine Technologie, die bereits eingeführt wird und das Durchsetzungsproblem direkt adressiert. Es wirkt nicht wie Politikerversprechen, sondern wie Technik, die bereits existiert.

---

### Was einfach gestrichen werden sollte

**Streichen: § Modellierung des Entscheidungsprozesses (vollständig)**
Der Abschnitt mit den Variablen $K_{DE}$, $K_{PL}$, $a$, $k$ erklärt der Zielgruppe nichts, was nicht bereits durch die Kostentabelle und den „Fabrik zieht um"-Absatz gesagt wurde. Die mathematische Notation schafft eine Distanz, die dem Post schadet. Das Gefangenendilemma als *Konzept* kann in einem `<details>`-Block für interessierte Leser leben. Für den Haupttext ist es Ballast.

**Streichen: § Was die Parteien anbieten — vollständig**
Dieser Abschnitt schadet dem Post mehr als er nützt. Drei Gründe:

1. Er widerspricht dem Planversprechen „kein Moralisieren" direkt.
2. Die Zielgruppe (AfD-skeptisch, aber misstrauisch gegenüber politischer Belehrung) reagiert auf Parteibewertungen mit Ablehnung — nicht mit Erkenntnis.
3. Die Analyse ist zu stark vereinfacht, um ernstzunehmend zu sein: „Volt passt am besten" klingt für einen sächsischen Kleinunternehmer abstrus, da Volt in ostdeutschen Wahlkreisen kaum präsent ist.

**Ersatz:** Kein Parteiranking — stattdessen eine Checkliste: „Was müsste eine Regierung konkret tun, damit Uwes Kostenlücke kleiner wird?" Ohne Parteinamen.

**Streichen: Rechtlicher Hinweis: die Transitausnahme (§ Backup)**
Reine Fußnote für Regulierungsexperten. Die Zielgruppe fährt keine Transitstrecken — sie macht Kabotage und bilateralen Verkehr. Das ist genau der Fall, der reguliert ist. Der Transithinweis verwirrt ohne Mehrwert.

**Kürzen stark: § Backup / Ablage**
Der gesamte Methodikabschnitt gehört in `<details>`-Blöcke. Die detaillierten Kostentabellen, Lohnzahlen, Tschechien-Maut-Daten und Quellenmethodik sind für Datenjournalisten und misstrauische Leser wertvoll — aber auf der Hauptleseebene verdoppeln sie die Post-Länge und signalisieren: „Das hier ist eine akademische Studie, kein Blogpost."

**Streichen oder stark kürzen: „Der etwas kompliziertere Fall für offene Märkte"**
Der Absatz sagt im Kern: „Kunden könnten Alternativen suchen." Das ist richtig — aber die Formulierung ist so vorsichtig und vage, dass es keine Überzeugungskraft hat. Der Punkt ist im „Fabrik zieht um"-Satz in § Realistische Alternativen bereits besser gesagt. Hier ist er Wiederholung ohne Mehrwert.

---

### Was geschärft werden muss

**Schärfen: Der Kipppunkt (§ fehlt derzeit)**
Der Post behauptet, Protektionismus könne für Uwe ein Nettoverlust sein — aber nennt nie konkret, *bei welchem Exportanteil* das passiert. Das ist die zentrale Lücke. Die Zielgruppe braucht eine Zahl: „Wenn mehr als 25 % deiner Aufträge grenzüberschreitend sind, verlierst du durch geschlossene Grenzen mehr, als du gewinnst." Ohne diese Zahl bleibt das Argument abstrakt. Das ist genau das, was das Widget hätte liefern sollen — aber eine einfache Rechnung im Text würde es auch tun.

**Schärfen: Hebel 2 — Mindestlohn-Durchsetzung (§ Realistische Alternativen)**
„Das Gesetz existiert, es wird nur nicht durchgesetzt" ist stark — aber was würde sich für Uwe *nächstes Jahr* konkret ändern, wenn es morgen vollständig durchgesetzt würde? Die Kostentabelle zeigt: Der polnische Spediteur auf deutschen Strecken mit Mindestlohn liegt bei €113 statt €107 — die Lücke zu €121 sinkt von 11,5 % auf 6,9 %. Das sollte explizit benannt werden: „Vollständige Durchsetzung des bestehenden Rechts brächte die Lücke allein auf die Hälfte."

**Schärfen: Die Einleitung (§ erste drei Absätze)**
Die drei Aufzählungspunkte am Ende der Einleitung („Das ist wieder einmal ein Beispiel...", „Ich muss offensichtlich...", „Ich muss offensichtlich...") sind das Beste an der Einleitung: Sie machen die innere Logik des Protektionismus sichtbar, ohne sie zu verurteilen. Aber dieser Moment ist eingebettet in einen moralisch aufgeladenen Kontext. Die Aufzählungspunkte sollten der eigentliche Einstieg sein — die Reflexion über Mitleid mit Dieselfahrern muss weg.

**Schärfen: CBAM als Argument (§ Hebel 3)**
„CBAM zielt nicht direkt auf Güterverkehr ab, signalisiert aber die Richtung" ist schwach. Ein Argument, das explizit sagt „das gilt eigentlich nicht für unser Thema, aber es zeigt eine Tendenz", hilft der Zielgruppe nicht. Entweder CBAM hat einen konkreten, beschreibbaren Effekt auf Transportkosten — dann nennen. Oder der Absatz wird gestrichen und Hebel 3 durch ein konkretes Gegenseitigkeits-Beispiel aus dem EU-Mobilitätspaket ersetzt.

---

### Nützt die Wahlprogramm-Analyse der Zielgruppe?

**In der aktuellen Form nicht — aber das Grundprinzip ist rettbar.**

Das Problem ist nicht, dass Parteien verglichen werden, sondern die *Richtung* des Arguments. Der aktuelle Abschnitt geht von den Parteien aus und bewertet sie: „Die AfD ist emotional kohärent, aber wirtschaftlich selbstzerstörerisch." Das ist ein Urteil über die Partei — und für die Zielgruppe klingt es wie eine Ablehnung in akademischer Verpackung.

**Die Umkehrung funktioniert:** Der Post hat bereits konkrete Maßnahmen identifiziert, die Uwes Kostenlücke tatsächlich schließen würden. Wenn diese Maßnahmen zuerst klar formuliert sind, kann danach gefragt werden, welche Parteiprogramme sie enthalten — als sachlicher Abgleich, nicht als Parteibewertung. Die Zielgruppe zieht das Fazit selbst.

**Voraussetzung: Die Maßnahmen müssen sich direkt aus der Analyse ableiten.**
Das ist die entscheidende Hürde. Die Tabellenzeilen dürfen keine allgemeinen Politikziele sein (z.B. „Bürokratieabbau"), sondern müssen konkret aus dem Post selbst folgen. Was der Post tatsächlich trägt:

- ✓ **Mindestlohn-Durchsetzung auf deutschen Straßen** — direkt aus Durchsetzungslücke + Kostentabelle. Vollständige Durchsetzung halbiert die Lücke (11,5 % → 6,9 %).
- ✓ **Operative Verknüpfung Smart Tachograph 2 mit Lohnkontrollen** — direkt aus Durchsetzungslücke. Die Technik ist da; es fehlt der administrative Schritt.
- ✓ **Bekämpfung von Scheinselbstständigkeit** — direkt aus Durchsetzungslücke, konkret und juristisch fassbar.
- △ **Überbrückungshilfen für Elektro-Lkw-Umstieg** — im Post erwähnt, aber zu wenig ausgearbeitet, um glaubwürdig als Tabellenzeile zu stehen. Erst schärfen (§ Hebel 1), dann in die Tabelle.
- ✗ **Bürokratieabbau allgemein** — zu vage; nicht direkt aus der Kostenanalyse ableitbar. Gehört nicht in die Tabelle.
- ✗ **CBAM als Hebel** — der Post selbst räumt ein, dass CBAM Güterverkehr nicht direkt betrifft. Nicht tabellenreif.

**Empfehlung:** Den Abschnitt umbauen — nicht löschen. Struktur:

1. Zuerst die 3–4 Maßnahmen benennen, die direkt aus der Analyse folgen (als nummerierte Forderungsliste).
2. Dann eine Tabelle: Welches Parteiprogramm enthält diese Maßnahme? (✓ / ○ / ✗, ohne Prosa-Urteile)
3. Kein zusammenfassendes Urteil — kein „Volt ist am besten." Die Tabelle ist das Ende des Abschnitts.

Das gibt der Zielgruppe eine Handlungsoption (konkrete Fragen an Kandidaten) statt einer Abstimmungsempfehlung.

---

## Offene Fragen zum überarbeiteten Post

### F1: Werden die drei Kernpunkte bereits klar?

**Punkt 1 — Kostenlücke schließt sich: Teilweise.**
Die 12%/7%-Zahl ist im Haupttext. Aber die *Dynamik* — dass die Lücke kleiner wird — ist nur im Appendix versteckt (Lohndaten: Verhältnis 1:2,8 → 1:1,8). Im Interpretationsabschnitt steht „diese Lücke wird immer geringer", ohne Beleg. Der Leser muss das glauben, kann es aber nicht nachvollziehen.

**Punkt 2 — Der Kostendruck kommt vom Klimawandel: Noch nicht vorhanden.**
Das ist die stärkste Erkenntnis im Notebook, aber sie fehlt im Post vollständig. Laut Notebook sind die deutschen Mautkosten von 2018 auf 2026 um **+149 %** gestiegen (von €15,60 auf €38,90) — fast ausschließlich durch den CO₂-Aufschlag auf die Lkw-Maut (eingeführt Dez. 2023). Kraftstoff stieg +55 %, Fahrerlöhne DE nur +17 %. Diese drei Zahlen zusammen sind der eigentliche Beweis für den Kern des Posts: Der Kostendruck kommt nicht mehr aus dem Lohngefälle, sondern aus dem Klimaumbau. Im Post steht das nicht.

**Punkt 3 — Regierungsaufgabe ist CO₂-Begleitung, nicht Lohnschutz: Fehlt.**
Der Interpretationsabschnitt endet abrupt mit „Aber das Thema möchte ich für einen möglichen zukünftigen Beitrag aufheben." Es gibt keine Schlussfolgerung. Der Leser hat die Daten gelesen — und weiß nicht, was er damit anfangen soll. Der Kern-Claim (Regierungsaufgabe = Transformation begleiten, nicht Grenzen schließen) wird nirgends ausgesprochen.

---

### F2: Sollten die 2018-Daten in den Haupttext?

**Nein als zweite vollständige Tabelle — ja als Veränderungsperspektive.**

Eine zweite Tabelle mit vier Kostenkomponenten für drei Länder ist zu schwer für den Haupttext. Was aber direkt aus dem Notebook ablesbar ist und den Kernpunkt trägt, wäre eine kompakte Vergleichsspalte oder ein kurzer Befund: wie stark haben sich die einzelnen Kostenkomponenten seit 2018 verändert?

Die überzeugendsten Zahlen aus dem Notebook (Notebook-Ausgabe Zelle 11):

| Kostenkomponente | DE 2018 | DE 2026 | Δ |
| --- | --- | --- | --- |
| Kraftstoff | €33,71 | €52,20 | +55 % |
| Fahrer (Ost-DE) | €20,97 | €24,54 | +17 % |
| Maut | €15,60 | €38,90 | +149 % |

Diese drei Zahlen zeigen sofort, warum die Frage nicht mehr primär die Lohnfrage ist. Die Maut hat sich fast verdreifacht — das trifft deutsche und polnische Spediteure auf deutschen Strecken gleichermaßen, aber der deutsche Spediteur bezahlt auch auf polnischen Strecken inzwischen mehr Maut als früher. Das ist der Kern von Punkt 2.

Empfehlung: Diese Prozentzahlen als kurze Einschubpassage in den Interpretationsabschnitt, keine vollständige neue Tabelle.

---

### F3: Sind die Angaben im Appendix kompatibel mit der Notebook-Methodik?

**Die Haupttabelle (2026, PL auf DE) ist konsistent — aber es gibt drei Auffälligkeiten:**

**Konsistent ✓:**
Die 2026-Haupttabelle im Post stimmt mit dem Notebook überein.

- DE Gesamt: €52,20 + €24,54 + €38,90 + €5,92 = €121,56 ✓
- PL Ist: €52,20 + €10,49 + €38,90 + €6,00 = €107,59 ✓
- PL Mindestlohn: €52,20 + €16,03 + €38,90 + €6,00 = €113,13 ✓

**Auffälligkeit 1 — Wechselkurs-Diskrepanz (geringfügig):**
Der Appendix nennt 1 EUR ≈ 4,19 PLN (12.05.2026), das Notebook verwendet 4,2465 PLN (15.05.2026). Für die Haupttabelle ist das irrelevant (polnische Maut auf deutschen Strecken ist die deutsche Maut = €38,90). Es betrifft nur die Backup-Tabelle für PL auf PL-Strecken: der Post zeigt €13,37, das Notebook ergibt €13,19. Kein Fehler, nur eine Datumsdifferenz — aber der Appendix sollte konsistente Wechselkurse nennen.

**Auffälligkeit 2 — Kraftstoff 2018 (geringfügig):**
Die 2018-Tabelle im Appendix zeigt DE-Kraftstoff = €34,45 (aus dem Kotsios-Paper). Das Notebook re-deriviert aus dem EU Oil Bulletin denselben Zeitraum und kommt auf €33,71. Beide beziehen sich auf die Woche des 20. Juli 2018, aber die Quelldaten differieren leicht. Das sollte in einer Anmerkung zur 2018-Tabelle transparent gemacht werden.

**Auffälligkeit 3 — Methodenbruch 2018 vs. 2026 (inhaltlich relevant):**
Die 2018-Tabelle im Appendix basiert für Fahrerkosten auf **Mindestlöhnen** (aus dem Kotsios-Paper: DE €11,05 = damaliger nationaler Mindestlohn × 1,25 h). Die 2026-Tabelle basiert auf **SES-Durchschnittslöhnen** (Eurostat, ostdeutsche NUTS-1-Regionen: €19,63/h → €24,54/100km). Das sind zwei verschiedene Konzepte. Ein direkter Vergleich zwischen den beiden Tabellen wäre daher irreführend — insbesondere weil die SES-Löhne deutlich höher liegen als der bloße Mindestlohn. Der Appendix sollte diesen Methodenwechsel explizit kennzeichnen.

---

## Lösungsvorschläge

### L-F1: Drei Optionen für den Interpretationsabschnitt

Die drei Kernpunkte brauchen konkrete Textstellen. Hier sind drei strukturelle Optionen — von minimal bis maximal:

**Option A — Minimale Ergänzung (empfohlen als Einstieg):**
Den bestehenden Interpretationsabschnitt um zwei Sätze verlängern, die Punkt 1 belegen und Punkt 2 einführen:

- Satz für Punkt 1: Die Lohndaten (SES 2018 vs. 2022) zeigen, dass polnische Löhne zwischen 2018 und 2022 um +37 % stiegen, ostdeutsche nur um +17 % — die Lücke schließt sich also messbar, auch wenn sie real bleibt.
- Satz für Punkt 2: Die Mautkosten stiegen im gleichen Zeitraum in Deutschland von €15,60 auf €38,90 pro 100 km (+149 %), vor allem durch den CO₂-Aufschlag ab Dezember 2023 — das ist jetzt der größte Kostentreiber.
- Punkt 3 (Schluss): Eine abschließende Aussage, die aus den Daten folgt: Das Problem ist nicht mehr primär das Lohngefälle, sondern die Frage, wie Spediteure mit steigenden CO₂-Kosten umgehen. Das ist eine andere politische Frage als Grenzschutz.

**Option B — Getrennte Schlussabschnitt:**
Einen eigenständigen dritten Abschnitt „Was bedeutet das?" nach der Interpretation einfügen, der die drei Punkte explizit als Fazit formuliert. Vorteil: klare Trennung von Daten und Schlussfolgerung. Nachteil: kann moralisierend wirken, wenn die Sprache nicht neutral bleibt.

**Option C — Offen lassen, Frage stellen:**
Den Post mit einer offenen Frage enden lassen statt einem Fazit: „Wenn der Kostendruck zunehmend aus Maut und Kraftstoff kommt und nicht aus dem Lohngefälle — was sollte die Regierung dann tun?" Das lässt den Leser die Schlussfolgerung selbst ziehen und vermeidet Moralisieren. Passt gut zur Zielgruppe (Skepsis gegenüber Belehrungen). Risiko: der Post wirkt unfertig.

**Zur Lohnkonvergenz (Formulierungsvorschlag):**
Die SES-Zahlen sind ehrlicher als der Mindestlohn-Vergleich (1:2,8 → 1:1,8), weil ostdeutsche Trucker 2018 schon über dem Mindestlohn verdienten. Eine mögliche Formulierung: „Polnische Löhne sind seit 2018 schneller gestiegen als ostdeutsche — der Abstand war 2018 noch 2,7:1, heute ist er 2,3:1. Real bleibt die Lücke, die Richtung stimmt." Das ist präziser als „schließt sich" und ehrlicher als die Mindestlohn-Ratio.

---

### L-F2: Konkrete Tabellenergänzung für den Haupttext

Vorschlag für eine schlanke Einschubpassage nach der bestehenden Tabelle, die Punkt 2 direkt belegt. Die Zahlen stammen direkt aus dem Notebook (Zelle 11, SES-basiert):

| Kostenkomponente | 2018 | 2026 | Veränderung |
| --- | --- | --- | --- |
| Maut (Deutschland) | €15,60 | €38,90 | **+149 %** |
| Kraftstoff (Deutschland) | €33,71 | €52,20 | +55 % |
| Fahrer (Ost-DE, SES) | €20,97 | €24,54 | +17 % |

Diese Tabelle zeigt in drei Zeilen, warum der Hauptkostendruck nicht mehr aus dem Lohngefälle kommt. Für die Lohnzeile gilt: die Prozentzahl (+17 %) ist korrekt und aus dem Notebook belegt. Den Vergleich mit dem polnischen Lohnwachstum (+37 %) kann man entweder in einem Satz ergänzen oder weglassen — je nachdem, wie stark man Punkt 1 im Haupttext verankern will.

---

### L-F3: Konsistente 2018-Basistabelle mit SES-Methodik

Das Notebook enthält SES-Daten für **beide** Jahre (2018: `EARN_SES18_RHR`, 2022: `EARN_SES22_RHR`). Damit ist ein vollständig konsistenter 2018-Vergleich möglich, ohne die Kotsios-Mindestlöhne zu verwenden.

**Konkrete Zahlen aus dem Notebook für eine überarbeitete Appendix-Basistabelle (SES-basiert, 2018):**

| Kostenkomponente | PL auf DE 2018 | PL auf DE 2026 | DE auf DE 2018 | DE auf DE 2026 |
| --- | --- | --- | --- | --- |
| Fahrer (SES) | €7,65 | €10,49 | €20,97 | €24,54 |
| Kraftstoff | €33,71 | €52,20 | €33,71 | €52,20 |
| Maut | €15,60 | €38,90 | €15,60 | €38,90 |
| Reifen | €5,67 | €6,00 | €5,29 | €5,92 |
| **Gesamt** | **€62,63** | **€107,59** | **€75,57** | **€121,56** |
| **Abstand zu DE** | **−17,1 %** | **−11,5 %** | — | — |

Diese Tabelle ist methodisch konsistent (SES für beide Jahre) und zeigt, dass der Abstand auf deutschen Strecken von ~17 % (2018) auf ~12 % (2026) gesunken ist — was Punkt 1 direkt belegt.

**Empfohlene Textformulierung für den Appendix:**
„Fahrerkosten basieren auf dem mittleren Bruttostundenlohn aus der Eurostat Structure of Earnings Survey (SES): EARN_SES18_RHR für 2018, EARN_SES22_RHR für 2022/2026. Für Deutschland: Mittelwert der 6 ostdeutschen NUTS-1-Regionen. Dies weicht von den Kotsios & Folinas (2020)-Originalwerten ab, die Mindestlöhne als Proxy verwendeten — der SES-Ansatz ist realistischer für die tatsächlichen Lohnkosten ostdeutscher Spediteure."

**Hinweis zur alten Kotsios-Basistabelle:** Die bestehende 2018-Tabelle im Appendix (auf Basis Kotsios-Mindestlöhne) kann dann ersetzt oder als Fussnote mit dem Hinweis „Originalwerte aus Kotsios & Folinas (2020), Methodik siehe oben" behalten werden.
