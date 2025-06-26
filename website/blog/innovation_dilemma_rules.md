# Innovation Dilemma: Detaillierte Spielregeln

## Grundlegende Spielmechanik

### Spieler-Typen und Rollen

#### 1. Management (Portfolio-Entscheider)
- **Ziel**: Maximierung des Gesamtinnovations-ROI
- **Constraints**: Begrenzte Ressourcen (Budget, Personal, Zeit)
- **Entscheidungsraum**: Allokation von 100% Ressourcen auf N Teams
- **Information**: Partial sichtbar - Teams können Erfolg übertreiben/verheimlichen

#### 2. Innovations-Teams (2-5 Teams pro Spiel)
- **Ziel**: Eigenen Team-Erfolg maximieren + langfristige Reputation
- **Constraints**: Abhängig von Management-Allokation und Peer-Kooperation
- **Entscheidungsraum**: Wissensaustausch-Level (0-100%), Effort-Level (0-100%)
- **Information**: Eigene Technologie vollständig, andere Teams teilweise

#### 3. Nutzer/Kunden (Kollektiv)
- **Ziel**: Beste Produktqualität bei minimaler eigener Investition
- **Constraints**: Begrenzte Zeit für Feedback, Unsicherheit über Produktqualität
- **Entscheidungsraum**: Feedback-Intensität (0-100%), Early-Adoption (ja/nein)
- **Information**: Nur eigene Erfahrung, begrenzte Sicht auf Entwicklungskosten

## Detaillierte Payoff-Strukturen

### Management Payoff-Matrix

```
Eigene Strategie vs. Markt-Dynamik

                        Markt diversifiziert  Markt fokussiert
Diversifikation         (50, 50)             (70, 30)
Fokussierung           (30, 70)             (80, 0) oder (0, 80)
```

**Payoff-Interpretation:**
- (50, 50): Beide diversifizieren → stabile, moderate Gewinne
- (70, 30): Eigene Diversifikation vs. fokussierte Konkurrenz → Vorteil durch Risikostreuung
- (30, 70): Fokussierung vs. diversifizierte Konkurrenz → Risiko der Fehlspezialisierung  
- (80, 0)/(0, 80): Beide fokussiert → Winner-takes-all Szenario

### Team Payoff-Matrix (2x2 Grundform)

```
Team A vs. Team B Wissensaustausch

                    Team B: Kooperiert    Team B: Defektiert
Team A: Kooperiert  (Innovation: +3/+3)  (Innovation: +1/+5)
                    (Reputation: +2/+2)  (Reputation: +1/-1)
                    
Team A: Defektiert  (Innovation: +5/+1)  (Innovation: +2/+2)
                    (Reputation: -1/+1)  (Reputation: -2/-2)
```

**Dual-Payoff System:**
- **Innovation Points**: Sofortige Produktverbesserung
- **Reputation Points**: Langfristige Kooperationsbereitschaft anderer

### Nutzer Payoff-Matrix

```
Einzelner Nutzer vs. Kollektiv

                        Kollektiv gibt Feedback  Kollektiv schweigt
Nutzer gibt Feedback    (Qualität: +4)          (Qualität: +2)
                        (Aufwand: -2)           (Aufwand: -2)
                        
Nutzer schweigt         (Qualität: +3)          (Qualität: +1)
                        (Aufwand: 0)            (Aufwand: 0)
```

**Net-Payoffs:**
- Beide kooperieren: +2 für alle
- Nur Kollektiv kooperiert: +3 für Trittbrettfahrer, +2 für Kooperative
- Nur einzelner kooperiert: 0 für einzelnen, +1 für andere
- Niemand kooperiert: +1 für alle

## Erweiterte Spielregeln

### Zeitliche Dynamik (Multi-Round)

#### Runden-Struktur:
1. **Planning Phase** (30 Sek): Jeder Spieler wählt Strategie
2. **Execution Phase** (60 Sek): Auswirkungen werden berechnet und angezeigt
3. **Learning Phase** (30 Sek): Ergebnisse aller Spieler werden teilweise enthüllt
4. **Adaptation Phase** (30 Sek): Spieler können Strategie für nächste Runde anpassen

#### Langzeit-Effekte:
- **Reputation Decay**: Ohne positive Interaktionen sinkt Vertrauen um 10% pro Runde
- **Knowledge Accumulation**: Geteiltes Wissen akkumuliert über Zeit
- **Market Position**: Erfolgreiche Innovation führt zu besserer Ausgangslage

### Informationsasymmetrien

#### Management sieht:
- Aggregierte Team-Performance (verzögert um 1 Runde)
- Markt-Benchmarks (Konkurrenz-Performance)
- Budget-Constraints und ROI-Anforderungen
- **Nicht sichtbar**: Individuelle Team-Kooperationsstrategien

#### Teams sehen:
- Eigene vollständige Technologie und Performance
- Partielle Information über andere Teams (abhängig von Kooperationslevel)
- Management-Allokationsentscheidungen
- **Nicht sichtbar**: Management-Strategie und langfristige Pläne

#### Nutzer sehen:
- Eigene Erfahrung mit Beta-Versionen
- Aggregierte Ratings von anderen Nutzern
- **Nicht sichtbar**: Entwicklungskosten, interne Team-Dynamiken

### Externe Schocks (Zufallsereignisse)

#### Markt-Events (Wahrscheinlichkeit 20% pro Runde):
- **Disruption**: Neue Technologie macht 50% der bisherigen Innovation obsolet
- **Boom**: Markt wächst um 100%, alle Payoffs verdoppelt
- **Recession**: Budgets um 30% gekürzt, härtere Trade-offs
- **Regulation**: Compliance-Kosten, 20% der Ressourcen gebunden

#### Technologie-Events (Wahrscheinlichkeit 15% pro Runde):
- **Breakthrough**: Ein zufälliges Team macht großen Durchbruch (+50% Innovation)
- **Patent-Block**: Externe Firma blockiert bestimmte Innovationsrichtung
- **Open Source**: Kritische Technologie wird frei verfügbar

#### Social Events (Wahrscheinlichkeit 10% pro Runde):
- **Talent-Abwerbung**: Top-Performer wechselt zu anderem Team
- **Whistleblower**: Interne Informationen werden publik
- **Merger**: Zwei Teams müssen fusionieren

## Fortgeschrittene Strategien

### Management-Strategien

#### "Balanced Portfolio"
- 40% auf bewährte Innovationen
- 40% auf vielversprechende neue Ansätze  
- 20% auf Moonshot-Projekte
- **Risiko**: Mittelmäßige Performance in allen Bereichen

#### "Strategic Focus"
- 80% auf einen Hauptbereich
- 20% zur Absicherung
- **Risiko**: Totaler Verlust bei Fehlentscheidung

#### "Adaptive Allocation"
- Ressourcen folgen Performance der letzten 3 Runden
- **Risiko**: Pro-zyklisches Verhalten, verpasste Wendepunkte

### Team-Strategien

#### "Tit-for-Tat Plus"
- Starte kooperativ
- Kopiere Partner-Verhalten der letzten Runde
- Vergib gelegentlich (10% Chance)
- **Vorteil**: Robust gegen verschiedene Strategien

#### "Gradual Cooperation"
- Starte mit 30% Kooperation
- Erhöhe um 10% bei Partner-Kooperation
- Reduziere um 20% bei Partner-Defektion
- **Vorteil**: Langsames Vertrauensaufbau

#### "Strategic Defection"
- Kooperiere in ersten 3 Runden
- Defektiere in entscheidenden späten Runden
- **Risiko**: Reputationsverlust, Vergeltung

### Nutzer-Strategien

#### "Early Adopter"
- Immer maximales Feedback
- **Vorteil**: Bestes Endprodukt
- **Kosten**: Hoher Zeitaufwand

#### "Strategic Feedback"
- Feedback nur bei vielversprechenden Produkten
- **Vorteil**: Optimiertes Aufwand-Nutzen-Verhältnis
- **Risiko**: Fehleinschätzung der Produktqualität

#### "Free Rider"
- Niemals eigenes Feedback
- **Vorteil**: Null Kosten
- **Risiko**: Schlechtere Produktqualität für alle

## Experimentelle Varianten

### A) Kommunikation erlaubt
- Teams können vor jeder Runde 60 Sekunden chatten
- **Hypothese**: Erhöht Kooperationsrate um 30-40%

### B) Reputation transparent
- Alle Reputation-Scores sind öffentlich sichtbar
- **Hypothese**: Stabilisiert langfristige Kooperation

### C) Coalition-Building
- Teams können formelle Allianzen bilden
- Geteilte Payoffs innerhalb Allianz
- **Hypothese**: Führt zu Oligopol-ähnlichen Strukturen

### D) External Competition
- Zusätzliche KI-Gegner repräsentieren externe Konkurrenz
- **Hypothese**: Fördert interne Kooperation gegen gemeinsame Bedrohung

## Metriken und Erfolgsmaße

### Kurzfristige KPIs (pro Runde):
- **Innovation Output**: Summe aller Team-Innovationspunkte
- **Resource Efficiency**: Innovation pro eingesetzter Ressource
- **User Satisfaction**: Durchschnittlicher Nutzer-Payoff
- **Cooperation Index**: Anteil kooperativer Entscheidungen

### Langfristige KPIs (über gesamtes Spiel):
- **Total System Performance**: Summe aller Payoffs über alle Spieler
- **Inequality Measures**: Gini-Koeffizient der Payoff-Verteilung
- **Stability Index**: Varianz der Strategien über Zeit
- **Learning Curve**: Verbesserung der Performance über Runden

### Einzelspieler-Metriken:
- **Personal ROI**: Eigener Payoff im Verhältnis zu Investment
- **Reputation Score**: Langfristige Vertrauenswürdigkeit
- **Strategic Consistency**: Vorhersagbarkeit der Entscheidungen
- **Adaptation Speed**: Reaktionszeit auf veränderte Umstände

Diese detaillierten Spielregeln ermöglichen es, komplexe Innovations-Dilemmas realistisch zu simulieren und verschiedene Lösungsansätze zu testen.
