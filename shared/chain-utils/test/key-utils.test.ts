import { describe, test, expect } from "vitest";
import { loadPrivateKey } from "../src/key-utils";

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
