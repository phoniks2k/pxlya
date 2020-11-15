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

export async function isUserBlockedBy(userId, blockedById) {
  const exists = await UserBlock.findOne({
    where: {
      uid: userId,
      buid: blockedById,
    },
    raw: true,
    attributes: ['uid'],
  });
  return !!exists;
}

export default UserBlock;
