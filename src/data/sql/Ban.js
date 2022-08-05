import { DataTypes } from 'sequelize';
import sequelize from './sequelize';

import RegUser from './RegUser';

const Ban = sequelize.define('Blacklist', {
  ip: {
    type: DataTypes.CHAR(39),
    allowNull: false,
    primaryKey: true,
  },

  reason: {
    type: `${DataTypes.CHAR(200)} CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    allowNull: false,
  },

  /*
   * wpiration time,
   * NULL if infinite
   */
  expires: {
    type: DataTypes.DATE,
  },

  /*
   * uid of mod who made the ban
   */
  muid: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
}, {
  timestamps: true,
  updatedAt: false,
});



/*
 * check if ip is whitelisted
 * @param ip
 * @return boolean
 */
export async function isIPBanned(ip) {
  const count = await Ban
    .count({
      where: { ip },
    });
  return count !== 0;
}

/*
 * get information of ban
 * @param ip
 * @return
 */
export async function getBanInfo(ip) {
  const ban = await Ban.findByPk(ip, {
    include: [{
      model: RegUser,
      as: 'mod',
      foreignKey: 'muid',
      attributes: ['id', 'name'],
    }],
  });
  return ban;
}

/*
 * ban ip
 * @param ip
 * @return true if banned
 *         false if already banned
 */
export async function banIP(
  ip,
  reason,
  expiresTs,
  muid,
) {
  const expires = (expiresTs) ? new Date(expiresTs) : null;
  const [, created] = await Ban.findOrCreate({
    where: { ip },
    defaults: {
      reason,
      expires,
      muid,
    },
  });
  return created;
}

/*
 * unban ip
 * @param ip
 * @return true if unbanned,
 *         false if ip wasn't banned anyway
 */
export async function unbanIP(ip) {
  const count = await Ban.destroy({
    where: { ip },
  });
  return !!count;
}

export default Ban;
