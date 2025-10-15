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

When I started to work on this topic, I was a bit worried about the costs of using the blockchain with transactions on ETH itself that could easily cost several dollars. However, after working through some of the details, I realized that the costs are actually really low by now if you use layer 2 solutions like [Optimism](https://www.optimism.io). The costs were actually so low that I could implement small support buttons of the style "buy me a coffee" on my website or generate images. Together with some merke tree techniques, I could even push it further to make it viable for calls that cost less than a cent. So all in all, it is straightforward to have payment costs of less than 1 cent per transaction and this feels pretty much like a solved problem.

## Learning 3: Connections to normal APIs are possible, but tricky

I think that one of the strangest thing with the block chain is the connection to traditional APIs. It became really clear to me that it is really straight forward to make transactions there, this is what it meant for. However, the blockchain does not really have concepts of time or "calling somewhere else". So you have to play quite some games to make this work. Initially (as mentioned in [blog post 6](/blog/6)), I thought [Chainlink Functions](https://docs.chain.link/chainlink-functions) looked promising. However, after testing, I discovered two dealbreakers:

1. The 3¢/request overhead is substantial when AI generation itself costs only 7¢
2. Chainlink Functions require APIs to respond within 9 seconds, but AI image generation takes 30+ seconds

This led me to implement a custom listener node instead. The challenge is here, that I need to make sure that only "reliable" nodes can listen to the blockchain and call the API. This is not perfect, but it works for the moment. You can read more about my experiences [here](/blog/6).

## Learning 4: Make random systems fully trustless is hard

If we want to democratize access to quantum computing resources, we would like to make the system as trustless as possible. So anyone, who claims to have a quantum computer can be onboarded and provide the service. However, this is actually quite hard to do in practice. The main problem is that you need to have some way to verify that the results are actually correct. And this is a shared problem with the generation of AI images. How do you verify that the provider is not just tricking you ? I genuinely do not know the answer and think that this could be a fun research problem. However, for the moment, I have to work with some "reliable" nodes that provide the service and see how far what the future holds.

## Conclusion and outlook

Taken everything together, I do not see anything that would prevent the implement of a system which enables:

- Anonymous users to send instructions to quantum computers
- Have the payment done via smart contracts on a layer 2 solution like Optimism
- Get back the results as encrypted NFTs
- Have some "reliable" nodes that provide the service

So in the next blog post, I will try to lay out some of the technical details of how this could be implemented. If you have experiences, ideas or suggestions, feel free to write down ideas here, exchange and get active. The more people that care are, the more real gets the idea of a functioning smart contract for quantum computing.
