# Memory Platform CLI

Command-line interface for Memory Platform blockchain operations on Solana.

## Installation

### Global Installation

```bash
npm install -g @memory-platform/cli
```

### Local Installation

```bash
npm install @memory-platform/cli
```

### From Source

```bash
cd blockchain/cli
npm install
npm run build
npm link
```

## Quick Start

### 1. Configure CLI

```bash
# Interactive configuration
memory-cli config set

# Or set individual values
memory-cli config set --network devnet --rpc https://api.devnet.solana.com
```

### 2. Mint a Memory

```bash
# Interactive mode
memory-cli mint single

# Command-line mode
memory-cli mint single \
  --content "My first memory" \
  --agent "agent-123" \
  --metadata '{"type":"episodic","tags":["important"]}'
```

### 3. Query Memories

```bash
# List your memories
memory-cli query list

# Get specific memory
memory-cli query get <asset-id>
```

## Commands

### Configuration

#### Show Configuration

```bash
memory-cli config show
```

#### Set Configuration

```bash
# Interactive
memory-cli config set

# Command-line
memory-cli config set --network mainnet
memory-cli config set --rpc https://api.mainnet-beta.solana.com
memory-cli config set --api https://api.memoryplatform.io
memory-cli config set --program <program-id>
memory-cli config set --wallet ~/.config/solana/id.json
```

#### Reset Configuration

```bash
memory-cli config reset
```

### Minting

#### Mint Single Memory

```bash
# Interactive
memory-cli mint single

# With options
memory-cli mint single \
  --content "Memory content" \
  --agent "agent-id" \
  --metadata '{"type":"episodic"}' \
  --priority medium
```

#### Estimate Cost

```bash
memory-cli mint estimate 100
```

### Querying

#### List Memories

```bash
# List all memories
memory-cli query list

# Filter by agent
memory-cli query list --agent agent-123

# Pagination
memory-cli query list --limit 20 --offset 0

# Query specific wallet
memory-cli query list --wallet <wallet-address>
```

#### Get Memory Details

```bash
memory-cli query get <asset-id>
```

### Access Control

#### Grant Access

```bash
# Interactive
memory-cli access grant <asset-id>

# Command-line
memory-cli access grant <asset-id> \
  --grantee <wallet-address> \
  --permissions read,write \
  --expires 1234567890 \
  --max-access 10
```

#### Revoke Access

```bash
memory-cli access revoke <asset-id> <grantee-address>
```

### Transfer

#### Transfer Asset

```bash
# Interactive
memory-cli transfer <asset-id>

# Command-line
memory-cli transfer <asset-id> --to <new-owner-address>
```

### Batch Operations

#### Generate Template

```bash
# Create template with 10 sample memories
memory-cli batch template batch-memories.json --count 10
```

#### Batch Mint

```bash
memory-cli batch mint batch-memories.json --priority low
```

#### Get Batch Info

```bash
memory-cli batch info <batch-id>
```

## Batch File Format

Create a JSON file with the following structure:

```json
{
  "memories": [
    {
      "content": "Memory content 1",
      "metadata": {
        "type": "episodic",
        "tags": ["tag1", "tag2"]
      },
      "agentId": "agent-123"
    },
    {
      "content": "Memory content 2",
      "metadata": {
        "type": "semantic",
        "tags": ["tag3"]
      },
      "agentId": "agent-456"
    }
  ]
}
```

## Configuration File

The CLI stores configuration in:
- Linux/macOS: `~/.config/memory-platform-cli/config.json`
- Windows: `%APPDATA%\memory-platform-cli\config.json`

Default configuration:

```json
{
  "network": "devnet",
  "rpcUrl": "https://api.devnet.solana.com",
  "apiUrl": "https://api.memoryplatform.io",
  "programId": "",
  "walletPath": "~/.config/solana/id.json"
}
```

## Wallet Setup

The CLI uses your Solana wallet for signing transactions.

### Create New Wallet

```bash
solana-keygen new --outfile ~/.config/solana/id.json
```

### Use Existing Wallet

```bash
memory-cli config set --wallet /path/to/your/wallet.json
```

### Get Devnet SOL

```bash
solana airdrop 2 --url devnet
```

## Examples

### Example 1: Mint and Query

```bash
# Mint a memory
memory-cli mint single \
  --content "Meeting notes from today" \
  --agent "work-agent" \
  --metadata '{"type":"episodic","tags":["work","meeting"]}'

# List memories
memory-cli query list --agent work-agent
```

### Example 2: Batch Import

```bash
# Generate template
memory-cli batch template memories.json --count 50

# Edit memories.json with your data

# Mint batch
memory-cli batch mint memories.json
```

### Example 3: Access Management

```bash
# Grant read access for 24 hours
memory-cli access grant <asset-id> \
  --grantee <friend-wallet> \
  --permissions read \
  --expires $(($(date +%s) + 86400))

# Later, revoke access
memory-cli access revoke <asset-id> <friend-wallet>
```

### Example 4: Transfer Asset

```bash
# Transfer to another wallet
memory-cli transfer <asset-id> --to <new-owner-wallet>
```

## Environment Variables

You can override configuration with environment variables:

```bash
export MEMORY_CLI_RPC_URL=https://api.mainnet-beta.solana.com
export MEMORY_CLI_API_URL=https://api.memoryplatform.io
export MEMORY_CLI_WALLET_PATH=~/.config/solana/mainnet-wallet.json
```

## Troubleshooting

### Wallet Not Found

```bash
# Check wallet path
memory-cli config show

# Set correct path
memory-cli config set --wallet ~/.config/solana/id.json
```

### Insufficient Funds

```bash
# Check balance
solana balance

# Get devnet SOL
solana airdrop 2 --url devnet
```

### Connection Issues

```bash
# Test RPC connection
solana cluster-version --url <your-rpc-url>

# Try different RPC
memory-cli config set --rpc https://api.devnet.solana.com
```

### API Errors

```bash
# Verify API URL
memory-cli config show

# Check API status
curl https://api.memoryplatform.io/health
```

## Scripting

The CLI can be used in scripts:

```bash
#!/bin/bash

# Mint multiple memories
for i in {1..10}; do
  memory-cli mint single \
    --content "Memory $i" \
    --agent "script-agent" \
    --metadata "{\"index\":$i}" \
    --priority low
done

# Query results
memory-cli query list --agent script-agent
```

## Development

### Build

```bash
npm run build
```

### Run Locally

```bash
npm run dev -- config show
```

### Test

```bash
npm test
```

## Support

- Documentation: https://docs.memoryplatform.io
- Issues: https://github.com/tao-shen/Tacits/issues
- Discord: https://discord.gg/memoryplatform

## Related

- [TypeScript SDK](../sdk/typescript/README.md)
- [Rust SDK](../sdk/rust/README.md)
- [API Documentation](../../docs/API_GUIDE.md)

## License

MIT
