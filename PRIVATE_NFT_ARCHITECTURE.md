# Private NFT Architecture - Einfaches "isListed" System

## Überblick

Diese Architektur erweitert das bestehende GenImNFTv2-System um ein einfaches Privatsphäre-System basierend auf einem `isListed` Flag. Ähnlich wie robots.txt bei Websites können NFT-Besitzer entscheiden, ob ihre Tokens in öffentlichen Gallerien und Marktplätzen angezeigt werden oder privat bleiben. Die Inhalte bleiben technisch zugänglich, aber werden standardmäßig nicht in öffentlichen Interfaces gezeigt.

## Architekturkomponenten

### 1. Smart Contract Erweiterungen (GenImNFTv3)

#### Neue Storage-Variable
```solidity
// Mapping für öffentliche Sichtbarkeit der NFTs
mapping(uint256 => bool) private _isListed;

// Standard: neue NFTs sind gelistet (true)
// Besitzer können auf false setzen für Privatsphäre
```

#### Neue Funktionen
```solidity
// Setzt die Sichtbarkeit eines NFTs (nur Owner)
function setTokenListed(uint256 tokenId, bool isListed) external {
    require(ownerOf(tokenId) == msg.sender, "Not token owner");
    _isListed[tokenId] = isListed;
    emit TokenListingChanged(tokenId, isListed);
}

// Prüft ob Token öffentlich gelistet ist
function isTokenListed(uint256 tokenId) external view returns (bool) {
    require(_exists(tokenId), "Token does not exist");
    return _isListed[tokenId];
}

// Batch-Operation für mehrere Tokens
function setMultipleTokensListed(uint256[] calldata tokenIds, bool isListed) external {
    for (uint256 i = 0; i < tokenIds.length; i++) {
        require(ownerOf(tokenIds[i]) == msg.sender, "Not owner of token");
        _isListed[tokenIds[i]] = isListed;
        emit TokenListingChanged(tokenIds[i], isListed);
    }
}

// Event für Sichtbarkeitsänderungen
event TokenListingChanged(uint256 indexed tokenId, bool isListed);
```

#### Anpassung der Mint-Funktion
```solidity
function safeMint(string memory uri, bool isListed) 
    public payable returns (uint256) {
    require(msg.value >= mintPrice, "Insufficient payment");

    uint256 tokenId = _nextTokenId++;
    _safeMint(msg.sender, tokenId);
    _setTokenURI(tokenId, uri);
    
    // Setze Sichtbarkeit (Standard: true wenn nicht angegeben)
    _isListed[tokenId] = isListed;
    
    emit TokenListingChanged(tokenId, isListed);
    return tokenId;
}

// Backward compatibility: alte safeMint Funktion
function safeMint(string memory uri) public payable returns (uint256) {
    return safeMint(uri, true); // Standard: öffentlich gelistet
}
```

### 2. Frontend-Erweiterungen

#### UI-Komponenten im ImageGenerator
```typescript
// Einfacher Toggle für Privatsphäre
const [isPrivate, setIsPrivate] = useState(false);

// In der UI:
<label className={styles.privacyToggle}>
  <input 
    type="checkbox" 
    checked={isPrivate}
    onChange={(e) => setIsPrivate(e.target.checked)}
  />
  🔒 Keep this artwork private (not shown in public galleries)
</label>
```

#### Anpassung der Mint-Funktion
```typescript
// Updated mint call
const txHash = await writeContractAsync({
  ...genAiNFTContractConfig,
  functionName: "safeMint",
  args: [tempUri, !isPrivate], // isListed = !isPrivate
  value: mintPrice as bigint,
});
```

#### NFT Gallery Filtering
```typescript
// Neue Funktion zum Laden nur gelisteter NFTs
async function getPublicNFTs(contract: any, walletAddress: string) {
  const balance = await contract.read.balanceOf([walletAddress]);
  const publicNFTs = [];
  
  for (let i = 0; i < balance; i++) {
    const tokenId = await contract.read.tokenOfOwnerByIndex([walletAddress, i]);
    const isListed = await contract.read.isTokenListed([tokenId]);
    
    if (isListed) {
      const tokenURI = await contract.read.tokenURI([tokenId]);
      publicNFTs.push({ tokenId, tokenURI });
    }
  }
  
  return publicNFTs;
}

// Neue Funktion zum Laden aller NFTs (für eigene Galerie)
async function getAllNFTs(contract: any, walletAddress: string) {
  // Lädt alle NFTs, egal ob gelistet oder nicht
  // Für die eigene Galerie des Besitzers
}
```

#### Gallery-Komponenten-Erweiterung
```typescript
interface NFTListProps {
  showPrivate?: boolean; // true = zeige alle, false = nur öffentliche
  ownerMode?: boolean;   // true = eigene Galerie, false = öffentliche Ansicht
}

function NFTList({ showPrivate = false, ownerMode = false }: NFTListProps) {
  // Verschiedene Lademodi je nach Kontext
  const loadNFTs = ownerMode ? getAllNFTs : getPublicNFTs;
  
  // UI zeigt Privacy-Status an
  function NFTCard({ nft }: { nft: NFT }) {
    return (
      <div className={styles.nftCard}>
        {/* Bestehender Content */}
        
        {ownerMode && !nft.isListed && (
          <div className={styles.privateIndicator}>
            🔒 Private
          </div>
        )}
        
        {ownerMode && (
          <button 
            onClick={() => togglePrivacy(nft.tokenId)}
            className={styles.privacyToggleBtn}
          >
            {nft.isListed ? "Make Private" : "Make Public"}
          </button>
        )}
      </div>
    );
  }
}
```

### 3. Backend-Service (Minimal Changes)

#### readhandler_v3.js
```javascript
// Minimale Änderung: neuer Parameter für Privatsphäre
async function handle(event, context, cb) {
  const prompt = event.queryStringParameters.prompt;
  const tokenId = event.queryStringParameters.tokenId;
  const isPrivate = event.queryStringParameters.private === 'true';
  
  // Standard Bildgenerierung (unverändert)
  const metadataUrl = await generateAndUploadImage(prompt, tokenId, size);
  
  // Update Token mit isListed Parameter
  const txHash = await updateTokenWithImage(
    contract, 
    tokenId, 
    metadataUrl,
    !isPrivate // isListed = !isPrivate
  );
  
  return {
    body: JSON.stringify({
      metadata_url: metadataUrl,
      image_url: imageUrl,
      is_private: isPrivate,
      transaction_hash: txHash,
    }),
    // ... rest bleibt gleich
  };
}
```

### 4. Privacy Controls Dashboard

#### Neue Komponente: PrivacyManager
```typescript
function PrivacyManager({ userAddress }: { userAddress: string }) {
  const [userNFTs, setUserNFTs] = useState<NFT[]>([]);
  
  // Lädt alle NFTs des Benutzers mit Privacy-Status
  useEffect(() => {
    loadUserNFTs();
  }, [userAddress]);
  
  const toggleNFTPrivacy = async (tokenId: bigint, currentStatus: boolean) => {
    await writeContract({
      ...contractConfig,
      functionName: "setTokenListed",
      args: [tokenId, !currentStatus],
    });
    
    // UI aktualisieren
    setUserNFTs(prev => prev.map(nft => 
      nft.tokenId === tokenId 
        ? { ...nft, isListed: !currentStatus }
        : nft
    ));
  };
  
  return (
    <div className={styles.privacyManager}>
      <h3>🔒 Privacy Settings</h3>
      <p>Control which of your artworks appear in public galleries:</p>
      
      {userNFTs.map(nft => (
        <div key={nft.tokenId.toString()} className={styles.privacyItem}>
          <img src={nft.imageUrl} alt={nft.metadata?.name} />
          <div className={styles.privacyControls}>
            <span>{nft.metadata?.name || `Artwork #${nft.tokenId}`}</span>
            <button 
              onClick={() => toggleNFTPrivacy(nft.tokenId, nft.isListed)}
              className={nft.isListed ? styles.publicBtn : styles.privateBtn}
            >
              {nft.isListed ? "🌍 Public" : "🔒 Private"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 5. Öffentliche API-Endpunkte

#### Neue API-Funktionen für externe Services
```javascript
// Für Marktplätze und externe Gallerien
function getPublicTokens(contractAddress, limit = 100) {
  // Gibt nur öffentlich gelistete NFTs zurück
  // Respektiert Privacy-Einstellungen der Besitzer
}

// Für Statistiken
function getPublicTokenCount(contractAddress) {
  // Zählt nur öffentlich sichtbare NFTs
}

// Privacy-bewusste Token-Enumeration
function enumeratePublicTokens(contractAddress, offset, limit) {
  // Paginierte Liste nur öffentlicher NFTs
}
```

### 6. Contract Storage Layout (Upgrade-Safe)

```solidity
// Bestehende Storage (unverändert)
uint256 private _nextTokenId;                           // Slot 0
uint256 public mintPrice;                               // Slot 1
mapping(uint256 => address) private _authorizedImageUpdaters;  // Slot 2
mapping(uint256 => bool) private _imageUpdated;               // Slot 3

// Neue Storage für Privacy
mapping(uint256 => bool) private _isListed;                   // Slot 4

uint256[49] private __gap;                              // Slots 5-53 (angepasst)
```

### 7. Migration und Backward Compatibility

#### Migrations-Funktion
```solidity
function migrateToV3() external onlyOwner {
    // Markiere alle bestehenden Tokens als öffentlich gelistet
    // Bestehende NFTs bleiben sichtbar (opt-out statt opt-in)
    for (uint256 i = 0; i < _nextTokenId; i++) {
        if (_exists(i)) {
            _isListed[i] = true;
        }
    }
}
```

#### Frontend Migration
```typescript
// Automatische Migration für bestehende NFTs
async function migrateUserNFTs(userAddress: string) {
  const balance = await contract.read.balanceOf([userAddress]);
  
  for (let i = 0; i < balance; i++) {
    const tokenId = await contract.read.tokenOfOwnerByIndex([userAddress, i]);
    
    try {
      // Prüfe ob isListed bereits gesetzt ist
      await contract.read.isTokenListed([tokenId]);
    } catch {
      // Wenn nicht gesetzt, setze auf public (Standard)
      console.log(`Migrating token ${tokenId} to public listing`);
    }
  }
}
```

## Vorteile dieser einfachen Lösung

### 1. **Einfachheit**
- Nur ein Boolean-Flag pro Token
- Keine komplexe Kryptographie
- Einfache UI-Controls
- Minimale Backend-Änderungen

### 2. **Benutzerfreundlichkeit**
- Klare Ein/Aus-Entscheidung
- Sofortige Wirkung
- Reversible Entscheidungen
- Keine technischen Hürden

### 3. **Backward Compatibility**
- Bestehende NFTs bleiben unverändert
- Opt-out System (Standard: öffentlich)
- Einfache Migration
- Keine Breaking Changes

### 4. **Performance**
- Keine Verschlüsselung/Entschlüsselung
- Einfache Datenbankabfragen
- Schnelle Sichtbarkeitskontrollen
- Minimaler Gas-Verbrauch

### 5. **Flexibilität**
- Besitzer können jederzeit wechseln
- Batch-Operationen möglich
- API-freundlich für externe Services
- Einfache Erweiterbarkeit

## Anwendungsfälle

### 1. **Persönliche Kunst**
- Private Experimente
- Persönliche Erinnerungen
- Work-in-Progress Pieces
- Experimentelle Styles

### 2. **Sammlerverwaltung**
- Kuratierte öffentliche Sammlung
- Private Reserve-Sammlung
- Strategische Markt-Timing
- Portfolio-Management

### 3. **Creator Tools**
- Draft-Versionen vor Release
- A/B Testing mit limitierter Sichtbarkeit
- Exklusive Community-Drops
- Staged Releases

## Implementierungsreihenfolge

1. **Phase 1**: Smart Contract `isListed` Mapping hinzufügen
2. **Phase 2**: Frontend Privacy Toggle im ImageGenerator
3. **Phase 3**: Gallery Filtering für öffentliche vs. private Ansichten
4. **Phase 4**: Privacy Manager Dashboard für Batch-Operations
5. **Phase 5**: API-Updates für externe Services

Diese einfache Lösung bietet 80% der gewünschten Privacy-Funktionalität mit nur 20% der Komplexität der ursprünglichen Architektur. Sie ist wie ein "robots.txt" für NFTs - einfach, effektiv und respektiert die Privatsphäre-Wünsche der Nutzer.
