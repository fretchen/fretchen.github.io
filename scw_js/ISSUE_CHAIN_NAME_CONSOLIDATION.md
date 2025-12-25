# GitHub Issue: Chain-Namen Konsolidierung

## Titel

`refactor: Consolidate chain name handling across codebase`

## Labels

- `enhancement`
- `tech-debt`
- `x402`

---

## Problem

Es existieren **drei verschiedene Namenskonventionen** für Chain-Namen im Codebase:

| Quelle                       | Optimism Mainnet     | Optimism Sepolia     |
| ---------------------------- | -------------------- | -------------------- |
| **viem/chains** (Bibliothek) | `"OP Mainnet"`       | `"OP Sepolia"`       |
| **getUSDCConfig()**          | `"Optimism Mainnet"` | `"Optimism Sepolia"` |
| **Einige Tests**             | `"Optimism"`         | `"Optimism Sepolia"` |

### Betroffene Stellen

#### Produktion

- `genimg_x402_token.js` Zeile 503: `viemChain.name` → `"OP Mainnet"` / `"OP Sepolia"`
- `genimg_x402_token.js` Zeile 443: `usdcConfig.name` → `"Optimism Mainnet"` / `"Optimism Sepolia"`
- `genimg_x402_token.js` Zeile 536: `viemChain.name` wird an `preFlightChecks()` übergeben

#### Konfiguration

- `getChain.js` `getUSDCConfig()`: Eigene Namen definiert

#### Tests

- `preflight_checks.test.js`: Erwartet teilweise `"Optimism Sepolia"`, teilweise `"Optimism"`
- `setup.ts`: viem/chains Mock mit echten viem-Namen

---

## Auswirkungen

1. **Inkonsistente Fehlermeldungen**: Je nach Code-Pfad erscheinen unterschiedliche Chain-Namen
2. **Fragile Tests**: Mock-Namen müssen mit Produktionscode übereinstimmen
3. **Wartbarkeit**: Änderungen an einer Stelle brechen andere

---

## Vorgeschlagene Lösung: Option D - getUSDCConfig als Single Source of Truth

### Begründung

1. `getUSDCConfig()` ist bereits zentral und enthält alle relevanten Informationen
2. Die Namen dort (`"Optimism Sepolia"`) sind leserlicher als viem-Namen (`"OP Sepolia"`)
3. viem-Namen könnten sich in Library-Updates ändern
4. Minimale Änderungen erforderlich

### Konkrete Änderungen

1. **In `genimg_x402_token.js`:**
   - `viemChain.name` durch `usdcConfig.name` ersetzen (Zeilen 503, 536)
   - `usdcConfig` ist bereits verfügbar im selben Scope

2. **In Tests:**
   - Alle erwarteten Chain-Namen auf `getUSDCConfig()`-Werte vereinheitlichen
   - `"Optimism Mainnet"` und `"Optimism Sepolia"` als Standard

3. **In `setup.ts`:**
   - viem/chains Mock-Namen sind dann irrelevant für Chain-Namen-Tests
   - Können auf echte viem-Namen bleiben für andere Funktionalität

### Alternative Optionen

| Option   | Beschreibung                 | Pro                | Contra                        |
| -------- | ---------------------------- | ------------------ | ----------------------------- |
| **A**    | Alle auf viem-Namen          | Konsistenz mit Lib | Kurze Namen, Library-abhängig |
| **B**    | Alle auf lesbare Namen       | Benutzerfreundlich | Abweichung von viem           |
| **C**    | Neue `getChainDisplayName()` | Klare Trennung     | Mehr Abstraktion              |
| **D** ✅ | `getUSDCConfig()` als Source | Bereits vorhanden  | -                             |

---

## Acceptance Criteria

- [ ] Alle Chain-Namen in Fehlermeldungen konsistent
- [ ] Alle Tests verwenden dieselbe Namenskonvention
- [ ] Dokumentation aktualisiert
- [ ] Keine Breaking Changes für API-Consumer

---

## Betroffene Dateien

- `scw_js/getChain.js`
- `scw_js/genimg_x402_token.js`
- `scw_js/test/preflight_checks.test.js`
- `scw_js/test/setup.ts`
- `scw_js/test/genimg_x402_token.test.js`

---

## Priorität

Medium - Funktionalität nicht beeinträchtigt, aber Wartbarkeit und Konsistenz verbessern
