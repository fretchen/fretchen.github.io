# Implementierungsplan: Box-Dimension-Post (Bretagne/GB)

## Ziel

Ein Blogpost, der Kindern (und Erwachsenen) das Konzept der Box-Counting-Dimension
zeigt: erst am einfachen Beispiel (Linie, Kreis), dann spielerisch an echten
Küsten/Seen. Zwei interaktive Bausteine, ein gemeinsamer Kern.

## Content-Gliederung des Posts

1. **Einstieg**: Warum ist eine Küste "länger", je genauer man misst?
   (Kurzer Verweis auf Mandelbrot, "How Long Is the Coast of Britain?", 1967)
2. **Konzept-Widget**: Linie/Kreis/gezackte Kurve + Gitter-Regler + Log-Log-Plot
   → Kernaussage: d = log N(ε) / log(1/ε), Linie und Kreis beide d=1
3. **Text-Brücke**: reale Küsten sind keine glatten Kurven → d wird > 1
   - Westküste Großbritannien: D ≈ 1,25 (Mandelbrot/Richardson)
   - grobe Faustregel: sandige/glatte Küsten nahe D≈1, felsige Küsten D≈1,3+
4. **Karten-Spiel**: Bretagne (felsig) vs. Kontrastregion (glatter) vs. optional
   ein See, mit Gitter-Overlay direkt auf der Karte
5. **Abschluss**: eigene Beobachtung/Ergebnis der Leser:innen einordnen

## Architekturentscheidung

- **Kartenbibliothek**: Leaflet.js über `react-leaflet` (Begründung: KISS,
  siehe Chat — MapLibre GL wäre für diesen Zweck Overkill)
- **Tiles**: CARTO Positron (kostenlos, kein API-Key, `© OpenStreetMap contributors`
  Attribution einbauen)
- **Geodaten**: GSHHG (Global Self-consistent, Hierarchical, High-resolution
  Geography Database) — public domain, exakt der Datensatz aus der
  akademischen Coastline-Dimension-Literatur, enthält auch Seen (Level 2)
- **Gemeinsamer Kern**: eine einzige Box-Counting-Utility (reine Funktion,
  kein React), die sowohl vom Canvas-Demo-Widget als auch vom Leaflet-Overlay
  genutzt wird

## Komponentenstruktur (Vorschlag)

```
website/components/box-dimension/
  boxCounting.ts        # reine Logik: countIntersectingCells(points, cellSizePx)
  ConceptDemo.tsx        # Canvas-Widget: Linie/Kreis/Fraktal + Slider + Log-Log-Plot
  LogLogPlot.tsx          # gemeinsame Plot-Komponente (von beiden genutzt)
  CoastPlayground.tsx     # Leaflet-Karte + Gitter-Overlay + Regionsauswahl
  GridOverlay.ts           # custom L.Layer, zeichnet Gitter via latLngToContainerPoint
  regions.ts               # Liste { id, label, geojsonPath, center, zoom }

website/public/data/coastlines/
  bretagne.geojson
  contrast-region.geojson   # z.B. glattere Küste zum Vergleich
  lake-example.geojson      # optional
```

## Datenaufbereitung (einmalig, vor dem Coden)

1. GSHHG herunterladen (volle Auflösung reicht als Quelle)
2. Mit `mapshaper` oder `ogr2ogr` auf Bounding Box zuschneiden:
   - Bretagne (grob: 47.2–48.9°N, -5.2–-1.0°E)
   - Kontrastregion (z.B. glatterer Küstenabschnitt zum Vergleich)
3. Auf vernünftige Punktdichte vereinfachen (Douglas-Peucker), damit das
   Gitter-Overlay im Browser performant bleibt — nicht die volle GSHHG-Auflösung
   direkt ausliefern
4. Nach GeoJSON exportieren, Dateigröße prüfen (Ziel: einige hundert KB pro Region)
5. Dateien nach `website/public/data/coastlines/` legen

## Implementierungsschritte

- [ ] **Schritt 1**: `boxCounting.ts` aus dem bestehenden Demo-Code extrahieren
      (reine Funktion, unabhängig von Canvas/Leaflet)
- [ ] **Schritt 2**: `ConceptDemo.tsx` als React-Komponente bauen
      (Canvas-Ref + useEffect statt globaler DOM-Listener, sonst 1:1 aus der Demo)
- [ ] **Schritt 3**: `LogLogPlot.tsx` als eigenständige, wiederverwendbare
      Komponente auslagern
- [ ] **Schritt 4**: GSHHG-Daten besorgen, zuschneiden, vereinfachen (siehe oben)
- [ ] **Schritt 5**: `CoastPlayground.tsx` — Leaflet-Karte mit TileLayer (CARTO)
      + GeoJSON-Layer für die gewählte Region
- [ ] **Schritt 6**: `GridOverlay.ts` — custom Leaflet-Layer, zeichnet Gitter neu
      bei `moveend`/`zoomend`, zählt Schnittzellen, meldet N(ε) nach oben
- [ ] **Schritt 7**: Regionsauswahl (Dropdown/Buttons) + Slider für Zellgröße
      (in km, intern in Pixel umgerechnet je nach Zoomstufe)
- [ ] **Schritt 8**: `CoastPlayground` an `LogLogPlot` anschließen (gleiche
      Komponente wie im Concept-Widget)
- [ ] **Schritt 9**: Attribution-Zeile einbauen (`© OpenStreetMap contributors`,
      GSHHG-Quellenangabe)
- [ ] **Schritt 10**: Post-Text schreiben, Widgets einbetten, gegenlesen

## Offene Entscheidungen (vor dem Start klären)

- Welche zweite Region als Kontrast zur Bretagne? (glattere Küste oder See)
- Soll der Slider in "km Kantenlänge" oder in "Anzahl Kästchen" gedacht werden?
- Reicht eine feste Auswahl an Regionen, oder soll perspektivisch doch eine
  Overpass-Live-Abfrage ergänzt werden (spätere Ausbaustufe, nicht für v1)?

## Lizenz-/Attributionshinweise

- OSM-Kartendaten (über CARTO-Tiles): ODbL, Attribution `© OpenStreetMap
  contributors` ist Pflicht und muss sichtbar auf der Karte stehen
- GSHHG: public domain (Quellen WVS/WDBII), Software/Daten-Distribution
  unter LGPL seit Version 2.2.2 — Quellenangabe im Post trotzdem fair
