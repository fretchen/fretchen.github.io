# contracts_archive/

Historische Solidity-Implementierungen. Dieser Ordner liegt bewusst **außerhalb** von `contracts/`, damit Hardhat ihn nicht kompiliert.

| Datei | Beschreibung | Git-Tag |
|---|---|---|
| `GenImNFT.sol` | GenImNFT v1 (erste Optimism-Deployment) | `genimg-v1-optimism` |
| `GenImNFTv2.sol` | GenImNFT v2 (UUPS upgradeable) | `genimg-v2-optimism` |
| `GenImNFTv3.sol` | GenImNFT v3 (private listings) | `genimg-v3-optimism` |
| `Support.sol` | Support v1 (Vorgänger von SupportV2.sol) | — |
| `CollectorNFTv1.sol` | CollectorNFT v1 (Vorgänger von CollectorNFT.sol) | — |
| `Lock.sol` | Hardhat-Template (nie produktiv deployed) | — |
| `Token.sol` | Hardhat-Template (nie produktiv deployed) | — |
| `ERC1967Proxy.sol` | OpenZeppelin-Kopie (ersetzt durch OZ npm-Paket) | — |

Die on-chain Adressen und Upgrade-History sind in `.openzeppelin/*.json` und `ignition/deployments/` gesichert.
