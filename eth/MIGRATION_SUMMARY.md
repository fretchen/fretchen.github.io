# GenImNFT zu GenImNFTv2 Migration - Zusammenfassung

## Durchgeführte Änderungen

### 1. Smart Contract (GenImNFTv2.sol)

- ✅ Contract-Name von `GenImNFT` zu `GenImNFTv2` geändert
- ✅ Token-Name in der `initialize()` Funktion von "GenImNFT" zu "GenImNFTv2" geändert
- ✅ Token-Symbol von "GENIMG" zu "GENIMGv2" geändert

### 2. Tests (GenImNFTv2.ts)

- ✅ Test-Suite-Name von "GenImNFT" zu "GenImNFTv2" geändert
- ✅ Fixture-Funktion von `deployGenImNFTFixture` zu `deployGenImNFTv2Fixture` umbenannt
- ✅ Alle Contract-Deployment-Referenzen von "GenImNFT" zu "GenImNFTv2" aktualisiert
- ✅ Alle `getContractAt`-Aufrufe von "GenImNFT" zu "GenImNFTv2" aktualisiert
- ✅ Erwartete Token-Namen und -Symbole in Tests entsprechend angepasst
- ✅ Metadaten-Generierung verwendet jetzt "GenImNFTv2" als Prefix

### 3. Ignition Module

- ✅ Veraltetes `GenImNFTv2_BurnableUpgrade.ts` Modul gelöscht
- ✅ Neues `GenImNFTv2.ts` Ignition-Modul erstellt, basierend auf dem GenImNFT.ts Beispiel
- ✅ Proxy-Module-Namen entsprechend angepasst ("GenImNFTv2ProxyModule", "GenImNFTv2Module")

## Validierung

- ✅ Alle Contracts kompilieren erfolgreich
- ✅ Alle 24 Tests in der GenImNFTv2 Test-Suite bestehen
- ✅ Ignition-Modul deployiert erfolgreich im lokalen Hardhat-Netzwerk

## Contract-Features

Das GenImNFTv2 Contract behält alle ursprünglichen Features bei:

- Upgradeable ERC721 NFT mit UUPS Proxy-Pattern
- Öffentliches Minting mit konfigurierbarem Preis
- Image-Update-Funktionalität mit Kompensationssystem
- Token-Burning-Funktionalität
- Vollständige Enumerable-Unterstützung
- URI-Storage für Metadaten

## Deployment-Befehle

Für lokale Tests:

```bash
npx hardhat test test/GenImNFTv2.ts
```

Für Deployment (Beispiel Sepolia):

```bash
npx hardhat ignition deploy ./ignition/modules/GenImNFTv2.ts --network sepolia
```
