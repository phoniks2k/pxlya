/*
 */

import path from 'path';
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';
import GeneratePackageJsonPlugin from 'generate-package-json-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';

import pkg from './package.json';

const basePackageValues = {
  name: pkg.name,
  version: pkg.version,
  private: true,
  engines: pkg.engines,
  scripts: {
    start: 'node --nouse-idle-notification --expose-gc server.js',
  },
  dependencies: {
    mysql2: '',
  },
};

const ttag = {};

const babelPlugins = [
  ['ttag', ttag],
];

console.log('IGNORE GPJWP (generate-package-json-webpack-plugin) WARNINGS / ERRORS, ITS CURRENT VERSION IS A BIT BUGGY, BUT STILL WORKS');

export default ({
  development, extract,
}) => {
  if (extract) {
    ttag.extract = {
      output: path.resolve(__dirname, 'i18n', 'template-ssr.pot'),
    };
    ttag.discover = ['t', 'jt'];
  }

  return {
    name: 'server',
    target: 'node',

    context: __dirname,
    mode: (development) ? 'development' : 'production',

    entry: {
      server: [path.resolve(__dirname, 'src', 'server.js')],
      backup: [path.resolve(__dirname, 'src', 'backup.js')],
      captchaserver: [path.resolve(__dirname, 'src', 'captchaserver.js')],
    },

    output: {
      library: {
        type: 'commonjs2',
      },
      clean: true,
    },

    resolve: {
      extensions: ['.js', '.jsx'],
    },

    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          loader: 'babel-loader',
          include: [
            path.resolve(__dirname, 'src'),
          ],
          options: {
            cacheDirectory: false,
            presets: [
              ['@babel/preset-env', {
                targets: {
                  node: pkg.engines.node.replace(/^\D+/g, ''),
                },
                modules: false,
              }],
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
            'clean-css-loader',
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
      /\/styleassets\.json$/,
      /\/assets\.json$/,
      nodeExternals(),
    ],

    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': development ? '"development"' : '"production"',
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
            to: path.resolve(__dirname, 'dist', 'public'),
          },
          path.resolve(__dirname, 'src', 'canvases.json'),
          path.resolve(__dirname, 'src', 'proxies.json'),
          {
            from: path.resolve(
              __dirname, 'deployment', 'example-ecosystem.yml'
            ),
            to: path.resolve(
              __dirname, 'dist', 'ecosystem.yml'
            ),
          },
          {
            from: path.resolve(
              __dirname, 'deployment', 'example-ecosystem-backup.yml'
            ),
            to: path.resolve(
              __dirname, 'dist', 'ecosystem-backup.yml'
            ),
          },
          {
            from: path.resolve(__dirname, 'captchaFonts'),
            to: path.resolve(__dirname, 'dist', 'captchaFonts'),
          },
          {
            from: path.resolve(
              __dirname, 'deployment', 'example-ecosystem-captchas.yml'
            ),
            to: path.resolve(
              __dirname, 'dist', 'ecosystem-captchas.yml'
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
      chunkModules: false,
    },

    node: {
      global: false,
      __filename: false,
      __dirname: false,
    },
  };
};
