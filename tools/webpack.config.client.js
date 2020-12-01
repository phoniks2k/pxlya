/**
 */

import path from 'path';
import webpack from 'webpack';
import AssetsPlugin from 'assets-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

import pkg from '../package.json';

const isDebug = process.argv.includes('--debug');
const isVerbose = process.argv.includes('--verbose');
const isAnalyze = process.argv.includes('--analyze')
  || process.argv.includes('--analyse');


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
  name: 'client',
  target: 'web',

  context: path.resolve(__dirname, '..'),
  mode: (isDebug) ? 'development' : 'production',
  devtool: 'source-map',

  entry: {
    client: ['./src/client.js'],
    globe: ['./src/globe.js'],
  },

  output: {
    path: path.resolve(__dirname, '../build/public/assets'),
    publicPath: '/assets/',
    pathinfo: isVerbose,
    filename: isDebug ? '[name].js' : '[name].[chunkhash:8].js',
    chunkFilename: isDebug ? '[name].chunk.js' : '[name].[chunkhash:8].js',
  },

  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
  },

  module: {
    rules: [
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'react-svg-loader',
            options: {
              svgo: {
                plugins: [
                  {
                    removeViewBox: false,
                  },
                  {
                    removeDimensions: true,
                  },
                ],
              },
              jsx: false,
            },
          },
        ],
      },
      {
        test: /\.(js|jsx|ts|tsx)$/,
        loader: 'babel-loader',
        include: [
          path.resolve(__dirname, '../src'),
        ],
        options: {
          cacheDirectory: isDebug,
          babelrc: false,
          presets: [
            ['@babel/preset-env', {
              targets: {
                browsers: pkg.browserslist,
              },
              modules: false,
              useBuiltIns: 'usage',
              corejs: {
                version: 3,
              },
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
        use: ['style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: isDebug,
              modules: false,
            },
          },
        ],
      },
    ],
  },

  plugins: [
    // Define free variables
    // https://webpack.github.io/docs/list-of-plugins.html#defineplugin
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': isDebug ? '"development"' : '"production"',
      'process.env.BROWSER': true,
    }),

    // Emit a file with assets paths
    // https://github.com/sporto/assets-webpack-plugin#options
    new AssetsPlugin({
      path: path.resolve(__dirname, '../build'),
      filename: 'assets.json',
      prettyPrint: true,
    }),

    // Webpack Bundle Analyzer
    // https://github.com/th0r/webpack-bundle-analyzer
    ...isAnalyze ? [new BundleAnalyzerPlugin()] : [],
  ],

  optimization: {
    splitChunks: {
      chunks: 'all',
      name: false,
      cacheGroups: {
        default: false,
        defaultVendors: false,

        vendor: {
          name: 'vendor',
          chunks: (chunk) => chunk.name === 'client',
          test: /node_modules/,
        },
        three: {
          test: /[\\/]node_modules[\\/]three[\\/]/,
          name: 'three',
          chunks: 'all',
        }
      },
    },
  },

  bail: !isDebug,

  cache: isDebug,
};
