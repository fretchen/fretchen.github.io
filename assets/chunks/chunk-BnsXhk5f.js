import{kn as e}from"./chunk-IjxM6APl.js";var t=e(),n={publishing_date:`2025-12-02`,title:`How bots exploited my ImageGen contract - and how I fixed it`,category:`blockchain`,description:`A bot network exploited a vulnerability in my GenImNFT contract, extracting over 80 cents. Here's how they did it, how I fixed it, and what the forensic analysis revealed about the bot network that seemingly extracts substantial sums.`,tokenID:161};function r(e){let n={a:`a`,code:`code`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(n.p,{children:[`Early last week, I discovered that my `,(0,t.jsx)(n.a,{href:`/imagegen`,children:`image generation`}),` smart contract had been exploited by a sophisticated bot network. The bots found a vulnerability that allowed them to steal the rewards meant for my backend service. In this post, I'll explain the exploit, the fix, and share some of the surprising findings from my forensic analysis of the bot network.`]}),`
`,(0,t.jsx)(n.h2,{children:`The Exploit: Exploit-2025-11-26`}),`
`,(0,t.jsxs)(n.p,{children:[`The vulnerability was embarrassingly simple. In my `,(0,t.jsx)(n.code,{children:`GenImNFT`}),` contract, I had a function called `,(0,t.jsx)(n.code,{children:`requestImageUpdate()`}),` that was supposed to:`]}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsx)(n.li,{children:`Update the NFT with a generated image URL`}),`
`,(0,t.jsx)(n.li,{children:`Pay the caller (my backend service) the mint price as compensation`}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`The problem? `,(0,t.jsx)(n.strong,{children:`Anyone could call this function`}),`, not just my authorized backend service.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-solidity`,children:`// VULNERABLE CODE (v3)
function requestImageUpdate(uint256 tokenId, string memory imageUrl) public {
    require(_exists(tokenId), "Token does not exist");
    require(!_imageUpdated[tokenId], "Image already updated");
    // NO AUTHORIZATION CHECK! ❌

    _imageUpdated[tokenId] = true;
    _setTokenURI(tokenId, imageUrl);

    // Pay the caller - but anyone can be the caller!
    (bool success, ) = payable(msg.sender).call{value: mintPrice}("");
}
`})}),`
`,(0,t.jsx)(n.p,{children:`Some bots discovered this and started front-running legitimate image update requests. When my backend tried to update an NFT, the bots would:`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsx)(n.li,{children:`See the pending transaction in the mempool`}),`
`,(0,t.jsxs)(n.li,{children:[`Submit their own `,(0,t.jsx)(n.code,{children:`requestImageUpdate()`}),` with higher gas`]}),`
`,(0,t.jsx)(n.li,{children:`Claim the payment before my transaction executed`}),`
`,(0,t.jsx)(n.li,{children:`Leave the NFT with an empty image URL`}),`
`]}),`
`,(0,t.jsx)(n.h2,{children:`The Fix: Agent Whitelist (v4)`}),`
`,(0,t.jsxs)(n.p,{children:[`The fix was straightforward - implement a whitelist of authorized agent wallets that can call `,(0,t.jsx)(n.code,{children:`requestImageUpdate()`}),`. This follows the `,(0,t.jsx)(n.a,{href:`https://eips.ethereum.org/EIPS/eip-8004`,children:`EIP-8004`}),` pattern for trustless agents:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-solidity`,children:`// FIXED CODE (v4)
mapping(address => bool) private _whitelistedAgentWallets;

function authorizeAgentWallet(address agentWallet) public onlyOwner {
    _whitelistedAgentWallets[agentWallet] = true;
}

function requestImageUpdate(uint256 tokenId, string memory imageUrl) public {
    require(_exists(tokenId), "Token does not exist");
    require(!_imageUpdated[tokenId], "Image already updated");
    require(_whitelistedAgentWallets[msg.sender], "Not authorized agent"); // ✅

    // ... rest of the function
}
`})}),`
`,(0,t.jsxs)(n.p,{children:[`After upgrading to v4, I called `,(0,t.jsx)(n.code,{children:`authorizeAgentWallet()`}),` with my backend service's address. Now only whitelisted addresses can claim the rewards.`]}),`
`,(0,t.jsx)(n.h2,{children:`The Bot Network: A Forensic Analysis`}),`
`,(0,t.jsx)(n.p,{children:`What started as fixing a bug turned into a fascinating forensic investigation. Using Etherscan data and on-chain analysis, I traced the bot network's structure:`}),`
`,(0,t.jsx)(n.h3,{children:`Scale of the Operation`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`67 potential bot wallets`}),` identified on Optimism`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Roughly 100,679 USDC`}),` extracted (80cents just from my contract)`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Active since May 2023`}),` - over 2.5 years of operation`]}),`
`]}),`
`,(0,t.jsx)(n.h3,{children:`Network Hierarchy`}),`
`,(0,t.jsx)(n.p,{children:`The bots operate in a clear hierarchy:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-text`,children:`Central Treasury
    │
    ├── Wallet Farm Funder 1
    │       └── 67 bot wallets funded
    │
    └── Wallet Farm Funder 2
            └── roughly 100 bot wallets funded
`})}),`
`,(0,t.jsx)(n.p,{children:`The central wallet has been active for 893 days with 4,800+ transactions. It funds the "Wallet Farm Funders" who then distribute small amounts of ETH to a lot of individual bot wallets.`}),`
`,(0,t.jsx)(n.h3,{children:`How the Bots Operate`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Funding`}),`: The central treasury sends ETH to wallet farm funders on Mainnet`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Distribution`}),`: Farm funders send roughly 0.2 ETH to bot wallets`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Bridging`}),`: Bots bridge funds to target chains (Optimism, Arbitrum, etc.)`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Exploitation`}),`: Bots monitor mempools and front-run vulnerable transactions`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Extraction`}),`: Profits are bridged back via Stargate, Orbiter, deBridge, LiFi`]}),`
`]}),`
`,(0,t.jsx)(n.h3,{children:`Professionalism`}),`
`,(0,t.jsx)(n.p,{children:`This clearly looks like a professional operation:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Uses multiple parallel bot infrastructures`}),`
`,(0,t.jsx)(n.li,{children:`Rotates wallets regularly`}),`
`,(0,t.jsx)(n.li,{children:`Leverages multiple bridges to obscure fund flows`}),`
`,(0,t.jsx)(n.li,{children:`Has been operating undetected for years`}),`
`]}),`
`,(0,t.jsx)(n.h2,{children:`My Lessons Learned`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Always implement access control`}),` - Even "internal" functions that seem safe can be exploited. And even tiny amounts are exploited by bots.`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Use established patterns`}),` - EIP-8004 agent authorization patterns exist and are important for everyone, not just large protocols.`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Bots are everywhere`}),` - If there's value to extract, bots will find it`]}),`
`]}),`
`,(0,t.jsx)(n.h2,{children:`What's Next`}),`
`,(0,t.jsxs)(n.p,{children:[`I've filed reports on `,(0,t.jsx)(n.a,{href:`https://chainabuse.com/`,children:`Chainabuse`}),` to help warn others about these wallet addresses.`]}),`
`,(0,t.jsxs)(n.p,{children:[`The image generator is back online with the fixed contract. Feel free to try it at `,(0,t.jsx)(n.a,{href:`/imagegen`,children:`/imagegen`}),` - now with proper security!`]})]})}function i(e={}){let{wrapper:n}=e.components||{};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(r,{...e})}):r(e)}export{i as default,n as frontmatter};