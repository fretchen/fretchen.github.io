# x402: Standardisierte Zahlungen für AI-Agenten

> **Status:** Entwurf - bitte ausfüllen
> 
> **Datum:** Dezember 2025

## TL;DR

<!-- 1-2 Sätze: Was ist das Hauptergebnis? -->
Der Endpoint `imagegen-agent.fretchen.eu` nutzt jetzt den x402-Standard für Zahlungen. Das ermöglicht AI-Agenten, automatisch für Bildgenerierung zu bezahlen – ohne Accounts, ohne Sessions.

---

## Einleitung

<!-- 
Kontext: Warum ist HTTP 402 "Payment Required" interessant?
- Der Status-Code existiert seit 1999, wurde aber nie standardisiert
- Coinbase hat mit x402 einen offenen Standard entwickelt
- Perfekt für Machine-to-Machine Zahlungen
-->

---

## Der x402-Standard

<!-- 
Erkläre das Grundprinzip:
1. Client fragt Resource an
2. Server antwortet mit 402 + Payment-Requirements im Header
3. Client signiert Zahlung (EIP-3009, kein Gas!)
4. Server verifiziert und liefert Resource

Referenz: https://docs.cdp.coinbase.com/x402/welcome

Vorteile:
- Keine Accounts/Sessions nötig
- AI-Agenten können autonom bezahlen
- Micropayments möglich
- Standardisierte HTTP-Schnittstelle
-->

---

## Die Architektur

<!-- 
ASCII-Diagramm der Komponenten:

```
┌─────────────────┐         ┌──────────────────────────────┐         ┌─────────────────────┐
│  Client/Agent   │ ──────► │  imagegen-agent.fretchen.eu  │ ──────► │  Facilitator        │
│                 │ ◄────── │  (Resource Server)           │ ◄────── │  facilitator.fretchen.eu │
└─────────────────┘         └──────────────────────────────┘         └──────────┬──────────┘
                                       │                                         │
                                       ▼                                         ▼
                               ┌──────────────┐                          ┌───────────────┐
                               │ Black Forest │                          │ Optimism L2   │
                               │ Labs API     │                          │ (USDC EIP-3009) │
                               └──────────────┘                          └───────────────┘
```
-->

---

## Der Facilitator

<!-- 
Was macht der Facilitator?

1. **Verify** – Prüft off-chain, ob die signierte Zahlung gültig ist
2. **Settle** – Führt die Zahlung on-chain aus (EIP-3009 transferWithAuthorization)
3. **Supported** – Gibt an, welche Netzwerke/Assets unterstützt werden

Warum ein eigener Facilitator?
- Coinbase bietet nur Base/Solana an
- Wir brauchen Optimism (dort leben unsere NFTs)
- Whitelist-Logik für NFT-Holder (GenImNFTv4, LLMv1)

Code: `x402_facilitator/` im Branch `facilitator`
Endpoint: https://facilitator.fretchen.eu
-->

---

## Der ImageGen Endpoint

<!-- 
Wie funktioniert der Endpoint jetzt?

1. **Request ohne Zahlung:**
   ```http
   GET /genimg HTTP/1.1
   Host: imagegen-agent.fretchen.eu
   ```

2. **Antwort 402 mit Payment-Requirements:**
   ```http
   HTTP/1.1 402 Payment Required
   PAYMENT-REQUIRED: {...paymentDetails...}
   ```
   
3. **Request mit Zahlung:**
   ```http
   GET /genimg HTTP/1.1
   PAYMENT-SIGNATURE: {...signedPayment...}
   ```

4. **Erfolg:**
   - Bild wird generiert (Black Forest Labs)
   - NFT wird geminted (GenImNFTv4)
   - Zahlung wird gesettled (Facilitator)

Preis: 0.07 USDC (~7 Cent) pro Bild
Code: `scw_js/genimg_x402_token.js`
-->

---

## Was das für AI-Agenten bedeutet

<!-- 
Der eigentliche Punkt: Standardisierung!

Ein AI-Agent kann jetzt:
1. Den Endpoint anpingen
2. Die Payment-Requirements lesen (standardisiertes Format)
3. Automatisch mit USDC bezahlen (signieren, kein Gas)
4. Das Bild erhalten

Keine proprietäre Integration nötig – x402 ist ein offener Standard.
Jeder x402-kompatible Client funktioniert out-of-the-box.
-->

---

## Technische Details

<!-- 
Für die Nerds:

**Netzwerk:** Optimism L2
**Asset:** USDC (0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85)
**Zahlungsschema:** EIP-3009 (transferWithAuthorization)
**Facilitator-Endpunkte:**
- POST /verify
- POST /settle  
- GET /supported

**NFT-Integration:**
- GenImNFTv4: 0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb
- Server mintet das NFT nach erfolgreicher Zahlung
- Metadaten werden auf IPFS gespeichert
-->

---

## Links & Ressourcen

- [x402 Dokumentation (Coinbase)](https://docs.cdp.coinbase.com/x402/welcome)
- [Facilitator Code](https://github.com/fretchen/fretchen.github.io/tree/facilitator/x402_facilitator)
- [ImageGen Endpoint Code](https://github.com/fretchen/fretchen.github.io/blob/main/scw_js/genimg_x402_token.js)
- [EIP-3009: Transfer with Authorization](https://eips.ethereum.org/EIPS/eip-3009)

---

## Fazit

<!-- 
1-2 Sätze: Was ist der Take-away?

x402 macht "Payment Required" endlich nutzbar. 
Für Maschinen und Menschen.
-->
