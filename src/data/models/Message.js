/*
 *
 * Database layout for Chat Message History
 *
 * @flow
 *
 */

import DataType from 'sequelize';
import Model from '../sequelize';
import Channel from './Channel';
import RegUser from './RegUser';

const Message = Model.define('Message', {
  // Message ID
  id: {
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },

  message: {
    type: `${DataType.CHAR(200)} CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    allowNull: false,
  },
}, {
  updatedAt: false,
});

Message.belongsTo(Channel, {
  as: 'channel',
  foreignKey: 'cid',
  onDelete: 'cascade',
});

Message.belongsTo(RegUser, {
  as: 'user',
  foreignKey: 'uid',
  onDelete: 'cascade',
});

export default Message;
