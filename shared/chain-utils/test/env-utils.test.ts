import { describe, test, expect } from "vitest";
import { loadPrivateKey, getRpcUrl } from "../src/env-utils";

const VALID_HEX = "a".repeat(64);
const KEY = "TEST_PRIVATE_KEY";

function withEnv(value: string | undefined, fn: () => void) {
  const old = process.env[KEY];
  if (value === undefined) delete process.env[KEY];
  else process.env[KEY] = value;
  try {
    fn();
  } finally {
    if (old === undefined) delete process.env[KEY];
    else process.env[KEY] = old;
  }
}

describe("loadPrivateKey", () => {
  test("returns 0x-prefixed key from bare 64-char hex", () => {
    withEnv(VALID_HEX, () => {
      expect(loadPrivateKey(KEY)).toBe(`0x${VALID_HEX}`);
    });
  });

  test("strips existing 0x prefix before returning", () => {
    withEnv(`0x${VALID_HEX}`, () => {
      expect(loadPrivateKey(KEY)).toBe(`0x${VALID_HEX}`);
    });
  });

  test("strips existing 0X prefix (uppercase) before returning", () => {
    withEnv(`0X${VALID_HEX}`, () => {
      expect(loadPrivateKey(KEY)).toBe(`0x${VALID_HEX}`);
    });
  });

  test("throws when env var is absent", () => {
    withEnv(undefined, () => {
      expect(() => loadPrivateKey(KEY)).toThrow(`${KEY} not configured`);
    });
  });

  test("throws when env var is empty string", () => {
    withEnv("", () => {
      expect(() => loadPrivateKey(KEY)).toThrow(`${KEY} not configured`);
    });
  });

  test("throws for a 63-char key (too short)", () => {
    withEnv("a".repeat(63), () => {
      expect(() => loadPrivateKey(KEY)).toThrow(`${KEY} invalid: must be 64 hex characters`);
    });
  });

  test("throws for a 65-char key (too long)", () => {
    withEnv("a".repeat(65), () => {
      expect(() => loadPrivateKey(KEY)).toThrow(`${KEY} invalid: must be 64 hex characters`);
    });
  });

  test("throws for a key containing non-hex characters", () => {
    withEnv("z".repeat(64), () => {
      expect(() => loadPrivateKey(KEY)).toThrow(`${KEY} invalid: must be 64 hex characters`);
    });
  });

  // Whitespace trimming — keys from Scaleway secrets often arrive with trailing \n
  test("accepts key with leading whitespace", () => {
    withEnv(`  ${VALID_HEX}`, () => {
      expect(loadPrivateKey(KEY)).toBe(`0x${VALID_HEX}`);
    });
  });

  test("accepts key with trailing newline (Scaleway secret format)", () => {
    withEnv(`${VALID_HEX}\n`, () => {
      expect(loadPrivateKey(KEY)).toBe(`0x${VALID_HEX}`);
    });
  });

  test("accepts key with whitespace around 0x-prefixed value", () => {
    withEnv(` 0x${VALID_HEX} `, () => {
      expect(loadPrivateKey(KEY)).toBe(`0x${VALID_HEX}`);
    });
  });

  test("throws when env var is only whitespace", () => {
    withEnv("   ", () => {
      expect(() => loadPrivateKey(KEY)).toThrow(`${KEY} not configured`);
    });
  });

  test("error message names the correct env var", () => {
    const OTHER = "FACILITATOR_WALLET_PRIVATE_KEY";
    const oldVal = process.env[OTHER];
    delete process.env[OTHER];
    try {
      expect(() => loadPrivateKey(OTHER)).toThrow(`${OTHER} not configured`);
    } finally {
      if (oldVal !== undefined) process.env[OTHER] = oldVal;
    }
  });
});

describe("getRpcUrl", () => {
  function withRpcEnv(key: string, value: string | undefined, fn: () => void) {
    const old = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
    try {
      fn();
    } finally {
      if (old === undefined) delete process.env[key];
      else process.env[key] = old;
    }
  }

  test("maps a CAIP-2 network to RPC_URL_<NETWORK>", () => {
    withRpcEnv("RPC_URL_EIP155_8453", "https://base-mainnet.example/v2/key", () => {
      expect(getRpcUrl("eip155:8453")).toBe("https://base-mainnet.example/v2/key");
    });
  });

  test("returns undefined when unset, so viem falls back to the public endpoint", () => {
    withRpcEnv("RPC_URL_EIP155_10", undefined, () => {
      expect(getRpcUrl("eip155:10")).toBeUndefined();
    });
  });

  // Must be undefined, not "" — viem treats an empty string as an invalid URL
  // rather than as "use the default".
  test("returns undefined for an empty env var", () => {
    withRpcEnv("RPC_URL_EIP155_8453", "", () => {
      expect(getRpcUrl("eip155:8453")).toBeUndefined();
    });
  });

  test("uppercases and replaces separators (testnet ids keep their digits)", () => {
    withRpcEnv("RPC_URL_EIP155_11155420", "https://op-sepolia.example", () => {
      expect(getRpcUrl("eip155:11155420")).toBe("https://op-sepolia.example");
    });
  });

  test("does not leak one network's endpoint to another", () => {
    withRpcEnv("RPC_URL_EIP155_8453", "https://base-only.example", () => {
      expect(getRpcUrl("eip155:84532")).toBeUndefined();
    });
  });
});
