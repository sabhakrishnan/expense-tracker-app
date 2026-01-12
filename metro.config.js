// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get the default Metro configuration
const config = getDefaultConfig(__dirname);

// Get the project root
const projectRoot = __dirname;

// Add alias for react-native-svg to work on web
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-svg/src': path.resolve(__dirname, 'node_modules/react-native-svg'),
};

// Only watch the project root and the src folder (if present)
config.watchFolders = [
    projectRoot,
    path.join(projectRoot, 'src'),
];

// Lower the number of worker threads (helps on machines with low fd limits)
config.transformer = config.transformer || {};
config.transformer.maxWorkers = 1;

module.exports = config;
