/**
 * Created by HF
 *
 * This is the database of the data for registered Users
 *
 */

import { DataTypes, QueryTypes } from 'sequelize';

import logger from '../../core/logger';
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
    mailVerified() {
      return this.verified & 0x01;
    },

    blockDm() {
      return this.blocks & 0x01;
    },

    isMod() {
      return this.roles & 0x01;
    },
  },

  setterMethods: {
    mailVerified(num) {
      const val = (num) ? (this.verified | 0x01) : (this.verified & ~0x01);
      this.setDataValue('verified', val);
    },

    blockDm(num) {
      const val = (num) ? (this.blocks | 0x01) : (this.blocks & ~0x01);
      this.setDataValue('blocks', val);
    },

    isMod(num) {
      const val = (num) ? (this.roles | 0x01) : (this.roles & ~0x01);
      this.setDataValue('roles', val);
    },

    password(value) {
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

export async function getNamesToIds(ids) {
  const idToNameMap = new Map();
  if (!ids.length || ids.length > 300) {
    return idToNameMap;
  }
  try {
    const result = await RegUser.findAll({
      attributes: ['id', 'name'],
      where: {
        id: ids,
      },
      raw: true,
    });
    result.forEach((obj) => {
      idToNameMap.set(obj.id, obj.name);
    });
  } catch {
    // nothing
  }
  return idToNameMap;
}

/*
 * increment user pixelcount in batches sequentially
 * Queue directly accesses queuedPxlIncrement in user object
 */
let incrementQueue = {};
let pushLoop = null;
const incrementLoop = async () => {
  const idKeys = Object.keys(incrementQueue);
  if (!idKeys.length) {
    pushLoop = null;
    return;
  }
  let queue = incrementQueue;
  incrementQueue = {};
  const orderedCnts = {};
  idKeys.forEach((id) => {
    const cnt = queue[id];
    const cntArr = orderedCnts[cnt];
    if (cntArr) {
      cntArr.push(id);
    } else {
      orderedCnts[cnt] = [id];
    }
  });
  queue = Object.keys(orderedCnts);
  for (let u = 0; u < queue.length; u += 1) {
    const by = queue[u];
    const id = orderedCnts[by];
    try {
      // eslint-disable-next-line no-await-in-loop
      await RegUser.increment(['totalPixels', 'dailyTotalPixels'], {
        by,
        where: {
          id,
        },
        silent: true,
        raw: true,
      });
    } catch (err) {
      logger.warn(`Error on pixel increment: ${err.message}`);
    }
  }
  pushLoop = setTimeout(incrementLoop, 250);
};
export async function incrementPixelcount(id, by) {
  if (incrementQueue[id]) {
    incrementQueue[id] += by;
  } else {
    incrementQueue[id] = by;
  }
  if (!pushLoop) {
    pushLoop = setTimeout(incrementLoop, 0);
  }
}

export default RegUser;
