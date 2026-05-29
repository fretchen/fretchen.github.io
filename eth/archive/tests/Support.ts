import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("Support contract", function () {
  it("Should allow users to donate ETH and increment like count", async function () {
    // Arrange - Deploy contract and get accounts
    const [owner, user] = await hre.viem.getWalletClients();
    const supportContract = await hre.viem.deployContract("Support");
    const testUrl = "https://example.com";

    // Get initial balance of owner
    const publicClient = await hre.viem.getPublicClient();
    const initialOwnerBalance = await publicClient.getBalance({ address: owner.account.address });

    // Act - User donates ETH to the URL
    const donationAmount = parseEther("0.1");
    await supportContract.write.donate([testUrl], {
      value: donationAmount,
      account: user.account,
    });

    // Assert - URL has received one like
    const likeCount = await supportContract.read.getLikesForUrl([testUrl]);
    expect(likeCount).to.equal(1n);

    // Assert - Owner received the donation
    const finalOwnerBalance = await publicClient.getBalance({ address: owner.account.address });
    expect(finalOwnerBalance - initialOwnerBalance).to.equal(donationAmount);
  });

  it("Should increment like count for multiple donations to same URL", async function () {
    // Arrange
    const [_, user1, user2] = await hre.viem.getWalletClients();
    const supportContract = await hre.viem.deployContract("Support");
    const testUrl = "https://example.com";

    // Act - Two users donate to the same URL
    await supportContract.write.donate([testUrl], {
      value: parseEther("0.01"),
      account: user1.account,
    });

    await supportContract.write.donate([testUrl], {
      value: parseEther("0.02"),
      account: user2.account,
    });

    // Assert - URL has received two likes
    const likeCount = await supportContract.read.getLikesForUrl([testUrl]);
    expect(likeCount).to.equal(2n);
  });

  it("Should revert when donation amount is zero", async function () {
    // Arrange
    const [_, user] = await hre.viem.getWalletClients();
    const supportContract = await hre.viem.deployContract("Support");
    const testUrl = "https://example.com";

    // Act & Assert - Transaction should revert with specific message
    await expect(
      supportContract.write.donate([testUrl], {
        value: 0n,
        account: user.account,
      }),
    ).to.be.rejectedWith("Support amount must be greater than zero");
  });

  it("Should revert when URL is empty", async function () {
    // Arrange
    const [_, user] = await hre.viem.getWalletClients();
    const supportContract = await hre.viem.deployContract("Support");

    // Act & Assert - Transaction should revert with specific message
    await expect(
      supportContract.write.donate([""], {
        value: parseEther("0.01"),
        account: user.account,
      }),
    ).to.be.rejectedWith("URL cannot be empty");
  });
});
