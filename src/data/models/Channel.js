/*
 *
 * Database layout for Chat Channels
 *
 * @flow
 *
 */

import DataType from 'sequelize';
import Model from '../sequelize';

const Channel = Model.define('Channel', {
  // Channel ID
  id: {
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },

  name: {
    type: `${DataType.CHAR(32)} CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    allowNull: false,
  },

  lastMessage: {
    type: DataType.DATE,
    allowNull: false,
  },
}, {
  updatedAt: false,
});

export default Channel;
