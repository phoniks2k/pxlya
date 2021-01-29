/**
 */

import path from 'path';
import webpack from 'webpack';
import AssetsPlugin from 'assets-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

import pkg from './package.json';

/*
 * Emit a file with assets paths
 */
const assetPlugin =  new AssetsPlugin({
  path: path.resolve(__dirname, 'build'),
  filename: 'assets.json',
  entrypoints: true,
  prettyPrint: true,
});

export function buildWebpackClientConfig(development, analyze, locale) {
  const ttag = {
    resolve: {
      translations: (locale !== 'default')
        ? path.resolve(__dirname, 'i18n', `${locale}.po`)
        : locale,
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
    ['ttag', ttag],
  ];

  return {
    name: 'client',
    target: 'web',

    context: __dirname,
    mode: (development) ? 'development' : 'production',
    devtool: 'source-map',

    entry: {
      [(locale !== 'default') ? `client-${locale}` : 'client']:
        ['./src/client.js'],
      [(locale !== 'default') ? `globe-${locale}` : 'globe']:
        ['./src/globe.js'],
    },

    output: {
      path: path.resolve(__dirname, 'build', 'public', 'assets'),
      publicPath: '/assets/',
      filename: '[name].[chunkhash:8].js',
      chunkFilename: (locale !== 'default')
        ? `[name]-${locale}.[chunkhash:8].js`
        : '[name].[chunkhash:8].js',
    },

    resolve: {
      alias: {
        ttag: 'ttag/dist/mock',
      },
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
            path.resolve(__dirname, 'src'),
          ],
          options: {
            cacheDirectory: development,
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
                sourceMap: development,
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
        'process.env.NODE_ENV': development ? '"development"' : '"production"',
        'process.env.BROWSER': true,
      }),

      assetPlugin,

      // Webpack Bundle Analyzer
      // https://github.com/th0r/webpack-bundle-analyzer
      ...analyze ? [new BundleAnalyzerPlugin({ analyzerPort: 8889 })] : [],
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
            chunks: (chunk) => chunk.name.startsWith('client'),
            test: /[\\/]node_modules[\\/]/,
          },
          three: {
            name: 'three',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]three[\\/]/,
          },
        },
      },
    },

    cache: true,
  };
}

export default buildWebpackClientConfig(
  process.argv.includes('--debug'),
  process.argv.includes('--analyse') || process.argv.includes('--analyze'),
  'default',
);

