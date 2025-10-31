import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import cliProgress from 'cli-progress';
import { loadWallet } from '../config';
import { ApiClient } from '../utils/api-client';
import { displaySuccess, displayError, displayBatchInfo } from '../utils/display';

export const batchCommand = new Command('batch')
  .description('Batch operations for memories');

batchCommand
  .command('mint')
  .description('Mint multiple memories from a file')
  .argument('<file>', 'JSON file with memories array')
  .option('-p, --priority <level>', 'Priority (low/medium/high)', 'low')
  .action(async (file, options) => {
    const spinner = ora('Reading file...').start();

    try {
      if (!fs.existsSync(file)) {
        throw new Error(`File not found: ${file}`);
      }

      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      
      if (!Array.isArray(data.memories)) {
        throw new Error('File must contain a "memories" array');
      }

      spinner.succeed(`Loaded ${data.memories.length} memories`);

      const wallet = loadWallet();
      const client = new ApiClient();

      const request = {
        memories: data.memories.map((m: any) => ({
          content: m.content,
          metadata: m.metadata || {},
          agentId: m.agentId || 'batch-import',
          priority: options.priority,
        })),
        walletAddress: wallet.publicKey.toString(),
      };

      console.log(chalk.blue('\nStarting batch mint...'));
      const progressBar = new cliProgress.SingleBar({
        format: 'Progress |{bar}| {percentage}% | {value}/{total} memories',
      }, cliProgress.Presets.shades_classic);

      progressBar.start(request.memories.length, 0);

      const response = await client.mintBatch(request);

      progressBar.update(response.successCount);
      progressBar.stop();

      console.log();
      displaySuccess('Batch minting completed!');
      displayBatchInfo(response);

      if (response.failedCount > 0) {
        displayError(`${response.failedCount} memories failed to mint`);
      }
    } catch (error: any) {
      spinner.fail('Batch mint failed');
      displayError(error.message);
      process.exit(1);
    }
  });

batchCommand
  .command('info')
  .description('Get batch information')
  .argument('<batchId>', 'Batch ID')
  .action(async (batchId) => {
    const spinner = ora('Fetching batch info...').start();

    try {
      const client = new ApiClient();
      const batch = await client.getBatchInfo(batchId);

      spinner.succeed('Batch info retrieved');
      displayBatchInfo(batch);
    } catch (error: any) {
      spinner.fail('Failed to fetch batch info');
      displayError(error.message);
      process.exit(1);
    }
  });

batchCommand
  .command('template')
  .description('Generate a template file for batch minting')
  .argument('<output>', 'Output file path')
  .option('-c, --count <number>', 'Number of sample memories', '3')
  .action((output, options) => {
    const count = parseInt(options.count);
    const template = {
      memories: Array.from({ length: count }, (_, i) => ({
        content: `Sample memory content ${i + 1}`,
        metadata: {
          type: 'episodic',
          tags: ['sample', 'batch'],
          index: i + 1,
        },
        agentId: 'sample-agent',
      })),
    };

    fs.writeFileSync(output, JSON.stringify(template, null, 2));
    displaySuccess(`Template created: ${output}`);
    console.log(chalk.gray(`\nEdit the file and run: memory-cli batch mint ${output}`));
  });
