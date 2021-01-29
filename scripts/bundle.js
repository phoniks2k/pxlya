/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import webpack from 'webpack';
import webpackConfigWeb from '../webpack.config.web.babel';
import { buildWebpackClientConfig } from '../webpack.config.client.babel';

const wpStats = {
  colors: true,
  reasons: false,
  hash: false,
  version: false,
  timings: true,
  chunks: true,
  chunkModules: false,
  cached: false,
  cachedAssets: false,
};

/**
 * Creates application bundles from the source files.
 */
async function bundle() {
  try {
    /* fix image-q imports here
     * Pretty dirty, but we did write an issue and they might
     * update one day
     */
    console.log('Patching image-q set-immediate import');
    const regex = /core-js\/fn\/set-immediate/g;
    const files = [
      path.resolve(
        '..', 'node_modules',
        'image-q', 'dist', 'esm', 'basicAPI.js',
      ),
      path.resolve(
        '..', 'node_modules',
        'image-q', 'dist', 'esm', 'helper.js',
      ),
    ];
    files.forEach((file) => {
      let fileContent = fs.readFileSync(file, 'utf8');
      fileContent = fileContent.replace(
        regex,
        'core-js/features/set-immediate',
      );
      fs.writeFileSync(file, fileContent);
    });
    console.log('Patching image-q done');
  } catch {
    console.log('Error while patching image-q');
  }
  console.log('Bundle with webpack....');

  let webpackConfig = [
    webpackConfigWeb,
    buildWebpackClientConfig(false, false, 'default'),
  ]

  /*
   * add other language configs
   */
  const langDir = path.resolve(__dirname, '..', 'i18n');
  const langs = fs.readdirSync(langDir)
    .filter((e) => e.endsWith('.po'))
    .map((l) => l.slice(0, -3));
  webpackConfig = webpackConfig.concat(
    langs.map((l) => buildWebpackClientConfig(false, false, l)),
  );

  return new Promise((resolve, reject) => {
    webpack(webpackConfig).run((err, stats) => {
      if (err) {
        return reject(err);
      }
      console.log(stats.toString(wpStats));
      return resolve();
    });
  });
}

export default bundle;
