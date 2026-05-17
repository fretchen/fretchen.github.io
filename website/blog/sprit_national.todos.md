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
