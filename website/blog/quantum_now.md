---
publishing_date: 2025-10-13
title: What can we learn from NFTs for quantum computing with smart contracts ?
category: "quantum"
secondaryCategory: "blockchain"
description: I discuss the connections between my recent work on blockchain projects and their connection to possible smart contracts for quantum computing.
tokenID: 123
---

In a [recent blog post](/blog/17), I laid out some basic ideas on how smart contracts could be used to democratize access to quantum computing resources. However, this previous post only laid out the basic ideas and did not go into too many details on the implementation. In this post, I will follow up on this topic and detail what I learned up to here, especially what works and what does not work for the moment. In the next post, I will then try to connect it all and lay out a realistic implementation plan of smart contracts in the context of quantum computing.

## On the similiarites between NFT generation and quantum computing

In this first section, I want to discuss why I decided that NFT generation is a good training ground for the more complex problem of smart contracts for quantum computing. The quantum computing workflow can be summarized as follows:

1. Write some instructions, i.e. some json.
2. Send the instructions to some super fancy machine you do not really understand, i.e. a quantum computer.
3. Get back the result that you really do not want to share with anyone but that you also do not really understand in a lot of cases.

This workflow is actually not too far away from the workflow of generating NFTs with the help of AI models. The NFT generation workflow can be summarized as follows:

1. Write some instructions, i.e. some text prompt into some json.
2. Send the instructions to some super fancy machine you do not really understand, i.e. an AI model.
3. Get back the result that you also do not really understand in a lot of cases.

So you might see that the workflows are quite similar in that they send instructions to some remote machine, you need to pay for the service, and you get back a result that you do not really understand, i.e. that is hard (impossible?) to verify.

## Learning 1: NFTs are great for this use case

NFTs are really a great way to implement this kind of ideas. They provide clear ownership for the instructions. They are standardized and easy to implement. They are super flexible and based on json files. The tech stack behind them is super well developed. You can store the NFTs on S3 or IPFS and you can encrypt them if you really want to. Feel free to read more about my experiences [here](/blog/9).


## Learning 2: Blockchain payments are really cheap by now

When I started to work on this topic, I was a bit worried about the costs of using the blockchain with transactions on ETH itself that could easily cost several dollars. However, after working through some of the details, I realized that the costs are actually really low by now if you use layer 2 solutions like [Optimism](https://www.optimism.io). The costs were actually so low that I could implement small support buttons of the style "buy me a coffee" on my website or generate images. Together with [some merke tree techniques](/blog/16/), I could even push it further to make it viable for calls that cost less than a cent. As of October 2025, I would estimate the costs as follows:

- AI model provider (BFL: 6¢, Ionos: 7¢, DeepInfra: 5¢)
- Blockchain (Optimism: 1¢, Base: 1¢, Ethereum: $2+)
- Service margin (0-3¢)

 So all in all, it is straightforward to have payment costs of less than 1 cent per transaction and this feels pretty much like a solved problem.

## Learning 3: Connections to normal APIs requires custom oracles

I think that one of the strangest thing with the block chain is the connection to traditional APIs. It became really clear to me that it is really straight forward to make transactions there, this is what it meant for. However, the blockchain does not really have concepts of time or "calling somewhere else". So you use "oracles" to make this work. Think of them as the translator between two worlds:

 - **Blockchain:** Can handle payments and store data, but can't call external APIs or wait for responses
 - **Traditional APIs:** Can run AI models or quantum computers, but don't understand blockchain

An oracle is a server that:
 1. Watches the blockchain for events (e.g., "user just paid for an image")
 2. Calls the external API (e.g., Stable Diffusion takes 30 seconds)
 3. Brings the result back to update the blockchain (e.g., stores image URL in NFT)

Initially (as mentioned in [blog post 6](/blog/6)), I thought [Chainlink Functions](https://docs.chain.link/chainlink-functions) looked promising. However, after testing, I discovered two dealbreakers:

1. The 3¢/request overhead is substantial when AI generation itself costs only 7¢
2. Chainlink Functions require APIs to respond within 9 seconds, but AI image generation takes 30+ seconds

This led me to implement a custom oracle instead. The challenge is ensuring only "reliable" oracles can perform these operations as I do not want the users to be tricked.

## Learning 4: Make random systems fully trustless is hard

This led to my forth learning, which is that it is really hard to have a fully trustless system. Let me explain what I mean with that.

If we want to democratize access to quantum computing resources, we would like to make it as simple as possible for anyone to participate. Anyone who is interested can use the service through the blockchain. And anyone who claims to have a quantum computer can be onboarded and provide the service. 

Why is this so tough in practice? You need to have some way to verify that the results are actually correct. But in quantum and in generative AI the results are probabilistic. So how do you verify that the provider is not just tricking you? I genuinely do not know the answer and think that this could be a fun research problem. 

However, for the moment, I could not find a better solution than whitelisting "reliable" oracles that provide the service. This is clearly the centralization bottleneck, as new providers have to be whitelisted and I have no automated algorithm to detect cheating yet.

## Conclusion and outlook

This brings me to the end of this learning journey. Taken everything together, I do not see anything that would prevent the implementation of a system which enables smart contract-based quantum computing. Here's where we stand:

| Aspect | Today (Centralized Cloud) | Proven with AI NFTs ✅ | Future Quantum Goal 🔮 |
|--------|-------------------------|----------------------|---------------------|
| **Payment** | Accounts, subscriptions | Smart contract (10¢) | Smart contract (competitive) |
| **Ownership** | Provider database | NFT on blockchain | NFT on blockchain |
| **Privacy** | Trust required | Open | Encrypted on IPFS 🔮 |
| **User Access** | Registration needed | Permissionless | Permissionless |
| **Verification** | Trust provider | Trust oracle ⚠️ | Decentralized oracles |
| **Provider choice** | Few vendors | Single (prototype) ⚠️ | Open marketplace |

The key insights were:

- ✅ **Payment, ownership, privacy are solved** - my AI implementation proves it works on Layer-2 for <1¢ transaction costs
- ⚠️ **Verification remains the challenge** - both AI and quantum results are hard to verify trustlessly; for now, whitelisting and economic staking are the pragmatic approaches
- 🔮 **Path forward** - transition from centralized oracle (my server) to decentralized oracle network (multiple quantum providers)

So in the next blog post, I will lay out the technical details of how the smart contract architecture could be implemented for quantum computing. If you have experiences, ideas or suggestions—especially on trustless verification or oracle networks—feel free to write down ideas here, exchange and get active. The more people that care, the more real this becomes.
