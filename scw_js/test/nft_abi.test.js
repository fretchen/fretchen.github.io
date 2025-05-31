/**
 * Tests für NFT ABI und Contract-Interaktionen
 */

import { describe, test, expect, beforeAll } from "vitest";

describe("NFT ABI Tests", () => {
  let nftAbi;

  beforeAll(async () => {
    const module = await import("../nft_abi_v2.js");
    nftAbi = module.nftAbi;
  });

  describe("ABI Structure Tests", () => {
    test("sollte gültige ABI-Struktur haben", () => {
      expect(Array.isArray(nftAbi)).toBe(true);
      expect(nftAbi.length).toBeGreaterThan(0);
    });

    test("sollte erforderliche Funktionen enthalten", () => {
      const functionNames = nftAbi.filter((item) => item.type === "function").map((item) => item.name);

      const requiredFunctions = ["ownerOf", "mintPrice", "isImageUpdated", "requestImageUpdate"];

      requiredFunctions.forEach((funcName) => {
        expect(functionNames).toContain(funcName);
      });
    });

    test("sollte korrekte Funktions-Signaturen haben", () => {
      const ownerOfFunction = nftAbi.find((item) => item.type === "function" && item.name === "ownerOf");

      expect(ownerOfFunction).toBeDefined();
      expect(ownerOfFunction.inputs).toHaveLength(1);
      expect(ownerOfFunction.inputs[0].type).toBe("uint256");
      expect(ownerOfFunction.outputs).toHaveLength(1);
      expect(ownerOfFunction.outputs[0].type).toBe("address");

      const requestImageUpdateFunction = nftAbi.find(
        (item) => item.type === "function" && item.name === "requestImageUpdate"
      );

      expect(requestImageUpdateFunction).toBeDefined();
      expect(requestImageUpdateFunction.inputs).toHaveLength(2);
      expect(requestImageUpdateFunction.inputs[0].type).toBe("uint256");
      expect(requestImageUpdateFunction.inputs[1].type).toBe("string");
    });

    test("sollte Events definiert haben", () => {
      const events = nftAbi.filter((item) => item.type === "event");
      expect(events.length).toBeGreaterThan(0);
    });
  });
});

describe("Contract Utility Tests", () => {
  test("sollte Contract-Adresse validieren", () => {
    const contractAddress = "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb";

    // Ethereum-Adresse Format prüfen
    expect(contractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(contractAddress.length).toBe(42);
  });

  test("sollte BigInt-Konvertierungen korrekt handhaben", () => {
    const testValues = [
      { input: "1", expected: BigInt("1") },
      { input: "999999999999999999", expected: BigInt("999999999999999999") },
      { input: "0", expected: BigInt("0") },
    ];

    testValues.forEach(({ input, expected }) => {
      expect(BigInt(input)).toBe(expected);
    });
  });
});
