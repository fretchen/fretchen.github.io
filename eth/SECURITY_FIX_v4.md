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

---

### Option C: EIP-8004 Compatible Whitelist (empfohlen)

```solidity
// State - follows EIP-8004 naming convention
mapping(address => bool) private _whitelistedAgentWallets;

// Events - EIP-8004 aligned
event AgentWalletAuthorized(address indexed agentWallet);
event AgentWalletRevoked(address indexed agentWallet);

// Functions
function authorizeAgentWallet(address agentWallet) external onlyOwner {
    _whitelistedAgentWallets[agentWallet] = true;
    emit AgentWalletAuthorized(agentWallet);
}

function revokeAgentWallet(address agentWallet) external onlyOwner {
    _whitelistedAgentWallets[agentWallet] = false;
    emit AgentWalletRevoked(agentWallet);
}

function isAuthorizedAgent(address agentWallet) external view returns (bool) {
    return _whitelistedAgentWallets[agentWallet];
}

// Check in requestImageUpdate()
require(_whitelistedAgentWallets[msg.sender], "Not authorized agent");
```

**Vorteile:**

- ✅ **Identisch zu Option B** - gleiche Funktionalität
- ✅ **EIP-8004 Standard-kompatibel** - folgt etablierter Naming Convention
- ✅ **Future-proof** - kompatibel mit Identity/Reputation Registry
- ✅ **Dokumentiert** - klare Semantik ("Agent" statt "Updater")
- ✅ **Erweiterbar** - kann später zu vollem EIP-8004 migrieren

**Nachteile:**

- ⚠️ Identisch zu Option B

**Komplexitätsvergleich zu Option A (Per-Token Authorization):**

| Aspekt | Option A | Option C |
|--------|----------|----------|
| **State Variables** | 2 (`defaultImageUpdater`, `_authorizedImageUpdaters`) | 1 (`_whitelistedAgentWallets`) |
| **Functions** | 4 (set default, authorize, get default, get authorized) | 3 (authorize, revoke, check) |
| **Reinitialisierung** | Ja (`reinitializeV4()` für `defaultImageUpdater`) | Nein |
| **User Transactions** | 2 (mint + authorize) oder 1 (bei default) | 1 (nur mint) |
| **Code Zeilen** | ~80 Zeilen | ~25 Zeilen |
| **Storage Slots** | 2 + 1 per Token | 1 + 1 per Agent |
| **Upgrade Risiko** | Mittel (neue Initialisierung) | Minimal (nur Mapping) |

**Technische Unterschiede:**

```solidity
// Option A - Komplexe Authorization
defaultImageUpdater = address(...)  // Global state
_authorizedImageUpdaters[tokenId] = address(...)  // Per-token state
// Prüfung: Ist msg.sender == _authorizedImageUpdaters[tokenId]?

// Option C - Einfache Whitelist
_whitelistedAgentWallets[address(...)] = true  // Nur Agent-state
// Prüfung: Ist msg.sender in Whitelist?
```

**EIP-8004 Kompatibilität:**

Option C nutzt die gleiche Terminologie wie EIP-8004 Trustless Agents:

- `agentWallet`: Standard-Begriff für Service-Wallet
- Ermöglicht später Integration mit Identity Registry
- Dokumentation kann EIP-8004 referenzieren

## Empfehlung: **Option C (EIP-8004 Compatible Whitelist)**

**Begründung:**

1. **Einfachste Implementierung**: ~70% weniger Code als Option A
2. **Kein Reinitialisierung**: Upgrade ohne `reinitializeV4()` Logik
3. **Zentrale Architektur**: Backend-Services updaten, nicht Token-Owner
4. **Standard-kompatibel**: Folgt EIP-8004 Naming Convention
5. **Bessere UX**: Nutzer machen nur 1 Transaktion (mint), keine Authorization
6. **Flexibilität**: Owner kann mehrere Agent-Wallets autorisieren (Backup, Load-Balancing)
7. **Future-proof**: Upgrade zu vollem EIP-8004 (Identity/Reputation Registry) möglich

**Implementation:**

```bash
# Nach Deployment
npx hardhat console --network optimism
> const contract = await ethers.getContractAt("GenImNFTv4", "0x80f95d33...")
> await contract.authorizeAgentWallet("0xAAEBC1441323B8ad6Bdf6793A8428166b510239C")
```

**Storage-Änderungen zu v3:**

- ❌ Entferne: `defaultImageUpdater` (nicht benötigt)
- ❌ Entferne: per-Token `_authorizedImageUpdaters` (wird nicht genutzt)
- ✅ Behalte: Alle bestehenden v3 Variablen
- ✅ Füge hinzu: `mapping(address => bool) private _whitelistedAgentWallets;` (1 Storage Slot)
- ✅ Anpassung: `uint256[48] private __gap;` (Platz für 1 neue Variable)

**Komplexitätsreduktion vs. Option A:**

| Metrik | Option A (v4 aktuell) | Option C (vorgeschlagen) | Reduktion |
|--------|----------------------|--------------------------|-----------|
| Functions (neu/geändert) | 5 | 3 | **-40%** |
| State Variables (neu) | 2 | 1 | **-50%** |
| Zeilen Code | ~80 | ~25 | **-69%** |
| Test Cases (zusätzlich) | 5 | 2 | **-60%** |
| Reinitialisierung | Ja | Nein | **✓** |
