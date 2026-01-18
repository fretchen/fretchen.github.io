# Budget Gridlock Blog Post - Verbesserungsplan

**Letzte Aktualisierung:** 18. Januar 2026

**Zielgruppe:** Politikinteressierte Leser, die keine mathematische Vorbildung brauchen
**Ziel:** Mathe begleitend, nicht blockierend; klare politische Schlussfolgerungen

---

## Status-Übersicht

| Phase | Beschreibung | Status |
|-------|--------------|--------|
| Phase 1 | Fehlende Struktur | ✅ ABGESCHLOSSEN |
| Phase 2 | Mathe-Barrieren abbauen | ✅ GRÖßTENTEILS ABGESCHLOSSEN |
| Phase 3 | Narrative Stärkung | ✅ ABGESCHLOSSEN (via Phase 5) |
| Phase 4 | Interaktivität | ✅ ABGESCHLOSSEN |
| Phase 5 | Narrative Restrukturierung | ✅ ABGESCHLOSSEN |

---

## Schwachstellen-Übersicht (Original)

### Kritisch (🔴) — BEHOBEN
1. ~~Abruptes Ende~~ ✅ Epilog mit "What Would Help?" und Reflexion
2. ~~δ_min Formel zu prominent~~ ✅ In Details-Box verschoben
3. ~~Random Walk Gleichung unnötig~~ ✅ In Details-Box "🔬 Model parameters"
4. ~~Utility-Eigenschaften zu abstrakt~~ ✅ Quadratische Utility verbal erklärt

### Strukturell (🟡) — BEHOBEN
5. ~~Fehlende politische Interpretation~~ ✅ Im Epilog und Akt 3
6. ~~Owls/Hummingbirds am Ende nicht aufgegriffen~~ ✅ Durchgängig verwendet
7. ~~p wird spät und abrupt eingeführt~~ ✅ Im Interlude (Telefongespräch mit Adam)

---

## Priorisierte Todo-Liste

### Phase 1: Fehlende Struktur wiederherstellen (Priorität: HOCH) — ✅ ABGESCHLOSSEN

- [x] **1.1** "Political Interpretation" Abschnitt wiederhergestellt
  - "The Toxic Combination" in Akt 3
  - Was macht δ niedrig / p hoch in echten Demokratien
  
- [x] **1.2** "What Would Help?" Abschnitt wiederhergestellt
  - Im Epilog mit konkreten Interventionen
  - Längere Amtszeiten, weniger sichere Sitze, Commitment-Mechanismen
  
- [x] **1.3** Conclusion geschrieben
  - Sofia im Bar, reflektiert mit Adam via SMS
  - "They were both rational. That's exactly the problem."

### Phase 2: Mathe-Barrieren abbauen (Priorität: MITTEL) — ✅ GRÖßTENTEILS ABGESCHLOSSEN

- [x] **2.1** Random Walk Gleichung in Details-Box verschoben
  - Jetzt in "🔬 Model parameters" im Widget
  
- [x] **2.2** Utility-Eigenschaften verbalisiert
  - "Losing everything hurts more than winning helps"
  - Konkave Utility verbal erklärt
  
- [x] **2.3** δ_min Formel in Details-Box verschoben
  - "🔬 Technical details: The patience threshold"
  
- [ ] **2.4** Strategie-Definitionen vereinfachen ⚠️ TEILWEISE
  - Widget zeigt "Win: Y = 0.8, Lose: Y = 0.2"
  - Die formale Definition könnte noch weiter vereinfacht werden

### Phase 3: Narrative Stärkung (Priorität: NIEDRIG) — ✅ ABGESCHLOSSEN (via Phase 5)

- [x] **3.1** Intro mit konkretem Hook
  - Trilog in Brüssel als Setting
  
- [x] **3.2** p früher einführen
  - Zusammen mit δ im Telefongespräch mit Adam
  
- [x] **3.3** Ende: Rückkehr zum konkreten Beispiel
  - Sofia sieht Ferreira in der Bar, beide wissen das Spiel

### Phase 4: Interaktivität — ✅ ABGESCHLOSSEN

- [x] **4.1** Interaktives Widget implementiert
  - TSX-Komponente mit Two-Slider Design
  - Political Security Slider (Ferreira ↔ Lindqvist)
  - Patience (δ) Slider
  
- [x] **4.2** Monte Carlo Simulation
  - 200 Trajektorien, 10 Perioden
  - Payoff-Vergleich Cooperate vs WTA
  - δ_min Threshold-Anzeige

---

## NEUE ISSUES (während Implementierung entdeckt)

### Kritisch (🔴) — BEHOBEN
1. ~~**δ_min Formel falsch angewandt**~~ ✅ BEHOBEN
   - **Problem:** `p` im Widget = Verlustwahrscheinlichkeit, aber Formel erwartet Gewinnwahrscheinlichkeit
   - **Fix:** `const pWin = 1 - currentP; const deltaMin = (1 - GAMMA) / (1 - pWin * GAMMA);`
   
2. ~~**Utility-Funktion inkonsistent**~~ ✅ BEHOBEN
   - **Problem:** Widget verwendete `sqrt(x)`, Notebook verwendet quadratische Utility
   - **Fix:** `utility = y - 0.5 * GAMMA * y * y`

3. ~~**Monte Carlo Strategien inkonsistent**~~ ✅ BEHOBEN
   - **Problem:** Cooperate war `Y = X` (proportional), sollte aber `Y = 1-COOP / COOP` sein
   - **Fix:** `cooperate: (x) => (x > 0.5 ? 1 - COOP : COOP)`

### Strukturell (🟡) — BEHOBEN
4. ~~**Payoff-Box Highlighting basierte auf δ_min statt MC-Ergebnis**~~ ✅ BEHOBEN
   - **Problem:** Boxes wurden nach analytischem Kriterium gefärbt, nicht nach simuliertem Payoff
   - **Fix:** Neues `coopPayoffHigher = results.cooperate.mean > results.wta.mean`

### Kleinere Issues (🟢) — OFFEN
5. **Text im Post referenziert "three strategies"** ⚠️ OFFEN
   - Sofias Dialog mit Adam erwähnt "Three strategies to compare"
   - Widget hat nur 2 Strategien (Cooperate, WTA)
   - **Mögliche Fixes:** 
     - a) Text auf 2 Strategien anpassen
     - b) Dritte Strategie (Partial) wieder hinzufügen
   
6. **Chart.js imports nicht verwendet** ⚠️ UNWICHTIG
   - CategoryScale, LinearScale, etc. werden registriert aber kein Chart angezeigt
   - Könnte bereinigt werden, funktioniert aber

7. **Widget erwähnt COOP=0.2 fest** ⚠️ OFFEN
   - Labels zeigen "Y = 0.8" und "Y = 0.2" hardcoded
   - Sollte dynamisch von COOP abgeleitet werden

---

## Validierung (Notebook Tests)

✅ Python-Übersetzung des Widget-Codes in `gridlock_estimates.ipynb`
✅ Monte Carlo vs analytische δ_min Vergleich
✅ Bug in p-Definition identifiziert und korrigiert
✅ Crossover-Punkt stimmt nach Korrektur mit Analytik überein

---

## Phase 5: Narrative Restrukturierung — Das Trilog-Szenario — ✅ ABGESCHLOSSEN

**Status:** Vollständig umgesetzt mit einigen Anpassungen:
- Timeline geändert von 22:00-06:00 auf 10:00-22:00 (Tag statt Nacht)
- Epilog in Bar statt Taxi
- Adam sendet Link zum Widget per SMS statt Video-Call

### Detaillierte Todo-Liste für Phase 5

#### 5.1 Prolog schreiben — ✅
- [x] **5.1.1** Sofia's Ankunft im Berlaymont um 09:47
- [x] **5.1.2** Innerer Monolog: "I've seen these negotiations before. They rarely end well."
- [x] **5.1.3** Kurze Erklärung was ein Trilog ist

#### 5.2 Akt 1: Die Positionen — ✅
- [x] **5.2.1** Lindqvist (Owl 🦉) vorstellen — secure coalition, long-term priorities
- [x] **5.2.2** Ferreira (Hummingbird 🐦) vorstellen — election in 8 months, immediate needs
- [x] **5.2.3** Sofia's Beobachtung: "In her mind, she's started calling them Owls and Hummingbirds"
- [x] **5.2.4** Die Kernfrage: "Why can't they find a middle ground?"
- [x] **5.2.5** NEU: Lunch break SMS an Adam (12:30)

#### 5.3 Akt 2: Die Eskalation — ✅
- [x] **5.3.1** Kompromiss-Vorschläge von Sofia abgelehnt
- [x] **5.3.2** Lindqvist: "We cannot accept anything below 55%"
- [x] **5.3.3** Ferreira: "My voters need to see results *now*"
- [x] **5.3.4** Sofia realisiert: Beide sind risk-averse, aber wählen die riskante Option
- [x] **5.3.5** "Why Losing Hurts More Than Winning Helps" — concave utility erklärt

#### 5.4 Interlude: Der Anruf — ✅
- [x] **5.4.1** Sofia im Korridor, ruft Adam an (18:20)
- [x] **5.4.2** Sie erklärt die Situation
- [x] **5.4.3** Adam: "That's the Prisoner's Dilemma" (Link zum anderen Post)
- [x] **5.4.4** Adam erklärt δ (patience) und p (power security)
- [x] **5.4.5** Adam sendet Link zum Widget: "A little tool"
- [x] **5.4.6** Details-Box mit δ_min Formel

#### 5.5 Akt 3: Die Deadline — ✅
- [x] **5.5.1** Zurück im Raum, Deadline 22:00
- [x] **5.5.2** Ferreira: "I have elections in eight months" (→ niedriges δ)
- [x] **5.5.3** Lindqvist: "My coalition is stable. We can wait" (→ hohes p)
- [x] **5.5.4** "The Toxic Combination" — was macht δ niedrig und p hoch
- [x] **5.5.5** Die Verhandlung scheitert

#### 5.6 Epilog: Reflexion — ✅
- [x] **5.6.1** Sofia in Bar near Place Luxembourg (22:30)
- [x] **5.6.2** SMS-Austausch mit Adam: "They were both rational. That's exactly the problem."
- [x] **5.6.3** "What Would Help?" — konkrete Interventionen
- [x] **5.6.4** Sofia sieht Ferreira in der Bar, kurzer Blickkontakt
- [x] **5.6.5** Offenes Ende: "Unless something changes"

---

## Verbleibende offene Punkte

### Muss noch gemacht werden
1. **Text-Widget Inkonsistenz:** Dialog erwähnt "three strategies", Widget hat nur 2
   - **Empfehlung:** Text anpassen auf 2 Strategien

### Nice-to-have
2. **Widget Labels dynamisch:** "Y = 0.8" sollte von COOP Variable abgeleitet werden
3. **Unbenutzte Chart.js Imports entfernen:** Funktioniert, aber unnötiger Ballast

---

## Erledigte Aufgaben (Zusammenfassung)

✅ Vollständige narrative Restrukturierung (Sofia's Trilog-Geschichte)
✅ TSX-Komponente mit interaktivem Widget
✅ Monte Carlo Simulation mit korrekten Strategien
✅ Quadratische Utility-Funktion implementiert
✅ δ_min Formel korrigiert (p_win statt p_lose)
✅ Payoff-Box Highlighting basiert auf MC-Ergebnissen
✅ Details-Boxen für technische Inhalte
✅ Political interpretation im Epilog
✅ "What Would Help?" Abschnitt
✅ Python-Tests im Notebook zur Validierung

**Gesamt Phase 5:** ~2.5-4h

### Notizen für die Umsetzung

- **Ton:** Novellistisch, nicht journalistisch. Innere Gedanken, Atmosphäre.
- **Dialog:** Realistische Verhandlungssprache, keine Karikaturen
- **Theorie:** Eingewoben in die Geschichte, nie dozierend
- **Sofia's Stimme:** Erfahren, leicht zynisch, aber nicht resigniert
- **Adam's Rolle:** Der "Erklärer" — aber via Dialog, nicht Monolog
- **Owls/Hummingbirds:** Sofia's mentale Abkürzung, nicht offizielle Namen

