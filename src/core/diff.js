const { diffLines, diffChars } = require('diff');
const crypto = require('crypto');



function calculateSimilarity(oldContent, newContent) {
    if (!oldContent || !newContent) return 0;
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const diff = diffLines(oldContent, newContent);

    let unchangedLines = 0;
    diff.forEach(part => {
        if (!part.added && !part.removed) {
            unchangedLines += part.count;
        }
    });

    const totalLines = Math.max(oldLines.length, newLines.length);
    return totalLines === 0 ? 1 : unchangedLines / totalLines;
}

function isTrivialChange(oldContent, newContent, config) {
    const { minCharChange, minLineChange } = config;

    const lineDiff = diffLines(oldContent, newContent);
    let changedLines = 0;
    lineDiff.forEach(part => {
        if (part.added || part.removed) {
            changedLines += part.count;
        }
    });

    if (changedLines >= minLineChange) return false; // Not trivial if lines changed enough

    const charDiff = diffChars(oldContent, newContent);
    let changedChars = 0;
    charDiff.forEach(part => {
        if (part.added || part.removed) {
            changedChars += part.count;
        }
    });

    return changedChars < minCharChange;
}

function isMeaningfulChange(oldContent, newContent, config) {
    if (!oldContent && newContent) return true; // New file
    if (!newContent) return true; // Deleted file

    // Rule 1: Trivial Change
    if (isTrivialChange(oldContent, newContent, config)) {
        console.log('[Diff] Trivial change skipped.');
        return false;
    }

    // Rule 2: Whitespace Check (User Request)
    if (config.ignoreWhitespace) {
        const cleanOld = oldContent.replace(/\s+/g, '');
        const cleanNew = newContent.replace(/\s+/g, '');
        if (cleanOld === cleanNew) {
            console.log('[Diff] Whitespace-only change skipped.');
            return false;
        }
    }

    // Rule 3: Similarity Check
    const similarity = calculateSimilarity(oldContent, newContent);
    if (similarity >= (config.similarityThreshold || 0.98)) {
        console.log(`[Diff] Content too similar (${(similarity * 100).toFixed(2)}%). Skipped.`);
        return false;
    }

    return true;
}

function getDiffStats(oldContent, newContent) {
    if (!oldContent) {
        return { added: newContent ? newContent.split('\n').length : 0, removed: 0 };
    }
    const changes = diffLines(oldContent, newContent);
    let added = 0;
    let removed = 0;
    changes.forEach(part => {
        if (part.added) added += part.count;
        if (part.removed) removed += part.count;
    });
    return { added, removed };
}

module.exports = {
    isMeaningfulChange,
    getDiffStats,

    calculateSimilarity
};
