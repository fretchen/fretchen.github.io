---
publishing_date: 2026-05-10
title: Ostdeutsche Spediteure stehen unter Kostendruck — aber wovon eigentlich?
category: "others"
description: Ostdeutsche Spediteure erleben einen erheblichen Kostendruck unter anderem durch niedrigere Lohnkosten in Polen. Interessanterweise, sind die Kostenunterschiede aber im einstelligen Prozentbereich und der eigentliche Kostendruck kommt aus einer anderen Richtung.
tokenID: 123
---
 
Vor Kurzem diskutierte ich mit jemandem aus Sachsen inmitten des Irankriegs und stark gestiegener Kraftstoffpreise. Es ging um eine sehr konkrete Frage: ob die deutsche Regierung einheimische Spediteure zum Beispiel durch Subventionen oder Zölle mehr schützen sollte, da osteuropäische Konkurrenten strukturell günstiger fahren könnten. Das motivierte mich tiefer in das Thema reinzuschauen und die Antwort war differenzierter, als ich erwartet hatte.

## Was sind die Kosten ?

Um die Situation der Spediteure besser zu verstehen, habe ich mir die Kostenseite genauer angeschaut. Spedition ist eine Branche mit extrem dünnen Margen, bei der Kostenunterschiede von wenigen Prozent über Aufträge entscheiden — das macht die Frage nach dem Wettbewerbsnachteil so drängend. Wirklich hilfreich fand ich dabei die Herangehensweise aus der Studie von [Kotsios & Folinas](https://dl.acm.org/doi/10.4018/IJAL.2020010102) aus dem Jahr 2020, die die Betriebskosten pro 100 km für einen standardisierten Fünfachs-Lkw auf europäischen Inlandsstrecken gemessen hat. Die Kosten für die großen Kostentreiber — Fahrer, Kraftstoff und Maut — werden in den verschiedenen Ländern untersucht und verglichen. Diese Studie habe ich dann, wie in den technischen Details beschrieben, auf aktuelle Zahlen für Deutschland und Polen aktualisiert. Grob zusammengefasst sind die Transportkosten für polnische Spediteure auf polnischen Strecken aktuell etwa 31 % geringer als für deutsche Spediteure in Deutschland.

Die eigentliche Frage ist aber nach den Kosten auf deutschen Strecken, und hier gilt die Maut gleichermaßen für alle in Deutschland fahrenden Fahrzeuge — in- wie ausländische. Die Kraftstoffpreise richten sich ebenfalls nach der lokalen Zapfsäule. Was jedoch am Herkunftsland verankert bleibt, ist der Lohn des Fahrers und der ist für polnische Spediteure deutlich niedriger als für deutsche Spediteure.

Das Ergebnis ist ein Kostenvorteil polnischer Spediteure von rund **12 %** auf deutschen Strecken bei tatsächlich gezahlten Löhnen. EU-Recht schreibt für Fahrer, die in Deutschland eingesetzt werden, den deutschen Mindestlohn vor — bei vollständiger Einhaltung schrumpft die Lücke auf rund **7 %**. In der Praxis wird das nicht flächendeckend kontrolliert. Die Ergebnisse im Detail:

| Kostenkomponente | PL auf DE-Strecken | PL auf DE (Mindestlohn) | DE auf DE-Strecken |
| --- | --- | --- | --- |
| Fahrer | €10,49 | €16,03 | €24,54 |
| Kraftstoff | €52,20 | €52,20 | €52,20 |
| Maut | €38,90 | €38,90 | €38,90 |
| **Gesamt** | **€107,59** | **€113,13** | **€121,56** |
| **Abstand zu DE** | **−11,5 %** | **−6,9 %** | — |

*Alle Angaben in €/100 km, 5-Achs-Lkw ≥ 12 t, Euro V, Mai 2026. Vollständige Methodik im Appendix.*

## Eine Interpretation

Aus den Daten sieht man, dass ein realer Kostenvorteil polnischer Spediteure auf deutschen Strecken besteht — aber dieser wird kleiner. Polnische Löhne sind zwischen 2018 und 2022 um rund 37 % gestiegen, ostdeutsche um 17 %. Der Lohnabstand lag 2018 bei etwa 2,7:1 und liegt heute bei 2,3:1 — polnische Fahrer verdienten 2018 gut ein Drittel so viel wie ostdeutsche, heute knapp die Hälfte. Die Richtung stimmt, auch wenn die Lücke real bleibt.

Noch auffälliger ist aber, wie sich die Kostenstruktur insgesamt verändert hat:

| Kostenkomponente (Deutschland) | 2018 | 2026 | Veränderung |
| --- | --- | --- | --- |
| Maut | €15,60 | €38,90 | **+149 %** |
| Kraftstoff | €33,71 | €52,20 | +55 % |
| Fahrer (Ost-DE, Ø-Lohn) | €20,97 | €24,54 | +17 % |

Die Maut hat sich fast verdreifacht — größtenteils durch den CO₂-Aufschlag auf die Lkw-Maut, der ab Dezember 2023 gilt. Kraftstoff und Maut machen damit heute den weitaus größten Teil der Gesamtkosten aus, und dieser Block trifft deutsche wie polnische Spediteure auf deutschen Strecken gleichermaßen.

Das verschiebt die eigentliche Wettbewerbsfrage: Nicht mehr wer die günstigeren Fahrerlöhne hat, sondern wer am besten mit steigenden Energie- und CO₂-Kosten umgehen kann, wird den Kostendruck der nächsten Jahre bestimmen. Konkret dreht sich das um die Frage, wann Elektro- oder Wasserstoff-Lkw gegenüber Diesel wirtschaftlich werden. Das ist eine andere politische Frage als Grenzschutz — und eine, bei der ein fairer Wettbewerb eher durch Unterstützung beim Technologiewechsel als durch Marktzugangsschranken gesichert wird.

## Technische Details

Alle Angaben berechnet für einen standardisierten 5-Achs-Lkw ≥ 12 t (Mercedes Actros-Äquivalent), Emissionsklasse Euro V, 100 km auf der Autobahn.

| Komponente | Quelle | Zeitraum |
| --- | --- | --- |
| Kraftstoff | EU Weekly Oil Bulletin (ec.europa.eu), Blatt *Preise mit Steuern* | Woche vom 11.05.2026 |
| Fahrerlöhne 2026 | Eurostat SES `EARN_SES22_RHR`, durchschnittliche Stundenverdienste, alle Branchen | 2022 (aktuellste verfügbare Daten) |
| Fahrerlöhne 2018 | Eurostat SES `EARN_SES18_RHR`, durchschnittliche Stundenverdienste, alle Branchen | 2018 |
| Deutsche Maut | BMVI *Mautsätze für mautpflichtige Lkw 2024/2025*, CO₂-Klasse EK1, Euro V, 5+ Achsen | ab Juli 2024 |
| Polnische Maut | Ministerstwo Finansów, *Mautsätze A+S-Straßen*, ≥ 12 t, mind. EURO 5 | ab 01.02.2026 |
| Wechselkurse | EZB SDMX Daily Rate API | 12.05.2026 |
| Reifen | Marktpreise, 295/60 R22.5, 10 Reifen / 120.000 km | Schätzung 2025 |

Fahrerkosten setzen 1,25 h pro 100 km voraus (Reisegeschwindigkeit 80 km/h). Deutsche SES-Daten verwenden den Mittelwert von sechs ostdeutschen NUTS-1-Regionen (DE3, DE4, DE8, DED, DEE, DEG). Polnische SES-Daten verwenden den Mittelwert von sieben NUTS-1-Makroregionen. Das Mindestlohn-Szenario wendet €12,82/h an (gesetzlicher Mindestlohn Deutschland, 2025).

### Kostenentwicklung 2018 — 2026 auf deutschen Strecken (SES-basiert)

Fahrerkosten für beide Jahre aus der Eurostat Structure of Earnings Survey (SES), nicht aus Mindestlöhnen. Für Deutschland: Mittelwert der 6 ostdeutschen NUTS-1-Regionen (SES 2018: €16,77/h → €20,97/100 km; SES 2022: €19,63/h → €24,54/100 km). Für Polen: Mittelwert der 7 NUTS-1-Makroregionen (SES 2018: €6,12/h → €7,65/100 km; SES 2022: €8,39/h → €10,49/100 km). Kraftstoffpreise aus dem EU Weekly Oil Bulletin (Juli 2018 bzw. Mai 2026).

| Kostenkomponente | PL auf DE 2018 | PL auf DE 2026 | DE auf DE 2018 | DE auf DE 2026 |
| --- | --- | --- | --- | --- |
| Fahrer (SES) | €7,65 | €10,49 | €20,97 | €24,54 |
| Kraftstoff | €33,71 | €52,20 | €33,71 | €52,20 |
| Maut | €15,60 | €38,90 | €15,60 | €38,90 |
| Reifen | €5,67 | €6,00 | €5,29 | €5,92 |
| **Gesamt** | **€62,63** | **€107,59** | **€75,57** | **€121,56** |
| **Abstand zu DE** | **−17,1 %** | **−11,5 %** | — | — |

### Aktualisierung 2026: alle Szenarien (eigene Berechnung)

| Kostenkomponente | PL auf PL-Strecken | PL auf DE-Strecken | PL auf DE (Mindestlohn) | DE auf DE-Strecken |
| --- | --- | --- | --- | --- |
| Fahrer | €10,49 | €10,49 | €16,03 | €24,54 |
| Kraftstoff | €43,02 | €52,20 | €52,20 | €52,20 |
| Maut | €13,19 | €38,90 | €38,90 | €38,90 |
| Reifen | €6,00 | €6,00 | €6,00 | €5,92 |
| **Gesamt** | **€72,70** | **€107,59** | **€113,13** | **€121,56** |
| **Abstand zu DE** | — | **−11,5 %** | **−6,9 %** | — |

Wechselkurse (EZB, 15.05.2026): 1 EUR = 4,2465 PLN.
