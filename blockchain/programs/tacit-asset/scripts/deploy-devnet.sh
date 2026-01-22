#!/bin/bash

# Deploy Memory Asset Program to Solana Devnet

set -e

echo "🚀 Deploying Memory Asset Program to Devnet..."
echo ""

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Please install it first."
    exit 1
fi

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor not found. Please install it first."
    exit 1
fi

# Configure to Devnet
echo "📡 Configuring Solana to Devnet..."
solana config set --url https://api.devnet.solana.com

# Check wallet balance
BALANCE=$(solana balance | awk '{print $1}')
echo "💰 Current balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 2" | bc -l) )); then
    echo "⚠️  Low balance. Requesting airdrop..."
    solana airdrop 2 || echo "Airdrop failed. Please get SOL from https://faucet.solana.com"
fi

# Build the program
echo ""
echo "🔨 Building program..."
cd "$(dirname "$0")/.."
anchor build

# Get program ID
PROGRAM_ID=$(solana address -k target/deploy/memory_asset-keypair.json)
echo ""
echo "📝 Program ID: $PROGRAM_ID"

# Deploy
echo ""
echo "🚀 Deploying to Devnet..."
anchor deploy --provider.cluster devnet

# Verify deployment
echo ""
echo "✅ Verifying deployment..."
solana program show $PROGRAM_ID

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment successful!"
echo ""
echo "Program ID: $PROGRAM_ID"
echo "Network: Devnet"
echo "Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo ""
echo "📝 Next steps:"
echo "  1. Update MEMORY_ASSET_PROGRAM_ID in .env file"
echo "  2. Run tests: anchor test --skip-local-validator"
echo "  3. Deploy backend services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
