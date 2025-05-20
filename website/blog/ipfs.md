---
publishing_date: 2025-01-18
title: Are decentral websites a thing for me ?
---

Over the last few years, I kept wondering what it might mean to host a "decentral" website very much like it is possible to decentralize certain financial services through smart contracts [^2]. What would be needed ?

[^2]: The stuff done on [Uniswap](https://app.uniswap.org/) for example is quite impressive.

- A decentral domain provider.
- A simple way to update the website.
- A decentralized storage system.

As we will see the first and last part are fairly straight-forward. For the decentral storage I continue to have some doubts.

## Get an ENS domain

Normally, each website is hosted on some servers and you can access them through some domain. Currently, this website is hosted by github, which also delivers me directly the domain address. And behind Github is simply a big company which handles the domain registration for me. If I want to go decentral, I try to avoid this company and simply register the domain on a blockchain. This is already possible with [ENS](https://ens.domains/). This is a great start as it gets us closer to have some fancy adress like `fretchen.eth`. To get this I needed to set up a wallet, where [Metamask](https://metamask.io/) seems to be the absolute standard nowadays. Once I have the wallet, I need to convert normal currency into the currency of the Blockchain, which is here [ethereum](https://ethereum.org/en/) [^1].

[^1]: From my understanding Ethereum is THE biggest blockchain, which allows you to run smart contracts and quite energy efficient. It feels a bit like the Linux of the blockchain world.

To buy the ethereum, I had to go through [Kraken](https://www.kraken.com) and then send myself the ETH into the Metamask wallet. With the ETH I could quite simply register the domain of my choice with [ENS](https://ens.domains/). The purchase itself is fairly straight-forward and interestingly the domain is implemented as an NFT. This is the tech that is mostly used to allow people to claim ownership for weird pictures of bored apes. Here, it basically gets you exclusive access rights to the domain, which actually sounds quite smart. The other cool thing is that `ens.domains` is a DAO. So there is no single authority controlling it, but a community of people. Another fairly cool feature.

## A simple way to update the website

This is the part where it started to get slightly non-trivial. In the centralized world we have simple no-code systems like [wordpress](https://wordpress.org/) that run on a server. All of this is not really available on decentral systes. So we need some way to fall back into static website generation very much like I do here. But once, you can host a static website on [github pages](https://pages.github.com/), it should also be theoretically ready to host it decentrally. Given that this is clearly solved (otherwise you would not read this), it was time to try to get this onto the block-chain.

## A decentralized storage system

And this is now the part which was really quite annoying. At first, you think "Let me put it onto the blockchain". Well you quite quickly realize that this is totally cost-prohibitive and that you need some kind of alternative. The most famous and commonly used solution there is the [IPFS](https://ipfs.tech/). As you put a file / folder into the IPFS it gets a CID and becomes discoverable for others. But in contrast to systems like ethereum it feels quite different:

- Either you have to run your own IPFS node, which is quite a bit of work. I never was able to have relible notes with acceptable download speeds.
- Or you use a service like [Pinata](https://pinata.cloud/), which is a centralized service that pins your files for you. This is quite a bit of a bummer, as it is not really decentralized anymore. Further you mostly have to pay through dollars etc. So there is really no clear difference to the world of standard cloud storages there.

## Conclusion

And this is also the moment at which I wrote this blog post. I could now try to pay for the pinning service, put the CID onto eth.domains and claim some decentralized website. But what did I win ?

- The service is still quite centralized.
- I have really slow site accessbility.

So I am really not sure if I will go down this road any further at this stage. I keep wondering how the master himself handles the storage of [his blog](https://vitalik.eth.limo/). But I guess I will have to keep on reading and keep waiting for helpful insights.
