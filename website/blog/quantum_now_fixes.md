# Schritt-für-Schritt Fix-Anleitung für quantum_now.md

**Status:** 15. Oktober 2025  
**Implementiert:** ✅ Reliable nodes/oracles erklärt, 3-Spalten-Tabelle, Call-to-Action  
**Noch zu tun:** 🔴 Grammar, Flow, logische Übergänge

---

## 🔴 MUST-FIX (20 Minuten, sofort machen)

### Schritt 1: Tippfehler korrigieren (5 Min)

#### Fix 1.1: Überschrift - "similarities" statt "similiarites"

**Zeile 11:**

```markdown
## On the similarities between NFT generation and quantum computing
```

#### Fix 1.2: "fourth" statt "forth"

**Zeile ~62 (Learning 4 Intro):**

```markdown
This led to my fourth learning, which is that [...]
```

#### Fix 1.3: Plural-Verb im Heading

**Zeile ~45 (Learning 3 Heading):**

```markdown
## Learning 3: Connections to normal APIs require custom oracles
```

#### Fix 1.4: "by that" statt "with that"

**Zeile ~63:**

```markdown
Let me explain what I mean by that.
```

---

### Schritt 2: Formatierung bereinigen (5 Min)

#### Fix 2.1: Führende Leerzeichen entfernen (Learning 3)

**Zeile ~49-51:** Entferne Leerzeichen vor den Bulletpoints

```markdown
- **Blockchain:** Can handle payments and store data, but can't call external APIs
- **Traditional APIs:** Can run AI models or quantum computers, but don't understand blockchain
```

**Zeile ~53-55:** Entferne Leerzeichen vor Nummerierung

```markdown
1. Watches the blockchain for events (e.g., "user just paid for an image")
2. Calls the external API (e.g., Stable Diffusion takes 30 seconds)
3. Brings the result back to update the blockchain (e.g., stores image URL in NFT)
```

#### Fix 2.2: Leerzeilen vor Conclusion

**Zeile ~69:** Reduziere von 3 auf 2 Leerzeilen

```markdown
(Ende von Learning 4)

## Conclusion and outlook
```

---

### Schritt 3: Kritische logische Brücken (5 Min)

#### Fix 3.1: Übergang zur Timeline verbessern

**Zeile ~28-29:** Ersetze den Satz

```markdown
VORHER:
So you might see that the workflows are quite similar [...]. To understand this better,
I've been experimenting with blockchain-enabled AI services over the last 10 months:

NACHHER:
So you might see that the workflows are quite similar in that they send instructions
to some remote machine, you need to pay for the service, and you get back a result
that you do not really understand, i.e. that is hard (impossible?) to verify.

This similarity isn't just theoretical—I've been testing it in practice over the last
10 months:
```

#### Fix 3.2: Trust-Trade-off in Learning 3 explizit machen

**Zeile ~60:** Erweitere den Satz

```markdown
VORHER:
This led me to implement a custom oracle instead. The challenge is ensuring only
"reliable" oracles can perform these operations as I do not want the users to be tricked.

NACHHER:
This led me to implement a custom oracle instead.

**The trust trade-off:** While blockchain transactions are trustless, my oracle is
centralized—I control it. Users must trust that I'll execute requests honestly. This
is pragmatic for now, but it's the weakest link in the system.

The challenge is ensuring only "reliable" oracles can perform these operations.
```

#### Fix 3.3: Brücke von Learning 3 zu Learning 4

**Zeile ~60 (Ende von Learning 3):** Füge am Ende hinzu

```markdown
The challenge is ensuring only "reliable" oracles can perform these operations.
But this raises a deeper question: how do we verify they're actually doing the work honestly?
```

---

### Schritt 4: Tabellen-Inkonsistenz (2 Min)

#### Fix 4.1: Privacy-Zeile korrigieren

**Zeile ~76 (Tabelle):**

```markdown
VORHER:
| **Privacy** | Trust required | Open | Encrypted on IPFS 🔮 |

NACHHER:
| **Privacy** | Trust required | Encrypted on IPFS | Encrypted on IPFS |
```

**Begründung:** AI ist auch verschlüsselt, nicht "Open"

---

### Schritt 5: Grammar in Conclusion (3 Min)

#### Fix 5.1: Present tense statt past

**Zeile ~82:**

```markdown
VORHER:
The key insights were:

NACHHER:
Key takeaways:
```

#### Fix 5.2: Call-to-Action Grammar

**Zeile ~92:**

```markdown
VORHER:

- Are there other known oracle solutions than Chainlink for 30+ second operations?

NACHHER:

- Do you know oracle solutions besides Chainlink for 30+ second operations?
```

---

## 🟡 SHOULD-FIX (30 Minuten, deutlich bessere Qualität)

### Schritt 6: Learning 2 - Kosten-Breakdown verbessern (8 Min)

**Zeile ~39-42:** Umstrukturieren für besseren Kontext

```markdown
VORHER:
[...] I realized that the costs are actually really low by now if you use layer 2
solutions like Optimism. The costs were actually so low that I could implement small
support buttons [...]. As of October 2025, I would estimate the costs as follows:

- AI model provider (BFL: 6¢, Ionos: 7¢, DeepInfra: 5¢)
- Blockchain (Optimism: 1¢, Base: 1¢, Ethereum: $2+)
- Service margin (0-3¢)

So all in all, it is straightforward to have payment costs of less than 1 cent per
transaction and this feels pretty much like a solved problem.

NACHHER:
[...] I realized that the costs are actually really low by now if you use layer 2
solutions like Optimism. The costs were so low that I could implement small support
buttons of the style "buy me a coffee" on my website or generate images. Together with
[some merkle tree techniques](/blog/16/), I could even push it further to make it viable
for calls that cost less than a cent.

As of October 2025, here's what a typical image generation costs:

- **AI computation:** 5-7¢ depending on provider (BFL: 6¢, Ionos: 7¢, DeepInfra: 5¢)
- **Blockchain transaction:** ~1¢ (Optimism, Base) vs $2+ (Ethereum mainnet)
- **Service margin:** 0-3¢

**Total:** ~10¢ per image with <1¢ in blockchain costs. For quantum computing, the
same Layer-2 infrastructure means payment costs are essentially a solved problem.
```

---

### Schritt 7: Learning 1 - Struktur verbessern (10 Min)

**Zeile ~34-37:** Besserer Einstieg ins konkrete Beispiel

```markdown
VORHER:

## Learning 1: NFTs are great for this use case

NFTs are really a great way to implement this kind of ideas. What does this mean in
this specific case of generative AI and quantum computing? Let us start with the AI
images (see [this blog post](/blog/9) on my experiences). When Alice generates an
AI image with the prompt "quantum computer in a forest":

NACHHER:

## Learning 1: NFTs are great for this use case

What does this mean for generative AI and quantum computing? Let me illustrate with
a concrete example from my AI image work ([blog 9](/blog/9)).

**Example scenario - AI image generation:**

When Alice generates an AI image with the prompt "quantum computer in a forest":
```

**Zeile ~46-51:** Quantum-Übersetzung klarer absetzen

```markdown
NACHHER (nach den 5 Alice-Punkten):

**Translated to quantum computing:**

- Bob submits a quantum circuit and pays via smart contract
- He gets an NFT with unique identifier and reference to the encrypted results
- The NFT proves Bob ran this computation at this time
- No centralized database needed, no account registration

**Why NFTs work well:**

NFTs provide clear ownership for the instructions. They are standardized (ERC-721),
easy to implement, and super flexible based on JSON files. The tech stack behind them
is well-developed. You can store them on S3 or IPFS and encrypt them if needed. All
of this makes them an ideal fit for both AI and quantum computing results.
```

---

### Schritt 8: Learning 4 - Intro straffen (5 Min)

**Zeile ~62-64:** Direkter zum Punkt

```markdown
VORHER:

## Learning 4: Make random systems fully trustless is hard

This led to my forth learning, which is that it is really hard to have a fully
trustless system. Let me explain what I mean with that.

If we want to democratize access to quantum computing resources, we would like to
make it as simple as possible for anyone to participate. Anyone who is interested
can use the service through the blockchain. And anyone who claims to have a quantum
computer can be onboarded and provide the service.

NACHHER:

## Learning 4: Making systems fully trustless is hard

Achieving true trustlessness is the toughest challenge I encountered.

Ideally, democratizing quantum computing means:

- **For users:** Anyone can access the service (just needs a wallet)
- **For providers:** Anyone can offer quantum computing resources (just runs an oracle)

But here's the problem:
```

---

### Schritt 9: Wortwiederholungen reduzieren (7 Min)

Suche und ersetze folgende Wörter (wo es Sinn macht):

#### "really" (erscheint 8x)

- Zeile ~34: "NFTs are really a great way" → "NFTs are an excellent way"
- Zeile ~39: "costs are actually really low" → "costs are remarkably low"
- Zeile ~47: "blockchain does not really have concepts" → "blockchain lacks concepts"
- Zeile ~62: "it is really hard" → "it's challenging"

#### "quite" (erscheint 3x)

- Zeile ~28: "quite similar" → "very similar" oder einfach "similar"
- Zeile ~47: "quite some games" → "various workarounds"

#### "actually" (erscheint 4x)

- Zeile ~20: "actually not too far away" → "remarkably close"
- Zeile ~39: "actually really low" → "surprisingly low"
- Zeile ~41: "actually so low" → "low enough"
- Zeile ~67: "actually correct" → "correct"

---

## 🟢 NICE-TO-HAVE (15 Minuten, Polish)

### Schritt 10: Conclusion - Tabellen-Intro verbessern (3 Min)

**Zeile ~75:**

```markdown
VORHER:
Taken everything together, I do not see anything that would prevent the implementation
of a system which enables smart contract-based quantum computing. Here's where we stand:

NACHHER:
Taken everything together, I do not see anything that would prevent the implementation
of a system which enables smart contract-based quantum computing.

Here's where we stand—comparing traditional cloud, my working AI prototype, and the
quantum computing goal:
```

---

### Schritt 11: Pronomen-Bezug klären (5 Min)

**Zeile ~48 (Learning 3):**

```markdown
VORHER:
So you use "oracles" to make this work. Think of them as the translator between two worlds:

NACHHER:
So you use "oracles" to make this work. Think of oracles as translators between two worlds:
```

**Grund:** "them" bezieht sich unklar auf "oracles" 2 Sätze vorher

---

### Schritt 12: Emoji-Konsistenz (7 Min)

**Option A: Emojis in Tabellen-Zellen hinzufügen**

```markdown
| **Verification** | Trust provider | Trust oracle ⚠️ | Decentralized oracles 🔮 |
| **Provider choice** | Few vendors ⚠️ | Single (prototype) ⚠️ | Open marketplace 🔮 |
```

**Option B: Nur in "Future" Spalte lassen (aktueller Zustand beibehalten)**

- Keine Änderung nötig

**Empfehlung:** Option B - weniger ist mehr bei Emojis

---

## 📋 CHECKPOINT NACH ALLEN FIXES

Nach allen Änderungen sollte der Post:

✅ **Keine Tippfehler** haben (similarities, fourth, require)  
✅ **Konsistente Formatierung** (keine führenden Leerzeichen, 2 Leerzeilen)  
✅ **Klare Übergänge** zwischen Sections  
✅ **Explizite Trust-Trade-offs** in Learning 3  
✅ **Logische Brücken** zwischen Learnings  
✅ **Strukturierte Listen** in Learning 2  
✅ **Konkrete Beispiele** in Learning 1  
✅ **Reduzierte Wortwiederholungen** (really, quite, actually)  
✅ **Korrigierte Tabelle** (Privacy-Zeile)  
✅ **Bessere Grammar** (key insights are, besides Chainlink)

---

## 🔍 FINAL CHECK

Nach allen Fixes durchführen:

1. **Spell-Check:** Cmd+Shift+P → "Spell Check"
2. **Markdown Lint:** `npm run lint` (falls vorhanden)
3. **Laut vorlesen:** Stolperstellen finden sich beim Vorlesen
4. **Build testen:** `npm run build` → keine Fehler
5. **Preview:** Lokal anschauen → Tabellen OK? Links funktionieren?

---

## ⏱️ ZEITPLAN

Empfohlene Reihenfolge:

**Session 1 (20 Min):** Must-Fix Schritte 1-5

- Tippfehler, Formatierung, kritische Brücken
- **Ergebnis:** Post ist technisch korrekt

**Session 2 (30 Min):** Should-Fix Schritte 6-9

- Kosten-Breakdown, Learning 1+4, Wortwiederholungen
- **Ergebnis:** Post liest sich deutlich besser

**Session 3 (15 Min):** Nice-to-Have Schritte 10-12

- Tabellen-Intro, Pronomen, Emoji-Konsistenz
- **Ergebnis:** Post ist polished

**Gesamt:** ~65 Minuten für einen sehr guten Post
