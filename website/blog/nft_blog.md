---
publishing_date: 2025-05-20
title: Generating AI images, paying anonymously and little
description: "I implement anonymous micro-payments for AI image generation using Ethereum Layer-2. I learn how to connect blockchain payments with serverless AI systems for sustainable, privacy-focused services."
---

As I wrote already in one of my [previous posts](6), I have set up a small image generator on my website. The whole thing is hosted in Europe and I am using open source models. The system is running on a serverless setup, which is also hosted in Europe. The costs are low and I am happy with the setup. But to make it sustainable, I need to charge the users for the images at least as much as I get charged.

I do not want to go with advertisement or anything like that. To test the waters, I have recently set up a support button to "support" the website. This experiment proofed that it Layer-2 solutions on ethereum are nowadays super cheap and up for task. Feel free to have a look into my note over [here](7).

In the last few week I was able to tie the two ingredients (the AI system and the blockchain) together and I will describe the setup here.

## The challenge

Nowadays it costs roughly 5 to 6 cents to generate an image with services like [Ionos](https://cloud.ionos.de/managed/ai-model-hub) or [deepinfra](https://deepinfra.com/). Therefore, I wondered if it was possible to implement a payment system with similiar cost but with anonymous web3 payment systems instead of Stripe etc. This meant mostly that I had to solve two major challenges:

- **Challenge 1:** How could I connect the ethereum payment systems to the serverless systems.
- **Challenge 2:** How could I minimize the fees and remain competitive ?

## Connect payments to the AI serverless system

This part actually required quite a bit of try and error. At first I thought that I could simply tell the external serverless system to "listen" to an ethereum event on the contract. However, this would have required a constant listener and would have been too expensive.

In the second step, I though about oracle systems like [Chainlink](https://chain.link/). However, this came with a few shortcomings:

- With chainlink you have to pay 3 cents per request. This is substantial overhead.
- The only chainlink service that was really appropiate would have been [chainlink functions](https://chain.link/functions). However, this one needs that external API to answer within 9 seconds, which is not possible with the current AI setup, which takes up to 30 seconds to generate the images.

I therefore decided to set up the contract on my own.

### The Smart NFT contract: Bridging Blockchain and AI

The [`GenImNFT`](https://optimistic.etherscan.io/address/0x9859431b682e861b19e87Db14a04944BC747AB6d#code) contract is the heart of my solution. It functions as an automated intermediary between users who want AI-generated images and the system that creates these images. Here are its key features:

- **NFT Creation:** Users can purchase (or "mint") an NFT for a small fee (currently about 10 cents in ETH). This NFT initially contains a placeholder image.

- **Intelligent Image Updates:** Once a user has paid, the contract stores the empty NFT and signals that an image can be added. When a new image is updated by a separate wallet, the contract updates the NFT with the new image link and records that this update has occurred. No further changes to the image are possible by external wallets afterwards.

- **Automatic Payment:** The contract automatically pays the wallet that provided the image once the image has been updated. This happens directly within the blockchain, without requiring separate payment processing.

### Using the contract

I could then use the contract for the [image generation](../imagegen) in a fairly straight-forward fashion which handles both the creation of the NFT and the image generation. When a user enters a prompt and clicks "Mint & Generate," the component first calls the contract's safeMint function, sending along the required payment (around 10 cents in ETH). This transaction creates a new NFT with a temporary placeholder image.

After a successful mint, the component extracts the newly created token ID from the transaction receipt. This token ID uniquely identifies the NFT that needs to be updated. The component then sends this token ID along with the user's prompt to a serverless API function that handles the AI image generation. This process is similar to the previous setup, but now the serverless function has been extended to update the NFT with the generated image using a dedicated wallet.

The payment system works in two steps: first, the user pays the contract when minting the NFT; then, when the image is generated and the NFT is updated, the contract automatically releases payment to the wallet that submitted the image. This ensures that users only pay for successfully generated images, and image providers are compensated only after delivering the image.

## The total costs

All in all, the costs for the serverless system and the transactions is almost negligible. On this part, I built up directly on the very positive experience I had with the [support button](7) that works on the [optimism](https://www.optimism.io/) chain.

If I wanted to optimize the system, it would most likely be possible to offer the service for 1 cents above the price charged by the image generation services. However, for the moment I have set up a buffer against the rather hefty fluctuations of ethereum such that I can currently offer the service for roughly 10 cents an image.

## Some nice side effects of the system

As I set up the system, I discovered the perks of the whole NFT setup. I actually decided to follow the ERC-721 standard to safe all the important imformation concerning the image. The prompt is part of the description. The model and the time of minting are simply attributes. This allowed me to directly list some of the images on [opensea](https://opensea.io/) and opens the possibility to trade some of the cooler images.

## Conclusion

Taken together, I am super happy with the setup:

- Anyone can generate AI images for a small fee such that it is sustainable.
- The costs are fully under control and the system is fully automated.
- The system is fully anonymous and does not require any personal data (which I never wanted to collect anyways). Say goodby annoying GDPR banners.
- The system is fully decentralized and can be used by anyone that cares.

So, if you want to generate some images, feel free to check out the [image generation page](../imagegen) and mint your first NFT. I am looking forward to see what you can come up with and what are your comments.
