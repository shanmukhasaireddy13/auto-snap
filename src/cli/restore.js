const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { restoreSnapshot } = require('../core/snapshot');
const { STORE_DIR, CONFIG_DIR } = require('../utils/config');

async function restore(targetId, filePattern) {
    const rootDir = process.cwd();
    const storeDir = path.join(rootDir, '.auto-snap', STORE_DIR);

    if (!await fs.pathExists(storeDir)) {
        console.log(chalk.red('No snapshots found.'));
        return;
    }

    let targetFiles = [];

    // Find all .snap files
    async function walk(dir) {
        const files = await fs.readdir(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = await fs.stat(fullPath);
            if (stat.isDirectory()) {
                await walk(fullPath);
            } else if (file.endsWith('.snap')) {
                const relPath = path.relative(storeDir, fullPath).replace(/\.snap$/, '');
                if (!filePattern || relPath.includes(filePattern)) {
                    targetFiles.push({ snapPath: fullPath, relPath, absUserPath: path.join(rootDir, relPath) });
                }
            }
        }
    }

    await walk(storeDir);

    if (targetFiles.length === 0) {
        console.log(chalk.yellow('No matching files found.'));
        return;
    }

    console.log(chalk.blue(`Restoring to version ID: ${targetId}...`));

    let successCount = 0;
    let failCount = 0;

    for (const { absUserPath, relPath } of targetFiles) {
        try {
            // Restore Snapshot (Pivots the Tree & Returns Content)
            const content = await restoreSnapshot(absUserPath, rootDir, targetId);

            // Write to Workspace
            await fs.ensureDir(path.dirname(absUserPath));
            await fs.writeFile(absUserPath, content);

            console.log(chalk.green(`Restored ${relPath}`));
            successCount++;

        } catch (err) {
            // Silence "not found" errors for unrelated files
            if (err.message.includes('not found') || err.message.includes('Version')) {
                // Silent skip
            } else {
                console.error(chalk.red(`Failed to restore ${relPath}:`), err.message);
                failCount++;
            }
        }
    }

    if (successCount === 0 && failCount === 0) {
        console.log(chalk.yellow(`Version ${targetId} not found in any matching files.`));
    } else {
        console.log(chalk.gray(`\nSummary: ${successCount} restored, ${failCount} failed.`));
    }
}

module.exports = restore;
