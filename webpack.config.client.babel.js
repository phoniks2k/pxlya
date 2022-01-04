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
  path: path.resolve(__dirname, 'dist'),
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

  // cache invalidates if .po file changed
  const buildDependencies = {
    config: [__filename],
  }
  if (locale !== 'default') {
    buildDependencies.i18n = [ttag.resolve.translations];
  }

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
      path: path.resolve(__dirname, 'dist', 'public', 'assets'),
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
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: pkg.browserslist,
                },
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
      chunkModules: false,
    },

    cache: {
      type: 'filesystem',
      name: (development) ? `${locale}-dev` : locale,
      buildDependencies,
    },
  };
}

export function getAllAvailableLocals() {
  const langDir = path.resolve(__dirname, 'i18n');
  const langs = fs.readdirSync(langDir)
    .filter((e) => (e.endsWith('.po') && !e.startsWith('ssr')))
    .map((l) => l.slice(0, -3));
  langs.push('default');
  return langs;
}

/*
 * return array of webpack configuartions for all languages
 */
function buildWebpackClientConfigAllLangs() {
  const langs = getAllAvailableLocals();
  const webpackConfigClient = [];
  for (let l = 0; l < langs.length; l += 1) {
    const lang = langs[l];
    const cfg = buildWebpackClientConfig(false, false, lang, false);
    webpackConfigClient.push(cfg);
  }
  return webpackConfigClient;
}

/*
 * Per default get configuration of all packages
 * If any argument is given, it will only get one
 * ('default' aka english if locale is unset)
 *
 * @param development If development mode
 * @param extract if translatable strings get in i18n templates should
 *   get updated
 * @param locale language get single configuration of specific locale
 * @param analyze launch BundleAnalyzerPlugin after build
 * @return webpack configuration
 */
export default ({
  development, analyze, extract, locale,
}) => {
  if (extract || analyze || locale || development) {
    return buildWebpackClientConfig(
      development, analyze, locale || 'default', extract,
    );
  }
  return buildWebpackClientConfigAllLangs(development);
};
