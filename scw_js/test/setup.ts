/**
 * Common test setup for all test files
 * Provides shared mocks and utilities to ensure consistency across tests
 */

import { vi } from "vitest";

// ===== VIEM MOCKS =====
export const mockViemFunctions = {
  createPublicClient: vi.fn(),
  createWalletClient: vi.fn(),
  getContract: vi.fn(),
  http: vi.fn(),
  parseEther: vi.fn(),
  parseAbiItem: vi.fn(),
  privateKeyToAccount: vi.fn(),
};

// ===== AWS SDK MOCKS =====
export const mockS3Send = vi.fn();
export const mockPutObjectCommand = vi.fn();

// ===== IMAGE SERVICE MOCKS =====
export const mockGenerateAndUploadImage = vi.fn();
export const mockUploadToS3 = vi.fn();

// ===== GLOBAL MOCK SETUP =====
export function setupGlobalMocks() {
  // Mock viem
  vi.mock("viem", () => mockViemFunctions);
  vi.mock("viem/chains", () => ({
    sepolia: { id: 11155111 },
    optimism: { id: 10 },
  }));
  vi.mock("viem/accounts", () => ({
    privateKeyToAccount: mockViemFunctions.privateKeyToAccount,
  }));

  // Setup parseAbiItem default
  mockViemFunctions.parseAbiItem.mockReturnValue({
    signature: "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
  });

  // Mock AWS SDK
  vi.mock("@aws-sdk/client-s3", () => ({
    S3Client: vi.fn().mockImplementation(() => ({
      send: mockS3Send,
    })),
    PutObjectCommand: mockPutObjectCommand,
  }));

  // Mock image_service
  vi.mock("../image_service.js", () => ({
    generateAndUploadImage: mockGenerateAndUploadImage,
    uploadToS3: mockUploadToS3,
    JSON_BASE_PATH: "https://my-imagestore.s3.nl-ams.scw.cloud/",
  }));

  // Global fetch mock
  global.fetch = vi.fn();
}

// ===== MOCK CONTRACT SETUP =====
export function createMockContract() {
  return {
    read: {
      ownerOf: vi.fn(),
      mintPrice: vi.fn(),
      isImageUpdated: vi.fn(),
    },
    write: {
      requestImageUpdate: vi.fn(),
    },
  };
}

// ===== ENVIRONMENT SETUP =====
export const testEnvironment = {
  // Serverless/Handler environment variables
  NFT_WALLET_PRIVATE_KEY: "test-private-key",

  // AWS/S3 environment variables
  SCW_ACCESS_KEY: "test-access-key",
  SCW_SECRET_KEY: "test-secret-key",

  // API tokens
  IONOS_API_TOKEN: "test-token",
  BFL_API_TOKEN: "test-bfl-token",
};

export function setupTestEnvironment(envVars: Record<string, string> = {}) {
  const env = { ...testEnvironment, ...envVars };
  Object.entries(env).forEach(([key, value]) => {
    process.env[key] = value;
  });
  return env;
}

export function cleanupTestEnvironment(envVars: string[] = Object.keys(testEnvironment)) {
  envVars.forEach((key) => {
    delete process.env[key];
  });
}

// ===== COMMON MOCK CONFIGURATIONS =====
export function setupDefaultMocks(mockContract: any) {
  // Viem defaults
  mockViemFunctions.getContract.mockReturnValue(mockContract);
  mockViemFunctions.createPublicClient.mockReturnValue({});
  mockViemFunctions.createWalletClient.mockReturnValue({});
  mockViemFunctions.privateKeyToAccount.mockReturnValue({ address: "0x123" });
  mockViemFunctions.http.mockReturnValue({});

  // Contract defaults
  mockContract.read.mintPrice.mockResolvedValue(BigInt("1000000000000000000")); // 1 ETH
  mockContract.read.isImageUpdated.mockResolvedValue(false);
  mockContract.read.ownerOf.mockResolvedValue("0x123456789");

  // Image service defaults
  mockGenerateAndUploadImage.mockResolvedValue(
    "https://my-imagestore.s3.nl-ams.scw.cloud/metadata/metadata_test_123456.json",
  );
  mockUploadToS3.mockResolvedValue("https://my-imagestore.s3.nl-ams.scw.cloud/test_file.json");

  // AWS S3 defaults
  mockS3Send.mockResolvedValue({});
  mockPutObjectCommand.mockImplementation((params: any) => params);

  // Contract write defaults
  mockContract.write.requestImageUpdate.mockResolvedValue(
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  );
}

// ===== FETCH MOCK HELPERS =====
export function mockFetchResponse(data: any, options: any = {}) {
  const defaultResponse = {
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    ...options,
  };
  (global.fetch as any).mockResolvedValue(defaultResponse);
}

export function mockFetchError(error: string = "Network error") {
  (global.fetch as any).mockRejectedValue(new Error(error));
}

// ===== METADATA MOCK =====
export const mockMetadataResponse = {
  name: "AI Generated Art #1",
  description: 'AI generated artwork based on the prompt: "beautiful landscape"',
  image: "https://my-imagestore.s3.nl-ams.scw.cloud/images/image_1_test.png",
  attributes: [
    {
      trait_type: "Prompt",
      value: "beautiful landscape",
    },
    {
      trait_type: "Model",
      value: "flux-pro-1.1",
    },
    {
      trait_type: "Image Size",
      value: "1024x1024",
    },
  ],
};

// ===== LLM MOCK RESPONSE =====
export const mockLLMResponse = {
  choices: [{ message: { content: "Antwort vom LLM" } }],
  usage: { prompt_tokens: 5, completion_tokens: 7, total_tokens: 12 },
  model: "meta-llama/Llama-3.3-70B-Instruct",
};
