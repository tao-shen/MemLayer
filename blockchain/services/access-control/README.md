# Access Control Service

Access control service for blockchain memory assets. Provides signature verification, policy management, and audit logging.

## Features

- **Signature Verification**: Verify Solana wallet signatures for authentication
- **Policy Management**: Manage access policies and grants for memory assets
- **Access Control**: Check permissions and enforce access rules
- **Audit Logging**: Comprehensive audit trail for all access operations
- **Challenge-Response**: Secure authentication flow with nonce and timestamp
- **Anti-Replay Protection**: Prevent replay attacks with nonce tracking

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PROGRAM_ID=YourProgramIdHere
REDIS_HOST=localhost
REDIS_PORT=6379
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=memory_platform
```

## Usage

### Initialize Service

```typescript
import { AccessControlService } from '@blockchain/access-control-service';

const config = {
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL,
    programId: process.env.SOLANA_PROGRAM_ID,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    db: 0,
  },
  postgres: {
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  },
  challenge: {
    ttl: 300,
    nonceLength: 32,
  },
  cache: {
    policyTTL: 300,
  },
};

const accessControl = new AccessControlService(config);
```

### Check Access

```typescript
const result = await accessControl.checkAccess({
  assetId: 'asset_123',
  walletAddress: 'user_wallet_address',
  signature: 'signature_here',
  permission: 'read',
});

if (result.allowed) {
  console.log('Access granted');
} else {
  console.log('Access denied:', result.reason);
}
```

### Grant Access

```typescript
await accessControl.grantAccess(
  {
    assetId: 'asset_123',
    grantee: 'grantee_wallet_address',
    permissions: ['read', 'write'],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    maxAccess: 100,
  },
  'owner_wallet_address',
  'owner_signature'
);
```

### Revoke Access

```typescript
await accessControl.revokeAccess(
  {
    assetId: 'asset_123',
    grantee: 'grantee_wallet_address',
  },
  'owner_wallet_address',
  'owner_signature'
);
```

### Authentication Flow

```typescript
// 1. Generate challenge
const challenge = await accessControl.generateChallenge('wallet_address');

// 2. User signs challenge message
// (done on client side)

// 3. Verify challenge response
const valid = await accessControl.verifyChallenge(
  'wallet_address',
  challenge.nonce,
  'signature'
);
```

## API Reference

### AccessControlService

#### checkAccess(request)
Check if user has access to asset.

**Parameters:**
- `request.assetId` - Asset ID
- `request.walletAddress` - User wallet address
- `request.signature` - Signed message
- `request.permission` - Permission to check ('read', 'write', 'transfer')

**Returns:** `AccessCheckResult`

#### grantAccess(request, grantor, signature)
Grant access to user.

**Parameters:**
- `request.assetId` - Asset ID
- `request.grantee` - Grantee wallet address
- `request.permissions` - Array of permissions
- `request.expiresAt` - Optional expiration date
- `request.maxAccess` - Optional max access count
- `grantor` - Grantor wallet address
- `signature` - Grantor signature

#### revokeAccess(request, revoker, signature)
Revoke access from user.

**Parameters:**
- `request.assetId` - Asset ID
- `request.grantee` - Grantee wallet address
- `revoker` - Revoker wallet address
- `signature` - Revoker signature

#### getAccessPolicy(assetId)
Get access policy for asset.

#### getActiveGrants(assetId)
Get active grants for asset.

#### getGrantsForUser(walletAddress)
Get all grants for user.

#### generateChallenge(walletAddress)
Generate authentication challenge.

#### verifyChallenge(walletAddress, nonce, signature)
Verify challenge response.

## Security

### Signature Verification
- Uses Ed25519 signature verification
- Validates Solana public key format
- Checks signature format and length

### Anti-Replay Protection
- Timestamp validation (max age: 5 minutes)
- Nonce tracking to prevent reuse
- Challenge-response for authentication

### Access Control
- Owner has all permissions
- Grant-based access control
- Time-limited grants
- Usage-limited grants
- Revocable grants

## Audit Logging

All access operations are logged to PostgreSQL:

```typescript
// Query audit logs
const logs = await auditLogger.queryLogs({
  walletAddress: 'wallet_address',
  action: 'access_attempt',
  startDate: new Date('2024-01-01'),
  limit: 100,
});

// Get statistics
const stats = await auditLogger.getStatistics({
  walletAddress: 'wallet_address',
  startDate: new Date('2024-01-01'),
});
```

## Testing

```bash
npm test
```

## License

MIT
