const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { CONFIG_DIR } = require('../utils/config');

async function stop() {
    const pidFile = path.join(process.cwd(), CONFIG_DIR, 'watcher.pid');

    if (!await fs.pathExists(pidFile)) {
        console.log(chalk.yellow('Auto-Snap watcher is not running.'));
        return;
    }

    try {
        const pid = parseInt(await fs.readFile(pidFile, 'utf8'));
        process.kill(pid, 'SIGINT');
        console.log(chalk.green('Auto-Snap watcher stopped.'));
    } catch (e) {
        console.log(chalk.red('Failed to stop watcher (maybe it was already stopped?)'));
    } finally {
        await fs.remove(pidFile);
    }
}

module.exports = stop;
