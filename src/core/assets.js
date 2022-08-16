import path from 'path';
import { readFileSync } from 'fs';

export const assets = JSON.parse(readFileSync(
  path.resolve(__dirname, './assets.json'),
));
export const styleassets = JSON.parse(readFileSync(
  path.resolve(__dirname, './styleassets.json'),
));
