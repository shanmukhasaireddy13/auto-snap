const chokidar = require('chokidar');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { isMeaningfulChange } = require('./diff');
const { createSnapshot, readSnapHistory } = require('./snapshot');

class Watcher {
    constructor(rootDir, config) {
        this.rootDir = rootDir;
        this.config = config;
        this.watcher = null;
        this.processing = new Set();
    }

    start() {
        console.log(chalk.blue(`Starting Auto-Snap watcher in ${this.rootDir}...`));
        const ignored = [...this.config.exclude, /(^|[\/\\])\../];

        this.watcher = chokidar.watch(this.config.include, {
            cwd: this.rootDir,
            ignored: ignored,
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: this.config.debounce || 2000,
                pollInterval: 100
            }
        });

        this.watcher
            .on('add', path => this.handleChange(path, 'add'))
            .on('change', path => this.handleChange(path, 'change'))
            .on('error', error => console.error(chalk.red(`Watcher error: ${error}`)));

        console.log(chalk.green('Watcher is active.'));
    }

    async handleChange(relPath, type) {
        if (this.processing.has(relPath)) return;
        this.processing.add(relPath);

        try {
            const absPath = path.join(this.rootDir, relPath);
            const content = await fs.readFile(absPath, 'utf8');

            // Get Last Snapshot Content (Reconstructed from Tree Current Pointer)
            const snapInfo = await readSnapHistory(this.rootDir, relPath);
            const lastContent = snapInfo ? snapInfo.currentContent : null;

            // If content matches 'lastContent', it means:
            // 1. It's a revert to exact previous state.
            // 2. OR, we just performed a Restore, and the .snap file's 'current' pointer matches this file.
            // In both cases, we SKIP creating a new snapshot.
            if (isMeaningfulChange(lastContent, content, this.config)) {
                await createSnapshot(absPath, this.rootDir, this.config);
            } else {
                // console.log(chalk.gray(`Skipping ${relPath}: no meaningful change (or match with current head)`));
            }

        } catch (err) {
            console.error(chalk.red(`Error processing ${relPath}:`), err);
        } finally {
            this.processing.delete(relPath);
        }
    }

    stop() {
        if (this.watcher) {
            this.watcher.close();
        }
    }
}

module.exports = Watcher;
