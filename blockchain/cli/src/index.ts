#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { configCommand } from './commands/config';
import { mintCommand } from './commands/mint';
import { queryCommand } from './commands/query';
import { accessCommand } from './commands/access';
import { transferCommand } from './commands/transfer';
import { batchCommand } from './commands/batch';

const program = new Command();

program
  .name('memory-cli')
  .description('CLI tool for Memory Platform blockchain operations')
  .version('0.1.0');

// Configuration commands
program
  .addCommand(configCommand)
  .addCommand(mintCommand)
  .addCommand(queryCommand)
  .addCommand(accessCommand)
  .addCommand(transferCommand)
  .addCommand(batchCommand);

// Global error handler
program.exitOverride();

try {
  program.parse(process.argv);
} catch (error: any) {
  if (error.code !== 'commander.help' && error.code !== 'commander.version') {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
