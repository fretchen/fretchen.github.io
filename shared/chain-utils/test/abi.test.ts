/**
 * Tests for Contract ABIs exported by @fretchen/chain-utils
 */

import { describe, test, expect } from "vitest";
import { GenImNFTv4ABI, EIP3009SplitterV1ABI, LLMv1ABI } from "../src/index";

describe("GenImNFTv4ABI", () => {
  test("should be a valid ABI array", () => {
    expect(Array.isArray(GenImNFTv4ABI)).toBe(true);
    expect(GenImNFTv4ABI.length).toBeGreaterThan(0);
  });

  test("should contain required read functions", () => {
    const functionNames = GenImNFTv4ABI
      .filter((item) => item.type === "function")
      .map((item) => item.name);

    const requiredFunctions = [
      "ownerOf",
      "mintPrice",
      "isImageUpdated",
      "isAuthorizedAgent",
    ];

    requiredFunctions.forEach((funcName) => {
      expect(functionNames).toContain(funcName);
    });
  });

  test("should contain required write functions", () => {
    const functionNames = GenImNFTv4ABI
      .filter((item) => item.type === "function")
      .map((item) => item.name);

    const requiredFunctions = [
      "safeMint",
      "requestImageUpdate",
      "safeTransferFrom",
    ];

    requiredFunctions.forEach((funcName) => {
      expect(functionNames).toContain(funcName);
    });
  });

  test("should have correct ownerOf signature", () => {
    const ownerOfFunction = GenImNFTv4ABI.find(
      (item) => item.type === "function" && item.name === "ownerOf"
    );

    expect(ownerOfFunction).toBeDefined();
    expect(ownerOfFunction!.inputs).toHaveLength(1);
    expect(ownerOfFunction!.inputs![0].type).toBe("uint256");
    expect(ownerOfFunction!.outputs).toHaveLength(1);
    expect(ownerOfFunction!.outputs![0].type).toBe("address");
  });

  test("should have correct requestImageUpdate signature", () => {
    const func = GenImNFTv4ABI.find(
      (item) => item.type === "function" && item.name === "requestImageUpdate"
    );

    expect(func).toBeDefined();
    expect(func!.inputs).toHaveLength(2);
    expect(func!.inputs![0].type).toBe("uint256");
    expect(func!.inputs![1].type).toBe("string");
  });

  test("should contain Transfer event", () => {
    const events = GenImNFTv4ABI.filter((item) => item.type === "event");
    const transferEvent = events.find((e) => e.name === "Transfer");

    expect(transferEvent).toBeDefined();
    expect(transferEvent!.inputs).toHaveLength(3);
  });
});

describe("EIP3009SplitterV1ABI", () => {
  test("should be a valid ABI array", () => {
    expect(Array.isArray(EIP3009SplitterV1ABI)).toBe(true);
    expect(EIP3009SplitterV1ABI.length).toBeGreaterThan(0);
  });

  test("should contain required functions", () => {
    const functionNames = EIP3009SplitterV1ABI
      .filter((item) => item.type === "function")
      .map((item) => item.name);

    const requiredFunctions = [
      "facilitatorWallet",
      "fixedFee",
      "isAuthorizationUsed",
      "executeSplit",
    ];

    requiredFunctions.forEach((funcName) => {
      expect(functionNames).toContain(funcName);
    });
  });

  test("should contain SplitExecuted event", () => {
    const events = EIP3009SplitterV1ABI.filter((item) => item.type === "event");
    const splitEvent = events.find((e) => e.name === "SplitExecuted");

    expect(splitEvent).toBeDefined();
  });
});

describe("LLMv1ABI", () => {
  test("should be a valid ABI array", () => {
    expect(Array.isArray(LLMv1ABI)).toBe(true);
    expect(LLMv1ABI.length).toBeGreaterThan(0);
  });

  test("should contain required functions", () => {
    const functionNames = LLMv1ABI
      .filter((item) => item.type === "function")
      .map((item) => item.name);

    const requiredFunctions = ["checkBalance", "processBatch"];

    requiredFunctions.forEach((funcName) => {
      expect(functionNames).toContain(funcName);
    });
  });
});
