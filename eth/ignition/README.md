# ignition/ — Eingefroren

Dieser Ordner enthält historische Hardhat-Ignition-Module und ihre Deployment-Artefakte.

**Neue Deployments erfolgen ausschließlich über `scripts/deploy-*.ts`.**

Hardhat Ignition hat eingeschränkte Unterstützung für upgradeable Contracts (UUPS). Die custom Deploy-Scripts in `scripts/` sind der aktuelle Standard.

## Historische Deployments

| Verzeichnis | Contract | Netzwerk |
|---|---|---|
| `my-first-genai-optimism-contract` | GenImNFT v1 | Optimism |
| `my-second-genai-optimism-contract` | GenImNFT v1 | Optimism |
| `my-upgradable-genai-optimism-contract` | GenImNFT (upgradeable) | Optimism |
| `genImv2-optimism` | GenImNFT v2 | Optimism |
| `genai-sepolia` | GenImNFT | Sepolia |
| `first-support-opmain-deployment` | Support | Optimism |
| `first-support-optsepolia-deployment` | Support | Opt-Sepolia |
| `first-support-sepolia-deployment` | Support | Sepolia |
| `lock-sepolia-deployment` | Lock (Template) | Sepolia |

Die `deployments/`-Verzeichnisse bleiben im Git erhalten — sie sind die on-chain Referenz der alten Deployments.
