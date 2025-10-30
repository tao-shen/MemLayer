# Blockchain API Documentation

## Overview

The Blockchain API provides endpoints for interacting with blockchain memory assets on Solana. It supports Solana wallet signature authentication and includes comprehensive rate limiting.

## Authentication

### Solana Signature Authentication

All blockchain endpoints require Solana wallet signature authentication.

**Required Headers:**
```
X-Wallet-Address: <solana_wallet_address>
X-Solana-Signature: <base58_encoded_signature>
X-Signed-Message: <signed_message_with_timestamp_and_nonce>
```

**Message Format:**
```
Sign this message to authenticate with Memory Platform

Wallet: <wallet_address>
Nonce: <random_nonce>
Timestamp: <unix_timestamp_ms>
```

### Authentication Flow

1. **Generate Challenge** (Optional)
```bash
POST /v1/blockchain/auth/challenge
Content-Type: application/json

{
  "walletAddress": "your_wallet_address"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "message": "Sign this message...",
    "nonce": "abc123",
    "timestamp": 1234567890
  }
}
```

2. **Sign Message**
Use your Solana wallet to sign the message.

3. **Make Authenticated Request**
Include the signature in request headers.

## Rate Limiting

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Minting | 10 req/min | Per wallet |
| Blockchain Ops | 20 req/min | Per wallet |
| General | 50 req/min | Per wallet |

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

## Endpoints

### Memory Minting

#### Mint Single Memory
```
POST /v1/blockchain/memories/mint
```

**Request:**
```json
{
  "memory": {
    "content": "Memory content here",
    "metadata": {
      "type": "episodic",
      "tags": ["important"],
      "importance": 0.9
    },
    "agentId": "agent_123",
    "timestamp": "2024-01-01T00:00:00Z"
  },
  "options": {
    "priority": "medium",
    "batch": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": "req_123",
    "assetId": "asset_456",
    "arweaveId": "arweave_789",
    "transactionSignature": "tx_abc",
    "cost": {
      "solanaTransaction": 5000,
      "arweaveStorage": 1000,
      "priorityFee": 2000,
      "total": 8000,
      "totalSOL": 0.000008,
      "totalAR": 0.000001
    },
    "timestamp": "2024-01-01T00:00:00Z",
    "status": "success"
  }
}
```

#### Mint Batch
```
POST /v1/blockchain/memories/mint-batch
```

**Request:**
```json
{
  "memories": [
    {
      "content": "Memory 1",
      "metadata": { "type": "episodic" },
      "agentId": "agent_123",
      "timestamp": "2024-01-01T00:00:00Z"
    },
    {
      "content": "Memory 2",
      "metadata": { "type": "semantic" },
      "agentId": "agent_123",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ],
  "options": {
    "priority": "high"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batchId": "batch_123",
    "assetIds": ["asset_1", "asset_2"],
    "totalCost": {
      "total": 16000,
      "totalSOL": 0.000016
    },
    "successCount": 2,
    "failedCount": 0,
    "results": [...]
  }
}
```

### Memory Queries

#### Get User Memories
```
GET /v1/blockchain/memories?limit=50&offset=0&agentId=agent_123
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "assetId": "asset_123",
      "owner": "wallet_address",
      "arweaveId": "arweave_456",
      "version": 1,
      "createdAt": "2024-01-01T00:00:00Z",
      "metadata": {...}
    }
  ]
}
```

#### Get Specific Memory
```
GET /v1/blockchain/memories/:assetId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assetId": "asset_123",
    "owner": "wallet_address",
    "arweaveId": "arweave_456",
    "content": "encrypted_content",
    "metadata": {...}
  }
}
```

### Access Control

#### Grant Access
```
POST /v1/blockchain/memories/:assetId/grant
```

**Request:**
```json
{
  "grantee": "grantee_wallet_address",
  "permissions": ["read", "write"],
  "expiresAt": "2024-12-31T23:59:59Z",
  "maxAccess": 100
}
```

**Response:**
```json
{
  "success": true,
  "message": "Access granted successfully"
}
```

#### Revoke Access
```
POST /v1/blockchain/memories/:assetId/revoke
```

**Request:**
```json
{
  "grantee": "grantee_wallet_address"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Access revoked successfully"
}
```

#### Get Access Policy
```
GET /v1/blockchain/access/policy/:assetId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "owner": "owner_wallet_address",
    "allowList": [
      {
        "grantee": "grantee_address",
        "permissions": ["read"],
        "expiresAt": "2024-12-31T23:59:59Z",
        "maxAccess": 100,
        "currentAccess": 5
      }
    ],
    "defaultPolicy": "deny"
  }
}
```

#### Get User Grants
```
GET /v1/blockchain/access/grants
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "assetId": "asset_123",
      "grant": {
        "grantee": "your_wallet_address",
        "permissions": ["read"],
        "expiresAt": "2024-12-31T23:59:59Z",
        "currentAccess": 5
      }
    }
  ]
}
```

### Asset Transfer

#### Transfer Ownership
```
POST /v1/blockchain/memories/:assetId/transfer
```

**Request:**
```json
{
  "newOwner": "new_owner_wallet_address"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transfer initiated",
  "data": {
    "assetId": "asset_123",
    "newOwner": "new_owner_address",
    "status": "pending"
  }
}
```

### Batch Information

#### Get Batch Info
```
GET /v1/blockchain/batches/:batchId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batchId": "batch_123",
    "ownerAddress": "wallet_address",
    "memoryCount": 50,
    "totalSizeBytes": 102400,
    "transactionSignature": "tx_signature",
    "totalCost": {...},
    "status": "completed",
    "createdAt": "2024-01-01T00:00:00Z",
    "confirmedAt": "2024-01-01T00:00:05Z"
  }
}
```

### Cost Estimation

#### Estimate Minting Cost
```
GET /v1/blockchain/cost/estimate?memoryCount=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "memoryCount": 10,
    "estimatedCost": {
      "solanaTransaction": 50000,
      "arweaveStorage": 10000,
      "priorityFee": 20000,
      "total": 80000,
      "totalSOL": 0.00008,
      "totalAR": 0.00001
    },
    "breakdown": {
      "perMemory": {...},
      "batchOverhead": {...}
    }
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `MISSING_AUTH_HEADERS` | 401 | Missing authentication headers |
| `INVALID_SIGNATURE` | 401 | Invalid Solana signature |
| `MESSAGE_EXPIRED` | 401 | Message timestamp too old |
| `REPLAY_ATTACK` | 401 | Nonce already used |
| `ACCESS_DENIED` | 403 | No permission to access resource |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_ERROR` | 429 | Rate limit exceeded |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |
| `INTERNAL_ERROR` | 500 | Internal server error |

## Code Examples

### JavaScript/TypeScript

```typescript
import { Connection, Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

// Generate signed message
function generateSignedMessage(wallet: Keypair, message: string): string {
  const messageBytes = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(messageBytes, wallet.secretKey);
  return bs58.encode(signature);
}

// Mint memory
async function mintMemory(wallet: Keypair, memory: any) {
  // Generate message
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(7);
  const message = `Mint Memory\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
  
  // Sign message
  const signature = generateSignedMessage(wallet, message);
  
  // Make request
  const response = await fetch('http://localhost:3000/v1/blockchain/memories/mint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Wallet-Address': wallet.publicKey.toBase58(),
      'X-Solana-Signature': signature,
      'X-Signed-Message': message,
    },
    body: JSON.stringify({ memory }),
  });
  
  return await response.json();
}
```

### Python

```python
from solana.keypair import Keypair
from nacl.signing import SigningKey
import base58
import requests
import time
import random
import string

def generate_signed_message(wallet: Keypair, message: str) -> str:
    message_bytes = message.encode('utf-8')
    signature = wallet.sign(message_bytes).signature
    return base58.b58encode(signature).decode('utf-8')

def mint_memory(wallet: Keypair, memory: dict):
    # Generate message
    timestamp = int(time.time() * 1000)
    nonce = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    message = f"Mint Memory\nTimestamp: {timestamp}\nNonce: {nonce}"
    
    # Sign message
    signature = generate_signed_message(wallet, message)
    
    # Make request
    response = requests.post(
        'http://localhost:3000/v1/blockchain/memories/mint',
        headers={
            'Content-Type': 'application/json',
            'X-Wallet-Address': str(wallet.public_key),
            'X-Solana-Signature': signature,
            'X-Signed-Message': message,
        },
        json={'memory': memory}
    )
    
    return response.json()
```

## Best Practices

1. **Message Freshness**: Always include current timestamp in signed messages
2. **Nonce Usage**: Use unique nonces to prevent replay attacks
3. **Rate Limiting**: Implement client-side rate limiting to avoid 429 errors
4. **Error Handling**: Always handle errors gracefully
5. **Batch Operations**: Use batch minting for multiple memories to save costs
6. **Cost Estimation**: Check costs before minting
7. **Access Control**: Regularly review and update access grants

## Support

For issues or questions:
- GitHub Issues: [link]
- Documentation: [link]
- Discord: [link]
