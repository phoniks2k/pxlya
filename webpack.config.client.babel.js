/**
 */

import path from 'path';
import fs from 'fs';
import webpack from 'webpack';
import AssetsPlugin from 'assets-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

import pkg from './package.json';

/*
 * Emit a file with assets paths
 */
const assetPlugin = new AssetsPlugin({
  path: path.resolve(__dirname, 'build'),
  filename: 'assets.json',
  update: true,
  entrypoints: true,
  prettyPrint: true,
});


export function buildWebpackClientConfig(
  development,
  analyze,
  locale,
  extract,
) {
  const ttag = {
    resolve: {
      translations: (locale !== 'default')
        ? path.resolve(__dirname, 'i18n', `${locale}.po`)
        : locale,
    },
  };

  if (extract) {
    ttag.extract = {
      output: path.resolve(__dirname, 'i18n', 'template.pot'),
    };
  }

  const babelPlugins = [
    ['ttag', ttag],
  ];

  return {
    name: 'client',
    target: 'web',

    context: __dirname,
    mode: (development) ? 'development' : 'production',
    devtool: (development) ? 'eval' : false,

    entry: {
      [(locale !== 'default') ? `client-${locale}` : 'client']:
        [path.resolve(__dirname, 'src', 'client.js')],
      [(locale !== 'default') ? `globe-${locale}` : 'globe']:
        [path.resolve(__dirname, 'src', 'globe.js')],
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
      extensions: ['.js', '.jsx'],
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
          test: /\.(js|jsx)$/,
          loader: 'babel-loader',
          include: [
            path.resolve(__dirname, 'src'),
            ...['image-q'].map((moduleName) => (
              path.resolve(__dirname + '/node_modules/' + moduleName)
            ))
          ],
          options: {
            // should be !extract and adhere to .po timestamps
            // in cacheIdentifier
            cacheDirectory: false,
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: pkg.browserslist,
                },
                /*
                useBuiltIns: 'usage',
                corejs: {
                  version: 3,
                },
                */
              }],
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

    stats: {
      colors: true,
      reasons: false,
      hash: false,
      version: false,
      timings: true,
      chunkModules: false,
    },

    /*
     * maybe some day in the future it might be
     * better than babel-loader cacheDirectory,
     * but right now it isn't
    cache: {
      type: 'filesystem',
      cacheDirectory: path.resolve(
        __dirname,
        'node_modules',
        '.cache',
        'webpack',
      ),
    },
     */
    cache: false,
  };
}

/*
 * return array of webpack configuartions for all languages
 */
function buildWebpackClientConfigAllLangs(development, analyze) {
  let webpackConfigClient = [
    buildWebpackClientConfig(development, analyze, 'default', false),
  ];
  /*
   * get available translations
   */
  const langDir = path.resolve(__dirname, 'i18n');
  const langs = fs.readdirSync(langDir)
    .filter((e) => (e.endsWith('.po') && !e.startsWith('ssr')))
    .map((l) => l.slice(0, -3));
  webpackConfigClient = webpackConfigClient.concat(
    langs.map((l) => buildWebpackClientConfig(development, analyze, l)),
  );

  return webpackConfigClient;
}

export default ({
  development, analyze, extract, locale,
}) => {
  if (extract || locale) {
    return buildWebpackClientConfig(
      development, analyze, locale || 'default', extract,
    );
  }
  return buildWebpackClientConfigAllLangs(development, analyze);
};
