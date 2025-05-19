---
publishing_date: 2025-05-15
title: Generating AI images, paying anonymously and little
---

As I wrote already in one of my [previous posts](6), I have set up a small image generator on my website. The whole thing is hosted in Europe and I am using open source models. The system is running on a serverless setup, which is also hosted in Europe. The costs are low and I am happy with the setup. But to make it sustainable, I need to charge the users for the images at least as much as I get charged. 

I do not want to go with advertisement or anything like that. To test the waters, I have recently set up a support button to "like" the website. This experiment proofed that it Layer-2 solutions on ethereum are nowadays super cheap and up for task. Feel free to have a look into my note over [here](7).

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

The `GenImNFT` contract is the heart of my solution. It functions as an automated intermediary between users who want AI-generated images and the system that creates these images. Here are its key features:

- **NFT Creation:** Users can purchase (or "mint") an NFT for a small fee (currently about 10 cents in ETH). This NFT initially contains a placeholder image.

- **Intelligent Image Updates:** Once a user has paid, the contract safes the empty NFT and signals that an image can be added. When a new image is added by an external wallet, the contract updates the NFT with the new image link and records that this update has occurred. No further changes to the image are possible by external wallets afterwards.

- **Automatic Payment:** The contract automatically pays the wallet that provided the image once the image has been updated. This happens directly within the blockchain, without requiring separate payment processing.

### Using the contract

I could then use the contract for the [image generation](../imagegen) in a fairly straight-forward fashion which handles both the creation of the NFT and the image generation.

When a user enters a prompt and clicks "Mint & Generate," the component first calls the contract's `safeMint` function, sending along the required payment amount (around 10 cents in ETH). This transaction creates a new NFT with a temporary placeholder image.

After successful minting, the component extracts the newly created token ID from the transaction receipt. This token ID is crucial as it uniquely identifies the NFT that needs to be updated. The component then sends this token ID along with the user's prompt to a serverless API function that handles the AI image generation. This part is similiar to the previous setup, where the serverless function generates the image based on the prompt. However,the serverless function was now extended to also update the NFT with the generated image through a wallet that is only available from the function.

The payment system works in two steps: first, the user pays the contract when minting the NFT; then, when the serverless function generates the image and updates the NFT, the contract automatically releases payment to the wallet that provided the image. This mechanism ensures that users only pay for successfully generated images, and the image provider only gets paid after delivering the image.

## The total costs

All in all, the costs for the serverless system and the transactions is almost negligible. If I wanted to optimize the system, it would most likely be possible to offer the service for 1 cents above the price charged by the image generation services. However, for the moment I have set up a buffer against the rather hefty fluctuations of ethereum such that I can currently offer the service for roughly 10 cents an image.

## Some nice side effects of the system

As I set up the system, I discovered the perks of the whole NFT setup. I actually decided to follow the ERC-721 standard to safe all the important imformation concerning the image. The prompt is part of the description. The model and the time of minting are simply attributes. This allowed me to directly list some of the images on [opensea](https://opensea.io/) and opens the possibility to trade some of the cooler images.

## Conclusion

Taken together, I am super happy with the setup:

- Anyone can generate AI images for a small fee such that it is sustainable. 
- The costs are fully under control and the system is fully automated.
- The system is fully anonymous and does not require any personal data (which I never wanted to collect anyways). Say goodby annoying GDPR banners.
- The system is fully decentralized and can be used by anyone that cares.

So, if you want to generate some images, feel free to check out the [image generation page](../imagegen) and mint your first NFT. I am looking forward to see what you can come up with and what are your comments.