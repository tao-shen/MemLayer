# Blockchain Frontend Components

React components and hooks for integrating Solana wallet functionality into the Memory Platform frontend.

## Features

- 🔌 Easy wallet connection with multiple wallet support
- 💼 Phantom, Solflare, Torus, and Ledger wallet adapters
- 🎨 Pre-built UI components
- 🪝 React hooks for wallet state management
- 📱 Responsive and customizable

## Installation

```bash
npm install @memory-platform/blockchain-frontend
```

## Quick Start

### 1. Wrap your app with WalletContextProvider

```tsx
import React from 'react';
import { WalletContextProvider } from '@memory-platform/blockchain-frontend';

function App() {
  return (
    <WalletContextProvider network="devnet">
      <YourApp />
    </WalletContextProvider>
  );
}
```

### 2. Add wallet connection button

```tsx
import { WalletButton } from '@memory-platform/blockchain-frontend';

function Header() {
  return (
    <header>
      <h1>Memory Platform</h1>
      <WalletButton />
    </header>
  );
}
```

### 3. Display wallet information

```tsx
import { WalletInfo } from '@memory-platform/blockchain-frontend';

function Dashboard() {
  return (
    <div>
      <WalletInfo showBalance showAddress />
    </div>
  );
}
```

### 4. Use wallet connection hook

```tsx
import { useWalletConnection } from '@memory-platform/blockchain-frontend';

function MyComponent() {
  const { connected, publicKey, connect, disconnect, getBalance } = useWalletConnection();

  const handleConnect = async () => {
    try {
      await connect();
      console.log('Wallet connected!');
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  if (!connected) {
    return <button onClick={handleConnect}>Connect Wallet</button>;
  }

  return (
    <div>
      <p>Connected: {publicKey?.toBase58()}</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
```

## Components

### WalletContextProvider

Provides wallet connection context to your app.

**Props:**
- `network`: `'mainnet-beta' | 'devnet' | 'testnet'` (default: `'devnet'`)
- `endpoint`: Custom RPC endpoint (optional)
- `children`: React nodes

**Example:**
```tsx
<WalletContextProvider network="mainnet-beta" endpoint="https://api.mainnet-beta.solana.com">
  <App />
</WalletContextProvider>
```

### WalletButton

Pre-styled wallet connection button.

**Props:**
- `className`: Custom CSS class
- `style`: Custom inline styles

**Example:**
```tsx
<WalletButton 
  className="my-wallet-button"
  style={{ backgroundColor: '#ff6b6b' }}
/>
```

### WalletInfo

Displays wallet address and balance.

**Props:**
- `className`: Custom CSS class
- `showBalance`: Show SOL balance (default: `true`)
- `showAddress`: Show wallet address (default: `true`)

**Example:**
```tsx
<WalletInfo 
  showBalance={true}
  showAddress={true}
  className="wallet-info-card"
/>
```

## Hooks

### useWalletConnection

Comprehensive hook for wallet state and operations.

**Returns:**
```typescript
{
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  publicKey: PublicKey | null;
  walletName: string | null;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getBalance: () => Promise<number | null>;
  wallet: WalletContextState;
  connection: Connection;
}
```

**Example:**
```tsx
const {
  connected,
  publicKey,
  connect,
  disconnect,
  getBalance,
  connection
} = useWalletConnection();

useEffect(() => {
  if (connected) {
    getBalance().then(balance => {
      console.log('Balance:', balance);
    });
  }
}, [connected]);
```

## Supported Wallets

- **Phantom** - Most popular Solana wallet
- **Solflare** - Feature-rich wallet with staking
- **Torus** - Social login wallet
- **Ledger** - Hardware wallet support

## Styling

The components use the default wallet adapter styles. You can customize them by:

1. **Override CSS classes:**
```css
.wallet-adapter-button {
  background-color: #your-color !important;
}
```

2. **Use custom styles:**
```tsx
<WalletButton style={{ backgroundColor: '#custom-color' }} />
```

3. **Import your own CSS:**
```tsx
import './my-wallet-styles.css';
```

## Environment Variables

You can configure the RPC endpoint using environment variables:

```bash
REACT_APP_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Advanced Usage

### Custom RPC Endpoint

```tsx
<WalletContextProvider 
  endpoint="https://your-custom-rpc.com"
>
  <App />
</WalletContextProvider>
```

### Handling Connection Errors

```tsx
const { connect, error } = useWalletConnection();

const handleConnect = async () => {
  try {
    await connect();
  } catch (err) {
    console.error('Connection failed:', err);
    // Show error to user
  }
};

if (error) {
  return <div>Error: {error.message}</div>;
}
```

### Checking Wallet Balance

```tsx
const { getBalance, publicKey } = useWalletConnection();
const [balance, setBalance] = useState<number | null>(null);

useEffect(() => {
  if (publicKey) {
    getBalance().then(bal => {
      if (bal !== null) {
        setBalance(bal / LAMPORTS_PER_SOL);
      }
    });
  }
}, [publicKey]);
```

## TypeScript Support

All components and hooks are fully typed. Import types as needed:

```tsx
import type { 
  WalletContextProviderProps,
  WalletButtonProps,
  WalletInfoProps,
  WalletConnectionState 
} from '@memory-platform/blockchain-frontend';
```

## Best Practices

1. **Always wrap your app with WalletContextProvider** at the root level
2. **Handle connection errors gracefully** with try-catch blocks
3. **Check connection state** before performing wallet operations
4. **Use the useWalletConnection hook** for complex wallet interactions
5. **Provide user feedback** during connection/disconnection

## Troubleshooting

### Wallet not connecting

1. Check if wallet extension is installed
2. Verify network configuration matches wallet network
3. Check browser console for errors
4. Try refreshing the page

### Balance not showing

1. Ensure wallet is connected
2. Check RPC endpoint is accessible
3. Verify network has sufficient balance
4. Try refreshing balance manually

### TypeScript errors

1. Ensure all peer dependencies are installed
2. Check TypeScript version compatibility
3. Import types explicitly if needed

## Examples

See the `/examples` directory for complete working examples:

- Basic wallet connection
- Memory minting with wallet
- Transaction signing
- Multi-wallet support

## License

MIT
