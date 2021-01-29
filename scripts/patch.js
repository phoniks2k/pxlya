/*
 * @flow
 */
import path from 'path';
import fs from 'fs';

/* eslint-disable no-console */

function patchImageQ() {
  try {
    /* fix image-q imports here
     * Pretty dirty, but we did write an issue and they might
     * update one day
     */
    console.log('Patching image-q set-immediate import');
    const regex = /core-js\/fn\/set-immediate/g;
    const files = [
      path.resolve(
        __dirname, '..', 'node_modules',
        'image-q', 'dist', 'esm', 'basicAPI.js',
      ),
      path.resolve(
        __dirname, '..', 'node_modules',
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
}


export default function patch() {
  patchImageQ();
}
