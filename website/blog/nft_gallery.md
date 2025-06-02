---
publishing_date: 2025-06-03
title: A gallery of AI images
tags: [blog, ai, blockchain]
---

In one of my [previous posts](9), I described how I set up a system to generate AI images and set up the payment system with ethereum. I liked the set-up, but it was very minimalistic and only focused on the generation process. However, with NFTs, you can do so much more and I started to work through the process. In a first step, I set up a gallery of the images that associated with the connected wallet. And in this post, I will describe how I set up the gallery and what I learned in the process.

## Modernizing the contract

The images were previouslycreated with a standard [ERC-721](https://docs.openzeppelin.com/contracts/5.x/erc721) contract, which allows you to own Non-fungible tokens. But this ran into trouble once I tried to collect all the NFTs that were created by a single wallet. The details of the problems are rather technical and it took me some time to understand the issue, but luckily I was not the only one that ran into this problem. The solution was to use the [ERC-721 Enumerable](https://docs.openzeppelin.com/contracts/5.x/api/token/erc721#ERC721Enumerable) extension. This extension allows you to enumerate all the tokens owned by a specific address, which is exactly what I needed for the gallery.

Now, I thought that this would be just a simple upgrade to the previous contract. However, the internal data structure is substantially different from the "normal" ERC-721 contract. Therefore, I simply created a new contract, wrote some tests and deployed it. The new contract is called [`GenImNFTv2`](https://optimistic.etherscan.io/address/0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb#code) and it is a replacement for the previous contract. It has all the features of the previous contract, but it also allows you to enumerate all the tokens owned by a specific address.

## Adding a gallery

Once, it was possible to enumerate the tokens, I could set up the gallery. At first, the gallery was simply another react component that queried the contract for all the tokens owned by a specific address. You could see the created NFTs and click on them to see the details. However, this was not very user friendly as the upper component with image preview and generation was still the main focus of the page. So the gallery and the generation felt really disconnected. So, I actually reworked the whole work flow within the [imagegen](../imagegen) component. It now only has a fairly small input and then contains the gallery below. This nicely integrates older pictures with new ideas and has all the functionality that I need. For the pictures in the gallery, I can zoom, download, share and delete them. This makes for me personally for a really nice user experience, just as I wanted it.

## A possible evolution

The component now fulfills a lot of my personal needs. If I wanted to extend it further, this would most likely mean that I want to make it more social with features like:

- User profiles to browse other people's AI art galleries
- Simple social features like favorites or comments
- Better discovery and search functionality

However, this would mean a clear shift in focus. From a project that exclusively serves my personal needs to a project that attempts to create a community around the protocol. And this is a big step. I am not sure if I want to take this step. The step is even bigger as I would most likely not enjoy it to take it on my own. I would need to work together with others that share the same passion for the project. And to govern the hypothetical community, I would need to set up some kind of DAO (Decentralized Autonomous Organization). The logic here is simple. If I introduce social features for users, I also want to introduce some kind of social features, i.e. governance, for the gallery. I do not want to be the sole owner of the gallery and decide what goes in and what does not. I want others to have a say in the future of the gallery. So the current most likely evolution of the gallery is:

- Try to learn how to set up a [DAO](https://docs.openzeppelin.com/contracts/5.x/governance).
- See if some kind of transaction fees for the DAO are in order. If the DAO supports the gallery, it should also be able to pay for the costs of the gallery, right ?
- Add minimal social features like seeing the NFTs of other users that like it.
- See if I can add some kind of social features like comments or likes just like I did with the [support button](7).

But this is all in the future. For the moment, I am happy with the gallery and the way it works. I hope you like it too and I am looking forward to your comments and suggestions.
