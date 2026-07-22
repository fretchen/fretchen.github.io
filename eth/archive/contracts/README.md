# archive/contracts/

Historische Solidity-Implementierungen. Dieser Ordner liegt bewusst **außerhalb** von `contracts/`, damit Hardhat ihn nicht kompiliert.

| Datei                | Beschreibung                                     | Git-Tag              |
| -------------------- | ------------------------------------------------ | -------------------- |
| `GenImNFT.sol`       | GenImNFT v1 (erste Optimism-Deployment)          | `genimg-v1-optimism` |
| `GenImNFTv2.sol`     | GenImNFT v2 (UUPS upgradeable)                   | `genimg-v2-optimism` |
| `Support.sol`        | Support v1 (Vorgänger von SupportV2.sol)         | —                    |
| `LLMv1.sol`          | LLM-Zahlungskanal (ETH-Prepaid + Merkle-Batching), abgelöst durch x402 Batch-Settlement | — |
| `Lock.sol`           | Hardhat-Template (nie produktiv deployed)        | —                    |
| `Token.sol`          | Hardhat-Template (nie produktiv deployed)        | —                    |

**Nicht hier, aber verwandt:**

- `contracts/GenImNFTv3.sol` — bleibt in `contracts/`, da `GenImNFTv4_Upgrade.ts` ihn zum Simulieren des v3→v4 Upgrade-Pfads braucht. Git-Tag: `genimg-v3-optimism`
- `contracts/ERC1967Proxy.sol` — bleibt in `contracts/`, da drei aktive Functional-Tests Proxys damit direkt deployen (Hardhat-Artifact wird zur Laufzeit gebraucht)
- `contracts/CollectorNFTv1.sol` — war hier archiviert, aber **zurück nach `contracts/` verschoben** (2026-07-22): on-chain-Verifikation zeigte, dass beide live-Proxys (Optimism + Base) tatsächlich noch die v1-Implementierung laufen lassen, nicht das separat existierende `CollectorNFT.sol` (2-Parameter-`mintCollectorNFT`, nie deployed). `CollectorNFT.sol` wurde daraufhin komplett gelöscht (nicht archiviert) — git-history bleibt erhalten, aber es hätte fälschlich den Eindruck erweckt, jemals live gewesen zu sein.

Die on-chain Adressen und Upgrade-History sind in `.openzeppelin/*.json` und `ignition/deployments/` gesichert.
