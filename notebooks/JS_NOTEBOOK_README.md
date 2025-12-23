# 🚀 x402 v2 JavaScript/TypeScript Notebook

## Setup

### 1. Deno & Bun Installation (bereits erledigt ✅)

```bash
# Deno
curl -fsSL https://deno.land/install.sh | sh

# Bun
curl -fsSL https://bun.com/install | bash

# Deno Jupyter Kernel
deno jupyter --install
```

### 2. Konfiguration (.env Datei)

```bash
# Copy example to .env
cp .env.example .env

# Edit .env and add your private key
nano .env  # or use any editor
```

**Wichtig:** Die `.env` Datei ist in `.gitignore` - dein Private Key wird nie committed!

### 3. Notebook öffnen

1. Öffne `genimg_x402_v2_js.ipynb` in VS Code
2. **Wichtig:** Wähle **"Deno"** als Kernel (oben rechts in VS Code)
3. Führe die Zellen nacheinander aus

## Warum Deno statt Python?

| Feature | Deno/JavaScript | Python |
|---------|----------------|--------|
| **x402 v2 Support** | ✅ Native (@x402/core) | ❌ Nicht verfügbar |
| **Type Safety** | ✅ TypeScript | ~ (mit typing) |
| **Code Sharing** | ✅ Gleicher Code wie Service | ❌ Neuer Code nötig |
| **Viem/Ethers** | ✅ Native | ⚠️ Via web3.py |
| **Setup** | Simple (npm packages) | Komplex |

## Notebook Struktur

```
📓 genimg_x402_v2_js.ipynb
│
├─ 📦 Dependencies Import
│   └─ @x402/core, @x402/evm, viem
│
├─ ⚙️ Configuration
│   ├─ Network Selection (Optimism/Base, Mainnet/Testnet)
│   ├─ Private Key
│   └─ Service URLs
│
├─ 🔑 Wallet Setup
│   └─ Create account + x402 Client
│
├─ 🚀 Payment Flow (Main Cell)
│   ├─ 1. Request → 402
│   ├─ 2. Parse Payment Requirements
│   ├─ 3. Create Payment (EIP-3009)
│   └─ 4. Request with Payment → Success
│
└─ 🧪 Debug Tools
    ├─ USDC Balance Check
    ├─ Facilitator Query
    └─ Manual Payment Creation
```

## Verwendung

### Quick Start

1. **Setup .env Datei:**
   ```bash
   cp .env.example .env
   # Edit .env and add your PRIVATE_KEY
   ```

2. Öffne Notebook, wähle Deno Kernel

3. **Zelle 2**: Dependencies + .env laden (dauert beim ersten Mal ~30 Sekunden)

4. **Zelle 4**: Konfiguration wird aus .env geladen:
   - `USE_MAINNET=false` → Testnet
   - `USE_BASE=false` → Optimism
   - `PRIVATE_KEY=0x...` → Dein Wallet

5. **Zelle 6**: Wallet Setup

6. **Zelle 8**: 🚀 **Payment Flow ausführen** - das ist die Hauptzelle!

### Erwartete Ausgabe

```
🌐 Step 1: Initial request (no payment)...
📡 Response Status: 402
✅ Parsed v2 Payment-Required header
💳 x402 Version: 2
🌐 Available Networks: 4
✅ Found matching network: eip155:11155420
💰 Amount: 1000 (0.001 USDC)

💳 Step 2: Creating payment...
✅ Payment created and signed
📝 Payload scheme: exact
🌐 Payload network: eip155:11155420

🚀 Step 3: Sending request with payment...
📡 Response Status: 200

🎉 SUCCESS!
🖼️  Image URL: https://...
🎫 NFT Token ID: 42
📍 NFT Contract: 0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb

✅ Payment settled:
   Transaction: 0x...
   Network: eip155:11155420
```

## Voraussetzungen

### Testnet (Sepolia):
- [ ] USDC auf Optimism Sepolia oder Base Sepolia
  - [Optimism Sepolia Faucet](https://faucet.optimism.io/)
  - [Circle Faucet (USDC)](https://faucet.circle.com/)
  - Mindestens 0.001 USDC benötigt

### Mainnet:
- [ ] USDC auf Optimism oder Base
  - Kaufe USDC auf Exchange
  - Bridge zu Optimism/Base
  - Mindestens 0.001 USDC benötigt

### Services:
- [ ] GenImg Service läuft (`http://localhost:8082/genimg`)
- [ ] Facilitator läuft (`http://localhost:3000`)

## Troubleshooting

### Kernel nicht gefunden?

```bash
# Kernel neu installieren
deno jupyter --install

# VS Code reload
Cmd+Shift+P → "Developer: Reload Window"
```

### Dependencies laden langsam?

Beim ersten Mal lädt Deno alle npm Packages. Das dauert ~30-60 Sekunden. Danach ist es gecached.

### "Module not found"?

Prüfe Deno Version:
```bash
deno --version  # Sollte >= 2.0 sein
```

### Signature Fehler?

- Prüfe ob Private Key korrekt ist (mit 0x Prefix)
- Prüfe ob USDC Balance ausreichend ist
- Check Facilitator Logs

## Vorteile dieses Setups

1. **Production-Ready Code**: Gleicher Code wie im Service
2. **Schnelles Prototyping**: Änderungen sofort testbar
3. **Type Safety**: TypeScript caught Fehler early
4. **Native x402**: Keine Manual Implementation nötig
5. **Live Debugging**: Console logs direkt im Notebook

## Next Steps

Nach erfolgreichem Test:

1. Deploy Service zu Scaleway:
   ```bash
   cd ../scw_js
   serverless deploy
   ```

2. Update `SERVICE_URL` im Notebook auf Production URL

3. Test mit Mainnet (USE_MAINNET = true)

4. Integriere in deine App!

## Vergleich zu Python Notebook

Das alte Python Notebook (`genimg_x402_demo.ipynb`) verwendet x402 v1. Die JavaScript Version hier nutzt v2 mit:

- ✅ Offiziellen @x402 Packages statt Manual Implementation  
- ✅ Multi-Network Support (4 Networks statt 2)
- ✅ Besseres Error Handling
- ✅ Type Safety durch TypeScript
- ✅ Gleicher Code wie Production Service

---

**Ready to go!** Öffne das Notebook und führe die Zellen aus. 🚀
