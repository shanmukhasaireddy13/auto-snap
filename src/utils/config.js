const fs = require('fs-extra');
const path = require('path');

const CONFIG_DIR = '.auto-snap';
const CONFIG_FILE = 'config.json';
const STORE_DIR = 'store';

const DEFAULT_CONFIG = {
    debounce: 10000, // 10 seconds (Rule 2)
    minCharChange: 5, // Rule 1
    minLineChange: 1, // Rule 1
    similarityThreshold: 0.98, // Rule 3
    ignoreWhitespace: true,
    include: ['**/*'],
    exclude: [
        'node_modules/**',
        '.git/**',
        'dist/**',
        'build/**',
        '.auto-snap/**',
        'package-lock.json',
        '.gitignore'
    ],
    maxFileSizeMB: 2,
    retention: {
        days: 7,
        maxSnapshots: 200
    }
};

async function loadConfig(rootDir = process.cwd()) {
    const configPath = path.join(rootDir, CONFIG_DIR, CONFIG_FILE);
    if (await fs.pathExists(configPath)) {
        const userConfig = await fs.readJson(configPath);
        return { ...DEFAULT_CONFIG, ...userConfig };
    }
    return DEFAULT_CONFIG;
}

async function initConfig(rootDir = process.cwd()) {
    const configDir = path.join(rootDir, CONFIG_DIR);
    await fs.ensureDir(configDir);
    await fs.ensureDir(path.join(configDir, STORE_DIR));

    const configPath = path.join(configDir, CONFIG_FILE);
    if (!await fs.pathExists(configPath)) {
        await fs.writeJson(configPath, DEFAULT_CONFIG, { spaces: 2 });
        return true;
    }
    return false;
}

module.exports = {
    loadConfig,
    initConfig,
    CONFIG_DIR,
    STORE_DIR
};
