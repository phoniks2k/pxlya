/*
 *
 * Database layout for Chat Channels
 *
 * @flow
 *
 */

import DataType from 'sequelize';
import Model from '../sequelize';
import RegUser from './RegUser';

const Channel = Model.define('Channel', {
  // Channel ID
  id: {
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },

  name: {
    type: `${DataType.CHAR(32)} CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    allowNull: true,
  },

  /*
   * 0: public channel
   * 1: DM
   * 2: Group (not implemented)
   * 3: faction (not implemented)
   */
  type: {
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },

  lastMessage: {
    type: DataType.DATE,
    allowNull: false,
  },
}, {
  updatedAt: false,
});

/*
 * Direct Message User id
 * just set if channel is DM
 * (associating it here allows us too
 * keep track of users leaving and joining DMs and ending up
 * in the same conversation)
 */
Channel.belongsTo(RegUser, {
  as: 'dmu1',
  foreignKey: 'dmu1id',
});
Channel.belongsTo(RegUser, {
  as: 'dmu2',
  foreignKey: 'dmu2id',
});

export default Channel;
