const Watcher = require('./watcher');
const { loadConfig } = require('../utils/config');
const path = require('path');

(async () => {
    const rootDir = process.cwd();
    const config = await loadConfig(rootDir);

    const watcher = new Watcher(rootDir, config);
    watcher.start();

    // Keep process alive
    process.stdin.resume();

    // Handle signals
    process.on('SIGINT', () => {
        watcher.stop();
        process.exit(0);
    });
})();
