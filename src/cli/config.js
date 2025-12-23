const { loadConfig, CONFIG_DIR } = require('../utils/config');
const chalk = require('chalk');
const path = require('path');

async function config() {
    try {
        const rootDir = process.cwd();
        const configData = await loadConfig(rootDir);
        const configPath = path.join(rootDir, CONFIG_DIR, 'config.json');

        console.log(chalk.bold(`Configuration (${configPath}):`));
        console.log(JSON.stringify(configData, null, 2));
        console.log(chalk.gray('\nEdit this file to change settings.'));
    } catch (err) {
        console.error(chalk.red('Failed to load config:'), err);
    }
}

module.exports = config;
