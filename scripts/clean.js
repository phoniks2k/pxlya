/*
 * Cleans up the output (build) directory.
 */

import rimraf from 'rimraf';
import path from 'path';

const builddir = path.resolve(__dirname, '..', 'build');


function clean() {
  return new Promise(
    (resolve, reject) => rimraf(`${builddir}/*`, {
        glob: {
          nosort: true,
          dot: true,
          ignore: ['build/.git'],
        },
      }, (err, result) => (err) ? reject(err) : resolve(result)),
  );
}

export default clean;
