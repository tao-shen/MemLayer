import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { loadWallet } from '../config';
import { ApiClient } from '../utils/api-client';
import { displaySuccess, displayError, displayMemoryAsset, displayTable } from '../utils/display';

export const queryCommand = new Command('query')
  .description('Query memory assets');

queryCommand
  .command('list')
  .description('List user memories')
  .option('-w, --wallet <address>', 'Wallet address (defaults to configured wallet)')
  .option('-a, --agent <id>', 'Filter by agent ID')
  .option('-l, --limit <number>', 'Limit results', '10')
  .option('-o, --offset <number>', 'Offset results', '0')
  .action(async (options) => {
    const spinner = ora('Fetching memories...').start();

    try {
      let walletAddress = options.wallet;
      
      if (!walletAddress) {
        const wallet = loadWallet();
        walletAddress = wallet.publicKey.toString();
      }

      const client = new ApiClient();
      const filters: any = {
        limit: parseInt(options.limit),
        offset: parseInt(options.offset),
      };

      if (options.agent) {
        filters.agentId = options.agent;
      }

      const memories = await client.getUserMemories(walletAddress, filters);

      spinner.succeed(`Found ${memories.length} memories`);

      if (memories.length === 0) {
        console.log(chalk.gray('\nNo memories found'));
        return;
      }

      const tableData = memories.map((m: any) => [
        m.assetId.substring(0, 8) + '...',
        m.version,
        new Date(m.createdAt).toLocaleDateString(),
        m.batchId ? m.batchId.substring(0, 8) + '...' : '-',
      ]);

      console.log();
      displayTable(tableData, ['Asset ID', 'Version', 'Created', 'Batch']);
    } catch (error: any) {
      spinner.fail('Failed to fetch memories');
      displayError(error.message);
      process.exit(1);
    }
  });

queryCommand
  .command('get')
  .description('Get memory asset details')
  .argument('<assetId>', 'Asset ID')
  .action(async (assetId) => {
    const spinner = ora('Fetching asset...').start();

    try {
      const client = new ApiClient();
      const asset = await client.getMemoryAsset(assetId);

      spinner.succeed('Asset retrieved');
      displayMemoryAsset(asset);
    } catch (error: any) {
      spinner.fail('Failed to fetch asset');
      displayError(error.message);
      process.exit(1);
    }
  });
