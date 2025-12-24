#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const packageJson = require('../package.json');

program
    .version(packageJson.version)
    .description('Autosnap: Intelligent Local File History');

program.command('init')
    .description('Initialize Autosnap in the current directory')
    .action(require('../src/cli/init'));

program.command('start')
    .description('Start the background file watcher')
    .action(require('../src/cli/start'));

program.command('stop')
    .description('Stop the background file watcher')
    .action(require('../src/cli/stop'));

program.command('history [file]')
    .description('View snapshot history (summary or detail)')
    .action(require('../src/cli/history'));

program.command('restore <id> [file]')
    .description('Restore a snapshot or specific file')
    .action(require('../src/cli/restore'));

program.command('clear')
    .description('Clear all snapshot history')
    .action(require('../src/cli/clear'));

program.command('settings')
    .description('Open configuration')
    .action(require('../src/cli/config'));

program.parse(process.argv);
