/*
 *
 * Junction table for User -> Channels
 * A channel can be anything,
 * Group, Public Chat, DM, etc.
 *
 * @flow
 *
 */

import DataType from 'sequelize';
import Model from '../sequelize';

const UserChannel = Model.define('UserChannel', {
  lastRead: {
    type: DataType.DATE,
    allowNull: true,
  },
}, {
  timestamps: false,
});

export default UserChannel;
