# Assistent Payment Implementation

> Stand: 18. Februar 2026 — Implementierungsvorschlag basierend auf [ASSISTANT_MODERNIZATION_ANALYSIS.md](ASSISTANT_MODERNIZATION_ANALYSIS.md)
>
> **Scope:** Ausschließlich die Assistent-Seite (`website/pages/assistent/`). ImageGen und andere Services werden nicht berührt.

---

## Übersicht

Dieses Dokument beschreibt den Weg zur Modernisierung des Payment-Systems für die **Assistent-Seite**.

### Status der Teilprojekte

| Teilprojekt | Status | Beschreibung |
|---|---|---|
| **Facilitator Permit2 Upgrade** | 🔀 **Separater PR** | Package-Upgrade auf @x402/evm≥2.3.1, Permit2-Verifizierung. Unabhängig vom Assistent-Umbau. |
| **LLMv2 Contract (transferFrom-Batch)** | ❌ **Verworfen** | Ökonomisch nicht tragfähig für Micropayments (siehe Sektion 2) |
| **Multi-Token (USDC/EURC/ETH)** | ❌ **Verworfen** | Overengineered — ETH funktioniert, Oracle-Aufwand für Stablecoins / Preise nicht lohnend (siehe Sektion 5.1) |
| **Marktvergleich** | ✅ **Abgeschlossen** | PayAI, 0xMeta, AgentKit/CDP analysiert — Netzwerk-Wahl ist entscheidend (Sektion 3) |
| **ETH-Prepaid Multi-Chain + Multi-Model** | 🟢 **Gewählt** | LLMv1 unverändert auf Base deployen, Multi-Model via IONOS, ~2 Wochen (Sektion 5) |

> ⚠️ **Abgrenzung:** Die Image-Generation (`genimg_x402_token.js`, `x402_server.js`) bleibt unverändert auf dem bestehenden EIP-3009 x402-Flow.

---

## 1. Facilitator Permit2 Upgrade (separater PR)

**Status:** 🔀 Wird als eigenständiger PR umgesetzt, unabhängig vom Assistent-Umbau.
**Dauer:** ~2–3 Tage
**Risiko:** Niedrig — additive Änderung, EIP-3009 bleibt als Fallback

> **Offene Frage:** Wie sollen Fees mit Permit2 funktionieren? Der aktuelle `onAfterVerify`-Hook prüft EIP-3009-Fees — muss das für Permit2-Payloads angepasst werden?

### Zusammenfassung des Code-Reviews

| Komponente | Befund | Permit2-Ready? |
|---|---|---|
| `facilitator_instance.ts` — `ExactEvmScheme` | Signer hat `writeContract`, `sendTransaction`, `waitForTransactionReceipt` | ✅ Alle Capabilities vorhanden |
| `x402_verify.ts` | Delegiert an `facilitator.verify()` — kein EIP-3009-spezifischer Code | ✅ Auto-Routing via `isPermit2Payload()` |
| `x402_settle.ts` | Delegiert an `facilitator.settle()` — kein EIP-3009-spezifischer Code | ✅ Auto-Routing via `isPermit2Payload()` |
| `x402_fee.ts` / `onAfterVerify` Hook | Prüft Fee-Allowance — token-agnostisch | ✅ Funktioniert mit jedem Token |

**Fazit:** `ExactEvmScheme` in x402 ≥2.3.1 erkennt Permit2-Payloads automatisch via `isPermit2Payload()` Type-Guard. Der Facilitator-Code selbst braucht **keine Code-Änderung**, nur ein Package-Upgrade.

### Was der PR umfasst

```bash
# Package-Upgrades (aktuell → Ziel)
x402_facilitator: @x402/evm@^2.0.0 → ^2.3.1, @x402/core@^2.0.0 → ^2.3.1, @coinbase/x402@^2.0.0 → ^2.3.1
scw_js:           @x402/evm@2.2.0  → ^2.3.1
website:          @x402/evm@2.1.0  → ^2.3.1
```

### Testplan

1. Bestehende Tests: `cd x402_facilitator && npm test` (Regression)
2. Neuer Mock-Test: `isPermit2Payload()` Detection
3. E2E auf Sepolia: Permit2-Payment-Roundtrip

---

## 2. Ökonomie-Analyse: Warum transferFrom-Batch nicht funktioniert

> **Status:** ❌ Der ursprünglich geplante LLMv2-Contract mit `transferFrom()` pro Leaf wird **nicht umgesetzt**.

### 2.1 Das Problem: Optimism-Kostenstruktur

Auf Optimism L2 dominiert die **L1 Data Fee** (>99,99% der Gesamtkosten). Jedes Byte Calldata kostet, egal wie günstig die L2-Execution ist.

| Komponente | Anteil | Wie es skaliert |
|---|---|---|
| **L2 Execution Gas** | <0,01% | Gas × L2-Gaspreis (~0,000003 Gwei) — praktisch gratis |
| **L1 Data Fee** | >99,99% | Komprimierte TX-Größe × gewichteter L1-Blob-Gaspreis |

### 2.2 Kostenvergleich

| Szenario | Calldata | Kosten | Pro Payment |
|---|---|---|---|
| 1× `transferFrom()` | ~200 Bytes | ~$0,06–$0,10 | $0,06–$0,10 |
| 4× einzelne `transferFrom()` TXs | ~800 Bytes | ~$0,24–$0,40 | $0,06–$0,10 |
| 1× Merkle-Batch (N=4, mit Proofs) | ~1.000–1.200 Bytes | ~$0,18–$0,30 | $0,045–$0,075 |

Man spart 3× TX-Envelope (~300 Bytes), aber Merkle-Proofs addieren ~256 Bytes und ABI-Array-Encoding ~192 Bytes. **Netto-Einsparung nur ~30%.**

### 2.3 Das fundamentale Mismatch

Ein typischer Llama 3.3 70B Request kostet ca. **$0,001**:

| Ansatz | Gaskosten | Zahlungssumme (4×) | Overhead |
|---|---|---|---|
| 4× einzelne `transferFrom` | ~$0,32 | $0,004 | **80×** ❌ |
| Merkle-Batch (N=4) | ~$0,22 | $0,004 | **55×** ❌ |
| Merkle-Batch (N=100) | ~$1,50 | $0,10 | **15×** ❌ |
| Merkle-Batch (N=1.000) | ~$12,00 | $1,00 | **12×** ❌ |

**Bei keiner Batch-Größe wird der Overhead unter 10×.** `transferFrom()` pro Leaf ist für Micropayments ≤$0,01 fundamental unwirtschaftlich.

### 2.4 Warum LLMv1 (Prepaid) ökonomisch besser ist

| Aspekt | transferFrom-Batch (LLMv2-Entwurf) | Prepaid + internes Ledger (LLMv1) |
|---|---|---|
| **Onboarding** | N × `approve()` | 1× `depositForLLM()` (~$0,08) |
| **Pro Leaf** | Externer `transferFrom()` (~26k Gas + Calldata) | Interner Balance-Update (~7k Gas) |
| **Provider-Auszahlung** | N separate Transfers | 1× aggregierter ETH-Transfer |
| **Kosten (N=4)** | ~$0,22 | ~$0,03–$0,05 |
| **Overhead bei $0,001/Req** | **55×** ❌ | **~8–12×** ⚠️ |

Vorteile des Prepaid-Modells:
1. User zahlt Deposit-Gas **einmal** (z.B. $5 für ~$0,08)
2. Batch-Settlements sind interne `SSTORE`-Operationen (kein externer Token-Call)
3. Provider erhält **eine** aggregierte Auszahlung statt N einzelner

### 2.5 Entscheidung

Der LLMv2-Contract mit `transferFrom()` pro Leaf wird **nicht umgesetzt**. Die Ökonomie funktioniert nicht für $0,001-Micropayments.

> Das bedeutet nicht, dass die Modernisierung aufgegeben wird — es bedeutet, dass die Payment-Architektur grundlegend neu gedacht werden muss.

---

## 3. Marktvergleich: Wie lösen andere das Micropayment-Problem?

> **Kernerkenntnis:** Kein Anbieter hat "Micropayments auf teuren L2s" gelöst. Alle weichen auf günstigere Netzwerke aus.

### 3.1 PayAI (payai.app)

**Ansatz:** Solana-first x402-Facilitator

| Aspekt | Details |
|---|---|
| **Kernidee** | x402-Facilitator auf Solana (~$0,00025/TX statt ~$0,06–$0,10 auf Optimism) |
| **Preismodell** | $0,001/Settlement, Free-Tier 1.000 TX/Monat |
| **Netzwerke** | Solana, Base, Polygon, SKALE (gaslos), insgesamt 16+ |
| **Token** | USDC, USDT auf allen unterstützten Netzwerken |
| **Relevanz für uns** | Zeigt, dass Solana/SKALE die Kostenstruktur fundamental ändert |

**Warum es funktioniert:** Auf Solana kostet ein `transferFrom()` ~$0,00025. Bei $0,001/Request ergibt sich ein Overhead von ~25% — erstmals wirtschaftlich tragbar. PayAI addiert $0,001 Settlement-Fee = ~125% Overhead total, aber **unter 2×** statt 55× auf Optimism.

### 3.2 0xMeta (0xmeta.ai)

**Ansatz:** Daten-Infrastruktur + x402-API-Monetarisierung

| Aspekt | Details |
|---|---|
| **Kernidee** | Nicht primär Payment-Innovation — eher Daten-Layer (Blockchain-Analytics, Token-Daten) |
| **x402-Nutzung** | Als Monetarisierungsschicht für API-Zugriff |
| **Netzwerke** | Primär EVM-Chains |
| **Relevanz für uns** | Gering — anderes Problem-Domain (Daten-APIs, nicht AI-Micropayments) |

### 3.3 Coinbase AgentKit + CDP-Ökosystem

**Ansatz:** Komplettes Infrastruktur-Stack für AI-Agenten

| Komponente | Funktion |
|---|---|
| **AgentKit** (`@coinbase/agentkit`) | Toolkit für AI-Agenten: Wallet-Management (CDP Server Wallet), Action Providers (Transfer, Swap, Deploy). Framework-agnostisch (LangChain, Eliza, Vercel AI SDK). **Kein Micropayment-Löser, sondern Agent-Infrastruktur.** |
| **CDP Facilitator** | Coinbase-gehosteter x402-Facilitator auf **Base + Solana**. Free-Tier: 1.000 TX/Monat, danach $0,001/TX. |
| **Embedded Wallets** | `useX402`-Hook für nahtlose x402-Payments. Smart Accounts ermöglichen gasfreie Zahlungen für Endnutzer. |
| **Base L2** | Coinbases eigenes L2 — ~$0,01–$0,03/TX (3–10× günstiger als Optimism) |

**Wie löst AgentKit das Problem?**
AgentKit selbst löst es **nicht** — es ist Infrastruktur. Die Antwort kommt vom CDP-Ökosystem:

1. **Netzwerk-Wahl:** Base (~$0,01–$0,03/TX) und Solana (~$0,00025/TX) statt teurer L2s
2. **Free-Tier:** 1.000 TX/Monat absorbieren Small-Scale-Nutzung komplett
3. **Smart Accounts:** Gaskosten werden vom Service-Provider übernommen, nicht vom User
4. **Facilitator-as-a-Service:** Seller braucht keine eigene Blockchain-Infrastruktur

### 3.4 Vergleichsmatrix

| Kriterium | Unser Setup (Optimism) | PayAI (Solana) | CDP (Base) | CDP (Solana) |
|---|---|---|---|---|
| **TX-Kosten** | ~$0,06–$0,10 | ~$0,00025 | ~$0,01–$0,03 | ~$0,00025 |
| **Overhead bei $0,001/Req** | **55–100×** ❌ | **~1,25×** ✅ | **~10–30×** ⚠️ | **~1,25×** ✅ |
| **Free-Tier** | Nein (eigener Facilitator) | 1.000 TX/Monat | 1.000 TX/Monat | 1.000 TX/Monat |
| **Settlement-Fee** | $0 (Gasfee only) | $0,001/TX | $0,001/TX | $0,001/TX |
| **USDC-Support** | ✅ (via x402) | ✅ | ✅ | ✅ |
| **Eigener Facilitator** | ✅ | ❌ (hosted) | ❌ (hosted) | ❌ (hosted) |
| **Smart Accounts** | ❌ | ❌ | ✅ | ❌ |

### 3.5 Implikation für unsere Architektur

Die Ökonomie-Analyse und der Marktvergleich zeigen dasselbe Bild:

> **Das Problem ist nicht die Architektur — es ist das Netzwerk.**

Drei mögliche Wege:

1. **Chain wechseln:** LLM-Payments auf Base oder Solana verlagern (wie PayAI/CDP). Fundamentale Lösung, aber erfordert Multi-Chain-Support.
2. **Batching verbessern:** Auf Optimism bleiben, aber LLMv1-Prepaid mit größeren Batches (N=100+) nutzen. Overhead sinkt auf ~$0,005/Req (~5×), tolerabel wenn Deposits groß genug.
3. **Hybrid:** x402 auf Base für Onboarding + Tab-System, Off-chain Tracking für Requests, periodisches Settlement.

---

## 4. Offene Architektur-Frage: Wie weiter?

Das Prepaid-Modell (LLMv1) funktioniert ökonomisch, hat aber bekannte UX-Probleme:
- User muss ETH einzahlen (Custodial)
- ETH-Volatilität
- Kein Stablecoin-Support

### 4.1 Mögliche Ansätze

| Ansatz | Idee | Pro | Contra |
|---|---|---|---|
| **A: Stablecoin-Prepaid** | Wie LLMv1, aber USDC statt ETH. `depositUSDC()` → interne Balance → Batch intern | Bewährt, stabil, günstig | Custodial |
| **B: Größere Batches** | LLMv1-Pattern mit N=100+ statt 4 | Amortisiert Gas (~$0,005/Payment) | Längere Settlement-Verzögerung |
| **C: Off-chain + periodisch** | Requests off-chain tracken, 1× pro Tag/Woche settlen | Extrem günstig | Trust-Modell, kein Echtzeit-Proof |
| **D: State-Channel** | Off-chain Payment-Channel | Micropayments nahe $0 | Komplex |
| **E: x402-Tab** | x402 für initiale Zahlung (z.B. $1), dann Tab bis aufgebraucht | Non-Custodial, bekannte UX | Frontend-Komplexität |

### 4.2 Bewertungsmatrix

| Kriterium | A: USDC-Prepaid | B: Große Batches | C: Off-chain | D: State-Channel | E: x402-Tab |
|---|---|---|---|---|---|
| Non-Custodial | ❌ | ❌ (ETH) | ❌ | ✅ | ✅ |
| Stablecoin | ✅ | ❌ | ✅ | ✅ | ✅ |
| Aufwand | Niedrig | Sehr niedrig | Mittel | Hoch | Mittel |
| Gas-Effizienz | ✅ | ✅ | ✅✅ | ✅✅ | ✅ |
| Nutzt bestehende Infra | Teilweise | ✅ (LLMv1) | Nein | Nein | Teilweise (x402) |
| UX | ⚠️ Deposit | ⚠️ Deposit | ✅ | ⚠️ Channel-Setup | ✅ |

### 4.3 Nächste Schritte

1. **Kurzfristig:** Facilitator Permit2 Upgrade als separaten PR umsetzen (unabhängig)
2. **Strategie-Entscheidung:** Chain-Wahl klären — Optimism-only vs. Multi-Chain (Base/Solana)
3. **Falls Optimism-only:** Ansatz A (USDC-Prepaid) oder E (x402-Tab) mit größeren Batches evaluieren
4. **Falls Multi-Chain:** CDP-Facilitator auf Base evaluieren (Free-Tier 1.000 TX/Monat, $0,001/TX danach)
5. **Prototyp:** Gewählten Ansatz auf Sepolia/Base-Sepolia prototypen

---

## 5. Entscheidung: ETH-Prepaid, Multi-Chain, Multi-Model (Minimal)

> **Status:** 🟢 **Gewählt** — LLMv1 unverändert wiederverwenden. Kein neuer Contract. ETH only. Auf Base deployen. Multi-Model über IONOS.

### 5.1 Warum kein neuer Contract?

Die vorherige Analyse (Multi-Token USDC/EURC/ETH, LLMv2) war overengineered. LLMv1 ist bereits:
- ✅ **ETH-nativ** — `depositForLLM() payable`, `processBatch()` mit ETH-Auszahlung
- ✅ **Model-agnostisch** — der Contract kennt keine Modelle, nur `(user, cost, tokenCount)`
- ✅ **Chain-agnostisch** — gleicher Bytecode funktioniert auf jeder EVM-Chain
- ✅ **Multi-Provider-fähig** — `authorizedProviders` Mapping existiert bereits

**Ergebnis: 0 Zeilen Solidity-Änderung.** Einfach LLMv1 auf Base + Base Sepolia deployen.

### 5.2 Multi-Model: Mistral läuft bereits auf IONOS

Entscheidender Fund: IONOS hostet Mistral-Modelle auf dem **gleichen Endpoint** mit dem **gleichen API-Key**:

| Modell | IONOS ID | Qualität | Geschwindigkeit | Preis/1M Token |
|---|---|---|---|---|
| **Llama 3.3 70B** (aktuell) | `meta-llama/Llama-3.3-70B-Instruct` | ⭐⭐⭐ | 🐌 Langsam | ~€0,71 |
| **Mistral Small 24B** | `mistralai/Mistral-Small-24B-Instruct` | ⭐⭐⭐⭐ | ⚡ Schnell | ~€0,14–0,42 |
| **Mistral Nemo 12B** | `mistralai/Mistral-Nemo-Instruct-2407` | ⭐⭐⭐ | ⚡⚡ Sehr schnell | ~€0,14–0,42 |
| **Mixtral 8x7B** | `mistralai/Mixtral-8x7B-Instruct-v0.1` | ⭐⭐⭐ | ⚡ Schnell | ~€0,14–0,42 |

Das bedeutet: **Kein neuer API-Key, kein neuer Endpoint, kein neues Secret in Scaleway.** Nur den `model`-Parameter in `callLLMAPI()` variabel machen.

### 5.3 Änderungen im Detail

#### Smart Contract: **Nichts**

| Aktion | Chain | Was |
|---|---|---|
| Deploy LLMv1 | Base | Gleicher Bytecode, neues Proxy via Hardhat |
| Deploy LLMv1 | Base Sepolia | Gleicher Bytecode, Testnet |
| `authorizeProvider()` | Base + Base Sepolia | Service-Provider-Wallet autorisieren |

#### Backend: `llm_service.js`

**Aktuell:** Hardcoded `MODEL_NAME` und `ENDPOINT` (Zeile 10–11)

```javascript
// VORHER:
const MODEL_NAME = "meta-llama/Llama-3.3-70B-Instruct";
const ENDPOINT = "https://openai.inference.de-txl.ionos.com/v1/chat/completions";

// NACHHER:
const MODEL_REGISTRY = {
  "llama-70b": {
    id: "meta-llama/Llama-3.3-70B-Instruct",
    endpoint: "https://openai.inference.de-txl.ionos.com/v1/chat/completions",
    apiKeyEnv: "IONOS_API_TOKEN",
    pricePerMillionEUR: 71n,  // 0,71 EUR
  },
  "mistral-small": {
    id: "mistralai/Mistral-Small-24B-Instruct",
    endpoint: "https://openai.inference.de-txl.ionos.com/v1/chat/completions",
    apiKeyEnv: "IONOS_API_TOKEN",  // Gleicher Key!
    pricePerMillionEUR: 42n,  // 0,42 EUR (TBC)
  },
  "mistral-nemo": {
    id: "mistralai/Mistral-Nemo-Instruct-2407",
    endpoint: "https://openai.inference.de-txl.ionos.com/v1/chat/completions",
    apiKeyEnv: "IONOS_API_TOKEN",
    pricePerMillionEUR: 14n,  // 0,14 EUR (TBC)
  },
};
```

**`callLLMAPI(prompt, dummy, modelKey)`** — neuer Parameter `modelKey`, Lookup in `MODEL_REGISTRY`.

**`convertTokensToCost(tokenCount, modelKey)`** — Preis aus Registry statt Hardcoded.

#### Backend: `getChain.js`

```javascript
// NACHHER: Base-Support hinzufügen
import { base, baseSepolia } from "viem/chains";

export function getChainByCAIP2(caip2Id) {
  const chains = {
    "eip155:10": optimism,
    "eip155:11155420": optimismSepolia,
    "eip155:8453": base,
    "eip155:84532": baseSepolia,
  };
  return chains[caip2Id] || optimism;
}

export function getLLMv1ContractConfig(caip2Id) {
  const configs = {
    "eip155:10":       { address: "0x833F39D6e67390324796f861990ce9B7cf9F5dE1", abi: LLMv1ABI },
    "eip155:11155420": { address: "0xB3dbD44477a7bcf253f2fA68eDb4be5aF2F2cA56", abi: LLMv1ABI },
    "eip155:8453":     { address: "TBD_AFTER_DEPLOY", abi: LLMv1ABI },
    "eip155:84532":    { address: "TBD_AFTER_DEPLOY", abi: LLMv1ABI },
  };
  return configs[caip2Id];
}
```

#### Backend: `sc_llm.js`

Request-Body erhält zwei neue optionale Felder:

```json
{
  "data": { "prompt": [...], "model": "mistral-small" },
  "auth": { ... },
  "chain": "eip155:8453"
}
```

- `model` default: `"llama-70b"` (Rückwärtskompatibel)
- `chain` default: `"eip155:10"` (Optimism, Rückwärtskompatibel)

#### Backend: Merkle Trees

S3-Pfad wird Chain-aware:

```
merkle/trees.json                    → (alt, Optimism-only)
merkle/eip155_10/trees.json          → (Optimism)
merkle/eip155_8453/trees.json        → (Base)
```

#### Frontend

1. **Model-Selector:** Dropdown mit Llama 70B / Mistral Small / Mistral Nemo
2. **Chain:** Auto-Detect von Wagmi `useChainId()` — User switched Chain im Wallet
3. **Wagmi Config:** Base zur Chain-Liste hinzufügen

### 5.4 Aufwandsschätzung

| Aufgabe | Dauer | Details |
|---|---|---|
| LLMv1 auf Base + Base Sepolia deployen | ~0,5 Tage | Bestehende Deploy-Scripts, nur neue Chain-Config |
| `MODEL_REGISTRY` + `callLLMAPI()` refactorn | ~1 Tag | Model-Lookup statt Hardcoded, gleicher IONOS-Endpoint |
| `convertTokensToCost()` model-aware | ~0,5 Tage | `pricePerMillionEUR` aus Registry |
| `getChain.js` → CAIP-2 + Base-Support | ~1 Tag | Neue Funktion `getChainByCAIP2()`, altes Pattern deprecaten |
| `sc_llm.js` Request-Parsing (model + chain) | ~0,5 Tage | Defaults für Rückwärtskompatibilität |
| Merkle-Trees Chain-aware (S3-Pfade) | ~1 Tag | `merkle/eip155_{chainId}/trees.json` |
| Frontend: Model-Dropdown + Base in Wagmi | ~1–2 Tage | Simpler Dropdown, Chain auto-detect |
| Tests (Hardhat + Vitest) | ~2–3 Tage | Deploy-Tests auf Base, Model-Registry-Tests |
| E2E Sepolia-Roundtrip | ~1 Tag | Opt Sepolia + Base Sepolia |
| | **~8–10 Tage (~2 Wochen)** | |

### 5.5 Vergleich: Was wir gespart haben

| Vorheriger Plan | Jetziger Plan | Ersparnis |
|---|---|---|
| Neuer LLMv2 Contract (Multi-Token) | LLMv1 unverändert | ~2 Wochen |
| USDC + EURC Integration | ETH only | ~2 Wochen |
| Oracle/API für Preiskonversion | Hardcoded EUR/ETH (existiert bereits) | ~1 Woche |
| Token-Whitelist, SafeERC20 | — | Weniger Angriffsfläche |
| **6–7 Wochen** | **~2 Wochen** | **~4–5 Wochen** |

### 5.6 Bekannte Limitierungen (akzeptiert)

| Limitierung | Auswirkung | Warum akzeptabel |
|---|---|---|
| ETH-Preisvolatilität | `convertTokensToCost()` hat Hardcoded `CONVERSION_RATE_EUR_PER_ETH = 3000n` | Micropayments — bei $0,001/Request ist ±30% Abweichung = $0,0003. Kann periodisch angepasst werden. |
| Kein Stablecoin | User muss ETH managen | Zielgruppe hat bereits ETH (Wallet-User) |
| Separate Balances pro Chain | User muss pro Chain depositen | Kein Cross-Chain-Bridging nötig, einfacheres Mental-Model |
| IONOS-Abhängigkeit | Alle Modelle auf einem Endpoint | Mistral-eigene API kann später als Fallback ergänzt werden |

