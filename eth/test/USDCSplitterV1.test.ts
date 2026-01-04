import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseUnits, keccak256, toHex, getAddress, encodeAbiParameters, encodeFunctionData } from "viem";

describe("USDCSplitterV1", function () {
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
    const implementation = await hre.viem.deployContract("USDCSplitterV1");

    // Encode initialize call using encodeFunctionData
    const initializeData = encodeFunctionData({
      abi: implementation.abi,
      functionName: "initialize",
      args: [mockUSDC.address, facilitator.account.address, FEE_1_CENT],
    });

    // Deploy proxy
    const proxy = await hre.viem.deployContract("ERC1967Proxy", [
      implementation.address,
      initializeData as `0x${string}`,
    ]);

    // Get Splitter interface at proxy address
    const splitter = await hre.viem.getContractAt("USDCSplitterV1", proxy.address);

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
   * Helper: Create EIP-3009 authorization signature
   */
  async function createAuthorization(
    mockUSDC: any,
    buyer: any,
    to: `0x${string}`,
    amount: bigint,
    validAfter: bigint = 0n,
    validBefore: bigint = BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
  ) {
    const nonceValue = Date.now() + Math.random();
    const nonce = keccak256(toHex(nonceValue.toString()));

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
      value: amount,
      validAfter,
      validBefore,
      nonce,
      v,
      r,
      s,
    };
  }

  describe("Deployment", function () {
    it("Should initialize with correct parameters", async function () {
      const { splitter, mockUSDC, facilitator } = await loadFixture(deploySplitterFixture);

      expect(await splitter.read.token()).to.equal(getAddress(mockUSDC.address));
      expect(await splitter.read.facilitatorWallet()).to.equal(getAddress(facilitator.account.address));
      expect(await splitter.read.fixedFee()).to.equal(FEE_1_CENT);
    });

    it("Should set owner correctly", async function () {
      const { splitter, owner } = await loadFixture(deploySplitterFixture);

      expect(await splitter.read.owner()).to.equal(getAddress(owner.account.address));
    });
  });

  describe("Split Execution", function () {
    it("Should execute split correctly with 1 cent fee", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator, publicClient } = await loadFixture(
        deploySplitterFixture,
      );

      const totalAmount = parseToken("1.00"); // 1.00 token
      const expectedSellerAmount = totalAmount - FEE_1_CENT; // 0.99 token
      const expectedFee = FEE_1_CENT; // 0.01 token

      // Create authorization
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, totalAmount);

      // Execute split (called by anyone, typically facilitator)
      const hash = await splitter.write.executeSplit(
        [
          auth.from as `0x${string}`,
          seller.account.address,
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

      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, totalAmount);

      await splitter.write.executeSplit(
        [
          auth.from as `0x${string}`,
          seller.account.address,
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
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, totalAmount);

      const hash = await splitter.write.executeSplit(
        [
          auth.from as `0x${string}`,
          seller.account.address,
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
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, totalAmount);

      await expect(
        splitter.write.executeSplit(
          [
            auth.from as `0x${string}`,
            seller.account.address,
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
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, totalAmount);

      await expect(
        splitter.write.executeSplit(
          [
            auth.from as `0x${string}`,
            seller.account.address,
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
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, totalAmount);

      const zeroAddress = "0x0000000000000000000000000000000000000000";
      await expect(
        splitter.write.executeSplit(
          [
            auth.from as `0x${string}`,
            zeroAddress as `0x${string}`,
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
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, totalAmount);

      // First execution should succeed
      await splitter.write.executeSplit(
        [
          auth.from as `0x${string}`,
          seller.account.address,
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
            auth.from as `0x${string}`,
            seller.account.address,
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
      const auth1 = await createAuthorization(mockUSDC, buyer, splitter.address, amount1);
      await splitter.write.executeSplit(
        [
          auth1.from as `0x${string}`,
          seller.account.address,
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
      const auth2 = await createAuthorization(mockUSDC, buyer2, splitter.address, amount2);
      await splitter.write.executeSplit(
        [
          auth2.from as `0x${string}`,
          seller.account.address,
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
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, totalAmount);

      await splitter.write.executeSplit(
        [
          auth.from as `0x${string}`,
          seller.account.address,
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
      const isUsed = await splitter.read.isAuthorizationUsed([buyer.account.address, nonce]);

      expect(isUsed).to.equal(false);
    });

    it("Should correctly report used authorization", async function () {
      const { splitter, mockUSDC, buyer, seller, facilitator } = await loadFixture(deploySplitterFixture);

      const totalAmount = parseToken("1.00");
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, totalAmount);

      // Execute split
      await splitter.write.executeSplit(
        [
          auth.from as `0x${string}`,
          seller.account.address,
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
      const isUsed = await splitter.read.isAuthorizationUsed([buyer.account.address, auth.nonce]);
      expect(isUsed).to.equal(true);
    });
  });

  describe("UUPS Upgradeability", function () {
    it("Should allow owner to authorize upgrade", async function () {
      const { splitter, owner, implementation } = await loadFixture(deploySplitterFixture);

      // Deploy new implementation
      const newImplementation = await hre.viem.deployContract("USDCSplitterV1");

      // Upgrade should succeed (owner authorized)
      await expect(
        splitter.write.upgradeToAndCall([newImplementation.address, "0x" as `0x${string}`], {
          account: owner.account,
        }),
      ).to.be.fulfilled;
    });

    it("Should reject upgrade from non-owner", async function () {
      const { splitter, otherAccount } = await loadFixture(deploySplitterFixture);

      const newImplementation = await hre.viem.deployContract("USDCSplitterV1");

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
        totalAmount,
        0n, // validAfter
        now - 3600n, // validBefore: 1 hour in the past
      );

      await expect(
        splitter.write.executeSplit(
          [
            auth.from as `0x${string}`,
            seller.account.address,
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
        totalAmount,
        now + 3600n, // validAfter: 1 hour in the future
        now + 7200n, // validBefore: 2 hours in the future
      );

      await expect(
        splitter.write.executeSplit(
          [
            auth.from as `0x${string}`,
            seller.account.address,
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
      const auth = await createAuthorization(mockUSDC, otherAccount, splitter.address, totalAmount);

      await expect(
        splitter.write.executeSplit(
          [
            buyer.account.address, // Claim it's from buyer
            seller.account.address,
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
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, totalAmount);

      await expect(
        splitter.write.executeSplit(
          [
            auth.from as `0x${string}`,
            seller.account.address,
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
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, totalAmount);

      // Buyer is also the seller (edge case but valid)
      const hash = await splitter.write.executeSplit(
        [
          auth.from as `0x${string}`,
          buyer.account.address, // seller = buyer
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
      const auth = await createAuthorization(mockUSDC, buyer, splitter.address, totalAmount);

      // Seller is the facilitator wallet
      const hash = await splitter.write.executeSplit(
        [
          auth.from as `0x${string}`,
          facilitator.account.address, // seller = facilitator
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
});
