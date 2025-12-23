const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { CONFIG_DIR } = require('../utils/config');

async function start() {
    const pidFile = path.join(process.cwd(), CONFIG_DIR, 'watcher.pid');

    if (await fs.pathExists(pidFile)) {
        const pid = parseInt(await fs.readFile(pidFile, 'utf8'));
        try {
            process.kill(pid, 0); // Check if running
            console.log(chalk.yellow('Auto-Snap watcher is already running.'));
            return;
        } catch (e) {
            // Not running, clean up pid file
            await fs.remove(pidFile);
        }
    }

    console.log(chalk.blue('Starting Auto-Snap watcher in background...'));

    const daemonPath = path.join(__dirname, '../../src/core/daemon.js');
    const child = spawn('node', [daemonPath], {
        detached: true,
        stdio: 'ignore',
        cwd: process.cwd()
    });

    await fs.writeFile(pidFile, child.pid.toString());

    child.unref();
    console.log(chalk.green(`Watcher started (PID: ${child.pid})`));
}

module.exports = start;
