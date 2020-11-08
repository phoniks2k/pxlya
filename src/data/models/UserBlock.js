/*
 *
 * Junction table for User -> Blocked User
 * Relations defined in ./index.js
 *
 * @flow
 *
 */

import Model from '../sequelize';

const UserBlock = Model.define('UserBlock', {
}, {
  timestamps: false,
});

export default UserBlock;
