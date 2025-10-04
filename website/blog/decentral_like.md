---
publishing_date: 2025-04-21
title: A decentral support button
description: "I build a decentralized support button using smart contracts for direct content monetization. Learn how blockchain enables transparent micro-payments without platform intermediaries."
---

I recently came across the `mirror` platfrom and was really impressed by the possibilities of such a dentralized [social platform](4). What intrigued me most is that it might give content creators a very simple and direct way to get paid for the content. But after some more digging I must admit that it is not clear to me if [mirror.xyz](https://mirror.xyz/) is still really actively maintained. So I decided to give it a try and see if I might be able to build something similar. As you can see on the top right of this site I succeeded and will explain how I did it. I am not sure yet how long this post will be, so buckle up.

## The goal

I wanted to have a simple like / support button. Its functionality is quite straightforward:

- As the user clicks on the button, he commits to support the content with a small amount of money.
- The support is done via a transaction on the blckchain.
- The smart contract keeps track of the number of likes for each site.

For me this is interesting for a few reasons:

- It is a really simple smart contract. So it allows me to learn the basics of smart contracts in a very simple way.
- It sets up a simple way to support the content that I create on this website.

## How to use the support button

To use the button you need to have a wallet that is connected to the Ethereum network. I used [MetaMask](https://metamask.io/) for this.

In the next step, you need to make sure that you have sufficent ETH on the [optimism chain](https://www.optimism.io). If you don't have any ETH on the optimism chain, you can use the [optimism bridge](https://app.optimism.io/bridge) to transfer some ETH from the Ethereum mainnet to the optimism chain.

Now, you are all set up to use the support button that you can find on the top right of this page. When you click it, a popup will open that allows you to send ETH to the smart contract. The amount of ETH is set to 0.002 ETH (rougly 50 cents). Once you confirm the transation, the smart contract will be called and the amount of ETH will be sent to the smart contract. The smart contract will then keep track of the number of likes for this specific URL and the number of supporters will be incremented. Thanks for your support!

Now that you know how to use the button, I will explain how I set everything up.

## Setting up the smart contract

In a first step, I had to decide how my smart contract should look like and then also set everything up to deploy it.

### The smart contract

I decided for a really simple approach based on [solidity](https://soliditylang.org/). The `Support` smart contract main hasly the `donate` function, which takes a URL as input and allows users to send ETH as a form of appreciation. Once the donation is called, ETH is transferred to the contract owner and the count of `urlLikes` is incremented.

The contract also includes a `getLikesForUrl` function, which allows anyone to check the number of likes for a specific URL. The contract is designed to be secure and efficient, utilizing OpenZeppelin's libraries for access control and reentrancy protection. One of the neat things of the blockchain is that you can the see fully deployed and verified code [here](https://optimistic.etherscan.io/address/0x314b07fbd33a7343479e99e6682d5ee1da7f17c1#code#F1#L1).

As I designed the contract, I actually wondered if I should use other approaches like NFTs or ERC20 tokens. But in the end there is no need for that at this stage and any of those increasing complexities may increase the risk of bugs and the gas fees.

### Deploying and testing the smart contract

As this was my first smart contract, I actually had to learn all the basics. It would seem that you have two major frameworks nowadays: [Foundry](https://book.getfoundry.sh/) and [Hardhat](https://hardhat.org/). Hardhat seemed to fulfill all my requirements and well integrated into the usual javascript workflows. To get started, I really like the documentation for the [Hardhat Runner](https://hardhat.org/hardhat-runner/docs/guides/compile-contracts) here. In summary, the steps are:

1. Install hardhat and the dependencies
2. Compile the contracts `npx hardhat compile`.
3. Write the tests for the contracts. I used [chai](https://www.chaijs.com/) and [viem](https://hardhat.org/hardhat-runner/docs/advanced/using-viem) for this.

Now we are ready to deploy and test the contract. In the test environment this is quite straightforward as described [here](https://hardhat.org/hardhat-runner/docs/guides/deploying). But as you would like to deploy the contract to a real network, you need to set up a few things as described [here](https://hardhat.org/hardhat-runner/docs/guides/verifying). First, you need to create an account on [Alchemy](https://www.alchemy.com/) and get an API key. Then we can once again deploy the contract to the network of my choice, which was Optimism.

Finally, we need to verify the contract on the blockchain. This is important as it allows others to see the code and verify that it is working as expected. Here again we need to set up a few things. First, you need to create an account on [Etherscan](https://etherscan.io/) and get an API key. Then, you need to set up the `ETHERSCAN_API_KEY` environment variable with your API key.

### The Optimism chain

One of the crucial points for the support button was that it must not be too costly to use. On the Ethereum mainnet, I have frequently encountered gas fees of 20-50 USD. This would have been prohibitive for a simple like button.

Every blockchain transaction requires computational resources that must be paid for with "gas fees." These fees represent the cost of having your transaction processed and validated by the network:

- On Ethereum's mainnet, high demand for block space drives fees to levels that make micro-transactions impractical
- When gas costs $20-50 per transaction, sending a $0.50 support donation becomes economically absurd
- Layer 2 solutions like Optimism process transactions in batches and post the cryptographic proof to Ethereum, distributing that mainnet gas cost across many transactions.

Therefore, I decided to investigate layer-2 alternatives, which promise much lower fees. As I investigated the major alternatives, I came across [Base](https://www.base.org/), [Arbitrum](https://arbitrum.io/), [Optimism](https://www.optimism.io/) and [Linea](https://linea.build/). All of them seemed fairly mature with slightly different focuses. Base is closely aligned with Coinbase, which makes it a bit less attractive for me. Linea seemed to be still quite new and not as widely adopted. Optimism on the other hand has some nice documententation, a strong community focus and a lot of projects already running on it. So I decided to go with Optimism.

You can see all the details for the deployed contract and activity on [Optimism Etherscan](https://optimistic.etherscan.io/address/0x314b07fbd33a7343479e99e6682d5ee1da7f17c1).

## The frontend

After I had the smart contract up and running, I needed to integrate it into the website. I decided to integrate it via [wagmi](https://wagmi.sh/), which is a library that makes it easy to interact with Ethereum from a react app. It provides a simple API for connecting to wallets, sending transactions, and reading data from the blockchain. It is also built around [viem](https://viem.sh/), which is a library for interacting with Ethereum in a type-safe way. This makes it easy to work with the blockchain and ensures that the code is safe and secure.

The integration itself, involved two parts:

- the connection to the wallet.
- the button itself.

### The wallet connection

To set up the wallet, I followed quite closely the [wagmi documentation](https://wagmi.sh/react/getting-started). However, I am using `vike` and there is no `App.tsx`. So the integration is a bit different. I was able to activate `tanstack-query` with the [official plugin](https://vike.dev/tanstack-query). To wrap Wagmi itself, I hooked into the `LayoutDefault.tsx` component, which worked out quite nicely. For the rest I could simply follow the very simple and straight forward guide [here](https://wagmi.sh/react/guides/connect-wallet). I had a quick look into the different kits, but wanted to learn things for myself at this stage. If I ever decide to use one of the kits, I will likely try out [AppKit](https://appkit.dev/) first.

### The support button

Now that the wallet was set up, I could directly integrate the support button. This was also surprisingly straight forward as I could simply follow the documentation on how to [write](https://wagmi.sh/react/guides/write-to-contract) and [read](https://wagmi.sh/react/guides/read-from-contract) small contracts. To get the number of supports, I simply call the `getLikesForUrl` function of the smart contract. To support the content, I call the `donate` function of the smart contract. That's it. As every developer in the world, I spent too much time one the styling of the button, but otherwise it was simply an enjoyable experience.

## My main learnings

- Fees on L2 chains are really low now. A transfer of 50 cents sometimes costs less than 1 cent in gas fees. So this problem is really pretty much solved for now and L2s are really usable.
- The development experience is really quite nice. Backend and frontend are nicely separated etc.
- The biggest question for me will be how the whole transfer to L2 chains will work out in the long term.
- I will continue to play with similiar applications as soon as I think about some kind of transfers.

## A small look into the future

I learned a few things that I would likely change in the future. I have mainly two things in mind.

1. First, I would like to make sure that the contract is [upgradable](https://docs.openzeppelin.com/upgrades-plugins/writing-upgradeable). While it would make the initial deployment process more complex, it would make the entire system much easier to maintain in the long run.
2. Second, I would most likely make it possible to select the adress of the recipient. This would also allow others to use the same contract and make the whole thing a bit more generic.

So I hope that you enjoyed the post. Comments as usual below. And any support through the support button is highly appreciated.
