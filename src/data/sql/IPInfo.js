import { DataTypes } from 'sequelize';
import sequelize from './sequelize';


const IPInfo = sequelize.define('IPInfo', {
  ip: {
    type: DataTypes.CHAR(39),
    allowNull: false,
    primaryKey: true,
  },

  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
  },

  country: {
    type: DataTypes.CHAR(2),
    defaultValue: 'xx',
    allowNull: false,
  },

  cidr: {
    type: DataTypes.CHAR(43),
    allowNull: false,
  },

  org: {
    type: DataTypes.CHAR(60),
  },

  descr: {
    type: DataTypes.CHAR(60),
  },

  asn: {
    type: DataTypes.CHAR(12),
    allowNull: false,
  },

  proxy: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
  },

  /*
   * extra information from
   * proxycheck
   */
  pcheck: {
    type: DataTypes.CHAR(60),
  },
}, {
  getterMethods: {
    isProxy() {
      return !!this.proxy;
    },
  },

  setterMethods: {
    isProxy(proxy) {
      const num = (proxy) ? 1 : 0;
      this.setDataValue('proxy', num);
    },

    org(value) {
      this.setDataValue('org', value.slice(0, 60));
    },

    descr(value) {
      this.setDataValue('descr', value.slice(0, 60));
    },

    pcheck(value) {
      this.setDataValue('pcheck', value.slice(0, 60));
    },
  },
});

export default IPInfo;
