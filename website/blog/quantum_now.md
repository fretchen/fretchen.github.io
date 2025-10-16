---
publishing_date: 2025-10-16
title: "Quantum Smart Contracts II: What can we learn from NFTs for quantum computing with smart contracts ?"
category: "quantum"
secondaryCategory: "blockchain"
description: Can blockchain solve quantum computing's access problem? I tested the architecture with AI NFTs—here's what worked, what didn't, and what's still unsolved.
tokenID: 130
---

In a [recent blog post](/blog/17), I laid out some basic ideas on how smart contracts could be used to democratize access to quantum computing resources. However, this previous post only laid out the basic ideas and did not go into too many details on the implementation. In this post, I will follow up on this topic and detail what I learned up to here, especially what works and what does not work for the moment. In the next post, I will then try to connect it all and lay out a realistic implementation plan of smart contracts in the context of quantum computing.

## On the similarities between NFT generation and quantum computing

In this first section, I want to discuss why I decided that NFT generation is a good training ground for the more complex problem of smart contracts for quantum computing. The quantum computing workflow can be summarized as follows:

1. Write some instructions, i.e. some json.
2. Send the instructions to some super fancy machine you do not understand, i.e. a quantum computer.
3. Get back the result that you do not want to share with anyone but that you also do not understand in a lot of cases.

This workflow is actually not too far away from the workflow of generating NFTs with the help of AI models. The NFT generation workflow can be summarized as follows:

1. Write some instructions, i.e. some text prompt into some json.
2. Send the instructions to some super fancy machine you do not understand, i.e. an AI model.
3. Get back the result that you also do not understand in a lot of cases.

So you might see that the workflows are quite similar in that they send instructions
to some remote machine, you need to pay for the service, and you get back a result
that you do not understand, i.e. that is hard (impossible?) to verify.

Given this similarity isn't just theoretical—I've been testing it in practice over the last 10 months:

- **January:** Built AI image generator ([blog 6](/blog/6))
- **April:** Added crypto payments + NFT minting ([blog 9](/blog/9))
- **October:** Realized this architecture could democratize quantum computing ([blog 17](/blog/17))

This post connects the dots: What did I learn from AI that applies to quantum computing?

## Learning 1: NFTs are great for this use case

NFTs are an excellent way to implement this kind of ideas. What does this mean for generative AI and quantum computing? Let me illustrate with
a concrete example from my AI image work ([blog 9](/blog/9)).

**Example scenario - AI image generation:**

When Alice generates an AI image with the prompt "quantum computer in a forest":

1. She pays 10¢ and receives an NFT with a unique identifier
2. The NFT contains: prompt, timestamp, model version, image URL link
3. Alice can prove she owns this specific generation (unlike with Midjourney)
4. She can sell/transfer the NFT on OpenSea
5. All metadata is permanent and verifiable on-chain

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

## Learning 2: Blockchain payments are remarkably cheap by now

When I started to work on this topic, I was a bit worried about the costs of using the blockchain with transactions on ETH itself that could easily cost several dollars. However, after working through some of the details, I realized that the costs are remarkably low by now if you use layer 2 solutions like [Optimism](https://www.optimism.io). The costs were so low that I could implement small support buttons of the style "buy me a coffee" on my website or generate images. Together with [some merkle tree techniques](/blog/16/), I could even push it further to make it viable for calls that cost less than a cent.

As of October 2025, here's what a typical image generation costs:

- **AI computation:** 5-7¢ depending on provider (BFL: 6¢, Ionos: 7¢, DeepInfra: 5¢)
- **Blockchain transaction:** ~1¢ (Optimism, Base) vs $2+ (Ethereum mainnet)
- **Service margin:** 0-3¢

**Total:** ~10¢ per image with <1¢ in blockchain costs. For quantum computing, the
same Layer-2 infrastructure means payment costs are essentially a solved problem.

## Learning 3: Connections to normal APIs require custom oracles

I think that one of the strangest thing with the block chain is the connection to traditional APIs. It became clear to me that it is really straight forward to make transactions there, this is what it meant for. However, the blockchain lacks concepts of time or "calling somewhere else". So you use "oracles" to make this work. Think of oracles as the translator between two worlds:

- **Blockchain:** Can handle payments and store data, but can't call external APIs or wait for responses
- **Traditional APIs:** Can run AI models or quantum computers, but don't understand blockchain

An oracle is a server that:

1.  Watches the blockchain for events (e.g., "user just paid for an image")
2.  Calls the external API (e.g., Stable Diffusion takes 30 seconds)
3.  Brings the result back to update the blockchain (e.g., stores image URL in NFT)

Initially (as mentioned in [blog post 6](/blog/6)), I thought [Chainlink Functions](https://docs.chain.link/chainlink-functions) looked promising. However, after testing, I discovered two dealbreakers:

1. The 3¢/request overhead is substantial when AI generation itself costs only 7¢
2. Chainlink Functions require APIs to respond within 9 seconds, but AI image generation takes 30+ seconds

This led me to implement a custom oracle instead. While blockchain transactions are trustless, my oracle is centralized—I control it. Users must trust that I'll execute requests honestly. This is a pragmatic solution for now, but it's the weakest link in the system. It actually raises a deeper question: how do we verify that the oracles are doing the work honestly?

## Learning 4: Make random systems fully trustless is hard

Achieving true trustlessness is the toughest challenge I encountered.

Ideally, democratizing quantum computing means:

- **For users:** Anyone can access the service (just needs a wallet)
- **For providers:** Anyone can offer quantum computing resources (just runs an oracle)

But here's the problem: You need to have some way to verify that the results are correct. But in quantum and in generative AI the results are probabilistic. So how do you verify that the provider is not just tricking you? I genuinely do not know the answer and think that this could be a fun research problem.

However, for the moment, I could not find a better solution than whitelisting "reliable" oracles that provide the service. This is clearly the centralization bottleneck, as new providers have to be whitelisted and I have no automated algorithm to detect cheating yet.

## Conclusion and outlook

This brings me to the end of this learning journey. Taken everything together, I do not see anything that would prevent the implementation of a system which enables smart contract-based quantum computing.

Here's where I stand — comparing traditional cloud, my working AI prototype, and the
quantum computing goal:

| Aspect              | Todays centralized cloud | Proven with AI NFTs   | Future Quantum Goal          |
| ------------------- | ------------------------ | --------------------- | ---------------------------- |
| **Payment**         | Accounts, subscriptions  | Smart contract (10¢)  | Smart contract (competitive) |
| **Ownership**       | Provider database        | NFT on blockchain     | NFT on blockchain            |
| **Privacy**         | Trust required           | Open                  | Encrypted on IPFS 🔮         |
| **User Access**     | Registration needed      | Permissionless        | Permissionless               |
| **Verification**    | Trust provider           | Trust oracle ⚠️       | Decentralized oracles        |
| **Provider choice** | Few vendors              | Single (prototype) ⚠️ | Open marketplace             |

My key takeaways are:

- ✅ **Payment, ownership, privacy are solved** - my AI implementation proves it works on Layer-2 for <1¢ transaction costs
- ⚠️ **Verification remains the challenge** - both AI and quantum results are hard to verify trustlessly; for now, whitelisting and economic staking are the pragmatic approaches
- 🔮 **Path forward** - transition from centralized oracle (my server) to decentralized oracle network (multiple quantum providers)

### Where I would be grateful for input

If you have experiences, ideas or suggestions—especially on trustless verification or oracle networks—feel free to write down ideas here, exchange and get active. The more people that care, the more real this becomes. Most urgently, I need feedback on the following topics:

**From quantum computing providers/researchers:**

- Would you run an oracle to offer your quantum computer via smart contracts?
- What verification methods could prove computation correctness?
- How important is privacy (encrypted results) for your use cases?

**From blockchain developers:**

- Do you know oracle solutions besides Chainlink for 30+ second operations?
- Any ideas on trustless verification of AI/quantum results?
- What are your experiences with similar "blockchain meets external API" projects?

**From potential users:**

- Would you pay via crypto to access quantum computing anonymously?
- Is NFT-based result storage valuable, or just gimmicky?
- What would make you choose this over AWS Braket?

**How to contribute:**

- Comment on this post
- Open GitHub issues at [this repo](https://github.com/fretchen/fretchen.github.io)

So in the next blog post, I will lay out the technical details of how the smart contract architecture could be implemented for quantum computing.
