const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { readSnapHistory, calculateTotalRawSize } = require('../core/snapshot');
const { STORE_DIR } = require('../utils/config');

async function history(filePattern) {
    try {
        const rootDir = process.cwd();
        const storeDir = path.join(rootDir, '.auto-snap', STORE_DIR);

        if (!await fs.pathExists(storeDir)) {
            console.log(chalk.yellow('No snapshots found.'));
            return;
        }

        const statsList = [];

        async function walk(dir) {
            const files = await fs.readdir(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = await fs.stat(fullPath);
                if (stat.isDirectory()) {
                    await walk(fullPath);
                } else if (file.endsWith('.snap')) {
                    const relPath = path.relative(storeDir, fullPath).replace(/\.snap$/, '');

                    // Filter if pattern provided
                    if (filePattern && !relPath.includes(filePattern)) continue;

                    try {
                        const historyData = await readSnapHistory(rootDir, relPath);
                        if (historyData) {
                            statsList.push({ file: relPath, data: historyData });
                        }
                    } catch (e) {
                        console.error(chalk.red(`Failed to read history for ${file}:`), e.message);
                    }
                }
            }
        }

        await walk(storeDir);

        if (statsList.length === 0) {
            console.log(chalk.yellow('No matching snapshots found.'));
            return;
        }

        // --- DETAILED VIEW ---
        if (filePattern) {
            console.log(chalk.bold.underline(`Snapshot History for "${filePattern}":`));

            for (const { file, data } of statsList) {
                // Calculate Raw Sizes for all versions
                const { total: totalRawSize, sizes: rawSizes } = calculateTotalRawSize(data.raw);

                console.log(chalk.bold(`\nFile: ${file}`));
                console.log(chalk.gray('----------------------------------------------------------------------------------------------------------------------------------'));
                console.log(chalk.bold(`| ${'Snapshot ID'.padEnd(15)} | ${'Parent'.padEnd(15)} | ${'Timestamp'.padEnd(30)} | ${'Size (Raw)'.padEnd(12)} | ${'Stats'.padEnd(10)} | ${'Type'}`));
                console.log(chalk.gray('----------------------------------------------------------------------------------------------------------------------------------'));

                // Show ALL versions (Tree View)
                const snapData = data.raw;
                const allNodes = Object.keys(snapData.i || {}).map(id => ({ id, ...snapData.i[id] }));

                // Sort Newest -> Oldest
                allNodes.sort((a, b) => b.t - a.t);

                allNodes.forEach(node => {
                    const date = new Date(node.t);
                    const dateStr = date.toLocaleString(); // Human Readable

                    let statsStr = '';
                    if (node.s) {
                        const added = node.s[0] ? chalk.green(`+${node.s[0]}`) : '';
                        const removed = node.s[1] ? chalk.red(`-${node.s[1]}`) : '';
                        statsStr = `${added} ${removed}`.trim();
                    }
                    const type = node.p ? 'VERSION' : 'ROOT';
                    const isHead = (node.id === data.currentId) ? chalk.cyan('(HEAD)') : '';
                    const parentId = node.p || '-';
                    const sizeStr = formatBytes(rawSizes[node.id] || 0);

                    console.log(`| ${node.id.padEnd(15)} | ${parentId.padEnd(15)} | ${dateStr.padEnd(30)} | ${sizeStr.padEnd(12)} | ${statsStr.padEnd(10)} | ${type} ${isHead}`);
                });
                console.log(chalk.gray('----------------------------------------------------------------------------------------------------------------------------------'));
                console.log(chalk.yellow(`\nTip: Use the 'Snapshot ID' (first column) to restore. Example: npm run restore ${allNodes[0].id}`));

                // --- Storage Efficiency Stats ---
                if (data.diskSize) {
                    const diskSize = data.diskSize;
                    const currentSize = rawSizes[data.currentId] || 0;
                    const savingsBytes = totalRawSize - diskSize;
                    const savingsPercent = totalRawSize > 0 ? ((savingsBytes / totalRawSize) * 100).toFixed(1) : '0.0';

                    console.log(chalk.gray('\n----------------------------------------------------------------------------------------------------------------------------------'));
                    console.log(chalk.bold.magenta('Storage Efficiency Overview:'));
                    console.log(`Current File Size:        ${formatBytes(currentSize)}`);
                    console.log(`Total Uncompressed Size:  ${formatBytes(totalRawSize)}  (Sum of Current + All Past Versions)`);
                    console.log(`Actual Storage (.snap):   ${formatBytes(diskSize)}`);
                    console.log(chalk.green(`Total Saved:              ${formatBytes(savingsBytes)} (${savingsPercent}%)`));
                    console.log(chalk.gray('----------------------------------------------------------------------------------------------------------------------------------'));
                }
            }
            return;
        }

        // --- SUMMARY VIEW (Default) ---
        console.log(chalk.bold.underline('Tracked Files Summary:'));
        console.log(chalk.gray('Use "npm run history <filename>" to see detailed versions.\n'));
        console.log(chalk.gray('--------------------------------------------------------------------------------'));
        console.log(chalk.bold(`| ${'File'.padEnd(40)} | ${'Last Updated'.padEnd(30)} | ${'Versions'} `));
        console.log(chalk.gray('--------------------------------------------------------------------------------'));

        // Filter invalid entries
        const validStats = statsList.filter(item => item.data && item.data.raw && item.data.raw.i);

        validStats.sort((a, b) => {
            const timeA = (a.data.raw.i[a.data.currentId]) ? a.data.raw.i[a.data.currentId].t : 0;
            const timeB = (b.data.raw.i[b.data.currentId]) ? b.data.raw.i[b.data.currentId].t : 0;
            return timeB - timeA;
        });

        for (const { file, data } of validStats) {
            const currentId = data.currentId;
            const currentNode = (data.raw.i && currentId) ? data.raw.i[currentId] : null;
            const dateStr = currentNode ? new Date(currentNode.t).toLocaleString() : 'N/A';

            // Count total versions in the file
            const count = data.raw.i ? Object.keys(data.raw.i).length : 0;

            console.log(`| ${file.padEnd(40)} | ${dateStr.padEnd(30)} | ${count} `);
        }
        console.log(chalk.gray('--------------------------------------------------------------------------------'));


    } catch (err) {
        console.error(chalk.red('Failed to retrieve history:'), err);
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = history;
