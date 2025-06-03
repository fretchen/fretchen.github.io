# README

Serverless functions for SCW. We use the node runtime here.

## Functions

### `readhandler_v2.js`

Main NFT handler that generates AI images and updates NFT tokens on the blockchain.

**Parameters:**

- `prompt` (required): Text prompt for AI image generation
- `tokenId` (required): NFT token ID to update
- `size` (optional): Image size, either "1024x1024" (default) or "1792x1024"

**Example:**

```
GET /function?prompt=beautiful+landscape&tokenId=123&size=1792x1024
```

### `dec_ai.js`

Simple script for testing the IONOS AI API without the NFT component. Useful for development and testing image generation functionality independently.

**Parameters:**

- `prompt` (required): Text prompt for AI image generation
- `tokenId` (optional): Token ID for metadata (defaults to "0")
- `size` (optional): Image size, either "1024x1024" (default) or "1792x1024"

**Example:**

```
GET /function?prompt=comic+style+landscape&size=1792x1024
```

## Local Testing

For local testing, you can simply run the following command:

```bash
NODE_ENV=test node readhandler_v2.js
```

For testing the AI API without NFT functionality:

```bash
NODE_ENV=test node dec_ai.js
```

## Deployment

To deploy the function, you can use the following command:

```bash
serverless deploy
```
