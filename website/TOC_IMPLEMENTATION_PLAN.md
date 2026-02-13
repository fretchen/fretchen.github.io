# Table of Contents (ToC) Implementation Plan

## Übersicht

Implementierung eines Docusaurus-ähnlichen Table of Contents für Blog-Posts mit:
- Sticky Sidebar rechts (Desktop >1200px)
- Scroll-Spy (aktive Section hervorgehoben)
- Versteckt auf Mobile/Tablet
- Funktioniert für Markdown UND TSX-Posts

---

## Phase 1: Hooks erstellen

### 1.1 `useTableOfContents` Hook

**Datei:** `website/hooks/useTableOfContents.ts`

**Funktion:** Extrahiert Headings (h2, h3) aus dem DOM nach dem Render.

**Anforderungen:**
- [ ] Akzeptiert `RefObject<HTMLElement>` für Content-Container
- [ ] Generiert IDs für Headings ohne ID (slug-basiert)
- [ ] Gibt Array von `{ id: string, text: string, level: number }` zurück
- [ ] Re-extrahiert bei Content-Änderung

**Abhängigkeiten:**
- Keine externen Pakete nötig

---

### 1.2 `useActiveHeading` Hook

**Datei:** `website/hooks/useActiveHeading.ts`

**Funktion:** Scroll-Spy mit Intersection Observer API.

**Anforderungen:**
- [ ] Akzeptiert Array von Heading-IDs
- [ ] Verwendet `IntersectionObserver` mit `rootMargin: '-80px 0px -80% 0px'`
- [ ] Gibt aktive Heading-ID zurück
- [ ] Cleanup bei Unmount

**Abhängigkeiten:**
- Keine externen Pakete nötig

---

## Phase 2: ToC Komponente erstellen

### 2.1 Komponenten-Struktur

**Verzeichnis:** `website/components/TableOfContents/`

```
TableOfContents/
├── index.ts              # Re-export
├── TableOfContents.tsx   # Hauptkomponente
├── TocItem.tsx           # Einzelner Eintrag mit Indent
└── styles.ts             # Panda CSS Styles
```

---

### 2.2 `TableOfContents.tsx`

**Anforderungen:**
- [ ] Props: `contentRef: RefObject<HTMLElement>`, `minHeadings?: number` (default: 2)
- [ ] Verwendet `useTableOfContents` und `useActiveHeading`
- [ ] Rendert nichts wenn `headings.length < minHeadings`
- [ ] Titel: "On this page"
- [ ] `aria-label="Table of contents"` für Accessibility

---

### 2.3 `TocItem.tsx`

**Anforderungen:**
- [ ] Props: `heading: TocItem`, `isActive: boolean`
- [ ] Indent für h3 (level 3)
- [ ] Active-State Styling (linker Border + Farbe)
- [ ] Smooth scroll on click (`scrollIntoView({ behavior: 'smooth' })`)

---

### 2.4 `styles.ts` (Panda CSS)

**Anforderungen:**
- [ ] Container: `position: sticky`, `top: 80px`, `max-height: calc(100vh - 100px)`
- [ ] Versteckt unter 1200px Breakpoint
- [ ] Titel-Styling (klein, uppercase, muted)
- [ ] List ohne Bullets, kompakter Abstand
- [ ] Active-Item: linker Border `2px solid brand`, Font-Weight medium
- [ ] Hover-Effekt für Items
- [ ] h3-Items: `padding-left` für Indent

---

## Phase 3: Types definieren

### 3.1 `TocItem` Interface

**Datei:** `website/types/components.ts` (erweitern)

```typescript
export interface TocItem {
  id: string;
  text: string;
  level: number; // 2 oder 3
}
```

- [ ] Interface zu types/components.ts hinzufügen

---

## Phase 4: Layout-Refactoring

### 4.1 Content-Layout mit CSS Grid

**Datei:** `website/layouts/styles.ts` (erweitern)

**Neue Styles:**
- [ ] `articleLayout`: 3-Spalten Grid (`1fr minmax(0, 720px) 250px`)
- [ ] `articleContent`: Mittlere Spalte
- [ ] `articleSidebar`: Rechte Spalte (ToC)
- [ ] Responsive: 
  - `>1200px`: 3 Spalten
  - `768-1200px`: Content zentriert, kein ToC
  - `<768px`: Full-width

---

### 4.2 Post.tsx Integration

**Datei:** `website/components/Post.tsx`

**Änderungen:**
- [ ] `useRef` für Content-Container hinzufügen
- [ ] Ref an `.e-content` Container übergeben
- [ ] `<TableOfContents contentRef={contentRef} />` in Sidebar rendern
- [ ] Layout-Wrapper mit neuem Grid

**Struktur nach Änderung:**
```tsx
<article className="h-entry">
  <div className={articleLayout}>
    <div /> {/* Linker Spacer */}
    <div className={articleContent}>
      <h1>...</h1>
      <MetadataLine />
      <div className="e-content" ref={contentRef}>
        {/* Content */}
      </div>
      <EndOfArticleSupport />
      <Navigation />
      <Webmentions />
    </div>
    <aside className={articleSidebar}>
      <TableOfContents contentRef={contentRef} />
    </aside>
  </div>
</article>
```

---

## Phase 5: Heading-ID-Generierung

### 5.1 Konsistente Slugs

**Problem:** Markdown-Headings brauchen IDs für Scroll-Navigation.

**Lösung A (empfohlen):** 
- [ ] In `useTableOfContents`: IDs zur Laufzeit generieren falls nicht vorhanden
- [ ] Slug-Funktion: `text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')`

**Alternative B:**
- [ ] rehype-slug Plugin in react-markdown integrieren (komplexer)

---

## Phase 6: Testing

### 6.1 Manuelle Tests

- [ ] Post mit vielen Headings (z.B. `multichain_technical_notes.md`)
- [ ] Post mit wenigen Headings (<2) - ToC sollte nicht erscheinen
- [ ] TSX-Post (z.B. `budget_gridlock_interactive.tsx`)
- [ ] Mobile-Ansicht (<768px) - ToC versteckt
- [ ] Tablet-Ansicht (768-1200px) - ToC versteckt
- [ ] Desktop-Ansicht (>1200px) - ToC sichtbar
- [ ] Scroll-Spy funktioniert korrekt
- [ ] Click auf ToC-Item scrollt zur Section

### 6.2 Edge Cases

- [ ] Post ohne Headings
- [ ] Headings mit Sonderzeichen (Umlaute, Emojis)
- [ ] Sehr lange Heading-Texte
- [ ] Nested Headings (h2 → h3 → h3 → h2)

---

## Phase 7: Feinschliff

### 7.1 Styling-Anpassungen

- [ ] Dark Mode Support prüfen (falls vorhanden)
- [ ] Animation beim Active-Wechsel (optional)
- [ ] ToC Overflow bei sehr vielen Headings (scrollbar)

### 7.2 Performance

- [ ] Intersection Observer Cleanup verifizieren
- [ ] Keine Memory Leaks bei Navigation zwischen Posts

---

## Datei-Checkliste

| Datei | Aktion | Status |
|-------|--------|--------|
| `hooks/useTableOfContents.ts` | Neu erstellen | ✅ |
| `hooks/useActiveHeading.ts` | Neu erstellen | ✅ |
| `components/TableOfContents/index.ts` | Neu erstellen | ✅ |
| `components/TableOfContents/TableOfContents.tsx` | Neu erstellen | ✅ |
| `components/TableOfContents/TocItem.tsx` | Neu erstellen | ✅ |
| `components/TableOfContents/styles.ts` | Neu erstellen | ✅ |
| `types/components.ts` | Erweitern (TocItem) | ✅ (in useTableOfContents.ts) |
| `layouts/styles.ts` | Erweitern (articleLayout) | ✅ |
| `components/Post.tsx` | Refactoring (Grid + ToC) | ✅ |

---

## Geschätzter Zeitaufwand

| Phase | Zeit |
|-------|------|
| Phase 1: Hooks | 45 min |
| Phase 2: Komponente | 60 min |
| Phase 3: Types | 10 min |
| Phase 4: Layout | 45 min |
| Phase 5: Heading-IDs | 20 min |
| Phase 6: Testing | 30 min |
| Phase 7: Feinschliff | 30 min |
| **Gesamt** | **~4 Stunden** |

---

## Abhängigkeiten

Keine neuen npm-Pakete erforderlich. Verwendet:
- React Hooks (useRef, useState, useEffect)
- Intersection Observer API (nativ)
- Panda CSS (bereits installiert)

---

## Rollback-Plan

Falls Probleme auftreten:
1. `Post.tsx` auf vorherige Version zurücksetzen
2. ToC-Komponenten können ohne Side-Effects entfernt werden
3. Layout-Änderungen sind isoliert in neuen CSS-Klassen

---

## Nächste Schritte nach Implementierung

1. **Mobile-ToC (optional):** Collapsible ToC am Anfang des Posts
2. **Progress-Indicator:** Lesefortschritt-Balken
3. **Quantum-Posts:** ToC auch für `/quantum/` Seiten aktivieren
