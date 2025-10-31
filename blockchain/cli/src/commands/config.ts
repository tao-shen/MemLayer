import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { config, getConfig, setConfig, resetConfig } from '../config';
import { displaySuccess, displayInfo, displayTable } from '../utils/display';

export const configCommand = new Command('config')
  .description('Manage CLI configuration');

configCommand
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const cfg = getConfig();
    console.log(chalk.bold('\nCurrent Configuration:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`${chalk.bold('Network:')}      ${cfg.network}`);
    console.log(`${chalk.bold('RPC URL:')}      ${cfg.rpcUrl}`);
    console.log(`${chalk.bold('API URL:')}      ${cfg.apiUrl}`);
    console.log(`${chalk.bold('Program ID:')}   ${cfg.programId || chalk.gray('(not set)')}`);
    console.log(`${chalk.bold('Wallet Path:')}  ${cfg.walletPath}`);
    console.log(chalk.gray('─'.repeat(50)));
  });

configCommand
  .command('set')
  .description('Set configuration values')
  .option('-n, --network <network>', 'Network (devnet/mainnet)')
  .option('-r, --rpc <url>', 'RPC URL')
  .option('-a, --api <url>', 'API URL')
  .option('-p, --program <id>', 'Program ID')
  .option('-w, --wallet <path>', 'Wallet path')
  .action(async (options) => {
    if (Object.keys(options).length === 0) {
      // Interactive mode
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'network',
          message: 'Select network:',
          choices: ['devnet', 'mainnet'],
          default: getConfig().network,
        },
        {
          type: 'input',
          name: 'rpcUrl',
          message: 'RPC URL:',
          default: getConfig().rpcUrl,
        },
        {
          type: 'input',
          name: 'apiUrl',
          message: 'API URL:',
          default: getConfig().apiUrl,
        },
        {
          type: 'input',
          name: 'programId',
          message: 'Program ID:',
          default: getConfig().programId,
        },
        {
          type: 'input',
          name: 'walletPath',
          message: 'Wallet path:',
          default: getConfig().walletPath,
        },
      ]);

      Object.entries(answers).forEach(([key, value]) => {
        if (value) {
          setConfig(key as any, value as string);
        }
      });
    } else {
      // Command-line mode
      if (options.network) setConfig('network', options.network);
      if (options.rpc) setConfig('rpcUrl', options.rpc);
      if (options.api) setConfig('apiUrl', options.api);
      if (options.program) setConfig('programId', options.program);
      if (options.wallet) setConfig('walletPath', options.wallet);
    }

    displaySuccess('Configuration updated');
  });

configCommand
  .command('reset')
  .description('Reset configuration to defaults')
  .action(async () => {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to reset all configuration?',
        default: false,
      },
    ]);

    if (confirm) {
      resetConfig();
      displaySuccess('Configuration reset to defaults');
    } else {
      displayInfo('Reset cancelled');
    }
  });
