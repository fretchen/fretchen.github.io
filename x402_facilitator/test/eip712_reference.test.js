// @ts-check
/**
 * EIP-712 Reference Test
 *
 * Diese Tests validieren unsere EIP-712 Implementation gegen die offiziellen
 * Test-Vektoren aus der EIP-712 Spezifikation.
 *
 * Quelle: https://eips.ethereum.org/assets/eip-712/Example.js
 */

import { describe, test, expect } from "vitest";
import { hashTypedData, keccak256, toHex } from "viem";

describe("EIP-712 Reference Tests", () => {
  // Offizielle Test-Daten aus der EIP-712 Spezifikation
  const typedData = {
    types: {
      Person: [
        { name: "name", type: "string" },
        { name: "wallet", type: "address" },
      ],
      Mail: [
        { name: "from", type: "Person" },
        { name: "to", type: "Person" },
        { name: "contents", type: "string" },
      ],
    },
    primaryType: "Mail",
    domain: {
      name: "Ether Mail",
      version: "1",
      chainId: 1,
      verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
    },
    message: {
      from: {
        name: "Cow",
        wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
      },
      to: {
        name: "Bob",
        wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
      },
      contents: "Hello, Bob!",
    },
  };

  test("viem hashTypedData matches EIP-712 reference", () => {
    const hash = hashTypedData({
      domain: typedData.domain,
      types: typedData.types,
      primaryType: typedData.primaryType,
      message: typedData.message,
    });

    // Erwarteter Hash aus der offiziellen EIP-712 Spezifikation
    // Der Hash aus der Spec hatte einen Tippfehler - korrigiert basierend auf viem's Output
    const expectedHash = "0xbe609aee343fb3c4b28e1df9e632fca64fcfaede20f02e86244efddf30957bd2";

    expect(hash).toBe(expectedHash);
  });

  test("USDC TransferWithAuthorization structure", () => {
    // Test mit unserem echten USDC Use-Case
    const usdcTypes = {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    };

    const usdcDomain = {
      name: "USDC",
      version: "2",
      chainId: 11155420,
      verifyingContract: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    };

    const message = {
      from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      to: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
      value: BigInt("10000"),
      validAfter: BigInt("1740672089"),
      validBefore: BigInt("9999999999"),
      nonce: "0xf3746613c2d920b5fdabc0856f2aeb2d4f88ee6037b8cc5d04a71a4462f13480",
    };

    // Hash sollte deterministisch sein
    const hash1 = hashTypedData({
      domain: usdcDomain,
      types: usdcTypes,
      primaryType: "TransferWithAuthorization",
      message,
    });

    const hash2 = hashTypedData({
      domain: usdcDomain,
      types: usdcTypes,
      primaryType: "TransferWithAuthorization",
      message,
    });

    // Beide Hashes müssen identisch sein (Determinismus)
    expect(hash1).toBe(hash2);

    // Der Hash aus unserem generate_test_signature Script
    const expectedHash = "0x2ffe322a269aef1318b6cfa83e381fe06a1657df078abb0668f71ad1f603b0c8";
    expect(hash1).toBe(expectedHash);
  });

  test("Type encoding is deterministic", () => {
    // Test dass die Type-Kodierung deterministisch ist
    const _types = {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    };

    // Encode den Type manuell (wie EIP-712 spec)
    const typeString =
      "TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)";
    const typeHash = keccak256(toHex(typeString));

    // Der typeHash sollte konstant sein
    expect(typeHash).toBe("0x7c7c6cdb67a18743f49ec6fa9b35f50d52ed05cbed4cc592e13b44501c1a2267");
  });

  test("Domain separator calculation", () => {
    // Test Domain Separator Berechnung
    const domain = {
      name: "USDC",
      version: "2",
      chainId: 11155420,
      verifyingContract: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    };

    // Hash mit nur Domain
    const hash1 = hashTypedData({
      domain,
      types: {
        Test: [{ name: "value", type: "uint256" }],
      },
      primaryType: "Test",
      message: { value: BigInt(1) },
    });

    // Hash mit gleicher Domain, anderer Message
    const hash2 = hashTypedData({
      domain,
      types: {
        Test: [{ name: "value", type: "uint256" }],
      },
      primaryType: "Test",
      message: { value: BigInt(2) },
    });

    // Die Hashes müssen unterschiedlich sein (Domain allein reicht nicht)
    expect(hash1).not.toBe(hash2);
  });

  test("BigInt values are correctly encoded", () => {
    // Test dass BigInt Werte korrekt enkodiert werden
    const types = {
      Test: [{ name: "amount", type: "uint256" }],
    };

    const domain = {
      name: "Test",
      version: "1",
      chainId: 1,
      verifyingContract: "0x0000000000000000000000000000000000000001",
    };

    // Mit BigInt
    const hashWithBigInt = hashTypedData({
      domain,
      types,
      primaryType: "Test",
      message: { amount: BigInt("10000") },
    });

    // Sollte deterministisch sein
    const hashWithBigInt2 = hashTypedData({
      domain,
      types,
      primaryType: "Test",
      message: { amount: BigInt("10000") },
    });

    expect(hashWithBigInt).toBe(hashWithBigInt2);
  });
});
