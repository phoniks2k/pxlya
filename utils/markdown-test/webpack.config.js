var path = require('path');
var webpack = require('webpack');

var babelPlugins = [
  '@babel/plugin-transform-flow-strip-types',
  ['@babel/plugin-proposal-decorators', { legacy: true }],
  '@babel/plugin-proposal-function-sent',
  '@babel/plugin-proposal-export-namespace-from',
  '@babel/plugin-proposal-numeric-separator',
  '@babel/plugin-proposal-throw-expressions',
  ['@babel/plugin-proposal-class-properties', { loose: true }],
  ['@babel/plugin-proposal-private-methods', { loose: true }],
  ["@babel/plugin-proposal-private-property-in-object", { "loose": true }],
  '@babel/proposal-object-rest-spread',
  // react-optimize
  '@babel/transform-react-constant-elements',
  '@babel/transform-react-inline-elements',
  'transform-react-remove-prop-types',
  'transform-react-pure-class-to-function',
];

module.exports = {
  name: 'script',
  target: 'web',
  mode: 'development',

  entry: [ path.resolve(__dirname, './mdtest.js') ],

  output: {
    path: __dirname,
    filename: 'script.js',
  },

  resolve: {
    extensions: ['.js', '.jsx' ],
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        options: {
          presets: [
            ['@babel/preset-env', {
              targets: {
                browsers: [ 'defaults' ],
              },
              modules: false,
            }],
            '@babel/react',
          ],
          plugins: babelPlugins,
        },
      },
    ],
  },

  stats: {
    colors: true,
  },
};
