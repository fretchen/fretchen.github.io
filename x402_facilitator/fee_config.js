// @ts-check

/**
 * Fee Configuration for x402 Facilitator
 *
 * Strategy: Flat fee of $0.01-0.02 per transaction
 * This covers gas costs + minimal infrastructure costs.
 * Much more user-friendly than percentage-based fees.
 */

export const FEE_CONFIG = {
  // Flat fee per transaction (in USD)
  FLAT_FEE_USD: 0.01, // $0.01 per transaction

  // Minimum transaction amount (prevents abuse)
  MIN_TRANSACTION_USD: 0.02, // $0.02 minimum

  // Token-specific configurations
  SUPPORTED_TOKENS: {
    // USDC on Optimism Mainnet
    "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85": {
      name: "USDC",
      decimals: 6,
      chainId: 10,
    },
    // USDC on Optimism Sepolia (testnet)
    "0x5fd84259d66Cd46123540766Be93DFE6D43130D7": {
      name: "USDC",
      decimals: 6,
      chainId: 11155420,
    },
  },
};

/**
 * Get token configuration by address
 * @param {string} tokenAddress - Token contract address
 * @returns {object|null} Token config or null if not supported
 */
export function getTokenConfig(tokenAddress) {
  const normalized = tokenAddress.toLowerCase();
  for (const [address, config] of Object.entries(FEE_CONFIG.SUPPORTED_TOKENS)) {
    if (address.toLowerCase() === normalized) {
      return { ...config, address };
    }
  }
  return null;
}

/**
 * Calculate facilitator fee (flat $0.01)
 * @param {string} amountInTokenUnits - Payment amount in token's smallest units (e.g., "1000000" for $1 USDC)
 * @param {string} tokenAddress - Token contract address
 * @returns {{serviceFee: string, serviceFeeUsd: number, totalAmount: string, totalAmountUsd: number, feePercent: number}}
 */
export function calculateFee(amountInTokenUnits, tokenAddress) {
  const tokenConfig = getTokenConfig(tokenAddress);

  if (!tokenConfig) {
    throw new Error(`Token ${tokenAddress} not supported`);
  }

  const { decimals } = tokenConfig;
  const { FLAT_FEE_USD, MIN_TRANSACTION_USD } = FEE_CONFIG;

  // Convert to USD (assuming 1:1 stablecoin peg)
  const amountUsd = Number(amountInTokenUnits) / Math.pow(10, decimals);

  // Validate minimum
  if (amountUsd < MIN_TRANSACTION_USD) {
    throw new Error(
      `Transaction amount too small. Minimum: $${MIN_TRANSACTION_USD} (${MIN_TRANSACTION_USD * Math.pow(10, decimals)} token units)`,
    );
  }

  // Calculate flat fee in token units
  const serviceFeeTokenUnits = Math.ceil(FLAT_FEE_USD * Math.pow(10, decimals));
  const totalAmount = BigInt(amountInTokenUnits) + BigInt(serviceFeeTokenUnits);
  const totalAmountUsd = Number(totalAmount) / Math.pow(10, decimals);

  // Calculate effective percentage
  const feePercent = (FLAT_FEE_USD / amountUsd) * 100;

  return {
    serviceFee: serviceFeeTokenUnits.toString(),
    serviceFeeUsd: FLAT_FEE_USD,
    totalAmount: totalAmount.toString(),
    totalAmountUsd: Number(totalAmountUsd.toFixed(decimals)),
    feePercent: Number(feePercent.toFixed(2)),
    paymentAmount: amountInTokenUnits,
    paymentAmountUsd: amountUsd,
  };
}

/**
 * Validate that authorized amount includes the service fee
 * @param {string} authorizedAmount - Amount user authorized in transferWithAuthorization
 * @param {string} paymentAmount - Amount to be paid to recipient
 * @param {string} tokenAddress - Token contract address
 * @returns {{valid: boolean, error?: string, expected?: string}}
 */
export function validateFeeIncluded(authorizedAmount, paymentAmount, tokenAddress) {
  try {
    const calc = calculateFee(paymentAmount, tokenAddress);
    const authorized = BigInt(authorizedAmount);
    const expected = BigInt(calc.totalAmount);

    if (authorized < expected) {
      return {
        valid: false,
        error: `Insufficient authorization. Expected: ${expected.toString()} (payment + $${calc.serviceFeeUsd} fee), Got: ${authorizedAmount}`,
        expected: expected.toString(),
        actual: authorizedAmount,
        missing: (expected - authorized).toString(),
      };
    }

    return {
      valid: true,
      authorizedAmount,
      paymentAmount,
      serviceFee: calc.serviceFee,
      serviceFeeUsd: calc.serviceFeeUsd,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
}

/**
 * Get fee information for all supported tokens (for /supported endpoint)
 * @returns {object} Fee information by token address
 */
export function getFeeInformation() {
  const fees = {};
  const { FLAT_FEE_USD, MIN_TRANSACTION_USD } = FEE_CONFIG;

  for (const [address, config] of Object.entries(FEE_CONFIG.SUPPORTED_TOKENS)) {
    const flatFeeTokenUnits = Math.ceil(FLAT_FEE_USD * Math.pow(10, config.decimals));
    const minTransactionTokenUnits = Math.ceil(MIN_TRANSACTION_USD * Math.pow(10, config.decimals));

    fees[address] = {
      token: config.name,
      chainId: config.chainId,
      decimals: config.decimals,
      feeModel: "flat",
      flatFee: flatFeeTokenUnits.toString(),
      flatFeeUsd: FLAT_FEE_USD,
      minTransaction: minTransactionTokenUnits.toString(),
      minTransactionUsd: MIN_TRANSACTION_USD,
    };
  }

  return fees;
}

/**
 * Example usage and test cases
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("💰 Flat Fee Model: $0.01 per transaction\n");

  const USDC_MAINNET = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85";

  const testCases = [
    { amountUsd: 1, description: "$1 payment" },
    { amountUsd: 5, description: "$5 payment" },
    { amountUsd: 10, description: "$10 payment" },
    { amountUsd: 50, description: "$50 payment" },
    { amountUsd: 100, description: "$100 payment" },
    { amountUsd: 500, description: "$500 payment" },
  ];

  console.log("Fee Calculation Examples (USDC, 6 decimals):\n");

  testCases.forEach(({ amountUsd, description }) => {
    const amountTokenUnits = (amountUsd * 1e6).toString();
    const fee = calculateFee(amountTokenUnits, USDC_MAINNET);

    console.log(`${description}:`);
    console.log(`  Payment: ${amountTokenUnits} units ($${fee.paymentAmountUsd})`);
    console.log(`  Service Fee: ${fee.serviceFee} units ($${fee.serviceFeeUsd})`);
    console.log(`  Total Required: ${fee.totalAmount} units ($${fee.totalAmountUsd})`);
    console.log(`  Effective Fee: ${fee.feePercent}%`);
    console.log();
  });

  console.log("\n📊 Comparison with traditional processors:");
  console.log("  Stripe: 2.9% + $0.30 = $0.59 on $10, $3.20 on $100");
  console.log("  PayPal: 2.99% + $0.49 = $0.79 on $10, $3.48 on $100");
  console.log("  x402 Facilitator: Flat $0.01 = $0.01 on any amount!");
  console.log("\n✅ Much cheaper for all transaction sizes!");
  console.log("✅ Predictable costs for users");
  console.log("✅ Covers gas + infrastructure costs");
}
