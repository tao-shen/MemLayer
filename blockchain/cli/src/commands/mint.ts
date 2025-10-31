import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { loadWallet } from '../config';
import { ApiClient } from '../utils/api-client';
import { displaySuccess, displayError, displayMemoryAsset, displayCostEstimate } from '../utils/display';

export const mintCommand = new Command('mint')
  .description('Mint a memory as compressed NFT');

mintCommand
  .command('single')
  .description('Mint a single memory')
  .option('-c, --content <content>', 'Memory content')
  .option('-a, --agent <id>', 'Agent ID')
  .option('-m, --metadata <json>', 'Metadata as JSON string')
  .option('-p, --priority <level>', 'Priority (low/medium/high)', 'medium')
  .option('-w, --wallet <path>', 'Wallet path (overrides config)')
  .action(async (options) => {
    const spinner = ora('Minting memory...').start();

    try {
      let content = options.content;
      let agentId = options.agent;
      let metadata = options.metadata ? JSON.parse(options.metadata) : {};

      // Interactive mode if options not provided
      if (!content || !agentId) {
        spinner.stop();
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'content',
            message: 'Memory content:',
            when: !content,
          },
          {
            type: 'input',
            name: 'agentId',
            message: 'Agent ID:',
            when: !agentId,
          },
          {
            type: 'confirm',
            name: 'addMetadata',
            message: 'Add metadata?',
            default: false,
            when: !options.metadata,
          },
        ]);

        content = content || answers.content;
        agentId = agentId || answers.agentId;

        if (answers.addMetadata) {
          const metaAnswers = await inquirer.prompt([
            {
              type: 'input',
              name: 'type',
              message: 'Memory type:',
              default: 'episodic',
            },
            {
              type: 'input',
              name: 'tags',
              message: 'Tags (comma-separated):',
            },
          ]);

          metadata = {
            type: metaAnswers.type,
            tags: metaAnswers.tags ? metaAnswers.tags.split(',').map((t: string) => t.trim()) : [],
          };
        }

        spinner.start('Minting memory...');
      }

      const wallet = loadWallet(options.wallet);
      const client = new ApiClient();

      const request = {
        content,
        metadata,
        agentId,
        priority: options.priority,
        walletAddress: wallet.publicKey.toString(),
      };

      const response = await client.mintMemory(request);

      spinner.succeed('Memory minted successfully!');
      console.log();
      displayMemoryAsset({
        assetId: response.assetId,
        owner: wallet.publicKey.toString(),
        arweaveId: response.arweaveId,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`\n${chalk.bold('Transaction:')} ${response.transactionSignature}`);
      console.log(`${chalk.bold('Cost:')} ${response.costLamports} lamports`);
    } catch (error: any) {
      spinner.fail('Failed to mint memory');
      displayError(error.message);
      process.exit(1);
    }
  });

mintCommand
  .command('estimate')
  .description('Estimate minting cost')
  .argument('<count>', 'Number of memories')
  .action(async (count) => {
    const spinner = ora('Estimating cost...').start();

    try {
      const client = new ApiClient();
      const estimate = await client.estimateCost(parseInt(count));

      spinner.succeed('Cost estimated');
      displayCostEstimate(estimate);
    } catch (error: any) {
      spinner.fail('Failed to estimate cost');
      displayError(error.message);
      process.exit(1);
    }
  });
