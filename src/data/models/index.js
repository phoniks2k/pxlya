/* @flow */

import sequelize from '../sequelize';
import Blacklist from './Blacklist';
import Whitelist from './Whitelist';
import User from './User';
import RegUser from './RegUser';
import Channel from './Channel';
import UserChannel from './UserChannel';
import Message from './Message';

RegUser.belongsToMany(Channel, {
  as: 'channel',
  through: UserChannel,
});
Channel.belongsToMany(RegUser, {
  as: 'user',
  through: UserChannel,
});

function sync(...args) {
  return sequelize.sync(...args);
}

export default { sync };
export {
  Whitelist, Blacklist, User, RegUser, Channel, UserChannel, Message,
};
