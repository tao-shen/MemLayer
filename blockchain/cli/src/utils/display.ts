import chalk from 'chalk';
import { table } from 'table';

export function displaySuccess(message: string): void {
  console.log(chalk.green('✓'), message);
}

export function displayError(message: string): void {
  console.log(chalk.red('✗'), message);
}

export function displayInfo(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

export function displayWarning(message: string): void {
  console.log(chalk.yellow('⚠'), message);
}

export function displayTable(data: any[], headers: string[]): void {
  const tableData = [headers, ...data];
  console.log(table(tableData));
}

export function displayMemoryAsset(asset: any): void {
  console.log(chalk.bold('\nMemory Asset Details:'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`${chalk.bold('Asset ID:')}      ${asset.assetId}`);
  console.log(`${chalk.bold('Owner:')}         ${asset.owner}`);
  console.log(`${chalk.bold('Arweave ID:')}    ${asset.arweaveId}`);
  console.log(`${chalk.bold('Version:')}       ${asset.version}`);
  console.log(`${chalk.bold('Created:')}       ${new Date(asset.createdAt).toLocaleString()}`);
  console.log(`${chalk.bold('Updated:')}       ${new Date(asset.updatedAt).toLocaleString()}`);
  if (asset.batchId) {
    console.log(`${chalk.bold('Batch ID:')}      ${asset.batchId}`);
  }
  console.log(chalk.gray('─'.repeat(50)));
}

export function displayBatchInfo(batch: any): void {
  console.log(chalk.bold('\nBatch Information:'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`${chalk.bold('Batch ID:')}      ${batch.batchId}`);
  console.log(`${chalk.bold('Assets:')}        ${batch.assetIds.length}`);
  console.log(`${chalk.bold('Success:')}       ${batch.successCount}`);
  console.log(`${chalk.bold('Failed:')}        ${batch.failedCount}`);
  console.log(`${chalk.bold('Total Cost:')}    ${batch.totalCost} lamports`);
  console.log(chalk.gray('─'.repeat(50)));
}

export function displayCostEstimate(estimate: any): void {
  console.log(chalk.bold('\nCost Estimate:'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`${chalk.bold('Solana:')}        ${estimate.solanaCostLamports} lamports`);
  console.log(`${chalk.bold('Arweave:')}       ${estimate.arweaveCostAr} AR`);
  console.log(`${chalk.bold('Total USD:')}     $${estimate.totalCostUsd.toFixed(4)}`);
  console.log(chalk.gray('─'.repeat(50)));
}
