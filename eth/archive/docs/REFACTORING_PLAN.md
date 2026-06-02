# Refactoring Plan: `eth/` Repo – Modern Hardhat Best Practices

> Basis: Analyse des Repos `fretchen/fretchen.github.io/eth` (Mai 2026)

---

## Was bereits gut ist

- UUPS-Proxy-Pattern mit `@openzeppelin/hardhat-upgrades`
- `.openzeppelin/*.json` trackt die Upgrade-History korrekt
- `scripts/deployments/*.json` speichert Deployment-Records mit Timestamp
- Zod-Validierung in Deploy-Scripts
- `hardhat vars` statt `.env` für Secrets
- TypeScript durchgehend

---

## Problem 1 – Doppeltes Deployment-System

**Symptom:** Zwei parallele Systeme existieren nebeneinander:

- `ignition/modules/` → `GenImNFT.ts`, `GenImNFTv2.ts`, `Lock.ts`, `Support.ts` (alt)
- `scripts/deploy-*.ts` → `GenImNFTv4`, `CollectorNFT`, `SupportV2`, `LLM` (neu)

Hardhat Ignition hat eingeschränkte Unterstützung für upgradeable Contracts. Die custom `deploy-*.ts` Scripts sind professioneller und bereits der Standard im Repo.

### Aufgaben

- [ ] Entscheidung dokumentieren: **Ignition einfrieren, nur noch `scripts/deploy-*.ts` für neue Contracts**
- [ ] `README.md` in `ignition/` ergänzen: _"Diese Module sind historisch. Neue Deployments erfolgen via `scripts/`."_
- [ ] Sicherstellen, dass alle `ignition/deployments/` im Git bleiben (sie sind die on-chain Referenz der alten Deployments)

---

## Problem 2 – Alte Contract-Dateien in `contracts/`

**Symptom:** Alle historischen Implementierungen liegen im aktiven Compile-Pfad:

```
contracts/
  GenImNFT.sol       ← v1, nie wieder deployed
  GenImNFTv2.sol     ← v2, nie wieder deployed
  GenImNFTv3.sol     ← v3, nie wieder deployed
  GenImNFTv4.sol     ← aktuelle Version ✅
  CollectorNFTv1.sol ← Vorgänger von CollectorNFT.sol
  Support.sol        ← Vorgänger von SupportV2.sol
```

Da UUPS verwendet wird, sind die alten Implementierungen on-chain in `.openzeppelin/*.json` verankert. Der Quellcode muss nicht im aktiven Ordner bleiben.

### Aufgaben

- [ ] Git-Tags für historische Deployments setzen:
  ```bash
  git log --oneline  # relevante Commit-Hashes finden
  git tag genimg-v1-optimism <hash>
  git tag genimg-v2-optimism <hash>
  git tag genimg-v3-optimism <hash>
  ```
- [ ] Archiv-Ordner anlegen und alte Contracts verschieben:
  ```bash
  mkdir contracts/_archive
  git mv contracts/GenImNFT.sol    contracts/_archive/
  git mv contracts/GenImNFTv2.sol  contracts/_archive/
  git mv contracts/GenImNFTv3.sol  contracts/_archive/
  git mv contracts/Support.sol     contracts/_archive/
  git mv contracts/CollectorNFTv1.sol contracts/_archive/
  git mv contracts/Lock.sol        contracts/_archive/   # nur Hardhat-Template
  git mv contracts/Token.sol       contracts/_archive/   # nur Hardhat-Template
  git mv contracts/ERC1967Proxy.sol contracts/_archive/  # OZ-Kopie, kein eigener Contract
  ```
- [ ] Sicherstellen, dass kein aktiver Contract `_archive/` importiert
- [ ] `_archive/README.md` erstellen mit Hinweis: _"Historische Implementierungen. Zugriff via Git-Tag möglich."_

---

## Problem 3 – Tests für alte Contract-Versionen

**Symptom:** Tests für längst abgelöste Contracts laufen bei jedem `hardhat test`:

```
test/
  GenImNFT.ts                    ← testet v1
  GenImNFTv2.ts                  ← testet v2
  GenImNFTv3.ts                  ← testet v3
  GenImNFTv3_OpenZeppelin_Upgrade.ts  ← Upgrade-Pfad v2→v3
  CollectorNFTv1_Deployment.ts
  CollectorNFTv1_Functional.ts
```

Der einzig relevante Upgrade-Pfad ist v3→v4, abgedeckt durch `GenImNFTv4_Upgrade.ts`.

### Aufgaben

- [ ] Alte Tests archivieren:
  ```bash
  mkdir test/_archive
  git mv test/GenImNFT.ts                         test/_archive/
  git mv test/GenImNFTv2.ts                       test/_archive/
  git mv test/GenImNFTv3.ts                       test/_archive/
  git mv test/GenImNFTv3_OpenZeppelin_Upgrade.ts  test/_archive/
  git mv test/CollectorNFTv1_Deployment.ts        test/_archive/
  git mv test/CollectorNFTv1_Functional.ts        test/_archive/
  ```
- [ ] Prüfen ob `shared/GenImNFTSharedTests.ts` noch von aktiven Tests verwendet wird (wenn nicht → ebenfalls archivieren)
- [ ] `hardhat test` nach der Bereinigung einmal vollständig durchlaufen lassen

---

## Zielzustand

```
contracts/
  GenImNFTv4.sol          ← aktuelle UUPS-Implementierung
  SupportV2.sol
  CollectorNFT.sol
  LLMv1.sol
  EIP3009SplitterV1.sol
  MockUSDC_EIP3009.sol    ← nur für Tests
  interfaces/
  _archive/               ← historisch, Compiler ignoriert sie (kein aktiver Import)

scripts/
  deploy-*.ts             ← einheitliches Deployment-System
  upgrade-*.ts
  deployments/            ← Deployment-Records mit Timestamp ✅

ignition/
  deployments/            ← historische Ignition-Deployments, eingefroren ✅

.openzeppelin/            ← OZ Upgrade-Tracking ✅

test/
  GenImNFTv4_Functional.ts
  GenImNFTv4_Upgrade.ts
  SupportV2_Deployment.ts
  SupportV2_Functional.ts
  EIP3009SplitterV1_*.ts
  LLMv1_*.ts
  _archive/               ← historische Tests
```

---

## Priorisierung

| #   | Aufgabe                                            | Priorität | Aufwand |
| --- | -------------------------------------------------- | --------- | ------- |
| 1   | Git-Tags für historische Deployments setzen        | Hoch      | ~15 min |
| 2   | Alte Contract-Dateien nach `_archive/` verschieben | Hoch      | ~30 min |
| 3   | Alte Tests nach `_archive/` verschieben            | Mittel    | ~30 min |
| 4   | `ignition/` und `README` als eingefroren markieren | Mittel    | ~15 min |
| 5   | `hardhat test` nach Bereinigung verifizieren       | Hoch      | ~10 min |
