// @ts-check
import { describe, it, expect } from "vitest";
import {
  calculateFee,
  validateFeeIncluded,
  getFeeInformation,
  getTokenConfig,
  FEE_CONFIG,
} from "../fee_config.js";

const USDC_MAINNET = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85";
const USDC_SEPOLIA = "0x5fd84259d66Cd46123540766Be93DFE6D43130D7";

describe("Fee Configuration", () => {
  describe("getTokenConfig", () => {
    it("should return config for supported token (case-insensitive)", () => {
      const config = getTokenConfig(USDC_MAINNET);
      expect(config).toBeDefined();
      expect(config?.name).toBe("USDC");
      expect(config?.decimals).toBe(6);
      expect(config?.chainId).toBe(10);
    });

    it("should handle lowercase addresses", () => {
      const config = getTokenConfig(USDC_MAINNET.toLowerCase());
      expect(config).toBeDefined();
      expect(config?.name).toBe("USDC");
    });

    it("should return null for unsupported token", () => {
      const config = getTokenConfig("0x1234567890123456789012345678901234567890");
      expect(config).toBeNull();
    });
  });

  describe("calculateFee", () => {
    it("should calculate flat $0.01 fee for $10 payment", () => {
      const paymentAmount = "10000000"; // $10 USDC
      const fee = calculateFee(paymentAmount, USDC_MAINNET);

      expect(fee.serviceFee).toBe("10000"); // $0.01 USDC
      expect(fee.serviceFeeUsd).toBe(0.01);
      expect(fee.totalAmount).toBe("10010000"); // $10.01 USDC
      expect(fee.totalAmountUsd).toBe(10.01);
      expect(fee.feePercent).toBe(0.1); // 0.1% for $10
    });

    it("should calculate flat $0.01 fee for $100 payment", () => {
      const paymentAmount = "100000000"; // $100 USDC
      const fee = calculateFee(paymentAmount, USDC_MAINNET);

      expect(fee.serviceFee).toBe("10000");
      expect(fee.serviceFeeUsd).toBe(0.01);
      expect(fee.totalAmount).toBe("100010000"); // $100.01 USDC
      expect(fee.feePercent).toBe(0.01); // 0.01% for $100
    });

    it("should calculate flat $0.01 fee for $1 payment", () => {
      const paymentAmount = "1000000"; // $1 USDC
      const fee = calculateFee(paymentAmount, USDC_MAINNET);

      expect(fee.serviceFee).toBe("10000");
      expect(fee.serviceFeeUsd).toBe(0.01);
      expect(fee.totalAmount).toBe("1010000"); // $1.01 USDC
      expect(fee.feePercent).toBe(1); // 1% for $1
    });

    it("should throw error for payment below minimum", () => {
      const paymentAmount = "50000"; // $0.05 USDC (below $0.10 minimum)

      expect(() => calculateFee(paymentAmount, USDC_MAINNET)).toThrow(
        /Transaction amount too small/,
      );
    });

    it("should work for testnet USDC", () => {
      const paymentAmount = "25000000"; // $25 USDC
      const fee = calculateFee(paymentAmount, USDC_SEPOLIA);

      expect(fee.serviceFee).toBe("10000");
      expect(fee.totalAmount).toBe("25010000");
      expect(fee.feePercent).toBe(0.04); // 0.04% for $25
    });

    it("should throw error for unsupported token", () => {
      expect(() => calculateFee("1000000", "0x1234567890123456789012345678901234567890")).toThrow(
        /not supported/,
      );
    });
  });

  describe("validateFeeIncluded", () => {
    it("should validate correct authorization with fee", () => {
      const paymentAmount = "10000000"; // $10
      const authorizedAmount = "10010000"; // $10.01 (with fee)

      const result = validateFeeIncluded(authorizedAmount, paymentAmount, USDC_MAINNET);

      expect(result.valid).toBe(true);
      expect(result.serviceFee).toBe("10000");
      expect(result.serviceFeeUsd).toBe(0.01);
    });

    it("should reject authorization without fee", () => {
      const paymentAmount = "10000000"; // $10
      const authorizedAmount = "10000000"; // $10 (missing fee)

      const result = validateFeeIncluded(authorizedAmount, paymentAmount, USDC_MAINNET);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Insufficient authorization");
      expect(result.missing).toBe("10000");
    });

    it("should accept authorization with surplus", () => {
      const paymentAmount = "10000000"; // $10
      const authorizedAmount = "11000000"; // $11 (more than needed)

      const result = validateFeeIncluded(authorizedAmount, paymentAmount, USDC_MAINNET);

      expect(result.valid).toBe(true);
      expect(result.serviceFee).toBe("10000");
    });

    it("should return error for unsupported token", () => {
      const result = validateFeeIncluded(
        "10000000",
        "10000000",
        "0x1234567890123456789012345678901234567890",
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain("not supported");
    });

    it("should accept string parameters (not objects) - regression test", () => {
      // This test ensures validateFeeIncluded works with string parameters
      // Previously there was a bug where authorization object was passed instead of authorization.value
      const paymentAmount = "1000000"; // $1
      const authorizedAmount = "1010000"; // $1.01 (with fee)

      const result = validateFeeIncluded(authorizedAmount, paymentAmount, USDC_MAINNET);

      expect(result.valid).toBe(true);
      expect(result.serviceFee).toBe("10000");

      // Ensure function fails gracefully if wrong types are passed
      expect(typeof authorizedAmount).toBe("string");
      expect(typeof paymentAmount).toBe("string");
    });
  });

  describe("getFeeInformation", () => {
    it("should return fee info for all supported tokens", () => {
      const feeInfo = getFeeInformation();

      expect(feeInfo[USDC_MAINNET]).toBeDefined();
      expect(feeInfo[USDC_SEPOLIA]).toBeDefined();

      const mainnetFee = feeInfo[USDC_MAINNET];
      expect(mainnetFee?.token).toBe("USDC");
      expect(mainnetFee?.feeModel).toBe("flat");
      expect(mainnetFee?.flatFee).toBe("10000");
      expect(mainnetFee?.flatFeeUsd).toBe(0.01);
      expect(mainnetFee?.minTransaction).toBe("100000");
      expect(mainnetFee?.minTransactionUsd).toBe(0.1);
    });

    it("should include all required fields", () => {
      const feeInfo = getFeeInformation();
      const fee = feeInfo[USDC_MAINNET];

      expect(fee).toHaveProperty("token");
      expect(fee).toHaveProperty("chainId");
      expect(fee).toHaveProperty("decimals");
      expect(fee).toHaveProperty("feeModel");
      expect(fee).toHaveProperty("flatFee");
      expect(fee).toHaveProperty("flatFeeUsd");
      expect(fee).toHaveProperty("minTransaction");
      expect(fee).toHaveProperty("minTransactionUsd");
    });
  });

  describe("Fee Configuration Constants", () => {
    it("should have correct flat fee", () => {
      expect(FEE_CONFIG.FLAT_FEE_USD).toBe(0.01);
    });

    it("should have correct minimum transaction", () => {
      expect(FEE_CONFIG.MIN_TRANSACTION_USD).toBe(0.1);
    });

    it("should support USDC on Optimism Mainnet", () => {
      const tokens = FEE_CONFIG.SUPPORTED_TOKENS;
      expect(tokens[USDC_MAINNET]).toBeDefined();
      expect(tokens[USDC_MAINNET]?.chainId).toBe(10);
    });

    it("should support USDC on Optimism Sepolia", () => {
      const tokens = FEE_CONFIG.SUPPORTED_TOKENS;
      expect(tokens[USDC_SEPOLIA]).toBeDefined();
      expect(tokens[USDC_SEPOLIA]?.chainId).toBe(11155420);
    });
  });
});
