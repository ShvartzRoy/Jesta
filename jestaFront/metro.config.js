const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver = {
    ...config.resolver,
    extraNodeModules: {
        ...config.resolver.extraNodeModules,
        "@react-native-community/slider": require.resolve("@react-native-community/slider"),
        "@react-native-community/datetimepicker": require.resolve("@react-native-community/datetimepicker"),
    },
};


module.exports = withNativeWind(config, { input: "./global.css" });