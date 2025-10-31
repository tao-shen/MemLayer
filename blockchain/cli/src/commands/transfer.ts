import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { loadWallet } from '../config';
import { ApiClient } from '../utils/api-client';
import { displaySuccess, displayError, displayInfo } from '../utils/display';

export const transferCommand = new Command('transfer')
  .description('Transfer memory asset ownership')
  .argument('<assetId>', 'Asset ID')
  .option('-t, --to <address>', 'New owner wallet address')
  .action(async (assetId, options) => {
    const spinner = ora('Transferring asset...').start();

    try {
      let newOwner = options.to;

      if (!newOwner) {
        spinner.stop();
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'newOwner',
            message: 'New owner wallet address:',
          },
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Confirm transfer? This action cannot be undone.',
            default: false,
          },
        ]);

        if (!answers.confirm) {
          displayInfo('Transfer cancelled');
          return;
        }

        newOwner = answers.newOwner;
        spinner.start('Transferring asset...');
      }

      const wallet = loadWallet();
      const client = new ApiClient();

      const response = await client.transferMemory(assetId, { newOwner });

      spinner.succeed('Asset transferred successfully!');
      console.log(`\n${chalk.bold('Transaction:')} ${response.transactionSignature}`);
      console.log(`${chalk.bold('New Owner:')} ${response.newOwner}`);
      displayInfo('The asset has been transferred and you no longer have access');
    } catch (error: any) {
      spinner.fail('Failed to transfer asset');
      displayError(error.message);
      process.exit(1);
    }
  });
