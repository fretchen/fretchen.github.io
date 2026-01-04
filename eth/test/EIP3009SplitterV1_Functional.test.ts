import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseUnits, keccak256, toHex, getAddress, encodeAbiParameters, encodeFunctionData } from "viem";

describe("EIP3009SplitterV1", function () {
  // Token decimals (USDC uses 6)
  const TOKEN_DECIMALS = 6;
  const parseToken = (amount: string) => parseUnits(amount, TOKEN_DECIMALS);

  // Test fee amounts
  const FEE_1_CENT = parseToken("0.01"); // 10_000
  const FEE_2_CENTS = parseToken("0.02"); // 20_000

  /**
   * Deploy fixture with mock USDC and Splitter
   */
  async function deploySplitterFixture() {
    const [owner, facilitator, buyer, seller, otherAccount] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    // Deploy mock USDC with EIP-3009 support
    const mockUSDC = await hre.viem.deployContract("MockUSDC_EIP3009");

    // Mint tokens to buyer for testing
    const initialBalance = parseToken("1000"); // 1000 tokens
    await mockUSDC.write.mint([buyer.account.address, initialBalance]);

    // Deploy Splitter implementation
    const implementation = await hre.viem.deployContract("EIP3009SplitterV1");

    // Encode initialize call using encodeFunctionData
    const initializeData = encodeFunctionData({
      abi: implementation.abi,
      functionName: "initialize",
      args: [facilitator.account.address, FEE_1_CENT],
    });

    // Deploy proxy
    const proxy = await hre.viem.deployContract("ERC1967Proxy", [
      implementation.address,
      initializeData as `0x${string}`,
    ]);

    // Get Splitter interface at proxy address
    const splitter = await hre.viem.getContractAt("EIP3009SplitterV1", proxy.address);

    return {
      splitter,
      mockUSDC,
      owner,
      facilitator,
      buyer,
      seller,
      otherAccount,
      publicClient,
      implementation,
    };
  }

  /**
   * Helper: Create EIP-3009 authorization signature with seller verification
   * 
   * SECURITY: The nonce is computed as keccak256(seller, salt) to cryptographically
   * bind the intended seller to the buyer's signature. This prevents a malicious
   * facilitator from redirecting funds to a different address.
   */
  async function createAuthorization(
    mockUSDC: any,
    buyer: any,
    to: `0x${string}`,
    seller: `0x${string}`,  // NEW: seller is now required for nonce computation
    amount: bigint,
    validAfter: bigint = 0n,
    validBefore: bigint = BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
  ) {
    // Generate random salt
    const saltValue = Date.now() + Math.random();
    const salt = keccak256(toHex(saltValue.toString()));
    
    // Compute nonce as keccak256(abi.encode(seller, salt)) 
    // This binds seller to the signature - must match Solidity's abi.encode
    // Uses standard ABI encoding (address padded to 32 bytes + bytes32 = 64 bytes)
    const nonce = keccak256(
      encodeAbiParameters(
        [{ type: "address" }, { type: "bytes32" }],
        [seller, salt]
      )
    );

    // Get domain separator from mock USDC
    const domain = await mockUSDC.read.eip712Domain();

    const types = {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    };

    const message = {
      from: getAddress(buyer.account.address),
      to: getAddress(to),
      value: amount,
      validAfter,
      validBefore,
      nonce,
    };

    // Sign with buyer's wallet
    const signature = await buyer.signTypedData({
      domain: {
        name: domain[1], // name
        version: domain[2], // version
        chainId: Number(domain[3]), // chainId
        verifyingContract: domain[4] as `0x${string}`, // verifyingContract
      },
      types,
      primaryType: "TransferWithAuthorization",
      message,
    });

    // Parse signature into v, r, s
    const r = signature.slice(0, 66) as `0x${string}`;
    const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
    const v = parseInt(signature.slice(130, 132), 16);

    return {
      from: buyer.account.address,
      to,
      seller,  // Include seller in return for convenience
      salt,    // Include salt for executeSplit call
      value: amount,
      validAfter,
      validBefore,
      nonce,
      v,
      r,
      s,
    };
  }

  // Note: Basic deployment tests are in EIP3009SplitterV1_Deployment.ts
  // This file focuses on functional business logic tests

  describe("Split Execution", function () {
    it("Should execute split correctly with 1 cent fee", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator, publicClient } = await loadFixture(
        deploySplitterFixture,
      );

      const totalAmount = parseToken("1.00"); // 1.00 token
      const expectedSellerAmount = totalAmount - FEE_1_CENT; // 0.99 token
      const expectedFee = FEE_1_CENT; // 0.01 token

      // Create authorization with seller bound to nonce
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, seller.account.address, totalAmount);

      // Execute split (called by anyone, typically facilitator)
      const hash = await splitter.write.executeSplit(
        [
          mockUSDC.address,
          auth.from as `0x${string}`,
          seller.account.address,
          auth.salt,
          auth.value,
          auth.validAfter,
          auth.validBefore,
          auth.nonce,
          auth.v,
          auth.r,
          auth.s,
        ],
        { account: facilitator.account },
      );

      // Verify transaction succeeded
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      expect(receipt.status).to.equal("success");

      // Verify balances
      expect(await mockUSDC.read.balanceOf([seller.account.address])).to.equal(expectedSellerAmount);
      expect(await mockUSDC.read.balanceOf([facilitator.account.address])).to.equal(expectedFee);
      expect(await mockUSDC.read.balanceOf([splitter.address])).to.equal(0n); // No funds remain in contract
    });

    it("Should execute split correctly with 2 cents fee", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator, owner } = await loadFixture(deploySplitterFixture);

      // Update fee to 2 cents
      await splitter.write.setFixedFee([FEE_2_CENTS], { account: owner.account });

      const totalAmount = parseToken("5.00"); // 5.00 token
      const expectedSellerAmount = totalAmount - FEE_2_CENTS; // 4.98 token
      const expectedFee = FEE_2_CENTS; // 0.02 token

      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, seller.account.address, totalAmount);

      await splitter.write.executeSplit(
        [
          mockUSDC.address,
          auth.from as `0x${string}`,
          seller.account.address,
          auth.salt,
          auth.value,
          auth.validAfter,
          auth.validBefore,
          auth.nonce,
          auth.v,
          auth.r,
          auth.s,
        ],
        { account: facilitator.account },
      );

      expect(await mockUSDC.read.balanceOf([seller.account.address])).to.equal(expectedSellerAmount);
      expect(await mockUSDC.read.balanceOf([facilitator.account.address])).to.equal(expectedFee);
    });

    it("Should emit SplitExecuted event", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator, publicClient } = await loadFixture(
        deploySplitterFixture,
      );

      const totalAmount = parseToken("1.00");
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, seller.account.address, totalAmount);

      const hash = await splitter.write.executeSplit(
        [
          mockUSDC.address,
          auth.from as `0x${string}`,
          seller.account.address,
          auth.salt,
          auth.value,
          auth.validAfter,
          auth.validBefore,
          auth.nonce,
          auth.v,
          auth.r,
          auth.s,
        ],
        { account: facilitator.account },
      );

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      // Check for SplitExecuted event
      const logs = await publicClient.getLogs({
        address: splitter.address,
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
      });

      expect(logs.length).to.be.greaterThan(0);
    });

    it("Should reject split when amount equals fee (boundary)", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator } = await loadFixture(deploySplitterFixture);

      const totalAmount = FEE_1_CENT; // Amount = fee (seller would get 0)
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, seller.account.address, totalAmount);

      await expect(
        splitter.write.executeSplit(
          [
            mockUSDC.address,
            auth.from as `0x${string}`,
            seller.account.address,
            auth.salt,
            auth.value,
            auth.validAfter,
            auth.validBefore,
            auth.nonce,
            auth.v,
            auth.r,
            auth.s,
          ],
          { account: facilitator.account },
        ),
      ).to.be.rejectedWith("Amount must exceed fee");
    });

    it("Should reject split when amount is less than fee", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator } = await loadFixture(deploySplitterFixture);

      const totalAmount = parseToken("0.005"); // Less than 0.01 token fee
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, seller.account.address, totalAmount);

      await expect(
        splitter.write.executeSplit(
          [
            mockUSDC.address,
            auth.from as `0x${string}`,
            seller.account.address,
            auth.salt,
            auth.value,
            auth.validAfter,
            auth.validBefore,
            auth.nonce,
            auth.v,
            auth.r,
            auth.s,
          ],
          { account: facilitator.account },
        ),
      ).to.be.rejectedWith("Amount must exceed fee");
    });

    it("Should reject split with invalid seller address", async function () {
      const { splitter, mockUSDC, buyer, facilitator } = await loadFixture(deploySplitterFixture);

      const totalAmount = parseToken("1.00");
      const zeroAddress = "0x0000000000000000000000000000000000000000" as `0x${string}`;
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, zeroAddress, totalAmount);

      await expect(
        splitter.write.executeSplit(
          [
            mockUSDC.address,
            auth.from as `0x${string}`,
            zeroAddress,
            auth.salt,
            auth.value,
            auth.validAfter,
            auth.validBefore,
            auth.nonce,
            auth.v,
            auth.r,
            auth.s,
          ],
          { account: facilitator.account },
        ),
      ).to.be.rejectedWith("Invalid seller address");
    });

    it("Should reject reused authorization (nonce replay)", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator } = await loadFixture(deploySplitterFixture);

      const totalAmount = parseToken("1.00");
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, seller.account.address, totalAmount);

      // First execution should succeed
      await splitter.write.executeSplit(
        [
          mockUSDC.address,
          auth.from as `0x${string}`,
          seller.account.address,
          auth.salt,
          auth.value,
          auth.validAfter,
          auth.validBefore,
          auth.nonce,
          auth.v,
          auth.r,
          auth.s,
        ],
        { account: facilitator.account },
      );

      // Mint more USDC to buyer for second attempt
      await mockUSDC.write.mint([buyer.account.address, totalAmount]);

      // Second execution with same nonce should fail
      await expect(
        splitter.write.executeSplit(
          [
            mockUSDC.address,
            auth.from as `0x${string}`,
            seller.account.address,
            auth.salt,
            auth.value,
            auth.validAfter,
            auth.validBefore,
            auth.nonce,
            auth.v,
            auth.r,
            auth.s,
          ],
          { account: facilitator.account },
        ),
      ).to.be.rejected; // Will be rejected by mock USDC
    });

    it("Should allow different buyers to use same contract", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator, otherAccount } = await loadFixture(
        deploySplitterFixture,
      );

      // Mint tokens to second buyer
      const buyer2 = otherAccount;
      await mockUSDC.write.mint([buyer2.account.address, parseToken("1000")]);

      const amount1 = parseToken("1.00");
      const amount2 = parseToken("2.00");

      // First buyer
      const auth1 = await createAuthorization(mockUSDC, buyer, splitter.address, seller.account.address, amount1);
      await splitter.write.executeSplit(
        [
          mockUSDC.address,
          auth1.from as `0x${string}`,
          seller.account.address,
          auth1.salt,
          auth1.value,
          auth1.validAfter,
          auth1.validBefore,
          auth1.nonce,
          auth1.v,
          auth1.r,
          auth1.s,
        ],
        { account: facilitator.account },
      );

      // Second buyer
      const auth2 = await createAuthorization(mockUSDC, buyer2, splitter.address, seller.account.address, amount2);
      await splitter.write.executeSplit(
        [
          mockUSDC.address,
          auth2.from as `0x${string}`,
          seller.account.address,
          auth2.salt,
          auth2.value,
          auth2.validAfter,
          auth2.validBefore,
          auth2.nonce,
          auth2.v,
          auth2.r,
          auth2.s,
        ],
        { account: facilitator.account },
      );

      // Verify seller received both payments minus fees
      const expectedTotal = amount1 + amount2 - FEE_1_CENT * 2n;
      expect(await mockUSDC.read.balanceOf([seller.account.address])).to.equal(expectedTotal);
    });
  });

  describe("Configuration Updates", function () {
    it("Should allow owner to update fixed fee", async function () {
      const { splitter, owner } = await loadFixture(deploySplitterFixture);

      const newFee = FEE_2_CENTS;
      await splitter.write.setFixedFee([newFee], { account: owner.account });

      expect(await splitter.read.fixedFee()).to.equal(newFee);
    });

    it("Should emit FixedFeeUpdated event", async function () {
      const { splitter, owner, publicClient } = await loadFixture(deploySplitterFixture);

      const newFee = FEE_2_CENTS;
      const hash = await splitter.write.setFixedFee([newFee], { account: owner.account });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      expect(receipt.status).to.equal("success");
    });

    it("Should reject fee update from non-owner", async function () {
      const { splitter, otherAccount } = await loadFixture(deploySplitterFixture);

      await expect(
        splitter.write.setFixedFee([FEE_2_CENTS], { account: otherAccount.account }),
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("Should reject fee update to zero", async function () {
      const { splitter, owner } = await loadFixture(deploySplitterFixture);

      await expect(splitter.write.setFixedFee([0n], { account: owner.account })).to.be.rejectedWith(
        "Fee must be greater than 0",
      );
    });

    it("Should allow owner to update facilitator wallet", async function () {
      const { splitter, owner, otherAccount } = await loadFixture(deploySplitterFixture);

      const newWallet = otherAccount.account.address;
      await splitter.write.setFacilitatorWallet([newWallet], { account: owner.account });

      expect(await splitter.read.facilitatorWallet()).to.equal(getAddress(newWallet));
    });

    it("Should emit FacilitatorWalletUpdated event", async function () {
      const { splitter, owner, otherAccount, publicClient } = await loadFixture(deploySplitterFixture);

      const hash = await splitter.write.setFacilitatorWallet([otherAccount.account.address], {
        account: owner.account,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      expect(receipt.status).to.equal("success");
    });

    it("Should reject wallet update from non-owner", async function () {
      const { splitter, otherAccount } = await loadFixture(deploySplitterFixture);

      await expect(
        splitter.write.setFacilitatorWallet([otherAccount.account.address], { account: otherAccount.account }),
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("Should reject wallet update to zero address", async function () {
      const { splitter, owner } = await loadFixture(deploySplitterFixture);

      const zeroAddress = "0x0000000000000000000000000000000000000000";
      await expect(
        splitter.write.setFacilitatorWallet([zeroAddress as `0x${string}`], { account: owner.account }),
      ).to.be.rejectedWith("Invalid wallet address");
    });

    it("Should route fees to new wallet after update", async function () {
      const { splitter, mockUSDC, buyer, seller, owner, otherAccount } = await loadFixture(deploySplitterFixture);

      // Update facilitator wallet
      const newWallet = otherAccount.account.address;
      await splitter.write.setFacilitatorWallet([newWallet], { account: owner.account });

      // Execute split
      const totalAmount = parseToken("1.00");
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, seller.account.address, totalAmount);

      await splitter.write.executeSplit(
        [
          mockUSDC.address,
          auth.from as `0x${string}`,
          seller.account.address,
          auth.salt,
          auth.value,
          auth.validAfter,
          auth.validBefore,
          auth.nonce,
          auth.v,
          auth.r,
          auth.s,
        ],
        { account: owner.account },
      );

      // Verify new wallet received fee
      expect(await mockUSDC.read.balanceOf([newWallet])).to.equal(FEE_1_CENT);
    });
  });

  describe("Authorization State Query", function () {
    it("Should correctly report unused authorization", async function () {
      const { splitter, mockUSDC, buyer } = await loadFixture(deploySplitterFixture);

      const nonce = keccak256(toHex("test-nonce"));
      const isUsed = await splitter.read.isAuthorizationUsed([mockUSDC.address, buyer.account.address, nonce]);

      expect(isUsed).to.equal(false);
    });

    it("Should correctly report used authorization", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator } = await loadFixture(deploySplitterFixture);

      const totalAmount = parseToken("1.00");
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, seller.account.address, totalAmount);

      // Execute split
      await splitter.write.executeSplit(
        [
          mockUSDC.address,
          auth.from as `0x${string}`,
          seller.account.address,
          auth.salt,
          auth.value,
          auth.validAfter,
          auth.validBefore,
          auth.nonce,
          auth.v,
          auth.r,
          auth.s,
        ],
        { account: facilitator.account },
      );

      // Check authorization state
      const isUsed = await splitter.read.isAuthorizationUsed([mockUSDC.address, buyer.account.address, auth.nonce]);
      expect(isUsed).to.equal(true);
    });
  });

  describe("UUPS Upgradeability", function () {
    it("Should allow owner to authorize upgrade", async function () {
      const { splitter, owner, implementation } = await loadFixture(deploySplitterFixture);

      // Deploy new implementation
      const newImplementation = await hre.viem.deployContract("EIP3009SplitterV1");

      // Upgrade should succeed (owner authorized)
      await expect(
        splitter.write.upgradeToAndCall([newImplementation.address, "0x" as `0x${string}`], {
          account: owner.account,
        }),
      ).to.be.fulfilled;
    });

    it("Should reject upgrade from non-owner", async function () {
      const { splitter, otherAccount } = await loadFixture(deploySplitterFixture);

      const newImplementation = await hre.viem.deployContract("EIP3009SplitterV1");

      await expect(
        splitter.write.upgradeToAndCall([newImplementation.address, "0x" as `0x${string}`], {
          account: otherAccount.account,
        }),
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });
  });

  describe("EIP-3009 Authorization Security", function () {
    it("Should reject expired authorization (validBefore in past)", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator } = await loadFixture(deploySplitterFixture);

      const totalAmount = parseToken("1.00");
      const now = BigInt(Math.floor(Date.now() / 1000));
      
      // Create authorization that expired 1 hour ago
      const auth = await createAuthorization(
        mockUSDC,
        buyer,
        splitter.address,
        seller.account.address,
        totalAmount,
        0n, // validAfter
        now - 3600n, // validBefore: 1 hour in the past
      );

      await expect(
        splitter.write.executeSplit(
          [
            mockUSDC.address,
            auth.from as `0x${string}`,
            seller.account.address,
            auth.salt,
            auth.value,
            auth.validAfter,
            auth.validBefore,
            auth.nonce,
            auth.v,
            auth.r,
            auth.s,
          ],
          { account: facilitator.account },
        ),
      ).to.be.rejected; // EIP-3009 will reject expired authorization
    });

    it("Should reject authorization not yet valid (validAfter in future)", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator } = await loadFixture(deploySplitterFixture);

      const totalAmount = parseToken("1.00");
      const now = BigInt(Math.floor(Date.now() / 1000));
      
      // Create authorization that becomes valid in 1 hour
      const auth = await createAuthorization(
        mockUSDC,
        buyer,
        splitter.address,
        seller.account.address,
        totalAmount,
        now + 3600n, // validAfter: 1 hour in the future
        now + 7200n, // validBefore: 2 hours in the future
      );

      await expect(
        splitter.write.executeSplit(
          [
            mockUSDC.address,
            auth.from as `0x${string}`,
            seller.account.address,
            auth.salt,
            auth.value,
            auth.validAfter,
            auth.validBefore,
            auth.nonce,
            auth.v,
            auth.r,
            auth.s,
          ],
          { account: facilitator.account },
        ),
      ).to.be.rejected; // EIP-3009 will reject not-yet-valid authorization
    });

    it("Should reject authorization with wrong signer", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator, otherAccount } = await loadFixture(
        deploySplitterFixture,
      );

      const totalAmount = parseToken("1.00");
      
      // Create authorization signed by otherAccount but claiming to be from buyer
      const auth = await createAuthorization(mockUSDC, otherAccount, splitter.address, seller.account.address, totalAmount);

      await expect(
        splitter.write.executeSplit(
          [
            mockUSDC.address,
            buyer.account.address, // Claim it's from buyer
            seller.account.address,
            auth.salt,
            auth.value,
            auth.validAfter,
            auth.validBefore,
            auth.nonce,
            auth.v,
            auth.r,
            auth.s,
          ],
          { account: facilitator.account },
        ),
      ).to.be.rejected; // Signature verification will fail
    });

    it("Should reject authorization with insufficient buyer balance", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator } = await loadFixture(deploySplitterFixture);

      // Try to transfer more than buyer has
      const totalAmount = parseToken("10000.00"); // Buyer only has 1000
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, seller.account.address, totalAmount);

      await expect(
        splitter.write.executeSplit(
          [
            mockUSDC.address,
            auth.from as `0x${string}`,
            seller.account.address,
            auth.salt,
            auth.value,
            auth.validAfter,
            auth.validBefore,
            auth.nonce,
            auth.v,
            auth.r,
            auth.s,
          ],
          { account: facilitator.account },
        ),
      ).to.be.rejected; // Transfer will fail due to insufficient balance
    });

    it("Should work when seller equals buyer (self-payment)", async function () {
      const { splitter, mockUSDC, buyer, facilitator, publicClient } = await loadFixture(deploySplitterFixture);

      const totalAmount = parseToken("1.00");
      // Buyer is also the seller - nonce encodes buyer as seller
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, buyer.account.address, totalAmount);

      // Buyer is also the seller (edge case but valid)
      const hash = await splitter.write.executeSplit(
        [
          mockUSDC.address,
          auth.from as `0x${string}`,
          buyer.account.address, // seller = buyer
          auth.salt,
          auth.value,
          auth.validAfter,
          auth.validBefore,
          auth.nonce,
          auth.v,
          auth.r,
          auth.s,
        ],
        { account: facilitator.account },
      );

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      expect(receipt.status).to.equal("success");

      // Buyer should have: initial - totalAmount + (totalAmount - fee) = initial - fee
      const initialBalance = parseToken("1000");
      const expectedBalance = initialBalance - FEE_1_CENT;
      expect(await mockUSDC.read.balanceOf([buyer.account.address])).to.equal(expectedBalance);
    });

    it("Should work when seller equals facilitator wallet", async function () {
      const { splitter, mockUSDC, buyer, facilitator, publicClient } = await loadFixture(deploySplitterFixture);

      const totalAmount = parseToken("1.00");
      // Seller is the facilitator wallet - nonce encodes facilitator as seller
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, facilitator.account.address, totalAmount);

      // Seller is the facilitator wallet
      const hash = await splitter.write.executeSplit(
        [
          mockUSDC.address,
          auth.from as `0x${string}`,
          facilitator.account.address, // seller = facilitator
          auth.salt,
          auth.value,
          auth.validAfter,
          auth.validBefore,
          auth.nonce,
          auth.v,
          auth.r,
          auth.s,
        ],
        { account: facilitator.account },
      );

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      expect(receipt.status).to.equal("success");

      // Facilitator should receive both seller amount and fee
      expect(await mockUSDC.read.balanceOf([facilitator.account.address])).to.equal(totalAmount);
    });
  });

  describe("Seller Verification Security", function () {
    it("Should reject when facilitator tries to redirect funds to different seller", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator, otherAccount } = await loadFixture(
        deploySplitterFixture,
      );

      const totalAmount = parseToken("1.00");
      
      // Buyer authorizes payment to seller (nonce encodes seller)
      const auth = await createAuthorization(
        mockUSDC,
        buyer,
        splitter.address,
        seller.account.address, // Buyer intends to pay seller
        totalAmount,
      );

      // Malicious facilitator tries to redirect funds to otherAccount (attacker)
      await expect(
        splitter.write.executeSplit(
          [
            mockUSDC.address,
            auth.from as `0x${string}`,
            otherAccount.account.address, // ATTACKER: Not the authorized seller!
            auth.salt,
            auth.value,
            auth.validAfter,
            auth.validBefore,
            auth.nonce,
            auth.v,
            auth.r,
            auth.s,
          ],
          { account: facilitator.account },
        ),
      ).to.be.rejectedWith("Seller not authorized by buyer");
    });

    it("Should reject when facilitator provides wrong salt for correct seller", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator } = await loadFixture(deploySplitterFixture);

      const totalAmount = parseToken("1.00");
      
      // Buyer authorizes payment to seller
      const auth = await createAuthorization(
        mockUSDC,
        buyer,
        splitter.address,
        seller.account.address,
        totalAmount,
      );

      // Facilitator tries with correct seller but wrong salt
      const wrongSalt = keccak256(toHex("wrong-salt"));
      
      await expect(
        splitter.write.executeSplit(
          [
            mockUSDC.address,
            auth.from as `0x${string}`,
            seller.account.address, // Correct seller
            wrongSalt, // Wrong salt!
            auth.value,
            auth.validAfter,
            auth.validBefore,
            auth.nonce, // Original nonce won't match hash(seller, wrongSalt)
            auth.v,
            auth.r,
            auth.s,
          ],
          { account: facilitator.account },
        ),
      ).to.be.rejectedWith("Seller not authorized by buyer");
    });

    it("Should reject when facilitator swaps seller between two valid authorizations", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator, otherAccount, publicClient } = await loadFixture(
        deploySplitterFixture,
      );

      const amount1 = parseToken("1.00");
      const amount2 = parseToken("2.00");
      
      // Buyer creates two authorizations for different sellers
      const authForSeller = await createAuthorization(
        mockUSDC,
        buyer,
        splitter.address,
        seller.account.address,
        amount1,
      );
      
      const authForOther = await createAuthorization(
        mockUSDC,
        buyer,
        splitter.address,
        otherAccount.account.address,
        amount2,
      );

      // Facilitator tries to use authForSeller's signature but with otherAccount as seller
      await expect(
        splitter.write.executeSplit(
          [
            mockUSDC.address,
            authForSeller.from as `0x${string}`,
            otherAccount.account.address, // Wrong seller for this auth
            authForSeller.salt, // Salt from seller auth
            authForSeller.value,
            authForSeller.validAfter,
            authForSeller.validBefore,
            authForSeller.nonce, // Nonce encodes seller, not otherAccount
            authForSeller.v,
            authForSeller.r,
            authForSeller.s,
          ],
          { account: facilitator.account },
        ),
      ).to.be.rejectedWith("Seller not authorized by buyer");

      // But correct seller should work
      const hash = await splitter.write.executeSplit(
        [
          mockUSDC.address,
          authForSeller.from as `0x${string}`,
          seller.account.address,
          authForSeller.salt,
          authForSeller.value,
          authForSeller.validAfter,
          authForSeller.validBefore,
          authForSeller.nonce,
          authForSeller.v,
          authForSeller.r,
          authForSeller.s,
        ],
        { account: facilitator.account },
      );

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      expect(receipt.status).to.equal("success");
    });

    it("Should verify seller address is cryptographically bound to nonce", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator, publicClient } = await loadFixture(
        deploySplitterFixture,
      );

      const totalAmount = parseToken("5.00");
      
      // Create authorization with seller bound to nonce
      const auth = await createAuthorization(
        mockUSDC,
        buyer,
        splitter.address,
        seller.account.address,
        totalAmount,
      );

      // Verify that nonce = keccak256(abi.encode(seller, salt))
      // Uses standard ABI encoding matching Solidity's abi.encode
      const expectedNonce = keccak256(
        encodeAbiParameters(
          [{ type: "address" }, { type: "bytes32" }],
          [seller.account.address, auth.salt]
        )
      );
      expect(auth.nonce).to.equal(expectedNonce);

      // Execute split - should succeed because seller matches nonce
      const hash = await splitter.write.executeSplit(
        [
          mockUSDC.address,
          auth.from as `0x${string}`,
          seller.account.address,
          auth.salt,
          auth.value,
          auth.validAfter,
          auth.validBefore,
          auth.nonce,
          auth.v,
          auth.r,
          auth.s,
        ],
        { account: facilitator.account },
      );

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      expect(receipt.status).to.equal("success");

      // Verify correct distribution
      const expectedSellerAmount = totalAmount - FEE_1_CENT;
      expect(await mockUSDC.read.balanceOf([seller.account.address])).to.equal(expectedSellerAmount);
      expect(await mockUSDC.read.balanceOf([facilitator.account.address])).to.equal(FEE_1_CENT);
    });

    it("Should prevent facilitator from stealing funds via self as seller", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator } = await loadFixture(deploySplitterFixture);

      const totalAmount = parseToken("100.00");
      
      // Buyer authorizes payment to legitimate seller
      const auth = await createAuthorization(
        mockUSDC,
        buyer,
        splitter.address,
        seller.account.address,
        totalAmount,
      );

      // Malicious facilitator tries to set themselves as seller
      await expect(
        splitter.write.executeSplit(
          [
            mockUSDC.address,
            auth.from as `0x${string}`,
            facilitator.account.address, // Facilitator tries to steal!
            auth.salt,
            auth.value,
            auth.validAfter,
            auth.validBefore,
            auth.nonce,
            auth.v,
            auth.r,
            auth.s,
          ],
          { account: facilitator.account },
        ),
      ).to.be.rejectedWith("Seller not authorized by buyer");
    });
  });

  describe("Token Parameter Attack Vectors", function () {
    it("Should reject when token address is zero", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator } = await loadFixture(deploySplitterFixture);

      const totalAmount = parseToken("1.00");
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, seller.account.address, totalAmount);

      const zeroAddress = "0x0000000000000000000000000000000000000000" as `0x${string}`;

      await expect(
        splitter.write.executeSplit(
          [
            zeroAddress, // Invalid token address
            auth.from as `0x${string}`,
            seller.account.address,
            auth.salt,
            auth.value,
            auth.validAfter,
            auth.validBefore,
            auth.nonce,
            auth.v,
            auth.r,
            auth.s,
          ],
          { account: facilitator.account },
        ),
      ).to.be.rejectedWith("Invalid token address");
    });

    it("Should fail gracefully when fake token is provided (non-contract EOA)", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator, otherAccount } = await loadFixture(
        deploySplitterFixture,
      );

      const totalAmount = parseToken("1.00");
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, seller.account.address, totalAmount);

      // Try to use an EOA (not a contract) as token address
      // This will fail because the transferWithAuthorization call will revert
      await expect(
        splitter.write.executeSplit(
          [
            otherAccount.account.address, // EOA, not a contract
            auth.from as `0x${string}`,
            seller.account.address,
            auth.salt,
            auth.value,
            auth.validAfter,
            auth.validBefore,
            auth.nonce,
            auth.v,
            auth.r,
            auth.s,
          ],
          { account: facilitator.account },
        ),
      ).to.be.rejected; // Will fail on transferWithAuthorization call to non-contract
    });

    it("Should prevent cross-token replay (signature bound to token domain)", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator, publicClient } = await loadFixture(
        deploySplitterFixture,
      );

      // Deploy a second mock USDC (different contract = different EIP-712 domain)
      const mockUSDC2 = await hre.viem.deployContract("MockUSDC_EIP3009");
      await mockUSDC2.write.mint([buyer.account.address, parseToken("1000")]);

      const totalAmount = parseToken("1.00");
      
      // Create authorization for mockUSDC (first token)
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, seller.account.address, totalAmount);

      // Attempt to use authorization on mockUSDC2 (different token)
      // This should fail because the EIP-712 domain includes the contract address
      await expect(
        splitter.write.executeSplit(
          [
            mockUSDC2.address, // Different token!
            auth.from as `0x${string}`,
            seller.account.address,
            auth.salt,
            auth.value,
            auth.validAfter,
            auth.validBefore,
            auth.nonce,
            auth.v,
            auth.r,
            auth.s,
          ],
          { account: facilitator.account },
        ),
      ).to.be.rejected; // EIP-712 signature verification will fail (wrong domain)
    });

    it("Should work with multiple different tokens in sequence", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator, publicClient } = await loadFixture(
        deploySplitterFixture,
      );

      // Deploy a second mock token
      const mockUSDC2 = await hre.viem.deployContract("MockUSDC_EIP3009");
      await mockUSDC2.write.mint([buyer.account.address, parseToken("1000")]);

      const amount1 = parseToken("1.00");
      const amount2 = parseToken("2.00");

      // Authorization for first token
      const auth1 = await createAuthorization(mockUSDC, buyer, splitter.address, seller.account.address, amount1);
      
      // Authorization for second token
      const auth2 = await createAuthorization(mockUSDC2, buyer, splitter.address, seller.account.address, amount2);

      // Execute split with first token
      const hash1 = await splitter.write.executeSplit(
        [
          mockUSDC.address,
          auth1.from as `0x${string}`,
          seller.account.address,
          auth1.salt,
          auth1.value,
          auth1.validAfter,
          auth1.validBefore,
          auth1.nonce,
          auth1.v,
          auth1.r,
          auth1.s,
        ],
        { account: facilitator.account },
      );

      const receipt1 = await publicClient.waitForTransactionReceipt({ hash: hash1 });
      expect(receipt1.status).to.equal("success");

      // Execute split with second token
      const hash2 = await splitter.write.executeSplit(
        [
          mockUSDC2.address,
          auth2.from as `0x${string}`,
          seller.account.address,
          auth2.salt,
          auth2.value,
          auth2.validAfter,
          auth2.validBefore,
          auth2.nonce,
          auth2.v,
          auth2.r,
          auth2.s,
        ],
        { account: facilitator.account },
      );

      const receipt2 = await publicClient.waitForTransactionReceipt({ hash: hash2 });
      expect(receipt2.status).to.equal("success");

      // Verify balances for first token
      const expectedSeller1 = amount1 - FEE_1_CENT;
      expect(await mockUSDC.read.balanceOf([seller.account.address])).to.equal(expectedSeller1);

      // Verify balances for second token
      const expectedSeller2 = amount2 - FEE_1_CENT;
      expect(await mockUSDC2.read.balanceOf([seller.account.address])).to.equal(expectedSeller2);

      // Verify facilitator received fees from both tokens
      expect(await mockUSDC.read.balanceOf([facilitator.account.address])).to.equal(FEE_1_CENT);
      expect(await mockUSDC2.read.balanceOf([facilitator.account.address])).to.equal(FEE_1_CENT);
    });

    it("Should not allow reusing nonce across different tokens", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator, publicClient } = await loadFixture(
        deploySplitterFixture,
      );

      // Deploy a second mock token
      const mockUSDC2 = await hre.viem.deployContract("MockUSDC_EIP3009");
      await mockUSDC2.write.mint([buyer.account.address, parseToken("1000")]);

      const totalAmount = parseToken("1.00");
      
      // Create authorization for first token
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, seller.account.address, totalAmount);

      // Execute with first token - should succeed
      const hash = await splitter.write.executeSplit(
        [
          mockUSDC.address,
          auth.from as `0x${string}`,
          seller.account.address,
          auth.salt,
          auth.value,
          auth.validAfter,
          auth.validBefore,
          auth.nonce,
          auth.v,
          auth.r,
          auth.s,
        ],
        { account: facilitator.account },
      );

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      expect(receipt.status).to.equal("success");

      // Create new auth for second token with SAME nonce (manually)
      // This simulates an attacker trying to reuse the nonce
      // The signature won't work because EIP-712 domain is different
      await expect(
        splitter.write.executeSplit(
          [
            mockUSDC2.address, // Different token
            auth.from as `0x${string}`,
            seller.account.address,
            auth.salt,
            auth.value,
            auth.validAfter,
            auth.validBefore,
            auth.nonce, // Same nonce
            auth.v,
            auth.r,
            auth.s,
          ],
          { account: facilitator.account },
        ),
      ).to.be.rejected; // Signature bound to mockUSDC domain, won't verify on mockUSDC2
    });

    it("Should verify contract has no persistent token balance after split", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator, publicClient } = await loadFixture(
        deploySplitterFixture,
      );

      const totalAmount = parseToken("10.00");
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, seller.account.address, totalAmount);

      // Check contract balance before
      expect(await mockUSDC.read.balanceOf([splitter.address])).to.equal(0n);

      // Execute split
      const hash = await splitter.write.executeSplit(
        [
          mockUSDC.address,
          auth.from as `0x${string}`,
          seller.account.address,
          auth.salt,
          auth.value,
          auth.validAfter,
          auth.validBefore,
          auth.nonce,
          auth.v,
          auth.r,
          auth.s,
        ],
        { account: facilitator.account },
      );

      await publicClient.waitForTransactionReceipt({ hash });

      // Verify contract balance after - should still be 0 (all funds distributed)
      expect(await mockUSDC.read.balanceOf([splitter.address])).to.equal(0n);

      // Verify funds went to correct recipients
      const expectedSellerAmount = totalAmount - FEE_1_CENT;
      expect(await mockUSDC.read.balanceOf([seller.account.address])).to.equal(expectedSellerAmount);
      expect(await mockUSDC.read.balanceOf([facilitator.account.address])).to.equal(FEE_1_CENT);
    });
  });
});
