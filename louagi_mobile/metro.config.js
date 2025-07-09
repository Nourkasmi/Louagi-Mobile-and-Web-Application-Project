const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure resolver for platform-specific modules
config.resolver.platforms = ['native', 'web', 'ios', 'android'];

// Set resolver main fields to handle different environments
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add resolver alias to handle native-only modules on web
config.resolver.alias = {
    'react-native/Libraries/Utilities/codegenNativeComponents': false,
    'react-native/Libraries/Stripe/codegenNativeCommands': false,
    'react-native/Libraries/Utilities/codegenNativeCommands': false,
};

// Configure resolver to ignore native-only modules on web
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;