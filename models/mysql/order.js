const Sequelize = require('sequelize');

const sequelize = require('../../util/mysql/database');

const Order = sequelize.define('order',{
  id:{
    type: Sequelize.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true
  }
})

module.exports = Order;