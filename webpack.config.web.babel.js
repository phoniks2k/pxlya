/*
 */

import path from 'path';
import fs from 'fs';
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';
import GeneratePackageJsonPlugin from 'generate-package-json-webpack-plugin';

import patch from './scripts/patch';
import pkg from './package.json';

const isDebug = process.argv.includes('--debug');

/*
 * check which ssr translations are available
 * Maybe we will use thi later to auto-populat src/core/ttag.js
 *
const langDir = path.resolve(__dirname, 'i18n');
const langs = fs.readdirSync(langDir)
  .filter((e) => (e.endsWith('.po') && e.startsWith('ssr')));
fs.writeFileSync(path.resolve(langDir, 'ssr-list.json'), JSON.stringify(langs));
*/

patch();

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
  ['ttag', {
    extract: {
      output: path.resolve(__dirname, 'i18n', 'template-ssr.pot'),
    },
    discover: ['t', 'jt'],
  }],
];


export default {
  name: 'web',
  target: 'node',

  context: __dirname,
  mode: (isDebug) ? 'development' : 'production',

  entry: {
    web: [path.resolve(__dirname, 'src', 'web.js')],
    backup: [path.resolve(__dirname, 'src', 'web.js')],
  },

  output: {
    path: path.resolve(__dirname, 'build'),
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
          path.resolve(__dirname, 'src'),
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
      {
        test: [/\.po$/],
        loader: 'ttag-po-loader',
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
      sourcePackageFilenames: [
        path.resolve(__dirname, 'package.json'),
      ],
    }),
  ],

  stats: {
    colors: true,
    reasons: false,
    hash: false,
    version: false,
    timings: true,
    chunkModules: false,
  },

  node: {
    global: false,
    __filename: false,
    __dirname: false,
  },
};
