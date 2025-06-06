# GenImNFTv3 Upgrade mit Hardhat Ignition

Diese Anleitung beschreibt, wie man einen bestehenden GenImNFTv2 Contract mit Hardhat Ignition auf GenImNFTv3 upgradet.

## Übersicht

GenImNFTv3 erweitert GenImNFTv2 um einfache Privacy-Features:
- `isListed` Flag pro Token für öffentliche Sichtbarkeit
- Batch-Operationen für Privacy-Einstellungen  
- Backward-kompatible API
- Automatische Migration bestehender Tokens

## Voraussetzungen

1. **Bestehender GenImNFTv2 Proxy Contract**: Du musst bereits einen GenImNFTv2 Contract deployed haben
2. **Owner-Rechte**: Du musst der Owner des Proxy Contracts sein
3. **Netzwerk-Zugang**: Konfigurierter Zugang zum entsprechenden Netzwerk (z.B. Sepolia)
4. **Umgebungsvariablen**: ALCHEMY_API_KEY und SEPOLIA_PRIVATE_KEY müssen gesetzt sein

## Upgrade-Prozess

### Schritt 1: Vorbereitung

```bash
# Stelle sicher, dass du im eth/ Verzeichnis bist
cd eth/

# Installiere Dependencies
npm install

# Setze Umgebungsvariablen
npx hardhat vars set ALCHEMY_API_KEY
npx hardhat vars set SEPOLIA_PRIVATE_KEY
```

### Schritt 2: Contract kompilieren

```bash
# Kompiliere alle Contracts
npx hardhat compile
```

### Schritt 3: Tests ausführen (optional aber empfohlen)

```bash
# Führe GenImNFTv3 Tests aus
npx hardhat test test/GenImNFTv3.ts

# Führe Upgrade-Tests aus  
npx hardhat test test/GenImNFTv3_Upgrade.ts
```

### Schritt 4: Upgrade durchführen

```bash
# Upgrade mit Ignition
# Ersetze DEINE_PROXY_ADRESSE mit der tatsächlichen Adresse deines GenImNFTv2 Proxy
npx hardhat ignition deploy ./ignition/modules/GenImNFTv3_Upgrade.ts \
  --network sepolia \
  --parameters '{"proxyAddress": "DEINE_PROXY_ADRESSE"}'
```

**Beispiel:**
```bash
npx hardhat ignition deploy ./ignition/modules/GenImNFTv3_Upgrade.ts \
  --network sepolia \
  --parameters '{"proxyAddress": "0x1234567890123456789012345678901234567890"}'
```

### Schritt 5: Upgrade validieren

```bash
# Validiere das Upgrade
npx hardhat ignition deploy ./ignition/modules/GenImNFTv3_Validation.ts \
  --network sepolia \
  --parameters '{"proxyAddress": "DEINE_PROXY_ADRESSE"}'
```

## Alternative Deployment-Optionen

### Frisches GenImNFTv3 Deployment (nicht Upgrade)

Falls du einen komplett neuen GenImNFTv3 Contract deployen möchtest:

```bash
npx hardhat ignition deploy ./ignition/modules/GenImNFTv3.ts --network sepolia
```

### Separate Migration (falls nötig)

Falls die Migration nicht automatisch funktioniert hat:

```bash
npx hardhat ignition deploy ./ignition/modules/GenImNFTv3_Migration.ts \
  --network sepolia \
  --parameters '{"proxyAddress": "DEINE_PROXY_ADRESSE"}'
```

## Was passiert beim Upgrade?

### 1. Implementation Deployment
- Neuer GenImNFTv3 Contract wird deployed
- Erhält neue Implementierungsadresse

### 2. Proxy Upgrade
- Bestehender Proxy wird auf neue Implementation umgestellt
- Alle bestehenden Daten bleiben erhalten
- Contract-Adresse bleibt unverändert

### 3. Automatische Migration
- Alle bestehenden Tokens werden als öffentlich (`isListed = true`) markiert
- `TokenListingChanged` Events werden für alle Tokens emitted
- Opt-out System: Nutzer können später auf privat umstellen

### 4. Validierung
- Contract-Metadata wird überprüft (Name: "GenImNFTv3", Symbol: "GENIMGv3")
- Bestehende Daten werden validiert
- Neue Privacy-Features werden getestet

## Upgrade-Sicherheit

### Storage Layout Kompatibilität
```solidity
// GenImNFTv2 Storage (unverändert)
uint256 private _nextTokenId;                    // Slot 0
uint256 public mintPrice;                        // Slot 1  
mapping(uint256 => address) private _authorizedImageUpdaters; // Slot 2
mapping(uint256 => bool) private _imageUpdated;  // Slot 3

// GenImNFTv3 Erweiterungen
mapping(uint256 => bool) private _isListed;     // Slot 4

uint256[49] private __gap;                       // Slots 5-53 (angepasst von 50)
```

### Backward Compatibility
- Alle bestehenden Funktionen bleiben unverändert
- Neue `safeMint(uri, isListed)` Überladung verfügbar
- Alte `safeMint(uri)` funktioniert weiterhin (Standard: öffentlich)
- Bestehende Events bleiben unverändert

## Neue Features nach Upgrade

### Privacy-Funktionen
```solidity
// Token-Sichtbarkeit setzen (nur Owner)
function setTokenListed(uint256 tokenId, bool isListed) external

// Sichtbarkeit abfragen  
function isTokenListed(uint256 tokenId) external view returns (bool)

// Batch-Operationen
function setMultipleTokensListed(uint256[] calldata tokenIds, bool isListed) external

// Öffentliche Tokens eines Owners abrufen
function getPublicTokensOfOwner(address owner) external view returns (uint256[] memory)
```

### Events
```solidity
event TokenListingChanged(uint256 indexed tokenId, bool isListed);
```

## Troubleshooting

### Häufige Probleme

**"OwnableUnauthorizedAccount"**
- Du bist nicht der Owner des Contracts
- Verwende die richtige Wallet/Private Key

**"Invalid proxy address"**
- Überprüfe die Proxy-Adresse
- Stelle sicher, dass es ein GenImNFTv2 Contract ist

**"Storage collision"**
- Storage Layout ist inkompatibel
- Überprüfe Contract-Versionen

### Debugging

```bash
# Detaillierte Logs anzeigen
npx hardhat ignition deploy ./ignition/modules/GenImNFTv3_Upgrade.ts \
  --network sepolia \
  --parameters '{"proxyAddress": "DEINE_PROXY_ADRESSE"}' \
  --verbose

# Deployment-Status überprüfen
npx hardhat ignition status GenImNFTv3UpgradeModule --network sepolia
```

### Rollback (falls nötig)

Falls etwas schiefgeht, kannst du theoretisch zurück zur alten Implementation:

```bash
# Deploye die alte GenImNFTv2 Implementation erneut
npx hardhat ignition deploy ./ignition/modules/GenImNFTv2_Upgrade.ts \
  --network sepolia \
  --parameters '{"proxyAddress": "DEINE_PROXY_ADRESSE"}'
```

**⚠️ Warnung:** Ein Rollback nach der Migration kann zu Datenverlust führen, da die neuen Privacy-Einstellungen verloren gehen.

## Post-Upgrade Schritte

### 1. Frontend aktualisieren
- Neue GenImNFTv3 ABI verwenden
- Privacy-Controls implementieren
- Public/Private Filtering in Gallery

### 2. Dokumentation
- API-Dokumentation aktualisieren
- Nutzer über neue Features informieren
- Privacy-Features erklären

### 3. Testing
- Umfassende Tests in Testnet
- Privacy-Funktionalität validieren
- Frontend-Integration testen

## Kontakt & Support

Bei Problemen oder Fragen:
1. Überprüfe die Logs und Error-Messages
2. Teste zuerst auf Sepolia Testnet
3. Validiere Storage Layout Kompatibilität
4. Führe umfassende Tests durch
