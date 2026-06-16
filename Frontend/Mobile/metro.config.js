const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Force Metro to use the subdirectory as the project root and watch folder
config.projectRoot = projectRoot;
config.watchFolders = [projectRoot];

// Explicitly define module resolution path inside this folder
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

module.exports = config;
