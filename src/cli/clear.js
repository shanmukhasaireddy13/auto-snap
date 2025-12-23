const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { CONFIG_DIR, STORE_DIR } = require('../utils/config');

async function clear() {
    const rootDir = process.cwd();
    const storePath = path.join(rootDir, CONFIG_DIR, STORE_DIR);

    try {
        console.log(chalk.yellow('Clearing all snapshots...'));

        // Clear Store (New Architecture)
        if (await fs.pathExists(storePath)) {
            await fs.emptyDir(storePath);
        }

        // Cleanup Legacy Directories (Safety)
        const legacySnapshots = path.join(rootDir, CONFIG_DIR, 'snapshots');
        if (await fs.pathExists(legacySnapshots)) {
            await fs.remove(legacySnapshots);
        }

        const legacyBlobs = path.join(rootDir, CONFIG_DIR, 'blobs');
        if (await fs.pathExists(legacyBlobs)) {
            await fs.remove(legacyBlobs);
        }

        console.log(chalk.green('History cleared successfully.'));
    } catch (err) {
        console.error(chalk.red('Failed to clear history:'), err);
    }
}

module.exports = clear;
