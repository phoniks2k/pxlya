import { DataTypes } from 'sequelize';
import sequelize from './sequelize';

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

export async function isIPBanned(ip) {
  const count = await Ban
    .count({
      where: { ip },
    });
  return count !== 0;
}

export default Ban;
