/**
 *
 * https://github.com/sequelize/sequelize/issues/1485#issuecomment-243822779
 *
 */

import { DataTypes } from 'sequelize';
import sequelize from './sequelize';


const Blacklist = sequelize.define('Blacklist', {

  ip: {
    type: DataTypes.CHAR(39),
    allowNull: false,
    primaryKey: true,
  },

});

export default Blacklist;
