/*
 */

import path from 'path';
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';
import GeneratePackageJsonPlugin from 'generate-package-json-webpack-plugin';

import pkg from './package.json';

const isDebug = process.argv.includes('--debug');
const VERBOSE = false;

const basePackageValues = {
  name: pkg.name,
  version: pkg.version,
  private: true,
  engines: pkg.engines,
  scripts: {
    start: 'node --nouse-idle-notification --expose-gc web.js',
  },
  dependencies: {
    mysql2: '',
  },
};

const babelPlugins = [
  '@babel/transform-flow-strip-types',
  ['@babel/plugin-proposal-decorators', { legacy: true }],
  '@babel/plugin-proposal-function-sent',
  '@babel/plugin-proposal-export-namespace-from',
  '@babel/plugin-proposal-numeric-separator',
  '@babel/plugin-proposal-throw-expressions',
  ['@babel/plugin-proposal-class-properties', { loose: true }],
  '@babel/proposal-object-rest-spread',
  // react-optimize
  '@babel/transform-react-constant-elements',
  '@babel/transform-react-inline-elements',
  'transform-react-remove-prop-types',
  'transform-react-pure-class-to-function',
];


export default {
  name: 'web',
  target: 'node',

  context: __dirname,
  mode: (isDebug) ? 'development' : 'production',

  entry: {
    web: ['./src/web.js'],
    backup: ['./src/backup.js'],
  },

  output: {
    pathinfo: VERBOSE,
    path: path.resolve(__dirname, './build'),
    libraryTarget: 'commonjs2',
  },

  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        loader: 'babel-loader',
        include: [
          path.resolve(__dirname, './src'),
        ],
        options: {
          cacheDirectory: isDebug,

          babelrc: false,
          presets: [
            ['@babel/preset-env', {
              targets: {
                node: pkg.engines.node.replace(/^\D+/g, ''),
              },
              modules: false,
              useBuiltIns: false,
              debug: false,
            }],
            '@babel/typescript',
            '@babel/react',
          ],
          plugins: babelPlugins,
        },
      },
      {
        test: /\.css/,
        use: [
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              sourceMap: false,
              modules: false,
            },
          },
        ],
      },
    ],
  },

  externals: [
    /\/proxies\.json$/,
    /\/canvases\.json$/,
    /^\.\/styleassets\.json$/,
    /^\.\/assets\.json$/,
    nodeExternals(),
  ],

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': isDebug ? '"development"' : '"production"',
      'process.env.BROWSER': false,
    }),
    // create package.json for deployment
    new GeneratePackageJsonPlugin(basePackageValues, {
      debug: VERBOSE,
      sourcePackageFilenames: [
        path.resolve(__dirname, './package.json'),
      ],
    }),
  ],

  node: {
    global: false,
    __filename: false,
    __dirname: false,
  },

  bail: !isDebug,

  cache: isDebug,
};
