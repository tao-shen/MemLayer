#!/bin/bash

# Verify Memory Asset Program deployment

set -e

if [ -z "$1" ]; then
    echo "Usage: ./verify-deployment.sh <PROGRAM_ID>"
    exit 1
fi

PROGRAM_ID=$1

echo "🔍 Verifying deployment of program: $PROGRAM_ID"
echo ""

# Check program exists
echo "📡 Checking program on Devnet..."
solana program show $PROGRAM_ID --url https://api.devnet.solana.com

# Get program data
echo ""
echo "📊 Program details:"
solana program show $PROGRAM_ID --url https://api.devnet.solana.com --output json | jq '.'

echo ""
echo "✅ Verification complete!"
echo "🌐 View on Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
