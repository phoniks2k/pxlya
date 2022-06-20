/*
 * send global ranking
 */

import rankings from '../core/ranking';

export default (req, res) => {
  res.json(rankings.ranks);
};
