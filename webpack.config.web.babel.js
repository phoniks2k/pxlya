/*
 */

import path from 'path';
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';
import GeneratePackageJsonPlugin from 'generate-package-json-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';

import patch from './scripts/patch';
import pkg from './package.json';

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

const ttag = {};

const babelPlugins = [
  '@babel/plugin-transform-flow-strip-types',
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


export default ({
  debug, extract,
}) => {
  if (extract) {
    ttag.extract = {
      output: path.resolve(__dirname, 'i18n', 'template-ssr.pot'),
    };
    ttag.discover = ['t', 'jt'];
  }

  return {
    name: 'web',
    target: 'node',

    context: __dirname,
    mode: (debug) ? 'development' : 'production',

    entry: {
      web: [path.resolve(__dirname, 'src', 'web.js')],
      backup: [path.resolve(__dirname, 'src', 'backup.js')],
      captchaserver: [path.resolve(__dirname, 'src', 'captchaserver.js')],
    },

    output: {
      path: path.resolve(__dirname, 'build'),
      libraryTarget: 'commonjs2',
      clean: true,
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
            cacheDirectory: false,

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
        'process.env.NODE_ENV': debug ? '"development"' : '"production"',
        'process.env.BROWSER': false,
      }),
      // create package.json for deployment
      new GeneratePackageJsonPlugin(basePackageValues, {
        sourcePackageFilenames: [
          path.resolve(__dirname, 'package.json'),
        ],
      }),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'public'),
            to: path.resolve(__dirname, 'build', 'public'),
          },
          path.resolve(__dirname, 'src', 'canvases.json'),
          path.resolve(__dirname, 'src', 'proxies.json'),
          {
            from: path.resolve(
              __dirname, 'deployment', 'example-ecosystem.yml'
            ),
            to: path.resolve(
              __dirname, 'build', 'ecosystem.yml'
            ),
          },
          {
            from: path.resolve(
              __dirname, 'deployment', 'example-ecosystem-backup.yml'
            ),
            to: path.resolve(
              __dirname, 'build', 'ecosystem-backup.yml'
            ),
          },
          {
            from: path.resolve(__dirname, 'captchaFonts'),
            to: path.resolve(__dirname, 'build', 'captchaFonts'),
          },
          {
            from: path.resolve(
              __dirname, 'deployment', 'example-ecosystem-captchas.yml'
            ),
            to: path.resolve(
              __dirname, 'build', 'ecosystem-captchas.yml'
            ),
          },
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
};
