import{kn as e}from"./chunk-DCq2tb4F.js";var t=e(),n={publishing_date:`2025-06-18`,title:`A public gallery of AI generated images`,tokenID:23,category:`ai`,secondaryCategory:`blockchain`,description:`I create a privacy-focused AI image gallery where creators share work and collectors mint NFTs. Discover the technical details combining open-source generation with blockchain incentives.`};function r(e){let n={a:`a`,code:`code`,em:`em`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(n.p,{children:[`In the `,(0,t.jsx)(n.a,{href:`./11`,children:`previous blog post`}),`, I described how I set up an image generator that quite nicely fulfills my needs: The generator in the background is open-source, I have full cost control, I made the system easily usable to others and it is really privacy-conserving. However, I could not resist the temptation to make it easier for others to see some of the images and to try to set up small incentive systems in the form of collector NFTs. The main changes are:`]}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`A public gallery for images that you explicitly want to share with others.`}),`
`,(0,t.jsx)(n.li,{children:`The possibility to collect public images in the form of NFTs and hence support the creators.`}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`They are all nicely visible in the screen shot below.`}),`
`,(0,t.jsxs)(`figure`,{id:`screenshot`,children:[(0,t.jsx)(`img`,{src:`/blog/ScreenShot_PublicGallery.png`,width:`100%`}),(0,t.jsx)(`figcaption`,{children:`Screen shot of the new public gallery with a collect feature.`})]}),`
`,(0,t.jsx)(n.p,{children:`Let me describe here, which major changes I made and give you some of the technical details.`}),`
`,(0,t.jsx)(n.h2,{children:`Listing images in the public gallery`}),`
`,(0,t.jsxs)(n.p,{children:[`I really enjoy the playful approach to image generation. But a lot of them fail and I do not really want to keep or share them. Hence, it is really easy to delete them from the blockchain and they are NOT listed to the public gallery by default. However, for a few of them I would actually be quite happy to share them with others. Hence, I added a simple new attribute to the smart contract, which is called `,(0,t.jsx)(n.code,{children:`isListed`}),` and set to `,(0,t.jsx)(n.code,{children:`false`}),` by default. The functionality is simple:`]}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`If this is set to `,(0,t.jsx)(n.code,{children:`true`}),`, the image is listed in the public gallery.`]}),`
`,(0,t.jsxs)(n.li,{children:[`If it is set to `,(0,t.jsx)(n.code,{children:`false`}),`, the image is not listed and can only be seen in the other tab.`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`This is a super simple approach, which is inspired by the `,(0,t.jsx)(n.a,{href:`https://en.wikipedia.org/wiki/Robots.txt`,children:`robots.txt`}),` approach. It does not securely make things private, but it unlists them from some public galleries. This approach is inspired by robots.txt - just as robots.txt doesn't technically prevent access but signals to web crawlers whether content should be indexed, the `,(0,t.jsx)(n.code,{children:`isListed`}),` flag signals whether an image should appear in public galleries. The data remains on the blockchain and is technically accessible, but won't be displayed in the public interface.`]}),`
`,(0,t.jsx)(n.h3,{children:`The pain of upgrading smart contracts`}),`
`,(0,t.jsxs)(n.p,{children:[`I had already set up the smart contract to be upgradeable with `,(0,t.jsx)(n.a,{href:`https://docs.openzeppelin.com/upgrades-plugins/writing-upgradeable`,children:`OpenZeppelin`}),`. However, initially I really enjoyed the work with `,(0,t.jsx)(n.a,{href:`https://hardhat.org/ignition/docs/getting-started#overview`,children:`hardhat ignition`}),` (a deployment tool) and `,(0,t.jsx)(n.a,{href:`https://viem.sh/`,children:`viem`}),` (a TypeScript library for Ethereum). So I tried to make the upgrades work with these tools for quite some time. The main issue was that Hardhat Ignition and Viem don't have built-in support for OpenZeppelin's upgrade patterns.`]}),`
`,(0,t.jsxs)(n.p,{children:[`In the end it never really worked out and everything became much easier when I left hardhat ignition behind and simply used the `,(0,t.jsx)(n.a,{href:`https://docs.openzeppelin.com/upgrades-plugins/1.x/overview`,children:`OpenZeppelin Hardhat Upgrades plugin`}),`. The OpenZeppelin Hardhat Upgrades plugin handles the complex proxy logic automatically, including storage layout validation and initialization functions.`]}),`
`,(0,t.jsx)(n.p,{children:`This unfortunately means that I have to change the deployment stack for the smart contracts completely. However, Claude Sonnet has proven to be a great friend for the corresponding code. I am still not proud about it, but it works good enough for now.`}),`
`,(0,t.jsx)(n.h3,{children:`Updating the website`}),`
`,(0,t.jsxs)(n.p,{children:[`The updates to the `,(0,t.jsx)(n.a,{href:`/imagegen`,children:`imagegen`}),` website were rather straightforward (again thanks to Claude Sonnet). I introduced a new tab which shows public images to anyone on the website. The functionality is obviously a bit different from the private tab, but overall the changes were fairly minimal.`]}),`
`,(0,t.jsx)(n.h2,{children:`Making images collectible`}),`
`,(0,t.jsxs)(n.p,{children:[`Once I was able to list images in the public gallery, I also wanted to allow others to collect them. The logic behind the little collect button is similar to the `,(0,t.jsx)(n.a,{href:`./7`,children:`support system`}),` for the blogs but a bit more evolved. In the contract for the support system, I implemented a simple mapping between the supported address and the number of supporters. Once you hit the support button, a small fee is sent to a specified address and the number of supporters is increased by one. However, this does not really create a market for the supported content and is very much a donation system.`]}),`
`,(0,t.jsx)(n.h3,{children:`The basic features of the collector NFT contract`}),`
`,(0,t.jsx)(n.p,{children:`In the case of the image generator, I wanted to go a step further. So I set up the system in the following fashion:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`If you hit the collect button you get to mint a new NFT, which directly links to the original NFT. However, it is not from the same contract and hence the owner of the original NFT always remains the unique owner.`}),`
`,(0,t.jsx)(n.li,{children:`When you collect the NFT, all the money is transferred into the wallet of the owner of the original NFT. This sets up a money transfer from the collector to the art creator and a financial resource stream similar to the one from the support button.`}),`
`,(0,t.jsxs)(n.li,{children:[`However, now the collector has his own tradable copy that he could sell on `,(0,t.jsx)(n.a,{href:`https://opensea.io/`,children:`opensea.io`}),` if he feels like it.`]}),`
`]}),`
`,(0,t.jsx)(n.h3,{children:`Introducing scarcity`}),`
`,(0,t.jsx)(n.p,{children:`The whole thing is about artwork. So you have the strong feeling that it should be more expensive to collect "popular" art than the one from an unknown street artist. However, in a standard approach of unlimited collector NFTs, a collector could never achieve a price gain because any additional supporter would simply mint another NFT and that's it.`}),`
`,(0,t.jsx)(n.p,{children:`Therefore, I decided to introduce an exponential increase in the mint price of the collector NFTs. The pricing follows an exponential progression where the price doubles with each batch of collectors:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Collectors 1-5: 0.001 ETH (base price)`}),`
`,(0,t.jsx)(n.li,{children:`Collectors 6-10: 0.002 ETH (2x base price)`}),`
`,(0,t.jsx)(n.li,{children:`Collectors 11-15: 0.004 ETH (4x base price)`}),`
`,(0,t.jsx)(n.li,{children:`Collectors 16-20: 0.008 ETH (8x base price)`}),`
`,(0,t.jsx)(n.li,{children:`Collectors 21-25: 0.016 ETH (16x base price)`}),`
`,(0,t.jsx)(n.li,{children:`Collectors 26-30: 0.032 ETH (32x base price)`}),`
`,(0,t.jsx)(n.li,{children:`And so on...`}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`This means if you're the 12th collector, you pay 0.004 ETH, but if someone becomes the 27th collector later, your NFT becomes more valuable as the entry price has increased to 0.032 ETH.`}),`
`,(0,t.jsx)(n.p,{children:`This can solve a number of open questions:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`There is a clear increase in the value of a collector NFT for popular art. The more collectors come in the more expensive it gets and early collectors can profit from it.`}),`
`,(0,t.jsx)(n.li,{children:`The owner of the original NFT can profit from the popularity of his art in an exponential fashion. This also feels quite natural.`}),`
`,(0,t.jsx)(n.li,{children:`Finally, you clearly create substantial scarcity and it will be rare to have much more than a few dozen collectors of a single image.`}),`
`]}),`
`,(0,t.jsx)(n.h3,{children:`More pain with upgrades`}),`
`,(0,t.jsxs)(n.p,{children:[`As I worked on the `,(0,t.jsx)(n.code,{children:`CollectorNFT`}),`, I had to fix a few bugs and wanted to implement them in an upgrade. However, at that point I discovered that OpenZeppelin actually uses annotations to mark certain functions. And these annotations are really important when you work with the upgradeable plugins as they help you to secure the contract. They are not documented super well, but if you try to introduce them later on, they break the upgrades. So better introduce them early on.`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.em,{children:`The key lesson:`}),` OpenZeppelin uses special annotations like `,(0,t.jsx)(n.code,{children:`@custom:oz-upgrades-unsafe-allow`}),` to mark functions that might be dangerous in upgradeable contracts. These annotations must be present from the beginning - adding them later breaks the upgrade mechanism because the plugin validates the entire contract history.`]}),`
`,(0,t.jsx)(n.h2,{children:`Conclusion`}),`
`,(0,t.jsx)(n.p,{children:`It is super stimulating to work on this kind of topics as they allow me to play around with new ideas which have plenty of possibilities.`}),`
`,(0,t.jsx)(n.p,{children:`This project demonstrates how blockchain technology can create sustainable creator economies for AI-generated art. The combination of public galleries, collector NFTs, and exponential pricing creates interesting dynamics that traditional platforms can't replicate.`}),`
`,(0,t.jsx)(n.p,{children:`Next steps I'm considering:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Implementing royalty mechanisms for secondary sales`}),`
`,(0,t.jsx)(n.li,{children:`More robust contracts and upgrade paths`}),`
`,(0,t.jsx)(n.li,{children:`Enhancing the public gallery with search and filtering`}),`
`,(0,t.jsx)(n.li,{children:`Adding community features like comments or ratings`}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`You can try the system yourself at `,(0,t.jsx)(n.a,{href:`/imagegen`,children:`imagegen`}),` - I'd love to see what images you create and whether anyone finds them worth collecting. The source code for both the smart contracts and frontend is available in my `,(0,t.jsx)(n.a,{href:`https://github.com/fretchen/fretchen.github.io`,children:`GitHub repository`}),`.`]})]})}function i(e={}){let{wrapper:n}=e.components||{};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(r,{...e})}):r(e)}export{i as default,n as frontmatter};