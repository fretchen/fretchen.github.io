# archive/contracts/

Historische Solidity-Implementierungen. Dieser Ordner liegt bewusst **außerhalb** von `contracts/`, damit Hardhat ihn nicht kompiliert.

| Datei                | Beschreibung                                     | Git-Tag              |
| -------------------- | ------------------------------------------------ | -------------------- |
| `GenImNFT.sol`       | GenImNFT v1 (erste Optimism-Deployment)          | `genimg-v1-optimism` |
| `GenImNFTv2.sol`     | GenImNFT v2 (UUPS upgradeable)                   | `genimg-v2-optimism` |
| `Support.sol`        | Support v1 (Vorgänger von SupportV2.sol)         | —                    |
| `CollectorNFTv1.sol` | CollectorNFT v1 (Vorgänger von CollectorNFT.sol) | —                    |
| `LLMv1.sol`          | LLM-Zahlungskanal (ETH-Prepaid + Merkle-Batching), abgelöst durch x402 Batch-Settlement | — |
| `Lock.sol`           | Hardhat-Template (nie produktiv deployed)        | —                    |
| `Token.sol`          | Hardhat-Template (nie produktiv deployed)        | —                    |

**Nicht hier, aber verwandt:**

- `contracts/GenImNFTv3.sol` — bleibt in `contracts/`, da `GenImNFTv4_Upgrade.ts` ihn zum Simulieren des v3→v4 Upgrade-Pfads braucht. Git-Tag: `genimg-v3-optimism`
- `contracts/ERC1967Proxy.sol` — bleibt in `contracts/`, da drei aktive Functional-Tests Proxys damit direkt deployen (Hardhat-Artifact wird zur Laufzeit gebraucht)

Die on-chain Adressen und Upgrade-History sind in `.openzeppelin/*.json` und `ignition/deployments/` gesichert.
