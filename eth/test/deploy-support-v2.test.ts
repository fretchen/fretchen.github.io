import { expect } from "chai";
import { formatEther, parseEther } from "viem";

/**
 * Tests for deploy-support-v2.ts script utility functions
 *
 * Note: These tests validate the balance checking logic that is also
 * embedded in the deploy script. The actual checkDeployerBalance function
 * is tested here via a reimplementation to ensure the logic is correct.
 */

// Minimum ETH balance required for deployment (must match deploy script)
const MIN_DEPLOYMENT_BALANCE = parseEther("0.03");

/**
 * Simulated balance check function (mirrors logic from deploy script)
 */
function checkBalance(balance: bigint): {
  isValid: boolean;
  deficit: bigint;
  errorMessage: string | null;
} {
  if (balance < MIN_DEPLOYMENT_BALANCE) {
    const deficit = MIN_DEPLOYMENT_BALANCE - balance;
    return {
      isValid: false,
      deficit,
      errorMessage:
        `Insufficient funds for deployment!\n` +
        `   Balance: ${formatEther(balance)} ETH\n` +
        `   Required: ${formatEther(MIN_DEPLOYMENT_BALANCE)} ETH\n` +
        `   Deficit: ${formatEther(deficit)} ETH`,
    };
  }

  return {
    isValid: true,
    deficit: 0n,
    errorMessage: null,
  };
}

describe("Deploy Script Balance Check", function () {
  describe("MIN_DEPLOYMENT_BALANCE constant", function () {
    it("should be 0.03 ETH", function () {
      expect(MIN_DEPLOYMENT_BALANCE).to.equal(parseEther("0.03"));
    });

    it("should be 30000000000000000 wei", function () {
      expect(MIN_DEPLOYMENT_BALANCE).to.equal(30000000000000000n);
    });
  });

  describe("Balance validation", function () {
    it("should reject zero balance", function () {
      const result = checkBalance(0n);

      expect(result.isValid).to.be.false;
      expect(result.deficit).to.equal(MIN_DEPLOYMENT_BALANCE);
      expect(result.errorMessage).to.include("Insufficient funds");
    });

    it("should reject balance below minimum (0.01 ETH)", function () {
      const balance = parseEther("0.01");
      const result = checkBalance(balance);

      expect(result.isValid).to.be.false;
      expect(result.deficit).to.equal(parseEther("0.02"));
      expect(result.errorMessage).to.include("0.01 ETH");
      expect(result.errorMessage).to.include("0.03 ETH");
    });

    it("should reject balance just below minimum (0.029 ETH)", function () {
      const balance = parseEther("0.029");
      const result = checkBalance(balance);

      expect(result.isValid).to.be.false;
      expect(result.deficit).to.equal(parseEther("0.001"));
    });

    it("should accept balance exactly at minimum (0.03 ETH)", function () {
      const balance = parseEther("0.03");
      const result = checkBalance(balance);

      expect(result.isValid).to.be.true;
      expect(result.deficit).to.equal(0n);
      expect(result.errorMessage).to.be.null;
    });

    it("should accept balance above minimum (0.05 ETH)", function () {
      const balance = parseEther("0.05");
      const result = checkBalance(balance);

      expect(result.isValid).to.be.true;
      expect(result.deficit).to.equal(0n);
      expect(result.errorMessage).to.be.null;
    });

    it("should accept large balance (1 ETH)", function () {
      const balance = parseEther("1");
      const result = checkBalance(balance);

      expect(result.isValid).to.be.true;
      expect(result.deficit).to.equal(0n);
      expect(result.errorMessage).to.be.null;
    });
  });

  describe("Error message formatting", function () {
    it("should include current balance in error message", function () {
      const balance = parseEther("0.01");
      const result = checkBalance(balance);

      expect(result.errorMessage).to.include("0.01 ETH");
    });

    it("should include required balance in error message", function () {
      const balance = parseEther("0.01");
      const result = checkBalance(balance);

      expect(result.errorMessage).to.include("0.03 ETH");
    });

    it("should include deficit in error message", function () {
      const balance = parseEther("0.01");
      const result = checkBalance(balance);

      expect(result.errorMessage).to.include("0.02 ETH");
    });
  });
});
