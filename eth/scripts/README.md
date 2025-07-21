# CollectorNFT Deployment Configuration

This directory contains configuration files and scripts for deploying the CollectorNFT contract.

## Configuration Files

### `deploy-config.json`

Main configuration file for CollectorNFT deployment. This file contains all deployment parameters and options.

### `deploy-config.example.json`

Example configuration file showing all available options. Copy this file to create your own configuration.

### `deploy-config.schema.json`

JSON schema file for validation of configuration structure. This ensures proper format and required fields.

## Configuration Structure

```json
{
  "genImNFTAddress": "0x1234567890123456789012345678901234567890",
  "baseMintPrice": "0.001",
  "options": {
    "validateOnly": false,
    "dryRun": false,
    "verify": true,
    "waitConfirmations": 2
  },
  "metadata": {
    "description": "CollectorNFT deployment for Sepolia testnet",
    "version": "1.0.0",
    "environment": "development"
  }
}
```

### Required Fields

- `genImNFTAddress`: Ethereum address of the GenImNFT contract (must be a valid hex address)
- `baseMintPrice`: Base price for minting in ETH (string format, e.g., "0.001")

### Optional Fields

#### `options`

Deployment options:

- `validateOnly` (boolean): Only validate configuration without deploying
- `dryRun` (boolean): Simulate deployment without actual execution
- `verify` (boolean): Verify contract on block explorer after deployment
- `waitConfirmations` (number): Number of confirmations to wait (1-20)

#### `metadata`

Additional metadata for documentation:

- `description`: Human-readable description of the deployment
- `version`: Version identifier
- `environment`: Environment type (development, staging, production)

## Usage Examples

### Basic Usage

```bash
# Deploy using default config file (deploy-config.json)
npx hardhat run scripts/deploy-collector-nft.ts --network sepolia
```

### Custom Config File

```bash
# Deploy using a specific config file
npx hardhat run scripts/deploy-collector-nft.ts --network sepolia -- ./my-custom-config.json
```

### Environment Variable

```bash
# Deploy using config file from environment variable
DEPLOY_CONFIG=./production-config.json npx hardhat run scripts/deploy-collector-nft.ts --network mainnet
```

**Note:** The network must be specified via the `--network` parameter as it determines which blockchain network to deploy to. The config file only contains contract-specific parameters.

### Validation Only

Set `"validateOnly": true` in your config file:

```json
{
  "genImNFTAddress": "0x...",
  "baseMintPrice": "0.001",
  "options": {
    "validateOnly": true
  }
}
```

### Dry Run

Set `"dryRun": true` in your config file:

```json
{
  "genImNFTAddress": "0x...",
  "baseMintPrice": "0.001",
  "options": {
    "dryRun": true
  }
}
```

## Configuration Validation

The script automatically validates:

- ✅ JSON syntax and structure
- ✅ Required fields presence
- ✅ Ethereum address format
- ✅ Price format (numeric string)
- ✅ Network name validity
- ✅ Options value ranges

## Best Practices

1. **Version Control**: Don't commit sensitive configurations to version control
2. **Environment-Specific**: Use separate config files for different environments
3. **Validation**: Always run with `validateOnly: true` first to check configuration
4. **Backup**: Keep backups of successful deployment configurations
5. **Documentation**: Use the `metadata` section to document your deployments

## Example Workflows

### Development Deployment

```json
{
  "genImNFTAddress": "0x742d35Cc0C8A4B20A3Fa31f8Fd4F7a77C4cFaE77",
  "baseMintPrice": "0.001",
  "network": "localhost",
  "options": {
    "verify": false,
    "waitConfirmations": 1
  },
  "metadata": {
    "environment": "development"
  }
}
```

### Production Deployment

```json
{
  "genImNFTAddress": "0xPRODUCTION_ADDRESS",
  "baseMintPrice": "0.01",
  "network": "mainnet",
  "options": {
    "verify": true,
    "waitConfirmations": 5
  },
  "metadata": {
    "environment": "production",
    "version": "1.0.0"
  }
}
```

## Troubleshooting

### Common Errors

1. **"Configuration file not found"**

   - Ensure the config file exists in the specified path
   - Check file permissions

2. **"Invalid JSON"**

   - Validate JSON syntax using a JSON validator
   - Check for missing commas or brackets

3. **"Invalid genImNFTAddress format"**

   - Ensure address is 42 characters (0x + 40 hex characters)
   - Verify address checksum

4. **"Network mismatch"**

   - Ensure config network matches Hardhat network parameter
   - This is a warning, not an error

5. **"Contract not found at address"**
   - Verify the GenImNFT contract is deployed at the specified address
   - Check you're using the correct network
