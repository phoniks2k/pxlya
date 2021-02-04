/**
 * copies files to build directory
 */

/* eslint-disable import/no-extraneous-dependencies */

import fs from 'fs';
import path from 'path';
import glob from 'glob';
import mkdirp from 'mkdirp';

const builddir = path.resolve(__dirname, '..', 'build');
const deploydir = path.resolve(__dirname, '..', 'deployment');
const publicdir = path.resolve(__dirname, '..', 'public');
const srcdir = path.resolve(__dirname, '..', 'src');

/*
 * following functions are copied from
 * React Starter Kit (https://www.reactstarterkit.com/)
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

// eslint-disable-next-line max-len
const readDir = (pattern, options) => new Promise((resolve, reject) => glob(pattern, options, (err, result) => (err ? reject(err) : resolve(result))));

const copyFile = (source, target) => new Promise((resolve, reject) => {
  let cbCalled = false;
  function done(err) {
    if (!cbCalled) {
      cbCalled = true;
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    }
  }
  const rd = fs.createReadStream(source);
  rd.on('error', (err) => done(err));
  const wr = fs.createWriteStream(target);
  wr.on('error', (err) => done(err));
  wr.on('close', (err) => done(err));
  rd.pipe(wr);
});

const copyDir = async (source, target) => {
  const dirs = await readDir('**/*.*', {
    cwd: source,
    nosort: true,
    dot: true,
  });
  await Promise.all(dirs.map(async (dir) => {
    const from = path.resolve(source, dir);
    const to = path.resolve(target, dir);
    mkdirp.sync(path.dirname(to));
    await copyFile(from, to);
  }));
};
/*
 * ----------------------------------------------------------------------------
 */



/**
 * Copies static files such as robots.txt, favicon.ico to the
 * output (build) folder.
 */
async function copy() {
  mkdirp.sync(`${builddir}/public/assets`);
  return Promise.all([
    copyDir(
      `${publicdir}`,
      `${builddir}/public`,
    ),
    copyFile(
      `${srcdir}/canvases.json`,
      `${builddir}/canvases.json`,
    ),
    copyFile(
      `${srcdir}/proxies.json`,
      `${builddir}/proxies.json`,
    ),
    copyFile(
      `${deploydir}/example-ecosystem.yml`,
      `${builddir}/ecosystem.example.yml`,
    ),
    copyFile(
      `${deploydir}/example-ecosystem-backup.yml`,
      `${builddir}/ecosystem-backup.example.yml`,
    ),
    copyFile(
      `${deploydir}/example-ecosystem-captchas.yml`,
      `${builddir}/ecosystem-captchas.example.yml`,
    ),
  ]);
}

export default copy;
