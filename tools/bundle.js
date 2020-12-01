/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import fs from 'fs';
import webpack from 'webpack';
import webpackConfigWeb from './webpack.config.web';
import webpackConfigClient from './webpack.config.client';

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
}

/**
 * Creates application bundles from the source files.
 */
function bundle() {
  try {
    /* fix image-q imports here
     * Pretty dirty, but we did write an issue and they might
     * update one day
     */
    console.log('Patching image-q set-immediate import');
    const regex = /core-js\/fn\/set-immediate/g;
    const files = [
      './node_modules/image-q/dist/esm/basicAPI.js',
      './node_modules/image-q/dist/esm/helper.js',
    ];
    files.forEach((file) => {
      let fileContent = fs.readFileSync(file,'utf8');
      fileContent = fileContent.replace(regex, 'core-js/features/set-immediate');
      fs.writeFileSync(file, fileContent);
    });
    console.log('Patching image-q done');
  } catch {
    console.log('Error while patching image-q');
  }
  console.log('Bundle with webpack....');

  return new Promise((resolve, reject) => {
    webpack([webpackConfigWeb, webpackConfigClient]).run((err, stats) => {
      if (err) {
        return reject(err);
      }
      console.log(stats.toString(wpStats));
      return resolve();
    });
  });
}

export default bundle;
