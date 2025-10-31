import Conf from 'conf';
import { Keypair } from '@solana/web3.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

export interface CliConfig {
  rpcUrl: string;
  apiUrl: string;
  programId: string;
  walletPath: string;
  network: 'devnet' | 'mainnet';
}

const schema = {
  rpcUrl: {
    type: 'string',
    default: 'https://api.devnet.solana.com',
  },
  apiUrl: {
    type: 'string',
    default: 'https://api.memoryplatform.io',
  },
  programId: {
    type: 'string',
    default: '',
  },
  walletPath: {
    type: 'string',
    default: path.join(os.homedir(), '.config', 'solana', 'id.json'),
  },
  network: {
    type: 'string',
    default: 'devnet',
  },
};

export const config = new Conf<CliConfig>({
  projectName: 'memory-platform-cli',
  schema: schema as any,
});

export function loadWallet(walletPath?: string): Keypair {
  const path = walletPath || config.get('walletPath');
  
  if (!fs.existsSync(path)) {
    throw new Error(`Wallet file not found at ${path}`);
  }
  
  const secretKey = JSON.parse(fs.readFileSync(path, 'utf-8'));
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

export function getConfig(): CliConfig {
  return {
    rpcUrl: config.get('rpcUrl'),
    apiUrl: config.get('apiUrl'),
    programId: config.get('programId'),
    walletPath: config.get('walletPath'),
    network: config.get('network'),
  };
}

export function setConfig(key: keyof CliConfig, value: string): void {
  config.set(key, value);
}

export function resetConfig(): void {
  config.clear();
}
