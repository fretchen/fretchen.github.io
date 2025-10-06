---
publishing_date: 2025-10-02
title: Can we decentralize access to quantum computing with smart contracts ?
category: "quantum"
secondaryCategory: "blockchain"
description: I explore how smart contracts can democratize access to quantum computing resources, enabling privacy-preserving decentralized payments and encrypted NFT results.
tokenID: 123
---

In this blog post, I want to dive into some ideas that have been going through my mind for a while now. I kept wondering, if it is possible to democratize access to quantum computing resources with the help of decentralized technologies, i.e. the blockchain. This question actually motivated a substantial amount of my work on the blockchain in the last few months and I will try to lay out my thoughts and learnings here. 

I think that this blog post will be the first one of roughly three posts. In this first one, I will lay out the context and the motivation. In the second one, I will try to connect the ideas to the learning that I have had so far with this website. In the third and last one, I will try to lay out some of the technical details of how the implementation could look like. 

But now let's get started on this topic.

## The bold vision

Quantum computing is an upcoming computing technology with the potential to reshape the software and hardware industry. And due to the complexity of building the machines it is a cloud first technology at this stage. Within this context, it would be great to unlock this power to as many stakeholders as possible with decentralized technologies.

## The point of this document

It is fun to work on tough problems. But it is only really fun once you get to share and think about them together with other collaborators and try to see how to solve it together. So these blog posts aremeant as a first piece that allows everyone that cares to shape some basic concepts and ideas and get this beyond the currently fuzzy ideas (maybe kill it, maybe make it a working reality).

Accidentally [this blog post](https://www.wearedevelopers.com/magazine/how-to-create-dao-guide) also recommends to start out with a clear intent document etc before you get into more technical details.

## The problem that should be solved

I already described the problem a bit [on this repo](https://alqor-ug.github.io/sqooler/v0.9/idea_payment/), but for the sake of completeness I will try to summarize it again here. If people try to use quantum computers nowadays it goes a bit like this:

1. Write some instructions, i.e. some json.
2. Send the instructions to some super fancy machine you do not really understand, i.e. a quantum computer.
3. Get back the result that you really do not want to share with anyone but that you also do not really understand in a lot of cases.

Quite frankly, almost no one cares on which machine the calculations are done. And how you can and should pay for the results is a bit of an open question but for the moment people go through good old web2 approaches like amazon [braket](https://aws.amazon.com/de/braket/) etc.

Taken together it might not take too much fantasy to think that it could be quite awesome to find a privacy conserving, decentral payment solution to this problem.

## The fuzzy “smart contracts for quantum computing” idea

Beware, the following ideas are based on an embarrassingly poor understanding of blockchain technologies but they are too tempting to not be scribbled down. The main questions that I have been asking myself are:

- Wouldn’t it be cool if the payment could be based on smart contracts ?
- Wouldn’t it be possible to just send the instructions out to some “reliable” node and get back the result ?
- Could the result be an encrypted NFT or something like that ?

Taken together it would seem that smart contracts could provide a really needed technological solution to a problem that is decentral and involves payments. So how to solve it ? I worked through some of the technicalities in a web2 world and did not see any real roadblocks for the moment. However, transitioning towards the block-chain is a very different beast. If you look through the website you will see that a lot of the blockchain + ai work actually implements solutions that are not too far away from this idea. This is what I will talk about in the next blog post.

If you have experiences, ideas or suggestions, feel free to write down ideas here, exchange and get active. The more people that care are, the more real gets the idea of a functioning smart contract for quantum computing.
