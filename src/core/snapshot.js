const fs = require('fs-extra');
const path = require('path');
const zlib = require('zlib');
const util = require('util');
const DiffMatchPatch = require('diff-match-patch');
const { getDiffStats } = require('./diff');
const { STORE_DIR } = require('../utils/config');

const brotliCompress = util.promisify(zlib.brotliCompress);
const brotliDecompress = util.promisify(zlib.brotliDecompress);
const dmp = new DiffMatchPatch();

/**
 * .snap Data Structure (Compact Tree):
 * {
 *   c: "current_node_id",
 *   i: {
 *     "root_id": { t: 123, b: "full_body", s: null },
 *     "child_id": { p: "parent_id", t: 124, d: "patch_text", s: [add, rem] }
 *   }
 * }
 */

async function createSnapshot(filePath, rootDir, config) {
    try {
        const relativePath = path.relative(rootDir, filePath);
        const storeDir = path.join(rootDir, '.auto-snap', STORE_DIR);
        await fs.ensureDir(storeDir);
        const snapPath = path.join(storeDir, `${path.basename(filePath)}.snap`);

        const currentContent = await fs.readFile(filePath, 'utf8');
        let snapData = { c: null, i: {} };

        // Load existing
        if (await fs.pathExists(snapPath)) {
            const buffer = await fs.readFile(snapPath);
            snapData = JSON.parse((await brotliDecompress(buffer)).toString());
        }

        const now = Date.now();
        const newId = now.toString(36); // Simple ID

        if (!snapData.c) {
            // First Snapshot -> Root
            snapData.i[newId] = {
                t: now,
                b: currentContent, // Full Body
                s: null
            };
            snapData.c = newId;
            console.log(`[Snapshot] Created Root for ${path.basename(filePath)}`);
        } else {
            // Branch from Current
            const parentId = snapData.c;
            const parentContent = reconstructContent(snapData, parentId);

            // Calculate Diff (Forward Patch: Parent -> Child)
            const patches = dmp.patch_make(parentContent, currentContent);
            const patchText = dmp.patch_toText(patches);

            // Calculate Stats
            const stats = getDiffStats(parentContent, currentContent);

            if (patches.length === 0) {
                return; // No change
            }

            snapData.i[newId] = {
                p: parentId,
                t: now,
                d: patchText,
                s: [stats.added, stats.removed]
            };
            snapData.c = newId;
            console.log(`[Snapshot] Saved version for ${path.basename(filePath)} (Parent: ${parentId})`);
        }

        // Save
        const compressed = await brotliCompress(Buffer.from(JSON.stringify(snapData)));
        await fs.writeFile(snapPath, compressed);

    } catch (error) {
        console.error(`Failed to create snapshot for ${filePath}:`, error);
    }
}

async function restoreSnapshot(filePath, rootDir, targetId) {
    const storeDir = path.join(rootDir, '.auto-snap', STORE_DIR);
    const snapPath = path.join(storeDir, `${path.basename(filePath)}.snap`);

    if (!await fs.pathExists(snapPath)) throw new Error('Snapshot file not found');

    const buffer = await fs.readFile(snapPath);
    const snapData = JSON.parse((await brotliDecompress(buffer)).toString());

    if (!snapData || !snapData.i || !snapData.i[targetId]) throw new Error(`Version ${targetId} not found`);

    const content = reconstructContent(snapData, targetId);

    // Update Current Pointer (Pivot)
    snapData.c = targetId;

    // Save Updated State
    const compressed = await brotliCompress(Buffer.from(JSON.stringify(snapData)));
    await fs.writeFile(snapPath, compressed);

    return content;
}

function reconstructContent(snapData, targetId) {
    // 1. Trace back to Root
    const path = [];
    let curr = targetId;
    while (curr) {
        path.unshift(curr); // Add to front [Root, ..., Target]
        const node = snapData.i[curr];
        if (node.b !== undefined) break; // Found Root (has body)
        curr = node.p;
    }

    // 2. Apply Forward From Root
    const rootId = path[0];
    let content = snapData.i[rootId].b;

    for (let i = 1; i < path.length; i++) {
        const nodeId = path[i];
        const node = snapData.i[nodeId];
        const patches = dmp.patch_fromText(node.d);
        const [newContent, results] = dmp.patch_apply(patches, content);
        content = newContent;
    }

    return content;
}

async function readSnapHistory(rootDir, relPath) {
    const storeDir = path.join(rootDir, '.auto-snap', STORE_DIR);
    const snapPath = path.join(storeDir, `${path.basename(relPath)}.snap`); // Note: simplified lookup

    if (!await fs.pathExists(snapPath)) return null;

    const buffer = await fs.readFile(snapPath);
    const snapData = JSON.parse((await brotliDecompress(buffer)).toString());

    // Get Current Content for Watcher
    const currentContent = reconstructContent(snapData, snapData.c);

    // Return structured data for CLI/Watcher
    return {
        currentId: snapData.c,
        currentContent: currentContent,
        raw: snapData
    };
}

// Helper to record deletions (optional implementation)
async function recordDeletion(filePath, rootDir, config) {
    // For now, maybe just log? Or create a "deleted" node?
    // Skipping complexity for this turn unless requested.
}

module.exports = {
    createSnapshot,
    restoreSnapshot,
    readSnapHistory,
    recordDeletion
};
