import{kn as e}from"./chunk-DCq2tb4F.js";var t=e(),n={publishing_date:`2025-10-16`,title:`Quantum Smart Contracts II - What can we learn from NFTs for quantum computing with smart contracts ?`,category:`quantum`,secondaryCategory:`blockchain`,description:`Can blockchain solve quantum computing's access problem? I tested the architecture with AI NFTs—here's what worked, what didn't, and what's still unsolved.`,tokenID:130};function r(e){let n={a:`a`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(n.p,{children:[`In a `,(0,t.jsx)(n.a,{href:`/blog/17`,children:`recent blog post`}),`, I laid out some basic ideas on how smart contracts could be used to democratize access to quantum computing resources. However, this previous post only laid out the basic ideas and did not go into too many details on the implementation. In this post, I will follow up on this topic and detail what I learned up to here, especially what works and what does not work for the moment. In the next post, I will then try to connect it all and lay out a realistic implementation plan of smart contracts in the context of quantum computing.`]}),`
`,(0,t.jsx)(n.h2,{children:`On the similarities between NFT generation and quantum computing`}),`
`,(0,t.jsx)(n.p,{children:`In this first section, I want to discuss why I decided that NFT generation is a good training ground for the more complex problem of smart contracts for quantum computing. The quantum computing workflow can be summarized as follows:`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsx)(n.li,{children:`Write some instructions, i.e. some json.`}),`
`,(0,t.jsx)(n.li,{children:`Send the instructions to some super fancy machine you do not understand, i.e. a quantum computer.`}),`
`,(0,t.jsx)(n.li,{children:`Get back the result that you do not want to share with anyone but that you also do not understand in a lot of cases.`}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`This workflow is actually not too far away from the workflow of generating NFTs with the help of AI models. The NFT generation workflow can be summarized as follows:`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsx)(n.li,{children:`Write some instructions, i.e. some text prompt into some json.`}),`
`,(0,t.jsx)(n.li,{children:`Send the instructions to some super fancy machine you do not understand, i.e. an AI model.`}),`
`,(0,t.jsx)(n.li,{children:`Get back the result that you also do not understand in a lot of cases.`}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`So you might see that the workflows are quite similar in that they send instructions
to some remote machine, you need to pay for the service, and you get back a result
that you do not understand, i.e. that is hard (impossible?) to verify.`}),`
`,(0,t.jsx)(n.p,{children:`Given this similarity isn't just theoretical—I've been testing it in practice over the last 10 months:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`January:`}),` Built AI image generator (`,(0,t.jsx)(n.a,{href:`/blog/6`,children:`blog 6`}),`)`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`April:`}),` Added crypto payments + NFT minting (`,(0,t.jsx)(n.a,{href:`/blog/9`,children:`blog 9`}),`)`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`October:`}),` Realized this architecture could democratize quantum computing (`,(0,t.jsx)(n.a,{href:`/blog/17`,children:`blog 17`}),`)`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`This post connects the dots: What did I learn from AI that applies to quantum computing?`}),`
`,(0,t.jsx)(n.h2,{children:`Learning 1: NFTs are great for this use case`}),`
`,(0,t.jsxs)(n.p,{children:[`NFTs are an excellent way to implement this kind of ideas. What does this mean for generative AI and quantum computing? Let me illustrate with
a concrete example from my AI image work (`,(0,t.jsx)(n.a,{href:`/blog/9`,children:`blog 9`}),`).`]}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`Example scenario - AI image generation:`})}),`
`,(0,t.jsx)(n.p,{children:`When Alice generates an AI image with the prompt "quantum computer in a forest":`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsx)(n.li,{children:`She pays 10¢ and receives an NFT with a unique identifier`}),`
`,(0,t.jsx)(n.li,{children:`The NFT contains: prompt, timestamp, model version, image URL link`}),`
`,(0,t.jsx)(n.li,{children:`Alice can prove she owns this specific generation (unlike with Midjourney)`}),`
`,(0,t.jsx)(n.li,{children:`She can sell/transfer the NFT on OpenSea`}),`
`,(0,t.jsx)(n.li,{children:`All metadata is permanent and verifiable on-chain`}),`
`]}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`Translated to quantum computing:`})}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Bob submits a quantum circuit and pays via smart contract`}),`
`,(0,t.jsx)(n.li,{children:`He gets an NFT with unique identifier and reference to the encrypted results`}),`
`,(0,t.jsx)(n.li,{children:`The NFT proves Bob ran this computation at this time`}),`
`,(0,t.jsx)(n.li,{children:`No centralized database needed, no account registration`}),`
`]}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`Why NFTs work well:`})}),`
`,(0,t.jsx)(n.p,{children:`NFTs provide clear ownership for the instructions. They are standardized (ERC-721),
easy to implement, and super flexible based on JSON files. The tech stack behind them
is well-developed. You can store them on S3 or IPFS and encrypt them if needed. All
of this makes them an ideal fit for both AI and quantum computing results.`}),`
`,(0,t.jsx)(n.h2,{children:`Learning 2: Blockchain payments are remarkably cheap by now`}),`
`,(0,t.jsxs)(n.p,{children:[`When I started to work on this topic, I was a bit worried about the costs of using the blockchain with transactions on ETH itself that could easily cost several dollars. However, after working through some of the details, I realized that the costs are remarkably low by now if you use layer 2 solutions like `,(0,t.jsx)(n.a,{href:`https://www.optimism.io`,children:`Optimism`}),`. The costs were so low that I could implement small support buttons of the style "buy me a coffee" on my website or generate images. Together with `,(0,t.jsx)(n.a,{href:`/blog/16/`,children:`some merkle tree techniques`}),`, I could even push it further to make it viable for calls that cost less than a cent.`]}),`
`,(0,t.jsx)(n.p,{children:`As of October 2025, here's what a typical image generation costs:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`AI computation:`}),` 5-7¢ depending on provider (BFL: 6¢, Ionos: 7¢, DeepInfra: 5¢)`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Blockchain transaction:`}),` ~1¢ (Optimism, Base) vs $2+ (Ethereum mainnet)`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Service margin:`}),` 0-3¢`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Total:`}),` ~10¢ per image with under 1¢ in blockchain costs. For quantum computing, the
same Layer-2 infrastructure means payment costs are essentially a solved problem.`]}),`
`,(0,t.jsx)(n.h2,{children:`Learning 3: Connections to normal APIs require custom oracles`}),`
`,(0,t.jsx)(n.p,{children:`I think that one of the strangest thing with the block chain is the connection to traditional APIs. It became clear to me that it is really straight forward to make transactions there, this is what it meant for. However, the blockchain lacks concepts of time or "calling somewhere else". So you use "oracles" to make this work. Think of oracles as the translator between two worlds:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Blockchain:`}),` Can handle payments and store data, but can't call external APIs or wait for responses`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Traditional APIs:`}),` Can run AI models or quantum computers, but don't understand blockchain`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`An oracle is a server that:`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsx)(n.li,{children:`Watches the blockchain for events (e.g., "user just paid for an image")`}),`
`,(0,t.jsx)(n.li,{children:`Calls the external API (e.g., Stable Diffusion takes 30 seconds)`}),`
`,(0,t.jsx)(n.li,{children:`Brings the result back to update the blockchain (e.g., stores image URL in NFT)`}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Initially (as mentioned in `,(0,t.jsx)(n.a,{href:`/blog/6`,children:`blog post 6`}),`), I thought `,(0,t.jsx)(n.a,{href:`https://docs.chain.link/chainlink-functions`,children:`Chainlink Functions`}),` looked promising. However, after testing, I discovered two dealbreakers:`]}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsx)(n.li,{children:`The 3¢/request overhead is substantial when AI generation itself costs only 7¢`}),`
`,(0,t.jsx)(n.li,{children:`Chainlink Functions require APIs to respond within 9 seconds, but AI image generation takes 30+ seconds`}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`This led me to implement a custom oracle instead. While blockchain transactions are trustless, my oracle is centralized—I control it. Users must trust that I'll execute requests honestly. This is a pragmatic solution for now, but it's the weakest link in the system. It actually raises a deeper question: how do we verify that the oracles are doing the work honestly?`}),`
`,(0,t.jsx)(n.h2,{children:`Learning 4: Make random systems fully trustless is hard`}),`
`,(0,t.jsx)(n.p,{children:`Achieving true trustlessness is the toughest challenge I encountered.`}),`
`,(0,t.jsx)(n.p,{children:`Ideally, democratizing quantum computing means:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`For users:`}),` Anyone can access the service (just needs a wallet)`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`For providers:`}),` Anyone can offer quantum computing resources (just runs an oracle)`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`But here's the problem: You need to have some way to verify that the results are correct. But in quantum and in generative AI the results are probabilistic. So how do you verify that the provider is not just tricking you? I genuinely do not know the answer and think that this could be a fun research problem.`}),`
`,(0,t.jsx)(n.p,{children:`However, for the moment, I could not find a better solution than whitelisting "reliable" oracles that provide the service. This is clearly the centralization bottleneck, as new providers have to be whitelisted and I have no automated algorithm to detect cheating yet.`}),`
`,(0,t.jsx)(n.h2,{children:`Conclusion and outlook`}),`
`,(0,t.jsx)(n.p,{children:`This brings me to the end of this learning journey. Taken everything together, I do not see anything that would prevent the implementation of a system which enables smart contract-based quantum computing.`}),`
`,(0,t.jsx)(n.p,{children:`Here's where I stand — comparing traditional cloud, my working AI prototype, and the
quantum computing goal:`}),`
`,(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{children:`Aspect`}),(0,t.jsx)(n.th,{children:`Todays centralized cloud`}),(0,t.jsx)(n.th,{children:`Proven with AI NFTs`}),(0,t.jsx)(n.th,{children:`Future Quantum Goal`})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.strong,{children:`Payment`})}),(0,t.jsx)(n.td,{children:`Accounts, subscriptions`}),(0,t.jsx)(n.td,{children:`Smart contract (10¢)`}),(0,t.jsx)(n.td,{children:`Smart contract (competitive)`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.strong,{children:`Ownership`})}),(0,t.jsx)(n.td,{children:`Provider database`}),(0,t.jsx)(n.td,{children:`NFT on blockchain`}),(0,t.jsx)(n.td,{children:`NFT on blockchain`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.strong,{children:`Privacy`})}),(0,t.jsx)(n.td,{children:`Trust required`}),(0,t.jsx)(n.td,{children:`Open`}),(0,t.jsx)(n.td,{children:`Encrypted on IPFS 🔮`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.strong,{children:`User Access`})}),(0,t.jsx)(n.td,{children:`Registration needed`}),(0,t.jsx)(n.td,{children:`Permissionless`}),(0,t.jsx)(n.td,{children:`Permissionless`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.strong,{children:`Verification`})}),(0,t.jsx)(n.td,{children:`Trust provider`}),(0,t.jsx)(n.td,{children:`Trust oracle ⚠️`}),(0,t.jsx)(n.td,{children:`Decentralized oracles`})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.strong,{children:`Provider choice`})}),(0,t.jsx)(n.td,{children:`Few vendors`}),(0,t.jsx)(n.td,{children:`Single (prototype) ⚠️`}),(0,t.jsx)(n.td,{children:`Open marketplace`})]})]})]}),`
`,(0,t.jsx)(n.p,{children:`My key takeaways are:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`✅ `,(0,t.jsx)(n.strong,{children:`Payment, ownership, privacy are solved`}),` - my AI implementation proves it works on Layer-2 for under 1¢ transaction costs`]}),`
`,(0,t.jsxs)(n.li,{children:[`⚠️ `,(0,t.jsx)(n.strong,{children:`Verification remains the challenge`}),` - both AI and quantum results are hard to verify trustlessly; for now, whitelisting and economic staking are the pragmatic approaches`]}),`
`,(0,t.jsxs)(n.li,{children:[`🔮 `,(0,t.jsx)(n.strong,{children:`Path forward`}),` - transition from centralized oracle (my server) to decentralized oracle network (multiple quantum providers)`]}),`
`]}),`
`,(0,t.jsx)(n.h3,{children:`Where I would be grateful for input`}),`
`,(0,t.jsx)(n.p,{children:`If you have experiences, ideas or suggestions—especially on trustless verification or oracle networks—feel free to write down ideas here, exchange and get active. The more people that care, the more real this becomes. Most urgently, I need feedback on the following topics:`}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`From quantum computing providers/researchers:`})}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Would you run an oracle to offer your quantum computer via smart contracts?`}),`
`,(0,t.jsx)(n.li,{children:`What verification methods could prove computation correctness?`}),`
`,(0,t.jsx)(n.li,{children:`How important is privacy (encrypted results) for your use cases?`}),`
`]}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`From blockchain developers:`})}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Do you know oracle solutions besides Chainlink for 30+ second operations?`}),`
`,(0,t.jsx)(n.li,{children:`Any ideas on trustless verification of AI/quantum results?`}),`
`,(0,t.jsx)(n.li,{children:`What are your experiences with similar "blockchain meets external API" projects?`}),`
`]}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`From potential users:`})}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Would you pay via crypto to access quantum computing anonymously?`}),`
`,(0,t.jsx)(n.li,{children:`Is NFT-based result storage valuable, or just gimmicky?`}),`
`,(0,t.jsx)(n.li,{children:`What would make you choose this over AWS Braket?`}),`
`]}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`How to contribute:`})}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Comment on this post`}),`
`,(0,t.jsxs)(n.li,{children:[`Open GitHub issues at `,(0,t.jsx)(n.a,{href:`https://github.com/fretchen/fretchen.github.io`,children:`this repo`})]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`So in the next blog post, I will lay out the technical details of how the smart contract architecture could be implemented for quantum computing.`})]})}function i(e={}){let{wrapper:n}=e.components||{};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(r,{...e})}):r(e)}export{i as default,n as frontmatter};