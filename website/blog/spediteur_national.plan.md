# Blog Post Plan: Spediteur, Spritpreise & die Logik hinter Protektion

## Entscheidungen

| # | Frage | Entscheidung | Status |
|---|-------|-------------|--------|
| 1 | Zeitgebundenheit | Irankrise als Hook (2-3 Absätze), dann strukturelles Problem | ✅ |
| 2 | POV-Charakter | Thomas (KFZ-Werkstatt-Besitzer, AfD-Skeptiker) — Leser-Identifikationsfigur | ✅ |
| 3 | Katalysator | Uwe (Spediteur, AfD-offen) — stellt das Problem | ✅ |
| 4 | Tonalität AfD | Explizit benennen, sachlich. Modell zeigt Grenzen, nicht der Erzähler | ✅ |
| 5 | Daten | Abstrakt — Modell zuerst, dann Datenbedarf | ✅ |
| 6 | Interaktivität | Widgets als "Rechner der Kammer/IHK", MDX + React-Komponenten | ✅ |
| 7 | Sprache | Deutsch. Einzelfall, kein i18n-Umbau | ✅ |
| 8 | Gegenpol-Typ | Freund aus anderem Sektor (KFZ-Werkstatt) | ✅ |
| 9 | Namen | Uwe (Spediteur), Thomas (Werkstatt) | ✅ |
| 10 | Setting | Thomas' Werkstatt, Uwe holt LKW ab / Reparatur | ✅ |
| 11 | Beruf Thomas | KFZ-Werkstatt, eigener Betrieb | ✅ |
| 12 | Widget-Quelle | IHK/Kammer der Grenzregion — Thomas hat es im Newsletter gesehen | ✅ |
| 13 | Modelltyp | ❓ offen — Modell muss zuerst formalisiert werden |
| 14 | Anzahl/Rolle Widgets | ❓ offen — abhängig vom Modell |
| 15 | Uwes Reaktion/Dramaturgie | ❓ offen — dramaturgische Frage, nach Modell klären |

---

## Target Audience

- **Wer**: Ostdeutsche, 30–60 Jahre, der AfD skeptisch gegenüberstehend
- **Ihr Problem**: Sie sehen die realen Probleme (Spritpreise, Konkurrenz, Abgehängtsein). Aber ihnen fehlen klare, gute Argumente, warum die AfD-Lösung ("Grenze zu") nicht funktioniert — und was besser wäre.
- **Kennen**: Spritpreise, Grenznähe zu Polen, jemanden wie Uwe
- **Kennen NICHT**: Spieltheorie, EU-Regulierungsdetails
- **Wollen NICHT hören**: "Jeder AfD-Wähler ist dumm", moralische Belehrung
- **Erwarten**: Ehrliche Auseinandersetzung. Uwes Problem ist real. Die Antwort darf kein "du verstehst das nur nicht" sein.

---

## Core Thesis

Uwes Frust über Spritpreise und polnische Konkurrenz ist berechtigt. Die AfD-Lösung "Grenze zu" klingt logisch — aber wenn man die Rechnung aufmacht, sieht man den Preis. Es gibt Alternativen, die Uwes Problem lösen, ohne den Markt kaputtzumachen. Thomas (und der Leser) lernt, wie er das erklären kann.

---

## Figuren

### Uwe — der Spediteur (Katalysator)

| | |
|---|---|
| **Alter** | 55 |
| **Region** | Sachsen, Grenzgebiet |
| **Beruf** | Spedition, 2–3 LKW |
| **Politik** | Wechselwähler AfD/CDU. Pragmatisch, nicht ideologisch. |
| **Funktion im Post** | Stellt das Problem. Hat die Zahlen, hat die Wut, hat die Logik. |
| **Nicht**: | Karikatur, Rassist, dumm. Er hat ein echtes Problem. |

### Thomas — KFZ-Werkstatt (POV / Identifikationsfigur)

| | |
|---|---|
| **Alter** | Anfang 50 |
| **Region** | Gleiche Gegend, eigene KFZ-Werkstatt |
| **Beziehung zu Uwe** | Regelmäßiger Geschäftskontakt (LKW-Wartung, TÜV), daraus Freundschaft |
| **PL-Konkurrenz** | Kaum direkt betroffen — lokale Kundschaft, Werkstattarbeit ist ortsgebunden |
| **Politik** | Wählt nicht AfD, aber hat kein gutes Gegenargument |
| **Funktion im Post** | Versteht Uwe, ringt mit der Antwort, findet sie im Laufe des Gesprächs |
| **Kernspannung** | Er kann nicht sagen "du liegst falsch" — weil Uwe nicht falsch liegt. |

---

## Setting

**Ort:** Thomas' KFZ-Werkstatt.

**Anlass:** Uwe holt seinen LKW ab (Reparatur, Wartung, TÜV-Vorbereitung). Normaler Geschäftskontakt. Er zahlt die Rechnung und fängt an zu rechnen — seine eigenen Kosten, die Tankquittung, der verlorene Auftrag letzte Woche.

**Warum es funktioniert:**
- Natürlicher Anlass, kein inszeniertes Treffen
- Uwes LKW ist sichtbar — seine Welt wird greifbar
- Zwei Unternehmer auf Augenhöhe, beide kennen Rechnungen und Druck
- Raum für ruhiges Gespräch (Feierabend, Werkstatt leer)

---

## Wie die Widgets ins Gespräch kommen

Thomas hat im **IHK-Newsletter** (oder Kammer-Rundschreiben) einen Rechner gesehen, den die Kammer für die Grenzregion veröffentlicht hat. Keine Studie die er "gelesen" hat — eher: "Die Kammer hat da letztens so'n Rechner rumgeschickt. Für Grenzregion-Betriebe. Hab ich mir mal angeschaut."

**Warum das funktioniert:**
- Beide sind IHK-/HWK-Mitglieder. Die Kammer ist ihre Institution.
- Thomas zeigt nicht SEINE Meinung, sondern ein neutrales Tool
- Uwe kann skeptisch sein oder nicht — der Rechner hat keine Haltung
- Ostrom-Brücke: Der Verband als vertrauenswürdige Selbstorganisation wird früh etabliert

**Offene Frage (nach Modell klären):** Ob es ein Widget ist (das beide Aspekte abdeckt — Kosten der Protektion UND Alternativen) oder zwei getrennte. Hängt davon ab, ob das Modell natürlich in zwei Schritte zerfällt.

---

## Modell — DER NÄCHSTE SCHRITT

### Was das Modell leisten muss

1. **Eine klare Frage beantworten:** "Was passiert mit Uwes Geschäft, wenn die Grenze zu ist?"
2. **Einen Kipppunkt zeigen:** Es gibt Bedingungen, unter denen Protektion rational ist, und solche, unter denen sie schadet. Der Leser muss selbst herausfinden, wo sein "Uwe" steht.
3. **Alternativen sichtbar machen:** Maßnahmen, die den Kostenunterschied reduzieren, ohne den Markt zu schließen.
4. **Rumspielen ermöglichen:** Nicht trivial. Der Leser soll 2-3 Minuten mit Slidern experimentieren und verschiedene Szenarien durchdenken.

### Modell-Skizze (zu formalisieren)

**Uwes Geschäft hat zwei Einkommensströme:**

| Auftragstyp | Offener Markt | Grenze zu |
|-------------|--------------|-----------|
| **Rein innerdeutsche Aufträge** | Unter Preisdruck durch PL-Konkurrenz | Kein PL-Konkurrent → mehr Aufträge, evtl. höhere Preise |
| **Grenzüberschreitende Aufträge** | Existieren (DE→PL, PL→DE Lieferungen) | Fallen teilweise oder ganz weg |

**Die Kernspannung:**
- Protektion GEWINNT bei innerdeutschen Aufträgen (weniger Konkurrenz)
- Protektion VERLIERT bei grenzüberschreitenden Aufträgen (Markt schrumpft)
- **Kipppunkt**: Ab welchem grenzüberschreitenden Anteil wird Protektion zum Nettoverlust?

**Mögliche Variablen (zu validieren):**

| Variable | Was sie bedeutet | Warum der Leser sie einstellen soll |
|----------|-----------------|--------------------------------------|
| Kostenunterschied DE vs. PL | Wie viel billiger ist der polnische Konkurrent? | Bestimmt, wie viel Uwe durch Protektion bei inländischen Aufträgen gewinnt |
| Anteil grenzüberschreitender Aufträge | Wie viele von Uwes Aufträgen brauchen offene Grenzen? | Bestimmt, wie viel Uwe durch Protektion verliert |
| Marktreaktion / Preiselastizität | Wie stark steigen Frachtpreise, wenn PL-Konkurrenz wegfällt? | Bestimmt, ob "mehr Aufträge" auch "mehr Gewinn" bedeutet |

**Mögliche Maßnahmen-Variable (für zweiten Teil / zweites Widget):**

| Maßnahme | Effekt im Modell |
|----------|-----------------|
| Mindeststandards (EU-Sozialdumping-Regeln) | Reduziert Kostenunterschied |
| Kompensation (Dieselsubvention, Mautanpassung) | Erhöht Uwes Marge direkt |
| Bürokratieabbau | Senkt Uwes Fixkosten |

### Offene Modell-Fragen (FOKUS nächster Schritt)

**M1: Wie modelliert man "Protektion"?**
Ist "Grenze zu" binär (ja/nein)? Oder gibt es Grade (Maut erhöhen, Kabotage einschränken, Mindestlohn kontrollieren)? Ein Slider "Grad der Protektion" (0% = völlig offen, 100% = Grenze zu) wäre realistischer als binär.

**M2: Wie reagiert der polnische Markt?**
Gegenseitige Protektion (Polen macht auch zu) vs. einseitig. Das ist der spieltheoretische Kern — muss nicht als "Gefangenendilemma" gelabelt werden, aber die Vergeltungslogik muss im Modell stecken.

**M3: Wie wird der Gewinn/Verlust berechnet?**
Braucht eine Formel. Vorschlag-Skizze:

```
Uwes Gewinn (offen) = Aufträge_inland × Marge_unter_Konkurrenz + Aufträge_grenz × Marge_grenz
Uwes Gewinn (geschlossen) = (Aufträge_inland + gewonnene_PL_Aufträge) × Marge_ohne_Konkurrenz - verlorene_Aufträge_grenz × Marge_grenz
```

Muss vereinfacht werden auf 2-3 Parameter, die der Leser per Slider steuert. Ergebnis: Balken- oder Liniendiagramm.

**M4: Ein Widget oder zwei?**
- **Ein Widget mit Tabs/Phasen:** Phase 1 = "Was passiert bei Protektion?" (Kostenunterschied + Exportanteil). Phase 2 = "Was bringen Alternativen?" (Maßnahmen-Slider). Vorteil: Ein zusammenhängendes Tool.
- **Zwei separate Widgets:** Widget 1 = Protektion-Rechner. Widget 2 = Maßnahmen-Vergleich. Vorteil: Klare narrative Trennung.
- Entscheidung hängt davon ab, ob das Modell natürlich in zwei Schritte zerfällt oder ob es ein Kontinuum ist.

**M5: Wie viel Spieltheorie explizit?**
Vorschlag: Das Modell im Haupttext ist ein Entscheidungsproblem ("Was ist für Uwe besser?"). Die spieltheoretische Dimension (Vergeltung, Nash-Gleichgewicht) kommt in einen `<details>`-Block für Interessierte.

---

## Outline (Entwurf — wird nach Modell finalisiert)

### Prolog (2-3 Sätze)
Kontext: Worum geht es, warum lohnt sich Weiterlesen.

### 1. Hook — Irankrise + Spritpreise (kurz)
Thomas hört im Radio: Spritpreise steigen. Denkt an Uwe.

### 2. Uwes Problem
Uwe holt seinen LKW ab, zahlt Thomas' Rechnung, legt seine eigene Kostenrechnung daneben. Diesel, polnische Konkurrenz, verlorene Aufträge. "Die AfD sagt wenigstens, was Sache ist."

Thomas versteht. Er kann nicht widersprechen. Das Problem ist real.

### 3. Die naheliegende Lösung
Uwe: "Grenze zu. Fertig." Thomas spürt, dass das nicht ganz stimmt — aber warum nicht?

### 4. "Die Kammer hat da was" (Widget 1)
Thomas holt den IHK-Rechner raus. Beide schauen zusammen. Was passiert mit Uwes Geschäft bei Grenzschließung? Slider für Kostenunterschied und Exportanteil. Ergebnis: Es gibt einen Kipppunkt.

### 5. Die Überraschung / Ernüchterung
Uwe sieht: Ab einem bestimmten Exportanteil verliert er durch Protektion mehr als er gewinnt. (Wie skeptisch er reagiert — dramaturgisch noch offen.)

### 6. "Gibt es was Besseres?" (Widget 2 — falls zwei Widgets)
Maßnahmen, die den Kostenunterschied verringern, ohne den Markt zu schließen. Slider für verschiedene politische Hebel.

### 7. Schluss
Kein Happy End. Kein Bekehren. Thomas hat jetzt Worte. Uwe hat eine Zahl gesehen. Beide wissen mehr als vorher.

---

## Tone & Style

- **Sprache**: Deutsch, direkt, nüchtern. Kurze Sätze.
- **Register**: Gesprächston zweier Handwerker/Unternehmer, nicht Seminarraum
- **Narrative**: Dialog treibt die Handlung (Vorbild: `housing_risk_portfolio.mdx`)
- **AfD**: Sachlich benannt. "Uwe hat letztes Mal AfD gewählt." Kein Kommentar.
- **Kein Moralisieren**: Die Rechnung spricht für sich. Thomas belehrt nicht.

---

## Sources & Research (nach Modell)

- [ ] Dieselpreise DE (Sachsen) vs. PL Grenzgebiet
- [ ] Anteil grenzüberschreitender Aufträge im sächsischen Transportgewerbe
- [ ] EU-Mobilitätspaket / Kabotage-Regeln
- [ ] AfD-Programm zum Thema Grenzverkehr
- [ ] Irankrise April 2026 — Ölpreis-Auswirkungen

---

## Consistency Notes

- **Verwandte Posts**: `prisoners_dilemma_interactive` (Grundlagen), `tragedy_of_commons_fishing` (Ostrom, asymmetrische Kosten), `housing_risk_portfolio` (MDX-Dialogstruktur)
- **Struktur-Vorbild**: `housing_risk_portfolio.mdx` — Dialog treibt Narration, Widgets am Moment des Verstehens
- **Neue Figuren**: Komplett neue Charaktere, andere Lebenswelt als Sofia/Amara/Moana
- **Erster deutscher Post**: Spieltheorie-Konzepte inline erklären, kein Verweis auf englische Posts
- **Ton-Unterschied**: Weniger akademisch, direkter, regionaler

---

## Implementierungsplan

### Phase 1: Modell formalisieren (NÄCHSTER SCHRITT)
- [ ] **1a.** Modell mathematisch aufschreiben: Uwes Gewinnfunktion unter "offen" vs. "geschlossen" mit 2-3 Parametern
- [ ] **1b.** Kipppunkt berechnen: Bei welchen Parameterwerten kippt Protektion von rational zu irrational?
- [ ] **1c.** Vergeltungslogik einbauen: Was passiert, wenn Polen Gegenmaßnahmen ergreift?
- [ ] **1d.** Maßnahmen formalisieren: Wie verschieben Mindeststandards/Kompensation/Bürokratieabbau die Parameter?
- [ ] **1e.** Entscheiden: Ein Widget oder zwei? (Ergibt sich aus 1a–1d)

### Phase 2: Widget(s) planen
- [ ] **2a.** Slider-Variablen und Wertebereiche festlegen
- [ ] **2b.** Visualisierung wählen (Balken, Linien, Flächen)
- [ ] **2c.** Ergebnisdarstellung: Was genau sieht der Leser? Zahl? Diagramm? Text?
- [ ] **2d.** Spieltheorie-`<details>`-Block skizzieren

### Phase 3: Narration finalisieren
- [ ] **3a.** Dialoge schreiben (Roh-Szenen)
- [ ] **3b.** Widget-Einbettungspunkte finalisieren
- [ ] **3c.** Uwes Reaktion / Dramaturgie klären
- [ ] **3d.** Schluss-Szene

### Phase 4: Implementierung
- [ ] **4a.** React-Komponenten in `website/components/blog/`
- [ ] **4b.** MDX-Datei `website/blog/spediteur_national.mdx`
- [ ] **4c.** Testen (lokaler Dev-Server)
- [ ] **4d.** Quellen/Daten einfügen wo nötig