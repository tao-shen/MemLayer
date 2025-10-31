import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { loadWallet } from '../config';
import { ApiClient } from '../utils/api-client';
import { displaySuccess, displayError, displayInfo } from '../utils/display';

export const accessCommand = new Command('access')
  .description('Manage memory access control');

accessCommand
  .command('grant')
  .description('Grant access to a memory')
  .argument('<assetId>', 'Asset ID')
  .option('-g, --grantee <address>', 'Grantee wallet address')
  .option('-p, --permissions <perms>', 'Permissions (comma-separated: read,write,transfer)', 'read')
  .option('-e, --expires <timestamp>', 'Expiration timestamp')
  .option('-m, --max-access <number>', 'Maximum access count')
  .action(async (assetId, options) => {
    const spinner = ora('Granting access...').start();

    try {
      let grantee = options.grantee;

      if (!grantee) {
        spinner.stop();
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'grantee',
            message: 'Grantee wallet address:',
          },
          {
            type: 'checkbox',
            name: 'permissions',
            message: 'Select permissions:',
            choices: ['read', 'write', 'transfer'],
            default: ['read'],
          },
          {
            type: 'confirm',
            name: 'setExpiry',
            message: 'Set expiration?',
            default: false,
          },
          {
            type: 'input',
            name: 'expiryHours',
            message: 'Expiry in hours:',
            when: (answers) => answers.setExpiry,
            default: '24',
          },
          {
            type: 'confirm',
            name: 'setMaxAccess',
            message: 'Set maximum access count?',
            default: false,
          },
          {
            type: 'input',
            name: 'maxAccess',
            message: 'Maximum access count:',
            when: (answers) => answers.setMaxAccess,
            default: '10',
          },
        ]);

        grantee = answers.grantee;
        options.permissions = answers.permissions.join(',');
        
        if (answers.setExpiry) {
          const hours = parseInt(answers.expiryHours);
          options.expires = Math.floor(Date.now() / 1000) + hours * 3600;
        }
        
        if (answers.setMaxAccess) {
          options.maxAccess = answers.maxAccess;
        }

        spinner.start('Granting access...');
      }

      const wallet = loadWallet();
      const client = new ApiClient();

      const grant = {
        grantee,
        permissions: options.permissions.split(',').map((p: string) => p.trim()),
        expiresAt: options.expires ? parseInt(options.expires) : undefined,
        maxAccess: options.maxAccess ? parseInt(options.maxAccess) : undefined,
        currentAccess: 0,
      };

      const response = await client.grantAccess(assetId, grant);

      spinner.succeed('Access granted successfully!');
      console.log(`\n${chalk.bold('Transaction:')} ${response.signature}`);
      displayInfo(`Granted ${grant.permissions.join(', ')} access to ${grantee}`);
    } catch (error: any) {
      spinner.fail('Failed to grant access');
      displayError(error.message);
      process.exit(1);
    }
  });

accessCommand
  .command('revoke')
  .description('Revoke access to a memory')
  .argument('<assetId>', 'Asset ID')
  .argument('<grantee>', 'Grantee wallet address')
  .action(async (assetId, grantee) => {
    const spinner = ora('Revoking access...').start();

    try {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Revoke access for ${grantee}?`,
          default: false,
        },
      ]);

      if (!confirm) {
        spinner.stop();
        displayInfo('Revoke cancelled');
        return;
      }

      const client = new ApiClient();
      const response = await client.revokeAccess(assetId, { grantee });

      spinner.succeed('Access revoked successfully!');
      console.log(`\n${chalk.bold('Transaction:')} ${response.signature}`);
    } catch (error: any) {
      spinner.fail('Failed to revoke access');
      displayError(error.message);
      process.exit(1);
    }
  });
