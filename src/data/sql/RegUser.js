/**
 * Created by HF
 *
 * This is the database of the data for registered Users
 *
 */

import { DataTypes, QueryTypes } from 'sequelize';
import sequelize from './sequelize';

import { generateHash } from '../../utils/hash';


const RegUser = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },

  email: {
    type: DataTypes.CHAR(40),
    allowNull: true,
  },

  name: {
    type: `${DataTypes.CHAR(32)} CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    allowNull: false,
  },

  // currently just moderator
  roles: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },

  // null if external oauth authentification
  password: {
    type: DataTypes.CHAR(60),
    allowNull: true,
  },

  totalPixels: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  dailyTotalPixels: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  ranking: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },

  dailyRanking: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },

  // mail and Minecraft verified
  verified: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: false,
  },

  // currently just blockDm
  blocks: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },

  discordid: {
    type: DataTypes.CHAR(18),
    allowNull: true,
  },

  redditid: {
    type: DataTypes.CHAR(10),
    allowNull: true,
  },

  // when mail verification got requested,
  // used for purging unverified accounts
  verificationReqAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  // flag == country code
  flag: {
    type: DataTypes.CHAR(2),
    defaultValue: 'xx',
    allowNull: false,
  },

  lastLogIn: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  updatedAt: false,

  getterMethods: {
    mailVerified(): boolean {
      return this.verified & 0x01;
    },

    blockDm(): boolean {
      return this.blocks & 0x01;
    },

    isMod(): boolean {
      return this.roles & 0x01;
    },
  },

  setterMethods: {
    mailVerified(num: boolean) {
      const val = (num) ? (this.verified | 0x01) : (this.verified & ~0x01);
      this.setDataValue('verified', val);
    },

    blockDm(num: boolean) {
      const val = (num) ? (this.blocks | 0x01) : (this.blocks & ~0x01);
      this.setDataValue('blocks', val);
    },

    isMod(num: boolean) {
      const val = (num) ? (this.roles | 0x01) : (this.roles & ~0x01);
      this.setDataValue('roles', val);
    },

    password(value: string) {
      if (value) this.setDataValue('password', generateHash(value));
    },
  },

});

export async function name2Id(name) {
  try {
    const userq = await sequelize.query(
      'SELECT id FROM Users WHERE name = $1',
      {
        bind: [name],
        type: QueryTypes.SELECT,
        raw: true,
        plain: true,
      },
    );
    return userq.id;
  } catch {
    return null;
  }
}

export async function findIdByNameOrId(searchString) {
  let id = await name2Id(searchString);
  if (id) {
    return { name: searchString, id };
  }
  id = parseInt(searchString, 10);
  if (!Number.isNaN(id)) {
    const user = await RegUser.findByPk(id, {
      attributes: ['name'],
      raw: true,
    });
    if (user) {
      return { name: user.name, id };
    }
  }
  return null;
}

export default RegUser;
