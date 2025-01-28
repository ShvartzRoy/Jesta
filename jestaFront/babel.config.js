module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "@babel/plugin-transform-runtime",
        {
          useESModules: true,  // Force ES Modules usage in Babel
        },
      ],
    ],
  };
};