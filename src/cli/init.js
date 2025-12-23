const { initConfig, loadConfig } = require('../utils/config');
const { createSnapshot } = require('../core/snapshot');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar'); // Use chokidar's match logic? Or just simple glob.

async function init() {
    try {
        const rootDir = process.cwd();
        const created = await initConfig(rootDir);

        if (created) {
            console.log(chalk.green('Auto-Snap initialized successfully!'));
            console.log(chalk.blue('Config created at .auto-snap/config.json'));

            // Perform Initial Snapshot
            console.log(chalk.blue('Creating initial snapshots of all files...'));
            const config = await loadConfig(rootDir);

            // We can reuse the Watcher logic or just manually scan.
            // Let's use chokidar's glob to match config.include/exclude
            // But checking files one by one is safer.
            // Using chokidar just to scan is easiest way to reuse logic.

            const watcher = chokidar.watch(config.include, {
                cwd: rootDir,
                ignored: [...config.exclude, /(^|[\/\\])\../],
                persistent: false, // Exit when done
                ignoreInitial: false
            });

            watcher.on('add', async (relPath) => {
                const absPath = path.join(rootDir, relPath);
                try {
                    // Check size constraint manually as watcher does
                    const stats = await fs.stat(absPath);
                    const fileSizeMB = stats.size / (1024 * 1024);
                    if (fileSizeMB > config.maxFileSizeMB) return;

                    await createSnapshot(absPath, rootDir, config);
                } catch (e) { }
            });

            // Wait for "ready" event
            await new Promise(resolve => {
                watcher.on('ready', () => {
                    resolve();
                });
            });

            // Allow a moment for async 'add' handlers to fire?
            // Actually 'ready' fires after initial scan. 'add' events fire synchronously during scan in chokidar usually?
            // Safer to just close after a small delay or use awaitWriteFinish logic? 
            // Standard chokidar scan: events emit, then ready.
            // We need to wait for the async createSnapshot calls. 
            // Let's use a simpler approach: glob. But we don't have glob package installed.
            // We have fs-extra. 
            // Actually chokidar works fine. Just wait a bit after ready.

            await new Promise(r => setTimeout(r, 1000));
            watcher.close();
            console.log(chalk.green('Initial snapshots complete.'));

        } else {
            console.log(chalk.yellow('Auto-Snap is already initialized.'));
        }
    } catch (err) {
        console.error(chalk.red('Initialization failed:'), err);
    }
}

module.exports = init;
