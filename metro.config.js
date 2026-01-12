// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get the default Metro configuration
const config = getDefaultConfig(__dirname);

// Get the project root
const projectRoot = __dirname;

// Exclude large folders that don't need watching to reduce open file handles
config.resolver.blacklistREs = [
    /node_modules\/.*/,
    /\.git\/.*/,
    /ios\/.*/,
    /android\/.*/,
    /\.expo\/.*/,
];

// Only watch the project root and the src folder (if present)
config.watchFolders = [
    projectRoot,
    path.join(projectRoot, 'src'),
];

// Lower the number of worker threads (helps on machines with low fd limits)
config.transformer = config.transformer || {};
config.transformer.maxWorkers = 1;

module.exports = config;
