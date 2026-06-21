import { describe, test, expect } from "vitest";
import { loadPrivateKey } from "../src/key-utils";

const VALID_HEX = "a".repeat(64);

describe("loadPrivateKey", () => {
  test("returns 0x-prefixed key from bare 64-char hex", () => {
    expect(loadPrivateKey(VALID_HEX)).toBe(`0x${VALID_HEX}`);
  });

  test("strips existing 0x prefix before returning", () => {
    expect(loadPrivateKey(`0x${VALID_HEX}`)).toBe(`0x${VALID_HEX}`);
  });

  test("strips existing 0X prefix (uppercase) before returning", () => {
    expect(loadPrivateKey(`0X${VALID_HEX}`)).toBe(`0x${VALID_HEX}`);
  });

  test("throws when value is undefined", () => {
    expect(() => loadPrivateKey(undefined)).toThrow("NFT_WALLET_PRIVATE_KEY not configured");
  });

  test("throws when value is empty string", () => {
    expect(() => loadPrivateKey("")).toThrow("NFT_WALLET_PRIVATE_KEY not configured");
  });

  test("throws for a 63-char key (too short)", () => {
    expect(() => loadPrivateKey("a".repeat(63))).toThrow("NFT_WALLET_PRIVATE_KEY invalid");
  });

  test("throws for a 65-char key (too long)", () => {
    expect(() => loadPrivateKey("a".repeat(65))).toThrow("NFT_WALLET_PRIVATE_KEY invalid");
  });

  test("throws for a key containing non-hex characters", () => {
    expect(() => loadPrivateKey("z".repeat(64))).toThrow("NFT_WALLET_PRIVATE_KEY invalid");
  });

  // Whitespace trimming — keys from Scaleway secrets often arrive with trailing \n
  test("accepts key with leading whitespace", () => {
    expect(loadPrivateKey(`  ${VALID_HEX}`)).toBe(`0x${VALID_HEX}`);
  });

  test("accepts key with trailing newline (Scaleway secret format)", () => {
    expect(loadPrivateKey(`${VALID_HEX}\n`)).toBe(`0x${VALID_HEX}`);
  });

  test("accepts key with whitespace around 0x-prefixed value", () => {
    expect(loadPrivateKey(` 0x${VALID_HEX} `)).toBe(`0x${VALID_HEX}`);
  });

  test("throws when value is only whitespace", () => {
    expect(() => loadPrivateKey("   ")).toThrow("NFT_WALLET_PRIVATE_KEY not configured");
  });
});
