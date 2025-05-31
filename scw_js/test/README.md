# Tests für das scw_js Projekt

Dieses Projekt enthält umfassende Tests für die `readhandler.js` Funktion mit Vitest.

## Installation

```bash
npm install
```

## Tests ausführen

### Einmalig alle Tests ausführen
```bash
npm run test:run
```

### Tests im Watch-Modus ausführen
```bash
npm test
```

### Tests mit Watch-Modus
```bash
npm run test:watch
```

## Teststruktur

### 1. `test/readhandler.test.js`
Haupttests für die `handle` Funktion:
- **Parameter-Validierung**: Tests für fehlende oder ungültige Parameter
- **Contract-Interaktion**: Tests für verschiedene Blockchain-Szenarien
- **Umgebungsvariablen**: Tests für fehlende Konfiguration

### 2. `test/utilities.test.js`
Tests für Hilfsfunktionen:
- **URL-Validierung**: Tests für sichere URL-Verarbeitung
- **Token-Existenz**: Tests für NFT-Existenzprüfung
- **Token-Update**: Tests für Metadaten-Aktualisierung

### 3. `test/integration.test.js`
Integrationstests:
- **Image Service**: Tests für Bildgenerierung und Upload
- **Metadaten-Abruf**: Tests für JSON-Metadaten-Verarbeitung
- **BigInt-Handling**: Tests für Blockchain-Datentypen

## Test-Coverage

Die Tests decken folgende Szenarien ab:

### Erfolgreiche Fälle
- ✅ Vollständige NFT-Aktualisierung mit gültigen Parametern
- ✅ Korrekte Token-Existenzprüfung
- ✅ Erfolgreiche Metadaten-Generierung

### Fehlerfälle
- ❌ Fehlende `prompt` Parameter
- ❌ Fehlende `tokenId` Parameter
- ❌ Nicht existierende Tokens
- ❌ Bereits aktualisierte NFTs
- ❌ Fehlende Umgebungsvariablen
- ❌ Netzwerkfehler bei der Bildgenerierung

### Sicherheit
- 🔒 URL-Validierung gegen vertrauenswürdige Domains
- 🔒 Eingabe-Sanitization
- 🔒 Error-Handling

## Technische Details

### Mocking
Das Projekt verwendet umfassende Mocks für:
- `viem` Blockchain-Library
- `image_service.js` Bildgenerierung
- Externe Fetch-Requests
- Smart Contract-Interaktionen

### Test-Umgebung
- **Framework**: Vitest
- **Umgebung**: Node.js
- **Coverage**: HTML + JSON Reports

## Konfiguration

Die Tests verwenden folgende Konfigurationsdateien:
- `vitest.config.js` - Vitest-Konfiguration
- `.env.test.example` - Beispiel für Test-Umgebungsvariablen

## Befehle im Detail

```bash
# Alle Tests mit Coverage
npm run test:run

# Tests im Watch-Modus für Entwicklung
npm test

# Tests mit UI (falls installiert)
npm run test:ui
```

## Troubleshooting

### Port-Konflikte
Falls Port 8080 bereits belegt ist, werden die Tests trotzdem ausgeführt, da der Scaleway-Server in der Test-Umgebung deaktiviert ist.

### Umgebungsvariablen
Stellen Sie sicher, dass `NFT_WALLET_PRIVATE_KEY` in der Test-Umgebung gesetzt ist (wird automatisch gemockt).

### Abhängigkeiten
Alle externen Abhängigkeiten werden gemockt, sodass keine echten Blockchain- oder API-Calls stattfinden.
