module.exports = function (api) {
  api.cache(true);
  const plugins = [
    '@babel/plugin-transform-flow-strip-types',
    '@babel/plugin-proposal-throw-expressions',
    // react-optimize
    '@babel/transform-react-constant-elements',
    '@babel/transform-react-inline-elements',
    'transform-react-remove-prop-types',
    'transform-react-pure-class-to-function',
  ];

  const presets = [
    [
      "@babel/preset-env",
      {
        "targets": {
          "node": "current"
        }
      }
    ],
    '@babel/react',
  ];

  return {
    presets,
    plugins
  };
}
