---
publishing_date: 2025-06-03
title: A gallery of AI images
---

In my [previous post](9), I described how I set up a system to generate AI images and set up the payment system with ethereum. I liked the set-up, but it was very minimalistic and only focused on the generation process. However, with NFTs, you can do so much more and I started to work through the process. In a first step, I set up a gallery of the images that assoicated with the connected wallet. And in this post, I will describe how I set up the gallery and what I learned in the process.

## Modernizing the contract

The images were created with a standard [ERC-721](https://docs.openzeppelin.com/contracts/5.x/erc721) contract. But this ran into trouble once I tried to collect all the NFTs that werre created by a single wallet. The details of the problems are rather technical and it took me some time to understand the issue, but luckily I was not the only one that ran into this problem. The solution was to use the [ERC-721 Enumerable](https://docs.openzeppelin.com/contracts/5.x/api/token/erc721#ERC721Enumerable) extension. This extension allows you to enumerate all the tokens owned by a specific address, which is exactly what I needed for the gallery.

Now, I thought that this would be just a simple upgrade to the previous contract. However, the internal data structure is substantially different from the "normal" ERC-721 contract. Therefore, I simply created a new contract, wrote some tests and deployed it. The new contract is called [`GenImNFTv2`](https://optimistic.etherscan.io/address/0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb#code) and it is a drop-in replacement for the previous contract. It has all the features of the previous contract, but it also allows you to enumerate all the tokens owned by a specific address.
