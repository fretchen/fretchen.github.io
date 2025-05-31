import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handle } from '../readhandler.js';

// Mock the external dependencies
vi.mock('viem', () => ({
  getContract: vi.fn(),
  createWalletClient: vi.fn(),
  parseEther: vi.fn(),
  createPublicClient: vi.fn(),
  http: vi.fn(),
}));

vi.mock('viem/chains', () => ({
  sepolia: { id: 11155111 },
  optimism: { id: 10 }
}));

vi.mock('viem/accounts', () => ({
  privateKeyToAccount: vi.fn()
}));

vi.mock('../image_service.js', () => ({
  generateAndUploadImage: vi.fn()
}));

vi.mock('../nft_abi.js', () => ({
  nftAbi: []
}));

describe('readhandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variable mock
    process.env.NFT_WALLET_PRIVATE_KEY = 'test-private-key';
  });

  describe('handle function - parameter validation', () => {
    it('should return 400 error when no prompt is provided', async () => {
      const event = {
        queryStringParameters: {
          tokenId: '123'
        }
      };
      const context = {};
      const cb = vi.fn();

      const result = await handle(event, context, cb);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('No prompt provided');
      expect(result.headers['Content-Type']).toEqual(['application/json']);
    });

    it('should return 400 error when no tokenId is provided', async () => {
      const event = {
        queryStringParameters: {
          prompt: 'test prompt'
        }
      };
      const context = {};
      const cb = vi.fn();

      const result = await handle(event, context, cb);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('No tokenId provided');
      expect(result.headers['Content-Type']).toEqual(['application/json']);
    });

    it('should return 400 error when no queryStringParameters are provided', async () => {
      const event = {
        queryStringParameters: null
      };
      const context = {};
      const cb = vi.fn();

      const result = await handle(event, context, cb);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('No prompt provided');
    });

    it('should return 400 error when queryStringParameters is undefined', async () => {
      const event = {};
      const context = {};
      const cb = vi.fn();

      const result = await handle(event, context, cb);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('No prompt provided');
    });
  });

  describe('handle function - contract interaction', () => {
    let mockContract;
    let mockViem;

    beforeEach(async () => {
      // Setup mocks for viem
      mockContract = {
        read: {
          mintPrice: vi.fn().mockResolvedValue(BigInt('1000000000000000000')), // 1 ETH
          ownerOf: vi.fn(),
          isImageUpdated: vi.fn()
        },
        write: {
          requestImageUpdate: vi.fn().mockResolvedValue('0xmocktxhash')
        }
      };

      mockViem = await import('viem');
      mockViem.getContract.mockReturnValue(mockContract);
      mockViem.createPublicClient.mockReturnValue({});
      mockViem.createWalletClient.mockReturnValue({});
      mockViem.http.mockReturnValue({});

      const mockAccounts = await import('viem/accounts');
      mockAccounts.privateKeyToAccount.mockReturnValue({ address: '0xtest' });
    });

    it('should return 404 error when token does not exist', async () => {
      // Mock token not existing
      mockContract.read.ownerOf.mockRejectedValue(new Error('Token does not exist'));

      const event = {
        queryStringParameters: {
          prompt: 'test prompt',
          tokenId: '999'
        }
      };
      const context = {};
      const cb = vi.fn();

      const result = await handle(event, context, cb);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toBe('Token does not exist');
    });

    it('should return 400 error when image is already updated', async () => {
      // Mock token existing but already updated
      mockContract.read.ownerOf.mockResolvedValue('0xowner');
      mockContract.read.isImageUpdated.mockResolvedValue(true);

      const event = {
        queryStringParameters: {
          prompt: 'test prompt',
          tokenId: '123'
        }
      };
      const context = {};
      const cb = vi.fn();

      const result = await handle(event, context, cb);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('Image already updated');
    });

    it('should successfully process valid request', async () => {
      // Mock successful scenario
      mockContract.read.ownerOf.mockResolvedValue('0xowner');
      mockContract.read.isImageUpdated.mockResolvedValue(false);

      const mockImageService = await import('../image_service.js');
      // Use a trusted domain URL that will pass validation
      mockImageService.generateAndUploadImage.mockResolvedValue('https://trusted-domain.com/metadata.json');

      // Mock fetch for metadata
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          image: 'https://trusted-domain.com/image.png'
        })
      });

      const event = {
        queryStringParameters: {
          prompt: 'test prompt',
          tokenId: '123'
        }
      };
      const context = {};
      const cb = vi.fn();

      const result = await handle(event, context, cb);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.metadata_url).toBe('https://trusted-domain.com/metadata.json');
      expect(body.image_url).toBe('https://trusted-domain.com/image.png');
      expect(body.transaction_hash).toBe('0xmocktxhash');
      expect(body.mintPrice).toBe('1000000000000000000');
      expect(body.message).toBe('Bild erfolgreich generiert und Token aktualisiert');
    });

    it('should return 500 error when image generation fails', async () => {
      // Mock token existing but image generation failing
      mockContract.read.ownerOf.mockResolvedValue('0xowner');
      mockContract.read.isImageUpdated.mockResolvedValue(false);

      const mockImageService = await import('../image_service.js');
      mockImageService.generateAndUploadImage.mockRejectedValue(new Error('Image generation failed'));

      const event = {
        queryStringParameters: {
          prompt: 'test prompt',
          tokenId: '123'
        }
      };
      const context = {};
      const cb = vi.fn();

      const result = await handle(event, context, cb);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('Operation fehlgeschlagen: Image generation failed');
      expect(body.mintPrice).toBe('1000000000000000000');
    });
  });

  describe('environment variables', () => {
    it('should throw error when NFT_WALLET_PRIVATE_KEY is not set', async () => {
      delete process.env.NFT_WALLET_PRIVATE_KEY;

      const event = {
        queryStringParameters: {
          prompt: 'test prompt',
          tokenId: '123'
        }
      };
      const context = {};
      const cb = vi.fn();

      await expect(handle(event, context, cb)).rejects.toThrow('NFT_WALLET_PRIVATE_KEY nicht konfiguriert');
    });
  });
});
