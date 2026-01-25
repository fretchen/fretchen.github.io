import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseUnits, parseEther, keccak256, toHex, getAddress, encodeFunctionData } from "viem";

/**
 * SupportV2 Functional Tests
 *
 * Tests contract functionality using Viem only (no ethers, no OpenZeppelin Upgrades Plugin).
 * Proxy is deployed manually via ERC1967Proxy contract.
 */
describe("SupportV2 - Functional Tests", function () {
  // Token decimals (USDC uses 6)
  const TOKEN_DECIMALS = 6;
  const parseToken = (amount: string) => parseUnits(amount, TOKEN_DECIMALS);

  // Test amounts
  const ETH_DONATION = parseEther("0.0002");
  const TOKEN_DONATION = parseToken("1"); // 1 USDC

  // Test URL
  const TEST_URL = "https://fretchen.github.io/blog/test-post";

  /**
   * Deploy fixture with SupportV2 proxy and mock USDC
   * Uses manual proxy deployment (Viem only, no OpenZeppelin Upgrades Plugin)
   */
  async function deploySupportFixture() {
    const [owner, donor, recipient, otherAccount] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    // Deploy mock USDC with EIP-3009 support
    const mockUSDC = await hre.viem.deployContract("MockUSDC_EIP3009");

    // Mint tokens to donor for testing
    const initialBalance = parseToken("1000"); // 1000 USDC
    await mockUSDC.write.mint([donor.account.address, initialBalance]);

    // Deploy SupportV2 implementation
    const implementation = await hre.viem.deployContract("SupportV2");

    // Encode initialize call
    const initializeData = encodeFunctionData({
      abi: implementation.abi,
      functionName: "initialize",
      args: [owner.account.address],
    });

    // Deploy proxy manually (Viem only)
    const proxy = await hre.viem.deployContract("ERC1967Proxy", [
      implementation.address,
      initializeData as `0x${string}`,
    ]);

    // Get SupportV2 interface at proxy address
    const support = await hre.viem.getContractAt("SupportV2", proxy.address);

    return {
      support,
      mockUSDC,
      owner,
      donor,
      recipient,
      otherAccount,
      publicClient,
      implementation,
    };
  }

  /**
   * Helper: Create EIP-3009 authorization signature for token donation
   * Note: Uses current block timestamp from Hardhat, not Date.now()
   */
  async function createTokenAuthorization(
    mockUSDC: {
      read: { eip712Domain: () => Promise<unknown> };
      address: `0x${string}`;
    },
    donor: {
      account: { address: `0x${string}` };
      signTypedData: (args: unknown) => Promise<`0x${string}`>;
    },
    recipient: `0x${string}`,
    amount: bigint,
    validAfter: bigint = 0n,
    validBeforeOverride?: bigint,
  ) {
    // Get current block timestamp from Hardhat (not Date.now()!)
    const publicClient = await hre.viem.getPublicClient();
    const block = await publicClient.getBlock();
    const currentTimestamp = block.timestamp;

    // Default: valid for 1 hour from current block time
    const validBefore = validBeforeOverride ?? currentTimestamp + 3600n;

    // Generate random nonce
    const saltValue = Date.now() + Math.random();
    const nonce = keccak256(toHex(saltValue.toString()));

    // Get domain separator from mock USDC
    const domain = (await mockUSDC.read.eip712Domain()) as [
      `0x${string}`,
      string,
      string,
      bigint,
      `0x${string}`,
      `0x${string}`,
      bigint[],
    ];

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
      from: getAddress(donor.account.address),
      to: getAddress(recipient),
      value: amount,
      validAfter,
      validBefore,
      nonce,
    };

    // Sign with donor's wallet
    const signature = await donor.signTypedData({
      domain: {
        name: domain[1],
        version: domain[2],
        chainId: Number(domain[3]),
        verifyingContract: domain[4] as `0x${string}`,
      },
      types,
      primaryType: "TransferWithAuthorization",
      message,
    });

    // Split signature into v, r, s
    const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
    const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
    const v = parseInt(signature.slice(130, 132), 16);

    return {
      nonce,
      validAfter,
      validBefore,
      v,
      r,
      s,
    };
  }

  describe("Initialization", function () {
    it("should initialize with correct owner", async function () {
      const { support, owner } = await loadFixture(deploySupportFixture);
      expect(await support.read.owner()).to.equal(getAddress(owner.account.address));
    });

    it("should have VERSION = 1", async function () {
      const { support } = await loadFixture(deploySupportFixture);
      expect(await support.read.VERSION()).to.equal(1n);
    });

    it("should not allow re-initialization", async function () {
      const { support, otherAccount } = await loadFixture(deploySupportFixture);
      await expect(support.write.initialize([otherAccount.account.address])).to.be.rejectedWith(
        "InvalidInitialization",
      );
    });
  });

  describe("ETH Donations", function () {
    it("should accept ETH donation and increment likes", async function () {
      const { support, donor, recipient, publicClient } = await loadFixture(deploySupportFixture);

      const recipientBalanceBefore = await publicClient.getBalance({
        address: recipient.account.address,
      });

      // Donate ETH
      await support.write.donate([TEST_URL, recipient.account.address], {
        value: ETH_DONATION,
        account: donor.account,
      });

      // Check likes incremented
      expect(await support.read.getLikesForUrl([TEST_URL])).to.equal(1n);

      // Check recipient received ETH
      const recipientBalanceAfter = await publicClient.getBalance({
        address: recipient.account.address,
      });
      expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(ETH_DONATION);
    });

    it("should emit Donation event with correct params", async function () {
      const { support, donor, recipient, publicClient } = await loadFixture(deploySupportFixture);

      const hash = await support.write.donate([TEST_URL, recipient.account.address], {
        value: ETH_DONATION,
        account: donor.account,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      expect(receipt.logs.length).to.be.greaterThan(0);
    });

    it("should reject donation with zero ETH", async function () {
      const { support, donor, recipient } = await loadFixture(deploySupportFixture);

      await expect(
        support.write.donate([TEST_URL, recipient.account.address], {
          value: 0n,
          account: donor.account,
        }),
      ).to.be.rejectedWith("No ETH sent");
    });

    it("should reject donation to zero address", async function () {
      const { support, donor } = await loadFixture(deploySupportFixture);

      await expect(
        support.write.donate([TEST_URL, "0x0000000000000000000000000000000000000000"], {
          value: ETH_DONATION,
          account: donor.account,
        }),
      ).to.be.rejectedWith("Invalid recipient");
    });

    it("should increment likes for multiple donations to same URL", async function () {
      const { support, donor, recipient } = await loadFixture(deploySupportFixture);

      await support.write.donate([TEST_URL, recipient.account.address], {
        value: ETH_DONATION,
        account: donor.account,
      });
      await support.write.donate([TEST_URL, recipient.account.address], {
        value: ETH_DONATION,
        account: donor.account,
      });
      await support.write.donate([TEST_URL, recipient.account.address], {
        value: ETH_DONATION,
        account: donor.account,
      });

      expect(await support.read.getLikesForUrl([TEST_URL])).to.equal(3n);
    });
  });

  describe("Token Donations (EIP-3009)", function () {
    it("should accept token donation with valid signature", async function () {
      const { support, donor, recipient, mockUSDC } = await loadFixture(deploySupportFixture);

      const recipientBalanceBefore = await mockUSDC.read.balanceOf([recipient.account.address]);

      // Create authorization signature (to = recipient directly)
      const auth = await createTokenAuthorization(mockUSDC, donor, recipient.account.address, TOKEN_DONATION);

      // Donate tokens
      await support.write.donateToken(
        [
          TEST_URL,
          recipient.account.address,
          mockUSDC.address,
          TOKEN_DONATION,
          auth.validAfter,
          auth.validBefore,
          auth.nonce,
          auth.v,
          auth.r,
          auth.s,
        ],
        { account: donor.account },
      );

      // Check likes incremented
      expect(await support.read.getLikesForUrl([TEST_URL])).to.equal(1n);

      // Check recipient received tokens
      const recipientBalanceAfter = await mockUSDC.read.balanceOf([recipient.account.address]);
      expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(TOKEN_DONATION);
    });

    it("should reject donation with zero token address", async function () {
      const { support, donor, recipient, mockUSDC } = await loadFixture(deploySupportFixture);

      const auth = await createTokenAuthorization(mockUSDC, donor, recipient.account.address, TOKEN_DONATION);

      await expect(
        support.write.donateToken(
          [
            TEST_URL,
            recipient.account.address,
            "0x0000000000000000000000000000000000000000",
            TOKEN_DONATION,
            auth.validAfter,
            auth.validBefore,
            auth.nonce,
            auth.v,
            auth.r,
            auth.s,
          ],
          { account: donor.account },
        ),
      ).to.be.rejectedWith("Invalid token");
    });

    it("should reject donation with zero amount", async function () {
      const { support, donor, recipient, mockUSDC } = await loadFixture(deploySupportFixture);

      const auth = await createTokenAuthorization(mockUSDC, donor, recipient.account.address, 0n);

      await expect(
        support.write.donateToken(
          [
            TEST_URL,
            recipient.account.address,
            mockUSDC.address,
            0n,
            auth.validAfter,
            auth.validBefore,
            auth.nonce,
            auth.v,
            auth.r,
            auth.s,
          ],
          { account: donor.account },
        ),
      ).to.be.rejectedWith("Amount must be > 0");
    });

    it("should reject donation to zero address", async function () {
      const { support, donor, mockUSDC } = await loadFixture(deploySupportFixture);

      const auth = await createTokenAuthorization(
        mockUSDC,
        donor,
        "0x0000000000000000000000000000000000000000",
        TOKEN_DONATION,
      );

      await expect(
        support.write.donateToken(
          [
            TEST_URL,
            "0x0000000000000000000000000000000000000000",
            mockUSDC.address,
            TOKEN_DONATION,
            auth.validAfter,
            auth.validBefore,
            auth.nonce,
            auth.v,
            auth.r,
            auth.s,
          ],
          { account: donor.account },
        ),
      ).to.be.rejectedWith("Invalid recipient");
    });
  });

  describe("URL Likes", function () {
    it("should return 0 for URL with no donations", async function () {
      const { support } = await loadFixture(deploySupportFixture);
      expect(await support.read.getLikesForUrl(["https://example.com/no-donations"])).to.equal(0n);
    });

    it("should track likes separately for different URLs", async function () {
      const { support, donor, recipient } = await loadFixture(deploySupportFixture);

      const url1 = "https://fretchen.github.io/blog/post-1";
      const url2 = "https://fretchen.github.io/blog/post-2";

      await support.write.donate([url1, recipient.account.address], {
        value: ETH_DONATION,
        account: donor.account,
      });
      await support.write.donate([url1, recipient.account.address], {
        value: ETH_DONATION,
        account: donor.account,
      });
      await support.write.donate([url2, recipient.account.address], {
        value: ETH_DONATION,
        account: donor.account,
      });

      expect(await support.read.getLikesForUrl([url1])).to.equal(2n);
      expect(await support.read.getLikesForUrl([url2])).to.equal(1n);
    });

    it("should count both ETH and token donations", async function () {
      const { support, donor, recipient, mockUSDC } = await loadFixture(deploySupportFixture);

      // ETH donation
      await support.write.donate([TEST_URL, recipient.account.address], {
        value: ETH_DONATION,
        account: donor.account,
      });

      // Token donation
      const auth = await createTokenAuthorization(mockUSDC, donor, recipient.account.address, TOKEN_DONATION);

      await support.write.donateToken(
        [
          TEST_URL,
          recipient.account.address,
          mockUSDC.address,
          TOKEN_DONATION,
          auth.validAfter,
          auth.validBefore,
          auth.nonce,
          auth.v,
          auth.r,
          auth.s,
        ],
        { account: donor.account },
      );

      // Should count both
      expect(await support.read.getLikesForUrl([TEST_URL])).to.equal(2n);
    });
  });

  describe("UUPS Upgrade Authorization", function () {
    it("should only allow owner to upgrade", async function () {
      const { support, otherAccount } = await loadFixture(deploySupportFixture);

      // Deploy new implementation
      const newImplementation = await hre.viem.deployContract("SupportV2");

      await expect(
        support.write.upgradeToAndCall([newImplementation.address, "0x" as `0x${string}`], {
          account: otherAccount.account,
        }),
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });
  });
});
