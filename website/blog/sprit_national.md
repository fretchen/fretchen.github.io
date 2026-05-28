---
publishing_date: 2026-05-10
title: Würde mehr Protektionismus Spediteuren helfen ?
category: "other"
description: Ich untersuche, wie ein rationaler Unternehmer abstimmen muss, wenn er entscheidet, ob er nationalistische und protektionistische Politik befürwortet.
tokenID: 123
---
 
Vor Kurzem diskutierte ich mit einer Person aus Sachsen über den Irankrieg und den massiven Anstieg der Kraftstoffpreise, den er ausgelöst hatte. Interessanterweise, ging es diesmal um die ziemlich konkrete Frage, ob die Deutsche Regierung einheimische Spediteure schützen sollte, da die Regierungen in osteuropäischen Nachbarländern ihre Unternehmen massiv stützen würden.

## Was sind die Kosten für Spediteure auf deutschen Strecken?

Das brachte mich dazu ein wenig über die Realität der Spediteure zu lernen. Der erste zentrale Punkt ist, dass das Speditionsgeschäft offensichtlich mit enormen Kostendruck zu kämpfen hat. Es ist eine dieser Branchen in denen die Margen extrem dünn sind und es somit viel um Kostenkontrolle geht. 

Somit war der nächste Schritt, mehr über die Kosten der Spediteure in Deutschland und der Nachbarländer zu erfahren. Wirklich hilfreich fand ich da die Herangehensweise aus der Studie von [Kotsios & Folinas](https://dl.acm.org/doi/10.4018/IJAL.2020010102) aus dem Jahr 2020, die die Betriebskosten pro 100 km für einen standardisierten Fünfachs-Lkw auf europäischen Inlandsstrecken gemessen hat. Die Kosten für die grossen Kostentreiber — Fahrer, Kraftstoff und Maut — werden in den verschiedenen Ländern untersucht und verglichen. Diese Studie habe ich dann, wie im Anhang beschrieben, auf aktuelle Zahlen für Deutschland und Polen aktualisiert. Grob zusammengefasst findet man aktuell, dass die Transportkosten für polnische Spediteure auf polnischen Strecken sind alsetwa 31 % geringer sind als für Deutsche Spediteure in Deutschland.

Nun ist die eigentliche Frage, aber nach den Kosten auf deutschen Strecken und hier gilt die die Maut gleichermaßen für alle in Deutschland fahrenden Fahrzeuge — in- wie ausländische. Die Kraftstoffpreise richten sich ebenfalls nach der lokalen Zapfsäule. Was jedoch am Herkunftsland verankert bleibt, ist der Lohn des Fahrers und der ist für polnische Spediteure deutlich niedriger als für deutsche Spediteure.

Das Ergebnis ist ein Kostenvorteil polnischer Spediteure von rund **12 %** auf deutschen Strecken bei tatsächlich gezahlten Löhnen. Bei vollständiger Einhaltung des deutschen Mindestlohns (Mindestlohn) schrumpft die Lücke auf rund **7 %**. Die Ergebnisse im Detail:

| Kostenkomponente | PL auf DE-Strecken | PL auf DE (Mindestlohn) | DE auf DE-Strecken |
| --- | --- | --- | --- |
| Fahrer | €10,49 | €16,03 | €24,54 |
| Kraftstoff | €52,20 | €52,20 | €52,20 |
| Maut | €38,90 | €38,90 | €38,90 |
| **Gesamt** | **€107,59** | **€113,13** | **€121,56** |
| **Abstand zu DE** | **−11,5 %** | **−6,9 %** | — |

*Alle Angaben in €/100 km, 5-Achs-Lkw ≥ 12 t, Euro V, Mai 2026. Vollständige Methodik im Appendix.*

## Eine Interpretation

Aus den Daten sieht man, dass ein realer Kostenachteil aufgrund der Lohnunterschiede besteht, aber diese Lücke wird immer geringer. Weiterhin ist auffällig, dass der Lohn mittlerweile bei weitem nicht mehr der grösste Kostenfaktor ist, die Maut und Kraftstoff machen den Grossteil der Kosten aus. Und da beide über die nächsten Jahre vorhersehbar steigen werden scheint es wahrscheinlich, dass der Kostendruck sich eher darüber unterscheidet wer am Besten mit diesen Kosten umgehen kann, als über die Lohnkosten. Und dann dreht sich die Frage nicht mehr wirklich um Lohnkosten, sondern darum wie sich in den nächsten Jahren vermutlich um die Wettbewerbsfähigkeit von Wasserstoff- oder Elektro-Lkw gegenüber Diesel-Lkw entwickeln wird. Aber das Thema möchte ich für einen möglichen zukünftigen Beitrag aufheben, um hier den Rahmen nicht komplett zu sprengen.

## Appendix

Alle Angaben berechnet für einen standardisierten 5-Achs-Lkw ≥ 12 t (Mercedes Actros-Äquivalent), Emissionsklasse Euro V, 100 km auf der Autobahn.

| Komponente | Quelle | Zeitraum |
| --- | --- | --- |
| Kraftstoff | EU Weekly Oil Bulletin (ec.europa.eu), Blatt *Preise mit Steuern* | Woche vom 11.05.2026 |
| Fahrerlöhne | Eurostat SES `EARN_SES22_RHR`, durchschnittliche Stundenverdienste, alle Branchen | 2022 (aktuellste verfügbare Daten) |
| Deutsche Maut | BMVI *Mautsätze für mautpflichtige Lkw 2024/2025*, CO₂-Klasse EK1, Euro V, 5+ Achsen | ab Juli 2024 |
| Polnische Maut | Ministerstwo Finansów, *Mautsätze A+S-Straßen*, ≥ 12 t, mind. EURO 5 | ab 01.02.2026 |
| Tschechische Maut | myto.gov.cz, Autobahn, ≥ 12 t, ≥ 5 Achsen, Euro V/EEV, CO₂-Klasse 1 | ab 01.01.2026 |
| Wechselkurse | EZB SDMX Daily Rate API | 12.05.2026 |
| Reifen | Marktpreise, 295/60 R22.5, 10 Reifen / 120.000 km | Schätzung 2025 |

Fahrerkosten setzen 1,25 h pro 100 km voraus (Reisegeschwindigkeit 80 km/h). Deutsche SES-Daten verwenden den Mittelwert von sechs ostdeutschen NUTS-1-Regionen (DE3, DE4, DE8, DED, DEE, DEG). Polnische SES-Daten verwenden den Mittelwert von sieben NUTS-1-Makroregionen. Das Mindestlohn-Szenario wendet €12,82/h an (gesetzlicher Mindestlohn Deutschland, 2025).

### Ausgangsbasis 2018 (Kotsios & Folinas 2020)

Die Studie von Kotsios & Folinas (2020) misst Kosten pro 100 km auf Inlandsstrecken. Für den Wettbewerb auf deutschen Straßen sind Maut und Kraftstoff streckenbezogene Kosten (für alle Betreiber gleich), während die Fahrerlöhne im Herkunftsland verankert bleiben.

| Kostenkomponente | PL auf PL-Strecken | PL auf DE-Strecken | DE auf DE-Strecken |
| --- | --- | --- | --- |
| Fahrer (Mindestlohnbasis) | €3,96 | €3,96* | €11,05 |
| Kraftstoff | €29,95 | ~€34,45 | €34,45 |
| Maut | €6,27 | €15,60 | €15,60 |
| Reifen | €5,67 | €5,67 | €5,29 |
| **Gesamt** | **€45,85** | **~€59,68** | **€66,38** |

*Ohne Durchsetzung der Entsenderegel. Quelle: Kotsios & Folinas (2020), eigene Erweiterung.

### Aktualisierung 2026 (eigene Berechnung)

| Kostenkomponente | PL auf PL-Strecken | PL auf DE-Strecken | PL auf DE (Mindestlohn) | DE auf DE-Strecken |
| --- | --- | --- | --- | --- |
| Fahrer | €10,49 | €10,49 | €16,03 | €24,54 |
| Kraftstoff | €43,02 | €52,20 | €52,20 | €52,20 |
| Maut | €13,37 | €38,90 | €38,90 | €38,90 |
| Reifen | €6,00 | €6,00 | €6,00 | €5,92 |
| **Gesamt** | **€72,88** | **€107,59** | **€113,13** | **€121,56** |
| **Abstand zu DE** | — | **−11,5 %** | **−6,9 %** | — |

Wechselkurse (EZB, 12.05.2026): 1 EUR ≈ 4,19 PLN.

### Lohndaten: genaue Zahlen (2025)

- Polnischer Mindestlohn 2025: 4.666 PLN brutto/Monat (~€1.085/Monat zum aktuellen Wechselkurs), Stundenlohn 30,50 PLN (~€7,09/h).
- Deutscher Mindestlohn 2025: €12,82/h, ab Januar 2026 steigend auf €13,90/h.
- Verhältnis 2025: ca. 1:1,8, verglichen mit 1:2,8 im Jahr 2018.
- Gemessen als Anteil am nationalen Medianlohn hat Polen (59,1 %) einen höheren relativen Mindestlohn als Deutschland — ein Hinweis darauf, dass die strukturelle Harmonisierung voranschreitet, auch wenn die absolute Kaufkraftlücke noch erheblich ist.
- Die EU-Mindestlohnrichtlinie wurde vom EuGH im November 2025 grundsätzlich bestätigt; die nationale Umsetzung läuft.

Quelle: Parakar (2025); Hans-Böckler-Stiftung / WSI (2026).