# GenImNFT v3 → v4 Security Fix

## Der Exploit in v3

**Vulnerability:** Jede beliebige Adresse kann `requestImageUpdate()` aufrufen und die `mintPrice` als Belohnung erhalten.

```solidity
function requestImageUpdate(uint256 tokenId, string memory imageUrl) public {
    require(_exists(tokenId), "Token does not exist");
    require(!_imageUpdated[tokenId], "Image already updated");
    // ❌ KEINE AUTORISIERUNGSPRÜFUNG
    
    _imageUpdated[tokenId] = true;
    _setTokenURI(tokenId, imageUrl);
    (bool success, ) = payable(msg.sender).call{value: mintPrice}("");
    // ✅ Zahlung an JEDEN der die Funktion aufruft
}
```

**Realer Angriff (26.11.2025):**

- Attacker: `0x8B6B008A0073D34D04ff00210E7200Ab00003300`
- Methode: Front-running mit leeren URLs `""`
- Impact: Token permanent gesperrt, Belohnung gestohlen

## Zwei Lösungsmöglichkeiten für v4

### Option A: Per-Token Authorization (aktuelles v4)

```solidity
// State
address public defaultImageUpdater;
mapping(uint256 => address) private _authorizedImageUpdaters;

// Functions
function setDefaultImageUpdater(address updater) external onlyOwner;
function authorizeImageUpdater(uint256 tokenId, address updater) external;

// Check in requestImageUpdate()
address authorizedUpdater = _authorizedImageUpdaters[tokenId];
require(authorizedUpdater != address(0), "No authorized updater");
require(msg.sender == authorizedUpdater, "Not authorized");
```

**Vorteile:**

- ✅ Token-Owner kann eigenen Updater setzen
- ✅ Maximale Flexibilität per Token

**Nachteile:**

- ❌ Komplexer Code (mehr State, mehr Funktionen)
- ❌ Erfordert `reinitializeV4()` für `defaultImageUpdater`
- ❌ Nutzer müssen ggf. `authorizeImageUpdater()` aufrufen (2. Transaction)

---

### Option B: Global Whitelist (empfohlen)

```solidity
// State
mapping(address => bool) private _whitelistedUpdaters;

// Functions
function addToWhitelist(address updater) external onlyOwner;
function removeFromWhitelist(address updater) external onlyOwner;

// Check in requestImageUpdate()
require(_whitelistedUpdaters[msg.sender], "Not whitelisted");
```

**Vorteile:**

- ✅ **Einfachster Code** - minimale Änderungen zu v3
- ✅ **Kein Reinitialisierung** nötig
- ✅ **Keine User-Action** erforderlich
- ✅ **Mehrere Backend-Adressen** möglich (Backup, Load-Balancing)
- ✅ **Geringere Gas-Kosten**

**Nachteile:**

- ⚠️ Token-Owner können nicht ihren eigenen Updater wählen
- ⚠️ Owner-Abhängigkeit für Whitelist-Management

## Empfehlung: **Option B (Global Whitelist)**

**Begründung:**

1. Der Use-Case ist **zentral**: Ein Backend-Service (oder wenige) aktualisiert alle Bilder
2. **Einfachheit**: Weniger Code = weniger Fehler, einfacheres Audit
3. **Kein Reinitialisierung**: Upgrade ohne zusätzliche Initialisierungslogik
4. **Bessere UX**: Nutzer müssen nichts tun nach dem Mint
5. **Flexibilität wo nötig**: Owner kann mehrere Updater erlauben (Redundanz)

**Implementation:**

- Whitelist Owner's Backend: `0xAAEBC1441323B8ad6Bdf6793A8428166b510239C`
- Bei Bedarf weitere Adressen hinzufügen
- Exploit ist geschlossen: Nur whitelistete Adressen können updaten

**Storage-Änderungen:**

- Entferne: `defaultImageUpdater`, per-Token Authorization
- Behalte: Existing v3 structure
- Füge hinzu: `_whitelistedUpdaters` Mapping (1 Storage Slot)
