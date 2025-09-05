---
publishing_date: 2025-06-18
title: A public gallery of AI generated images
tokenID: 23
---

In the [previous blog post](./11), I described how I set up an image generator that quite nicely fulfills my needs: The generator in the background is open-source, I have full cost control, I made the system easily usable to others and it is really privacy-conserving. However, I could not resist the temptation to make it easier for others to see some of the images and to try to set up small incentive systems in the form of collector NFTs. The main changes are:

- A public gallery for images that you explicitly want to share with others.
- The possibility to collect public images in the form of NFTs and hence support the creators.

They are all nicely visible in the screen shot below.

<figure id="screenshot">
<img src="/blog/ScreenShot_PublicGallery.png" width="100%" />
<figcaption>Screen shot of the new public gallery with a collect feature.</figcaption>
</figure>

Let me describe here, which major changes I made and give you some of the technical details.

## Listing images in the public gallery

I really enjoy the playful approach to image generation. But a lot of them fail and I do not really want to keep or share them. Hence, it is really easy to delete them from the blockchain and they are NOT listed to the public gallery by default. However, for a few of them I would actually be quite happy to share them with others. Hence, I added a simple new attribute to the smart contract, which is called `isListed` and set to `false` by default. The functionality is simple:

- If this is set to `true`, the image is listed in the public gallery.
- If it is set to `false`, the image is not listed and can only be seen in the other tab.

This is a super simple approach, which is inspired by the [robots.txt](https://en.wikipedia.org/wiki/Robots.txt) approach. It does not securely make things private, but it unlists them from some public galleries. This approach is inspired by robots.txt - just as robots.txt doesn't technically prevent access but signals to web crawlers whether content should be indexed, the `isListed` flag signals whether an image should appear in public galleries. The data remains on the blockchain and is technically accessible, but won't be displayed in the public interface.

### The pain of upgrading smart contracts

I had already set up the smart contract to be upgradeable with [OpenZeppelin](https://docs.openzeppelin.com/upgrades-plugins/writing-upgradeable). However, initially I really enjoyed the work with [hardhat ignition](https://hardhat.org/ignition/docs/getting-started#overview) (a deployment tool) and [viem](https://viem.sh/) (a TypeScript library for Ethereum). So I tried to make the upgrades work with these tools for quite some time. The main issue was that Hardhat Ignition and Viem don't have built-in support for OpenZeppelin's upgrade patterns.

In the end it never really worked out and everything became much easier when I left hardhat ignition behind and simply used the [OpenZeppelin Hardhat Upgrades plugin](https://docs.openzeppelin.com/upgrades-plugins/1.x/overview). The OpenZeppelin Hardhat Upgrades plugin handles the complex proxy logic automatically, including storage layout validation and initialization functions.

This unfortunately means that I have to change the deployment stack for the smart contracts completely. However, Claude Sonnet has proven to be a great friend for the corresponding code. I am still not proud about it, but it works good enough for now.

### Updating the website

The updates to the [imagegen](/imagegen) website were rather straightforward (again thanks to Claude Sonnet). I introduced a new tab which shows public images to anyone on the website. The functionality is obviously a bit different from the private tab, but overall the changes were fairly minimal.

## Making images collectible

Once I was able to list images in the public gallery, I also wanted to allow others to collect them. The logic behind the little collect button is similar to the [support system](./7) for the blogs but a bit more evolved. In the contract for the support system, I implemented a simple mapping between the supported address and the number of supporters. Once you hit the support button, a small fee is sent to a specified address and the number of supporters is increased by one. However, this does not really create a market for the supported content and is very much a donation system.

### The basic features of the collector NFT contract

In the case of the image generator, I wanted to go a step further. So I set up the system in the following fashion:

- If you hit the collect button you get to mint a new NFT, which directly links to the original NFT. However, it is not from the same contract and hence the owner of the original NFT always remains the unique owner.
- When you collect the NFT, all the money is transferred into the wallet of the owner of the original NFT. This sets up a money transfer from the collector to the art creator and a financial resource stream similar to the one from the support button.
- However, now the collector has his own tradable copy that he could sell on [opensea.io](https://opensea.io/) if he feels like it.

### Introducing scarcity

The whole thing is about artwork. So you have the strong feeling that it should be more expensive to collect "popular" art than the one from an unknown street artist. However, in a standard approach of unlimited collector NFTs, a collector could never achieve a price gain because any additional supporter would simply mint another NFT and that's it.

Therefore, I decided to introduce an exponential increase in the mint price of the collector NFTs. The pricing follows an exponential progression where the price doubles with each batch of collectors:

- Collectors 1-5: 0.001 ETH (base price)
- Collectors 6-10: 0.002 ETH (2x base price)
- Collectors 11-15: 0.004 ETH (4x base price)
- Collectors 16-20: 0.008 ETH (8x base price)
- Collectors 21-25: 0.016 ETH (16x base price)
- Collectors 26-30: 0.032 ETH (32x base price)
- And so on...

This means if you're the 12th collector, you pay 0.004 ETH, but if someone becomes the 27th collector later, your NFT becomes more valuable as the entry price has increased to 0.032 ETH.

This can solve a number of open questions:

- There is a clear increase in the value of a collector NFT for popular art. The more collectors come in the more expensive it gets and early collectors can profit from it.
- The owner of the original NFT can profit from the popularity of his art in an exponential fashion. This also feels quite natural.
- Finally, you clearly create substantial scarcity and it will be rare to have much more than a few dozen collectors of a single image.

### More pain with upgrades

As I worked on the `CollectorNFT`, I had to fix a few bugs and wanted to implement them in an upgrade. However, at that point I discovered that OpenZeppelin actually uses annotations to mark certain functions. And these annotations are really important when you work with the upgradeable plugins as they help you to secure the contract. They are not documented super well, but if you try to introduce them later on, they break the upgrades. So better introduce them early on.

_The key lesson:_ OpenZeppelin uses special annotations like `@custom:oz-upgrades-unsafe-allow` to mark functions that might be dangerous in upgradeable contracts. These annotations must be present from the beginning - adding them later breaks the upgrade mechanism because the plugin validates the entire contract history.

## Conclusion

It is super stimulating to work on this kind of topics as they allow me to play around with new ideas which have plenty of possibilities.

This project demonstrates how blockchain technology can create sustainable creator economies for AI-generated art. The combination of public galleries, collector NFTs, and exponential pricing creates interesting dynamics that traditional platforms can't replicate.

Next steps I'm considering:

- Implementing royalty mechanisms for secondary sales
- More robust contracts and upgrade paths
- Enhancing the public gallery with search and filtering
- Adding community features like comments or ratings

You can try the system yourself at [imagegen](/imagegen) - I'd love to see what images you create and whether anyone finds them worth collecting. The source code for both the smart contracts and frontend is available in my [GitHub repository](https://github.com/fretchen/fretchen.github.io).
